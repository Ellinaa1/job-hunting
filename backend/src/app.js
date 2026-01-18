import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import jobRouter from "./routes/jobRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import companyRouter from "./routes/companyRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerDocument = YAML.load("./docs/swagger.yaml"); 
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API routes
app.use("/auth", authRouter);
app.use("/jobs", jobRouter);
app.use("/users", userRouter);
app.use("/applications", applicationRouter);
app.use("/companies", companyRouter);

app.get("/", (req, res) => {
  res.json({ message: "Job Hunting API is running" });
});

export default app;
