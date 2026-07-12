import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const AuditoriaRevision = sequelize.define(
  "AuditoriaRevision",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    propuesta_id: { type: DataTypes.UUID, allowNull: false },
    asesor_id: { type: DataTypes.UUID, allowNull: false },
    accion: { type: DataTypes.ENUM("aprobada", "rechazada", "editada"), allowNull: false },
    comentarios: { type: DataTypes.TEXT, allowNull: true },
    version_reglas: { type: DataTypes.INTEGER, allowNull: false },
    snapshot_perfil: { type: DataTypes.JSON, allowNull: true },
    snapshot_propuesta: { type: DataTypes.JSON, allowNull: true },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "auditoria_revisiones", timestamps: true }
);