import { sendDirect } from "./handlers/message.handler.js";
import { handleTyping } from "./handlers/presence.handler.js";
import { acceptCall, handleAnswer, handleIceCandidate, handleOffer, initiateCall, rejectCall, endCall } from "./handlers/webRtc.handler.js";


export async function handleEvent(socket, data) {
  if (!data?.type) return;

  switch (data.type) {
    case "PING":
      socket.send(
        JSON.stringify({
          type: "PONG",
        }),
      );
      break;

    // Messaging
    case "SEND_DIRECT_MESSAGE":
      return sendDirect(socket, data.payload);

    // Presence
    case "TYPING_START":
      return handleTyping(socket, {
        chatId: data.payload?.chatId,
        isTyping: true,
      });

    case "TYPING_STOP":
      return handleTyping(socket, {
        chatId: data.payload?.chatId,
        isTyping: false,
      });

    // Call Lifecycle
    case "CALL_INITIATE":
      return initiateCall(socket, data.payload);

    case "CALL_ACCEPT":
      return acceptCall(socket, data.payload);

    case "CALL_REJECT":
      return rejectCall(socket, data.payload);

    case "CALL_END":
      return endCall(socket, data.payload);

    // WebRTC Signaling
    case "RTC_OFFER":
      return handleOffer(socket, data.payload);

    case "RTC_ANSWER":
      return handleAnswer(socket, data.payload);

    case "RTC_ICE_CANDIDATE":
      return handleIceCandidate(socket, data.payload);

    default:
      console.warn("Unknown socket event:", data.type);
      break;
  }
}
