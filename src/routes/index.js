import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import groupsRoutes from "../modules/groups/groups.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use(groupsRoutes);

export default router;