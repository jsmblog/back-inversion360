import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Investor = sequelize.define("Investor", {

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {
  tableName: "investors",
  timestamps: true
});