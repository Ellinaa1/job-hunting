import express from "express";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import jobRouter from "./routes/jobRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

app.use("/auth", authRouter)
app.use("/jobs", jobRouter);  
app.use("/users", userRouter);

// Default route
app.get("/", (req, res) => {
    res.json({ message: "Job Hunting API is running" });
});

export default app;
