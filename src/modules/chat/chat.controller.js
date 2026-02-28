import { asyncHandler } from "../../utils/async.handler.js";
import { sendError, sendSuccess } from "../../utils/response.handler.js";
import chatRepository from "./chat.repository.js";
import messageRepository from "../message/message.repository.js";
import mongoose from "mongoose";

/**
 * POST /api/chat/initiate
 * Create or retrieve a direct chat between two users.
 */
export const initiateChat = asyncHandler(async (req, res) => {
  const { id, email, userId } = req.user;
  const { receiverUserId, chatType = "direct" } = req.body;

  if (chatType.toUpperCase() === "DIRECT") {
    const chat = await chatRepository.findDirectChatBetweenUsers(
      id,
      receiverUserId,
    );

    if (chat) {
      return sendSuccess(res, chat, "Chat retrieved successfully");
    }

    const chatPayload = {
      type: "direct",
      members: [id, new mongoose.Types.ObjectId(receiverUserId)],
      createdBy: id,
    };

    const createdChat = await chatRepository.createChat(chatPayload);

    if (createdChat) {
      return sendSuccess(
        res,
        {
          chatId: createdChat._id,
        },
        "Chat created successfully",
      );
    }
    return sendError(res, "Chat creation failed");
  }
});

/**
 * GET /api/chat/list
 * Get all chats for the authenticated user.
 */
export const getUserChats = asyncHandler(async (req, res) => {
  const { id } = req.user;

  const chats = await chatRepository.getUserChats(id);
  return sendSuccess(res, chats, "Chats fetched successfully");
});

/**
 * GET /api/chat/:chatId/messages
 * Get messages for a specific chat (with pagination).
 */
export const getChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { id } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  // Verify user is a member of this chat
  const chat = await chatRepository.getChatById(chatId);
  if (!chat) {
    return sendError(res, "Chat not found", 404);
  }

  if (!chat.members.some((memberId) => memberId.toString() === id.toString())) {
    return sendError(res, "Not authorized to access this chat", 403);
  }

  const messages = await messageRepository.getMessagesByChatId(chatId, page, limit);
  return sendSuccess(res, messages, "Messages fetched successfully");
});
