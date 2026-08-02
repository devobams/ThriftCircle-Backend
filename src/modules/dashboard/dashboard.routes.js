import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { getDashboard, getMemberDashboardHandler } from "./dashboard.controller.js";

const router = Router();

router.get("/groups/:id/organizer-dashboard", authenticate, authorize("organizer"), getDashboard);
router.get("/groups/:id/member-dashboard", authenticate, getMemberDashboardHandler);

export default router;