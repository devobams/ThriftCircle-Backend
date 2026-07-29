import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { getDashboard } from "./dashboard.controller.js";

const router = Router();

router.get("/groups/:id/dashboard", authenticate, authorize("organizer"), getDashboard);

export default router;