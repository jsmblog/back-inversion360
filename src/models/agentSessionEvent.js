import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const AgentSessionEvent = sequelize.define("AgentSessionEvent", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  evento: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  detalle: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: "agent_session_events",
  timestamps: true, 
  updatedAt: false,  
  indexes: [
    { fields: ["sessionId", "createdAt"] },
    { fields: ["userId"] },
  ],
});

export default AgentSessionEvent;