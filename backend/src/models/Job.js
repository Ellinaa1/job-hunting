import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Job = sequelize.define(
  "Job",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    employerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employers",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    salaryMin: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
      },
    },

    salaryMax: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
      },
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "open",
    },

    category: { // IT
      type: DataTypes.STRING,
    },

    city: {
      type: DataTypes.STRING,
    },

    type: {
      type: DataTypes.STRING, // full-time, part-time, remote, internship,...
    },

    level: {
      type: DataTypes.STRING, // junior, mid, senior
    },
  },
  {
    tableName: "jobs",
    timestamps: true,
  }
);
