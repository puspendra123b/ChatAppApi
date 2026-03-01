import { Router } from "express";
import { login, signup, refreshTokenHandler } from "./auth.controller.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshTokenHandler);

export default router;
