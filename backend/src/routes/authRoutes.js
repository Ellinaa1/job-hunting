import { Router } from "express";
import authController from "../controllers/authController.js";
import validateRequiredStrings from "../middlewares/validateRequiredFields.js";


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

router.post(
  "/forgot-password",
  validateRequiredStrings(["email"]),
  authController.forgotPassword
);

router.post(
  "/reset-password/:token",
  validateRequiredStrings(["newPassword"]),
  authController.resetPassword
);

router.get("/reset-password/:token", authController.renderResetPasswordPage);

export default router;
