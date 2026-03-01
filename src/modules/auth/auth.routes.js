import { Router } from "express";
import {
    login,
    signup,
    refreshTokenHandler,
    sendOtp,
    verifyOtp,
} from "./auth.controller.js";

const router = Router();

// OTP flow
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Auth
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshTokenHandler);

export default router;
