import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Candidate = sequelize.define(
  "Candidate",
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

    cvUrl: {
      type: DataTypes.STRING,
    },

    phone: {
      type: DataTypes.STRING,
    },

    city: {
      type: DataTypes.STRING,
    },

    profession: {
      type: DataTypes.STRING,
    },

    linkedin: {
      type: DataTypes.STRING,
      validate: {
        isUrl: true, // optional but good
      }
    }
  },
  {
    tableName: "candidates",
    timestamps: true,
  }
);
