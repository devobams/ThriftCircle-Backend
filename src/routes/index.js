import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import groupsRoutes from "../modules/groups/groups.routes.js";
import contributionsRoutes from "../modules/contributions/contributions.routes.js";
import payoutsRoutes from "../modules/payouts/payouts.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/", groupsRoutes);
router.use("/", contributionsRoutes);
router.use("/", payoutsRoutes);

export default router;