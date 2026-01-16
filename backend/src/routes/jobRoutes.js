import { Router } from "express";
import jobController from "../controllers/jobController.js";
import { auth } from "../middlewares/auth.js";
import validateRequiredStrings from "../middlewares/validateRequiredFields.js";
import { isVerified } from "../middlewares/isVerified.js";

const router = Router();

router.get("/", jobController.getAllJobs); 
router.get("/:id", jobController.getJobById);
router.post("/", auth, isVerified, validateRequiredStrings(["title", "description"]), jobController.createJob)
router.put("/:id", auth, isVerified, jobController.updateJobById);
router.delete("/:id", auth, isVerified, jobController.deleteJob);



// these 3 are not checked 
// Get all jobs by employer
router.get("/employer/:id", jobController.getJobsByEmployer);

// Close job
router.patch("/:id/close", auth, isVerified, jobController.closeJob);

// Reopen job
router.patch("/:id/open", auth, isVerified, jobController.openJob);

export default router;
