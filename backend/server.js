import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import { sequelize } from "./src/config/database.js";

import "./src/models/index.js";

const PORT = process.env.PORT;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");

    await sequelize.sync({alter: true});
    console.log("Models synchronized");

    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error starting server:", err.message);
  }
}

startServer();
