import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Company = sequelize.define(
  "Company",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    industry: {
      type: DataTypes.STRING,
      allowNull: false
    },

    location: {
      type: DataTypes.STRING,
    },

    website: {
      type: DataTypes.STRING,
    },

    logoUrl: {
      type: DataTypes.STRING,
    }
  },
  {
    tableName: "companies",
    timestamps: true,
  }
);
