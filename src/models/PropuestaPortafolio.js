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
    perfil_id: { type: DataTypes.UUID, allowNull: false },
    instrumentos: { type: DataTypes.JSON, allowNull: false }, 
    riesgo_esperado: { type: DataTypes.STRING, allowNull: false },
    explicacion: { type: DataTypes.TEXT, allowNull: true },
    version_reglas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    estado: { type: DataTypes.ENUM("pendiente", "aprobada", "rechazada", "editada"), defaultValue: "pendiente" },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "propuestas_portafolio", timestamps: true }
);