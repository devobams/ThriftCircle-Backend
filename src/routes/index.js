import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import backOfficeRoutes from "../modules/back-office/backOffice.routes.js"

const router = Router();

router.use("/auth", authRoutes);
router.use("/back-office",backOfficeRoutes)

export default router;