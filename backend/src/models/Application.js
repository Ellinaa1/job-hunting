import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Application = sequelize.define(
  "Application",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "jobs",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    candidateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "candidates",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },

    coverLetter: {
      type: DataTypes.STRING
    },
    cvUrl: {
        type: DataTypes.STRING
    }
  },
  {
    tableName: "applications",
    timestamps: true,
  }
);
