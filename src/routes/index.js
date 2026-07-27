import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import groupsRoutes from "../modules/groups/groups.routes.js";
import contributionsRoutes from "../modules/contributions/contributions.routes.js";
import payoutsRoutes from "../modules/payouts/payouts.routes.js";
import invitesRoutes from "../modules/invites/invites.routes.js";
import joinRequestsRoutes from "../modules/join-requests/join-requests.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/", groupsRoutes);
router.use("/", contributionsRoutes);
router.use("/", payoutsRoutes);
router.use("/", invitesRoutes);
router.use("/", joinRequestsRoutes);

export default router;