import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const User = sequelize.define("User", {

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  rol: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
}, {
  tableName: "users",
  timestamps: true
});

export default User;