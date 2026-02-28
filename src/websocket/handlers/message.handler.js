import chatRepository from "../../modules/chat/chat.repository.js";
import messageRepository from "../../modules/message/message.repository.js";
import { sendToUser } from "../socketRegistry.js";

export async function sendDirect(socket, payload) {
    
    const { chatId, content, clientMessageId } = payload;
    const senderId = socket.userId;

  if (!chatId || !content || !clientMessageId) {
    return;
  }

  // 1️⃣ Validate chat exists
  const chat = await chatRepository.getChatById(chatId);

  if (!chat || chat.type !== "direct") {
    return;
  }
  

  // 2️⃣ Validate membership
  if (!chat.members.some((id) => id.toString() === senderId.toString())) {
    return;
  }

  let message;

  try {
    // 3️⃣ Save message (idempotent)
    message = await messageRepository.createMessage({
      chatId,
      senderId,
      content,
      clientMessageId,
    });
  } catch (err) {
    // If duplicate (idempotent case)
    message = await messageRepository.findByClientId(chatId, clientMessageId);
  }

  // 4️⃣ ACK to sender immediately
  socket.send(
    JSON.stringify({
      type: "MESSAGE_SENT_ACK",
      payload: {
        clientMessageId,
        messageId: message._id,
        createdAt: message.createdAt,
      },
    }),
  );

  // 5️⃣ Deliver to recipient
  const recipientId = chat.members.find(
    (id) => id.toString() !== senderId.toString(),
  );

  sendToUser(recipientId.toString(), {
    type: "NEW_DIRECT_MESSAGE",
    payload: message,
  });
}
