import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const AgentSession = sequelize.define("AgentSession", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  tarea: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM("en_progreso", "completado", "cancelado"),
    defaultValue: "en_progreso",
  },
  contexto: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  historial: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  tableName: "agent_sessions",
  timestamps: true,
});

export default AgentSession;