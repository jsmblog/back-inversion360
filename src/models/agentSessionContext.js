import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Reemplaza AgentSession.contexto (antes un JSON libre sin límite real).
// Cada campo tiene un tipo y un tamaño máximo IMPUESTO POR EL ESQUEMA de
// la base de datos, no solo por una validación en la app. Es estructuralmente
// imposible que un campo aquí crezca a cientos de KB: MySQL rechaza el
// INSERT/UPDATE antes de que eso ocurra.
const AgentSessionContext = sequelize.define("AgentSessionContext", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true, // una fila de contexto por sesión, relación 1:1
  },

  // ---- Respuestas del cuestionario de perfilamiento ----
  // Antes vivían mezcladas dentro de contexto.respuestas (JSON libre).
  // Ahora cada una es una columna con su propio tipo y límite.
  edad: {
    type: DataTypes.SMALLINT,
    allowNull: true,
  },
  objetivo: {
    type: DataTypes.STRING(30), // "ahorro" | "retiro" | "crecimiento"
    allowNull: true,
  },
  horizonte: {
    type: DataTypes.STRING(30), // "corto" | "medio" | "largo"
    allowNull: true,
  },
  tolerancia_perdida: {
    type: DataTypes.STRING(30), // "vender_todo" | "mantener" | "comprar_mas"
    allowNull: true,
  },
  ingresos: {
    type: DataTypes.STRING(30), // "bajo" | "medio" | "alto"
    allowNull: true,
  },
  experiencia: {
    type: DataTypes.STRING(30), // "ninguna" | "basica" | "avanzada"
    allowNull: true,
  },

  // ---- Referencias a filas ya creadas (no se duplica el dato) ----
  perfil_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  propuesta_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: "agent_session_contexts",
  timestamps: true,
});

export default AgentSessionContext;