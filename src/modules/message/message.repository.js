import { Message } from "./message.model.js";

class MessageRepository {
  async createMessage(data) {
    const output = new Message(data);
    return await output.save();
  }

  async findByClientId(chatId, clientMessageId) {
    return await Message.findOne({ chatId, clientMessageId });
  }

  /**
   * Get messages for a chat with pagination (newest first).
   * Returns messages in chronological order (oldest first) for the UI.
   */
  async getMessagesByChatId(chatId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      chatId,
      isDeleted: { $ne: true },
    })
      .populate("senderId", "email userId avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Return in chronological order (oldest first)
    return messages.reverse();
  }
}

export default new MessageRepository();
