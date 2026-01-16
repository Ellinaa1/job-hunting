import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Employer = sequelize.define(
  "Employer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    companyId: {
      type: DataTypes.INTEGER,
      references: {
        model: "companies",
        key: "id",
      }
    },

    position: {
      type: DataTypes.STRING,
    },

    phone: {
      type: DataTypes.STRING,
    },

    industry: {
      type: DataTypes.STRING,
    }
  },
  {
    tableName: "employers",
    timestamps: true,
  }
);
