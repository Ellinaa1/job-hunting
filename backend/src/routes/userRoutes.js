import { Router } from "express";
import userController from "../controllers/userController.js";
import { auth } from "../middlewares/auth.js";
import { isVerified } from "../middlewares/isVerified.js";

const router = Router();

router.get("/profile", auth, userController.profile);
router.put("/profile", auth, userController.updateProfile);
router.put("/change-password", auth, userController.changePassword);
router.delete("/account", auth, userController.deleteAccount);
router.get("/applications/list", auth, isVerified, userController.getMyApplications);
router.get("/:id", auth, userController.getUser);

export default router;
