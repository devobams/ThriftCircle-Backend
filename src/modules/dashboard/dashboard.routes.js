import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { getDashboard } from "./dashboard.controller.js";

const router = Router();

router.get("/groups/:id/dashboard", authenticate, getDashboard);

export default router;