import AgentSession from "../models/agentSession.js";
import AgentSessionEvent from "../models/agentSessionEvent.js";
import AgentSessionContext from "../models/agentSessionContext.js";
import { Op } from "sequelize";

const FASES = ["perfilamiento", "propuesta", "revision_asesor", "completado"];

const CAMPOS_CONTEXTO_VALIDOS = [
  "edad",
  "objetivo",
  "horizonte",
  "tolerancia_perdida",
  "ingresos",
  "experiencia",
  "perfil_id",
  "propuesta_id",
];

export const obtenerOCrearSesion = async (userId) => {
  const [sesion] = await AgentSession.findOrCreate({
    where: { sessionId: userId },
    defaults: { sessionId: userId, userId, tarea: "perfilamiento" },
  });
  // Garantiza que exista la fila 1:1 de contexto desde el inicio.
  await AgentSessionContext.findOrCreate({
    where: { sessionId: sesion.id },
    defaults: { sessionId: sesion.id },
  });
  return sesion;
};

export const obtenerContexto = async (sesion) => {
  const [contexto] = await AgentSessionContext.findOrCreate({
    where: { sessionId: sesion.id },
    defaults: { sessionId: sesion.id },
  });
  return contexto;
};

export const registrarEvento = async (sesion, evento, detalle = null) => {
  await AgentSessionEvent.create({
    sessionId: sesion.id,
    userId: sesion.userId,
    evento,
    detalle,
  });
  return sesion;
};

// Actualiza SOLO los campos tipados provistos. No hace merge de blobs,
// no reescribe nada que no se le pida. Cada columna está acotada por su
// tipo (SMALLINT, STRING(30), UUID) — MySQL rechaza el valor antes de que
// pueda crecer descontroladamente, así que no hace falta un límite de
// bytes calculado en la app como antes.
export const actualizarContexto = async (sesion, camposParciales = {}) => {
  const contexto = await obtenerContexto(sesion);

  const camposFiltrados = {};
  const camposIgnorados = [];
  for (const [key, value] of Object.entries(camposParciales)) {
    if (CAMPOS_CONTEXTO_VALIDOS.includes(key)) {
      camposFiltrados[key] = value;
    } else {
      camposIgnorados.push(key);
    }
  }

  if (camposIgnorados.length > 0) {
    console.warn(
      `[AgentSessionContext] Campos ignorados por no estar en el esquema: ${camposIgnorados.join(", ")}`
    );
    await registrarEvento(sesion, "contexto_campos_ignorados", { campos: camposIgnorados });
  }

  if (Object.keys(camposFiltrados).length > 0) {
    await contexto.update(camposFiltrados);
  }
  return contexto;
};

export const avanzarFase = async (sesion, nuevaFase, camposContexto = {}) => {
  await registrarEvento(sesion, `fase_completada:${sesion.tarea}`);

  if (Object.keys(camposContexto).length > 0) {
    await actualizarContexto(sesion, camposContexto);
  }

  await sesion.update({
    tarea: nuevaFase,
    estado: nuevaFase === "completado" ? "completado" : "en_progreso",
  });

  await registrarEvento(sesion, `fase_iniciada:${nuevaFase}`);
  return sesion;
};

// Reinicia solo las respuestas del cuestionario (deja intactos perfil_id
// y propuesta_id, que pertenecen a fases posteriores). Se usa cuando hay
// que volver a levantar el perfil de un usuario.
export const resetearRespuestas = async (sesion) => {
  const contexto = await obtenerContexto(sesion);
  await registrarEvento(sesion, "respuestas_reseteadas");
  await contexto.update({
    edad: null,
    objetivo: null,
    horizonte: null,
    tolerancia_perdida: null,
    ingresos: null,
    experiencia: null,
  });
  return contexto;
};

export const resumenEstado = async (sesion) => {
  const contexto = await obtenerContexto(sesion);
  const idx = FASES.indexOf(sesion.tarea);
  const completadas = FASES.slice(0, idx);
  const pendientes = FASES.slice(idx + 1);

  const respuestasTexto = CAMPOS_CONTEXTO_VALIDOS
    .filter((campo) => contexto[campo] !== null && contexto[campo] !== undefined)
    .map((campo) => `${campo}: ${contexto[campo]}`)
    .join(", ") || "ninguna";

  return `FASE ACTUAL: ${sesion.tarea}\nFASES COMPLETADAS: ${completadas.join(", ") || "ninguna"}\nFASES PENDIENTES: ${pendientes.join(", ") || "ninguna"}\nCONTEXTO_FASE: ${respuestasTexto}`;
};

// Timeline paginado — nunca "traer todo el historial".
export const obtenerHistorialPaginado = async (sesion, { limit = 50, before = null } = {}) => {
  const where = { sessionId: sesion.id };
  if (before) {
    where.createdAt = { [Op.lt]: before };
  }
  return AgentSessionEvent.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
  });
};