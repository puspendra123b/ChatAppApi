import { sendDirect } from "./handlers/message.handler.js";
import { handleTyping } from "./handlers/presence.handler.js";

export async function handleEvent(socket, data) {
  if (!data.type) return;

  switch (data.type) {
    case "PING":
      socket.send(JSON.stringify({ type: "PONG" }));
      break;

    case "SEND_DIRECT_MESSAGE":
      return sendDirect(socket, data.payload);

    case "TYPING_START":
      return handleTyping(socket, { chatId: data.payload?.chatId, isTyping: true });

    case "TYPING_STOP":
      return handleTyping(socket, { chatId: data.payload?.chatId, isTyping: false });

    default:
      break;
  }
}
