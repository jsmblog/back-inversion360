import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { sequelize } from "../config/database.js";
import { Mensaje, ContextoUsuario, User, PerfilInversionista, PropuestaPortafolio } from "../models/relations.js";
import { execute } from "../ai/execute.js";
import { validarQuerySegura } from "../utils/sqlguard.js";
import { calcularPerfil, generarPropuesta } from "../utils/perfilamiento.js";
import {
  obtenerOCrearSesion,
  obtenerContexto,
  registrarEvento,
  avanzarFase,
  resumenEstado,
  actualizarContexto,
  resetearRespuestas,
  obtenerHistorialPaginado,
} from "../services/agentSessionService.js";

const MENSAJES_DE_CONTEXTO = 10;
const SALT_ROUNDS = 10;

export const obtenerConversacion = async (req, res) => {
  try {
    const ownerId = req.user ? req.user.id : req.session?.ownerId;
    if (!ownerId) {
      return res.status(200).json({ ok: true, autenticado: false, data: [] });
    }
    const mensajes = await Mensaje.findAll({
      where: { propietario_id: ownerId },
      order: [["indice_orden", "ASC"]],
    });
    return res.status(200).json({ ok: true, autenticado: !!req.user, data: mensajes });
  } catch (err) {
    console.error("[obtenerConversacion]", err.message);
    return res.status(500).json({ ok: false, mensaje: "Error al obtener la conversación.", detalle: err.message });
  }
};

export const obtenerTimeline = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ ok: false, mensaje: "Debes iniciar sesión para ver tu timeline." });
    }
    const sesion = await obtenerOCrearSesion(req.user.id);

    const { limit, before } = req.query;
    const limiteAplicado = limit ? Math.min(Number(limit), 100) : 50;

    const eventos = await obtenerHistorialPaginado(sesion, {
      limit: limiteAplicado,
      before: before ? new Date(before) : null,
    });

    return res.status(200).json({
      ok: true,
      fase_actual: sesion.tarea,
      historial: eventos.reverse(),
      hay_mas: eventos.length === limiteAplicado,
    });
  } catch (err) {
    console.error("[obtenerTimeline]", err.message);
    return res.status(500).json({ ok: false, mensaje: "Error al obtener el timeline.", detalle: err.message });
  }
};

export const enviarMensaje = async (req, res) => {
  try {
    const { pregunta, provider, model, webSearch } = req.body;
    if (!pregunta?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "'pregunta' es obligatoria." });
    }

    let ownerId;
    if (req.user) {
      ownerId = req.user.id;
    } else {
      if (!req.session.ownerId) {
        req.session.ownerId = uuidv4();
      }
      ownerId = req.session.ownerId;
    }
    if (!ownerId) {
      return res.status(401).json({ ok: false, mensaje: "No se pudo identificar al usuario." });
    }

    const totalMensajes = await Mensaje.count({
      where: { propietario_id: ownerId },
    });

    await Mensaje.create({
      propietario_id: ownerId,
      user_id: req.user ? req.user.id : null,
      rol: "user",
      contenido: pregunta.trim(),
      indice_orden: totalMensajes,
    });

    const historialMensajes = await Mensaje.findAll({
      where: { propietario_id: ownerId, rol: ["user", "assistant"] },
      order: [["indice_orden", "DESC"]],
      limit: MENSAJES_DE_CONTEXTO,
    });
    const historial_reciente = historialMensajes.reverse().map((m) => ({
      rol: m.rol,
      contenido: m.contenido,
    }));

    // ================= FLUJO ANÓNIMO: REGISTRO =================
    if (!req.user) {
      let datos_parciales = req.session.datos_registro || null;

      let registerResult;
      try {
        registerResult = await execute("db_register", {
          pregunta,
          historial_reciente,
          datos_parciales,
          provider,
          model,
          webSearch,
        });
      } catch (err) {
        console.error("[IA] Error en db_register:", err.message);
        return res.status(500).json({ ok: false, mensaje: "Error al procesar el registro.", detalle: err.message });
      }

      if (!registerResult.isValid) {
        return res.status(422).json({
          ok: false,
          mensaje: "Error al formatear la respuesta de registro.",
          detalle: registerResult.error,
          raw: registerResult.raw,
        });
      }

      const { accion, mensaje, datos_faltantes, usuario } = registerResult.parsed;

      await Mensaje.create({
        propietario_id: ownerId,
        user_id: null,
        rol: "assistant",
        contenido: mensaje,
        indice_orden: totalMensajes + 1,
      });

      if (accion === "pedir_datos") {
        if (usuario) {
          req.session.datos_registro = {
            ...(datos_parciales || {}),
            name: usuario.name || null,
            email: usuario.email || null,
            password: usuario.password || null,
            rol: usuario.rol || "usuario",
          };
        }
        return res.status(200).json({
          ok: true,
          respuesta: mensaje,
          registro_completado: false,
          sugerencias: datos_faltantes || [],
        });
      }

      if (accion === "registrar") {
        if (!usuario || !usuario.name || !usuario.email || !usuario.password) {
          return res.status(400).json({
            ok: false,
            mensaje: "Faltan datos obligatorios para registrar.",
            datos_faltantes: ["name", "email", "password"],
          });
        }

        const existingUser = await User.findOne({ where: { email: usuario.email } });
        if (existingUser) {
          const mensajeError = "El correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.";
          await Mensaje.create({
            propietario_id: ownerId,
            user_id: null,
            rol: "assistant",
            contenido: mensajeError,
            indice_orden: totalMensajes + 2,
          });
          return res.status(200).json({
            ok: true,
            respuesta: mensajeError,
            registro_completado: false,
            sugerencias: ["Iniciar sesión", "Recuperar contraseña", "Usar otro correo"],
          });
        }

        const hashedPassword = await bcrypt.hash(usuario.password, SALT_ROUNDS);
        const newUser = await User.create({
          name: usuario.name,
          email: usuario.email,
          password: hashedPassword,
          rol: usuario.rol || "usuario",
          is_active: true,
        });

        await Mensaje.update(
          { user_id: newUser.id, propietario_id: newUser.id },
          { where: { propietario_id: ownerId } }
        );

        // Emite JWT igual que en login para que el frontend lo guarde y lo
        // mande en el header Authorization desde el siguiente mensaje.
        const token = jwt.sign(
          { id: newUser.id, email: newUser.email, rol: newUser.rol },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        req.user = { id: newUser.id, email: newUser.email, rol: newUser.rol };

        await ContextoUsuario.create({
          user_id: newUser.id,
          resumen: null,
          intencion_pendiente: null,
        });

        // Crea la sesión de agente ya en fase "perfilamiento" (esto también
        // crea la fila 1:1 en AgentSessionContext, vacía y lista).
        const sesionNueva = await obtenerOCrearSesion(newUser.id);
        await registrarEvento(sesionNueva, "usuario_registrado", { email: newUser.email });

        req.session.datos_registro = null;
        req.session.ownerId = null;

        const mensajeExito = `¡Registro completado! Bienvenido, ${newUser.name}. Ahora vamos a completar tu perfil de inversionista para poder darte una propuesta adecuada. ¿Cuál es tu edad?`;
        await Mensaje.create({
          propietario_id: newUser.id,
          user_id: newUser.id,
          rol: "assistant",
          contenido: mensajeExito,
          indice_orden: totalMensajes + 2,
        });

        return res.status(200).json({
          ok: true,
          respuesta: mensajeExito,
          registro_completado: true,
          fase: "perfilamiento",
          token,
          usuario: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            rol: newUser.rol,
          },
          sugerencias: [],
        });
      } else if (accion === "login") {
        return res.status(200).json({
          ok: true,
          respuesta: mensaje,
          redirigir: "/login",
          registro_completado: false,
          sugerencias: ["Ir a iniciar sesión", "Crear cuenta", "Recuperar contraseña"],
        });
      }

      return res.status(422).json({ ok: false, mensaje: "Acción no reconocida por el módulo de registro." });
    }

    // ================= FLUJO AUTENTICADO =================
    const user = req.user;
    const [contexto] = await ContextoUsuario.findOrCreate({
      where: { user_id: user.id },
      defaults: { user_id: user.id },
    });

    const sesion = await obtenerOCrearSesion(user.id);
    const resumen_estado = await resumenEstado(sesion);

    // ---- FASE: PERFILAMIENTO ----
    if (sesion.tarea === "perfilamiento") {
      const contextoSesion = await obtenerContexto(sesion);
      const respuestas_parciales = {
        edad: contextoSesion.edad,
        objetivo: contextoSesion.objetivo,
        horizonte: contextoSesion.horizonte,
        tolerancia_perdida: contextoSesion.tolerancia_perdida,
        ingresos: contextoSesion.ingresos,
        experiencia: contextoSesion.experiencia,
      };
      // No mandamos claves nulas al prompt, para no confundir al modelo.
      Object.keys(respuestas_parciales).forEach((k) => {
        if (respuestas_parciales[k] === null || respuestas_parciales[k] === undefined) {
          delete respuestas_parciales[k];
        }
      });

      let perfilResult;
      try {
        perfilResult = await execute("db_perfil", {
          pregunta,
          historial_reciente,
          respuestas_parciales,
          resumen_estado,
          provider,
          model,
          webSearch,
        });
      } catch (err) {
        console.error("[IA] Error en db_perfil:", err.message);
        return res.status(500).json({ ok: false, mensaje: "Error al procesar el perfilamiento.", detalle: err.message });
      }

      if (!perfilResult.isValid) {
        return res.status(422).json({
          ok: false,
          mensaje: "Error al formatear la respuesta de perfilamiento.",
          detalle: perfilResult.error,
          raw: perfilResult.raw,
        });
      }

      const { respuesta, perfil_completado, respuestas, sugerencias = [] } = perfilResult.parsed;

      await Mensaje.create({
        propietario_id: user.id,
        user_id: user.id,
        rol: "assistant",
        contenido: respuesta,
        indice_orden: totalMensajes + 1,
      });

      if (!perfil_completado) {
        // Antes: merge de un JSON libre sin límite. Ahora: solo se
        // escriben los campos tipados que el modelo haya devuelto; el
        // resto de las respuestas ya guardadas quedan intactas sin
        // necesidad de "traerlas y volver a mandarlas".
        if (respuestas && Object.keys(respuestas).length > 0) {
          try {
            await actualizarContexto(sesion, respuestas);
          } catch (err) {
            // Un valor fuera de rango (p. ej. texto más largo del permitido
            // en una columna) ya no puede tumbar toda la sesión: se loguea
            // y la conversación sigue. En el peor caso, esa respuesta
            // puntual no quedó guardada y se le vuelve a preguntar.
            console.error("[AgentSessionContext] No se pudo guardar respuesta parcial:", err.message);
          }
        }
        return res.status(200).json({ ok: true, respuesta, fase: "perfilamiento", sugerencias });
      }

      // Perfil completo: calcular score con reglas (no con IA) y crear propuesta
      const { score, perfil, version } = calcularPerfil(respuestas);
      const perfilCreado = await PerfilInversionista.create({
        user_id: user.id,
        ...respuestas,
        score,
        perfil,
        version_reglas: version,
      });

      const propuestaCalculada = generarPropuesta(perfil);
      const propuestaCreada = await PropuestaPortafolio.create({
        perfil_id: perfilCreado.id,
        ...propuestaCalculada,
      });

      await avanzarFase(sesion, "propuesta", {
        perfil_id: perfilCreado.id,
        propuesta_id: propuestaCreada.id,
      });
      await registrarEvento(sesion, "perfil_calculado", { perfil, score });

      const respuestaFinal = `${respuesta} Tu perfil calculado es "${perfil}". Ya generé una propuesta preliminar de portafolio, ¿quieres verla?`;

      await Mensaje.create({
        propietario_id: user.id,
        user_id: user.id,
        rol: "assistant",
        contenido: respuestaFinal,
        indice_orden: totalMensajes + 2,
      });

      return res.status(200).json({
        ok: true,
        respuesta: respuestaFinal,
        fase: "propuesta",
        perfil,
        sugerencias: ["Ver mi propuesta de portafolio"],
      });
    }

    // ---- FASE: PROPUESTA ----
    if (sesion.tarea === "propuesta") {
      const contextoSesion = await obtenerContexto(sesion);
      const perfilRow = await PerfilInversionista.findByPk(contextoSesion.perfil_id);
      const propuestaRow = await PropuestaPortafolio.findByPk(contextoSesion.propuesta_id);

      if (!perfilRow || !propuestaRow) {
        // Estado inconsistente: vuelve a levantar el perfil desde cero,
        // reseteando solo las respuestas (no toca perfil_id/propuesta_id
        // hasta que el nuevo perfilamiento los reemplace).
        await resetearRespuestas(sesion);
        await avanzarFase(sesion, "perfilamiento");
        return res.status(200).json({
          ok: true,
          respuesta: "Parece que necesito volver a levantar tu perfil de inversionista. ¿Cuál es tu edad?",
          fase: "perfilamiento",
          sugerencias: [],
        });
      }

      let propuestaResult;
      try {
        propuestaResult = await execute("db_propuesta", {
          pregunta,
          perfil: perfilRow.perfil,
          instrumentos: propuestaRow.instrumentos,
          riesgo_esperado: propuestaRow.riesgo_esperado,
          historial_reciente,
          resumen_estado,
          provider,
          model,
          webSearch,
        });
      } catch (err) {
        console.error("[IA] Error en db_propuesta:", err.message);
        return res.status(500).json({ ok: false, mensaje: "Error al explicar la propuesta.", detalle: err.message });
      }

      if (!propuestaResult.isValid) {
        return res.status(422).json({
          ok: false,
          mensaje: "Error al formatear la explicación de la propuesta.",
          detalle: propuestaResult.error,
          raw: propuestaResult.raw,
        });
      }

      const { respuesta, sugerencias = [] } = propuestaResult.parsed;

      await avanzarFase(sesion, "revision_asesor");

      const respuestaFinal = `${respuesta}\n\nEsta propuesta queda ahora pendiente de revisión por un asesor autorizado antes de cualquier ejecución.`;

      await Mensaje.create({
        propietario_id: user.id,
        user_id: user.id,
        rol: "assistant",
        contenido: respuestaFinal,
        indice_orden: totalMensajes + 1,
      });

      return res.status(200).json({
        ok: true,
        respuesta: respuestaFinal,
        fase: "revision_asesor",
        sugerencias,
      });
    }

    // ---- FASE: REVISIÓN POR ASESOR (esperando acción del asesor) ----
    if (sesion.tarea === "revision_asesor") {
      const respuestaFinal = "Tu propuesta está pendiente de revisión por un asesor. Te avisaremos apenas sea aprobada, editada o rechazada.";

      await Mensaje.create({
        propietario_id: user.id,
        user_id: user.id,
        rol: "assistant",
        contenido: respuestaFinal,
        indice_orden: totalMensajes + 1,
      });

      return res.status(200).json({
        ok: true,
        respuesta: respuestaFinal,
        fase: "revision_asesor",
        sugerencias: ["Ver estado de mi propuesta"],
      });
    }

    // ---- FASE: COMPLETADO -> flujo libre de consultas (db_query / db_answer) ----
    const intencion_pendiente = contexto.intencion_pendiente || null;
    const resumen_anterior = contexto.resumen || null;

    let queryResult;
    try {
      queryResult = await execute("db_query", {
        pregunta,
        historial_reciente,
        intencion_pendiente,
        resumen_contexto: resumen_anterior,
        resumen_estado,
        provider,
        model,
        webSearch,
      });
    } catch (err) {
      console.error("[IA] Error en db_query:", err.message);
      return res.status(500).json({ ok: false, mensaje: "Error al procesar la solicitud con la IA.", detalle: err.message });
    }

    if (!queryResult.isValid) {
      return res.status(422).json({ ok: false, mensaje: "La IA no pudo procesar la solicitud.", detalle: queryResult.error });
    }

    const { queryValida, razon, query } = queryResult.parsed;

    let resultados = [];
    let total_filas = 0;
    let errorEjecucion = null;

    if (queryValida && query) {
      try {
        const queryLimpia = validarQuerySegura(query);
        resultados = await sequelize.query(queryLimpia, {
          replacements: { userId: user.id },
          type: sequelize.QueryTypes.SELECT,
        });
        total_filas = resultados.length;
      } catch (sqlErr) {
        console.error("[SQL] Consulta rechazada o fallida:", sqlErr.message);
        errorEjecucion = sqlErr.message;
      }
    }

    let answerResult;
    try {
      answerResult = await execute("db_answer", {
        pregunta_original: pregunta,
        razon_query: razon,
        query_valida: queryValida && !errorEjecucion,
        resultados: resultados.slice(0, 50),
        total_filas,
        historial_reciente,
        intencion_pendiente,
        generar_resumen: true,
        resumen_anterior,
        resumen_estado,
        provider,
        model,
        webSearch,
      });
    } catch (err) {
      console.error("[IA] Error en db_answer:", err.message);
      return res.status(500).json({ ok: false, mensaje: "Error al formatear la respuesta.", detalle: err.message });
    }

    if (!answerResult.isValid) {
      return res.status(422).json({
        ok: false,
        mensaje: "Error al formatear la respuesta.",
        detalle: answerResult.error,
        raw: answerResult.raw,
      });
    }

    const {
      respuesta,
      tiene_datos,
      sugerencias = [],
      intencion_pendiente: nuevaIntencion = null,
      resumen: nuevoResumen = null,
    } = answerResult.parsed;

    await Mensaje.create({
      propietario_id: user.id,
      user_id: user.id,
      rol: "assistant",
      contenido: respuesta,
      indice_orden: totalMensajes + 1,
    });

    // ContextoUsuario.resumen sigue siendo un campo TEXT/STRING normal (no
    // JSON), pensado para texto libre que resume la conversación. Se
    // mantiene el truncado defensivo por las dudas, aunque el riesgo real
    // de esta pantalla ya no está aquí sino que estaba en AgentSession.
    const MAX_RESUMEN_BYTES = 20 * 1024; // 20KB
    let resumenAGuardar = nuevoResumen || resumen_anterior;
    if (resumenAGuardar && Buffer.byteLength(resumenAGuardar) > MAX_RESUMEN_BYTES) {
      console.warn(
        `[ContextoUsuario] resumen excede ${MAX_RESUMEN_BYTES} bytes para user ${user.id}, truncando.`
      );
      resumenAGuardar = resumenAGuardar.slice(0, MAX_RESUMEN_BYTES);
    }

    await contexto.update({
      intencion_pendiente: nuevaIntencion,
      resumen: resumenAGuardar,
    });

    return res.status(200).json({
      ok: true,
      respuesta,
      fase: "completado",
      tiene_datos,
      sugerencias,
      debug: {
        query_generada: query || null,
        total_filas,
        error_sql: errorEjecucion,
      },
    });
  } catch (err) {
    console.error("[enviarMensaje] Error general:", err.message);
    return res.status(500).json({ ok: false, mensaje: "Error en el flujo de chat.", detalle: err.message });
  }
};