import { Router } from "express";
import applicationController from "../controllers/applicationController.js";
import { auth } from "../middlewares/auth.js";
import { isVerified } from "../middlewares/isVerified.js";

const router = Router();

router.post("/:jobId/apply", auth, isVerified, applicationController.applyForJob);
router.get("/candidate/list", auth, isVerified, applicationController.getCandidateApplications);
router.get("/:applicationId", auth, isVerified, applicationController.getApplicationById);
router.delete("/:applicationId/withdraw", auth, isVerified, applicationController.withdrawApplication);
router.patch("/:applicationId/status", auth, isVerified, applicationController.updateApplicationStatus);

export default router;
