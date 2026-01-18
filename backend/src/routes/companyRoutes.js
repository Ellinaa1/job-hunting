import { Router } from "express";
import companyController from "../controllers/companyController.js";
import { auth } from "../middlewares/auth.js";
import validateRequiredStrings from "../middlewares/validateRequiredFields.js";

const router = Router();

router.get("/", companyController.listCompanies);
router.get("/:companyId", companyController.getCompanyById);
router.post(
  "/",
  auth,
  validateRequiredStrings(["name", "industry"]),
  companyController.createCompany
);
router.put(
  "/:companyId",
  auth,
  companyController.updateCompany
);
router.delete(
  "/:companyId",
  auth,
  companyController.deleteCompany
);

export default router;
