import { Router } from "express";
import userController from "../controllers/userController.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.get("/profile", auth, userController.profile); 
router.get("/:id", auth, userController.getUser)

export default router;
