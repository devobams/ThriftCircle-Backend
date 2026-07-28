import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { getReport } from "./reports.controller.js";

const router = Router();

router.get(
  "/groups/:id/reports/:cycleId",
  authenticate,
  getReport
);

export default router;