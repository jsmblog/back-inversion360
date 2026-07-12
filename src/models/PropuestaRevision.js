import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const PropuestaRevision = sequelize.define(
  "PropuestaRevision",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    propuesta_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'propuestas_portafolio',
        key: 'id'
      }
    },
    asesor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    accion: {
      type: DataTypes.ENUM('aprobada', 'rechazada', 'editada'),
      allowNull: false
    },
    comentarios: { type: DataTypes.TEXT, allowNull: true },
    cambios: { type: DataTypes.JSON, allowNull: true },
    snapshot_reglas: { type: DataTypes.JSON, allowNull: true },
    fecha_decision: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  {
    tableName: 'propuestas_revision',
    timestamps: false
  }
);