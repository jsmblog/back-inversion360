import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const PropuestaPortafolio = sequelize.define(
  "PropuestaPortafolio",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    perfil_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'perfiles_inversionista',
        key: 'id'
      }
    },
    instrumentos: { type: DataTypes.JSON, allowNull: false },
    riesgo_esperado: { type: DataTypes.STRING, allowNull: false },
    estado: {
      type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada', 'editada'),
      defaultValue: 'pendiente'
    },
    justificacion: { type: DataTypes.TEXT, allowNull: true },
    version_reglas: { type: DataTypes.STRING, allowNull: true, defaultValue: 'v1.0.0' },
  }, {
    tableName: 'propuestas_portafolio',
    timestamps: true
  }
);