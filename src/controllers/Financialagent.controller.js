import { sequelize } from "../config/database.js";
import { Mensaje, ContextoUsuario, User } from "../models/relations.js";
import { execute } from "../ai/execute.js";
import { validarQuerySegura } from "../utils/sqlguard.js";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from "bcrypt";

const MENSAJES_DE_CONTEXTO = 10;

function getEstadoPerfil(req) {
  if (!req.session.estado_perfil) {
    req.session.estado_perfil = {
      paso: 0, // 0 a 5
      respuestas: {},
      completado: false,
    };
  }
  return req.session.estado_perfil;
}

export const obtenerConversacion = async (req, res) => {
  try {
    const mensajes = await Mensaje.findAll({
      where: { propietario_id: req.ownerId },
      order: [["indice_orden", "ASC"]],
    });

    return res.status(200).json({ ok: true, autenticado: !!req.user, data: mensajes });
  } catch (err) {
    console.error("[obtenerConversacion]", err.message);
    return res.status(500).json({ ok: false, mensaje: "Error al obtener la conversación.", detalle: err.message });
  }
};

const SALT_ROUNDS = 10;

export const enviarMensaje = async (req, res) => {
  try {
    const { pregunta, provider, model, webSearch } = req.body;
    if (!pregunta?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "'pregunta' es obligatoria." });
    }

    let ownerId = req.ownerId;
    if (!req.user) {
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

        await ContextoUsuario.create({
          user_id: newUser.id,
          resumen: null,
          intencion_pendiente: null,
        });

        req.session.datos_registro = null;
        req.session.ownerId = null;

        const mensajeExito = `¡Registro completado! Bienvenido, ${newUser.name}. Ahora puedes realizar consultas financieras. ¿En qué puedo ayudarte?`;
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
          sugerencias: ["Ver mi saldo", "Últimos movimientos", "Crear meta de ahorro"],
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

    const user = req.user;
    const [contexto] = await ContextoUsuario.findOrCreate({
      where: { user_id: user.id },
      defaults: { user_id: user.id },
    });

    const intencion_pendiente = contexto.intencion_pendiente || null;
    const resumen_anterior = contexto.resumen || null;

    let queryResult;
    try {
      queryResult = await execute("db_query", {
        pregunta,
        historial_reciente,
        intencion_pendiente,
        resumen_contexto: resumen_anterior,
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

    await contexto.update({
      intencion_pendiente: nuevaIntencion,
      resumen: nuevoResumen || resumen_anterior,
    });

    return res.status(200).json({
      ok: true,
      respuesta,
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