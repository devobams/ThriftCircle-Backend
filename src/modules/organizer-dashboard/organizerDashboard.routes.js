import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { getOrganizerDashboardHandler } from "./organizerDashboard.controller.js";

const router = Router();

router.get("/organizer/dashboard", authenticate, authorize("organizer"), getOrganizerDashboardHandler);

export default router;