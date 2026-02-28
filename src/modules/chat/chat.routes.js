import { Router } from "express";
import { initiateChat, getUserChats, getChatMessages } from "./chat.controller.js";
import { authHandler } from "../../middlewares/authHandler.js";

const router = Router();

router.post("/initiate", authHandler, initiateChat);
router.get("/list", authHandler, getUserChats);
router.get("/:chatId/messages", authHandler, getChatMessages);

export default router;
