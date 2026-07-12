import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const ContextoUsuario = sequelize.define(
  "ContextoUsuario",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    resumen: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    intencion_pendiente: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mensajes_resumidos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tokens_acumulados: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "contexto_usuarios",
    timestamps: true,
  }
);