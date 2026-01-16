import { Router } from "express";
import authController from "../controllers/authController.js";
import validateRequiredStrings from "../middlewares/validateRequiredFields.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.post(
  "/candidate/signup",
  validateRequiredStrings(["name", "surname", "email", "password"]),
  authController.candidateSignup
);

router.post(
  "/employer/signup",
  validateRequiredStrings(["name", "surname", "email", "password"]),
  authController.employerSignup
);

router.get("/verify-email/:token", authController.verifyEmail);

router.post(
  "/login",
  validateRequiredStrings(["email", "password"]),
  authController.login
); // for all 3 roles

router.post("/logout", authController.logout); // not done
router.post("/refresh", authController.refreshToken); // not done


export default router;
