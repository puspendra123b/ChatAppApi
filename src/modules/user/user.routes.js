import { Router } from "express";
import { searchUsers, getMe } from "./user.controller.js";
import { authHandler } from "../../middlewares/authHandler.js";

const router = Router();

router.get("/me", authHandler, getMe);
router.get("/search", authHandler, searchUsers);

export default router;
