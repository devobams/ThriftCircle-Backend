import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { getReport } from "./reports.controller.js";

const router = Router();

router.get(
  "/groups/:id/reports/:cycleId",
  authenticate,
  authorize("organizer"),
  getReport
);

export default router;