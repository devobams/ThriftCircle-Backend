import { Router } from "express";
import {
    register, 
    login, 
    getMe,
    handleForgotPassword,
    handleVerifyResetOtp,
    handleResetPassword
 } from "./auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.post("/forgot-password", handleForgotPassword);
router.post("/verify-reset-otp", handleVerifyResetOtp);
router.patch("/reset-password", handleResetPassword);
export default router;