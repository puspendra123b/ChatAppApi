import mongoose from "mongoose";
import { Chat } from "./chat.model.js";

class ChatRepository {
  async createChat(data) {
    const output = new Chat(data);
    return await output.save();
  }

  async getChatById(chatId) {
    return await Chat.findById(chatId);
  }

  async findDirectChatBetweenUsers(userId1, userId2) {
    return await Chat.findOne({
      type: "direct",
      members: {
        $all: [
          new mongoose.Types.ObjectId(userId1),
          new mongoose.Types.ObjectId(userId2),
        ],
      },
      $expr: { $eq: [{ $size: "$members" }, 2] },
    });
  }

  /**
   * Get all chats for a user, populated with member info and last message.
   */
  async getUserChats(userId) {
    return await Chat.find({
      members: new mongoose.Types.ObjectId(userId),
      isActive: true,
    })
      .populate("members", "email userId avatar bio isOnline lastSeen")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .lean();
  }
}

export default new ChatRepository();
