// src/models/message.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Mensaje = sequelize.define(
  "Mensaje",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true, 
    },
    rol: {
      type: DataTypes.ENUM("user", "assistant", "system"),
      allowNull: false,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    indice_orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tokens: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    propietario_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "mensajes",
    timestamps: true,
    indexes: [{ fields: ["user_id", "indice_orden"] }],
  }
);