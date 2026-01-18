import { Router } from "express";
import jobController from "../controllers/jobController.js";
import applicationController from "../controllers/applicationController.js";
import { auth } from "../middlewares/auth.js";
import validateRequiredStrings from "../middlewares/validateRequiredFields.js";
import { isVerified } from "../middlewares/isVerified.js";

const router = Router();

router.get("/", jobController.getAllJobs);
router.post("/", auth, isVerified, validateRequiredStrings(["title", "description"]), jobController.createJob);
router.get("/employer/me", auth, isVerified, jobController.getMyJobs);
router.get("/company/:id", jobController.getJobsByCompany);
router.patch("/:id/close", auth, isVerified, jobController.closeJob);
router.patch("/:id/open", auth, isVerified, jobController.openJob);
router.get("/:id", jobController.getJobById);
router.put("/:id", auth, isVerified, jobController.updateJobById);
router.delete("/:id", auth, isVerified, jobController.deleteJob);
router.post("/:id/apply", auth, isVerified, applicationController.applyForJob);

export default router;
