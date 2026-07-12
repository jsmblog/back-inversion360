import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const PerfilInversionista = sequelize.define(
  "PerfilInversionista",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    edad: { type: DataTypes.INTEGER, allowNull: false },
    objetivo: { type: DataTypes.STRING, allowNull: false },
    horizonte: { type: DataTypes.STRING, allowNull: false },
    tolerancia_perdida: { type: DataTypes.STRING, allowNull: false },
    ingresos: { type: DataTypes.STRING, allowNull: false },
    experiencia: { type: DataTypes.STRING, allowNull: false },
    score: { type: DataTypes.FLOAT, allowNull: true },
    perfil: { type: DataTypes.ENUM("conservador", "moderado", "agresivo"), allowNull: true },
    version_reglas: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "perfiles_inversionista", timestamps: true }
);