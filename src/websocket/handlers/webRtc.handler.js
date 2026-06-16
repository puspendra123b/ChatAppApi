import chatRepository from "../../modules/chat/chat.repository.js";
import callRepository from "../../modules/call/call.repository.js";
import { sendToUser } from "../socketRegistry.js";

export async function initiateCall(socket, payload) {
  const { callId, chatId, mediaType } = payload;
  const callerId = socket.userId;

  if (!callId || !chatId || !mediaType) {
    return;
  }

  // Validate chat
  const chat = await chatRepository.getChatById(chatId);

  if (!chat || chat.type !== "direct") {
    return;
  }

  // Validate membership
  if (
    !chat.members.some(
      (id) => id.toString() === callerId.toString(),
    )
  ) {
    return;
  }

  // Find recipient
  const recipientId = chat.members.find(
    (id) => id.toString() !== callerId.toString(),
  );

  if (!recipientId) {
    return;
  }

  // Log to DB
  try {
    await callRepository.createCall({
      callId,
      chatId,
      callerId,
      calleeId: recipientId,
      mediaType,
      status: "initiated",
    });
  } catch (err) {
    console.error("Failed to log call initiation to DB:", err);
  }

  // Notify recipient
  sendToUser(recipientId.toString(), {
    type: "CALL_INCOMING",
    payload: {
      callId,
      chatId,
      callerId,
      mediaType, // "audio" | "video"
      createdAt: new Date(),
    },
  });

  // ACK caller
  socket.send(
    JSON.stringify({
      type: "CALL_INITIATED_ACK",
      payload: {
        callId,
        chatId,
      },
    }),
  );
}

export async function acceptCall(socket, payload) {
  const { callId, callerId } = payload;

  try {
    await callRepository.updateCallStatus(callId, "accepted", {
      startedAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to update call status on accept:", err);
  }

  sendToUser(callerId, {
    type: "CALL_ACCEPTED",
    payload: {
      callId,
      acceptedBy: socket.userId,
    },
  });
}

export async function rejectCall(socket, payload) {
  const { callId, callerId } = payload;

  try {
    await callRepository.updateCallStatus(callId, "rejected", {
      endedAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to update call status on reject:", err);
  }

  sendToUser(callerId, {
    type: "CALL_REJECTED",
    payload: {
      callId,
      rejectedBy: socket.userId,
    },
  });
}

export async function endCall(socket, payload) {
  const { callId, targetUserId } = payload;
  const endedAt = new Date();

  try {
    const call = await callRepository.updateCallStatus(callId, "ended", {
      endedAt,
    });
    if (call && call.startedAt) {
      const durationSeconds = Math.round((endedAt - call.startedAt) / 1000);
      await callRepository.updateCallStatus(callId, "ended", {
        durationSeconds,
      });
    }
  } catch (err) {
    console.error("Failed to update call status on end:", err);
  }

  if (targetUserId) {
    sendToUser(targetUserId, {
      type: "CALL_ENDED",
      payload: {
        callId,
        endedBy: socket.userId,
      },
    });
  }
}

export async function handleOffer(socket, payload) {
  const { callId, targetUserId, offer } = payload;

  sendToUser(targetUserId, {
    type: "RTC_OFFER",
    payload: {
      callId,
      from: socket.userId,
      offer,
    },
  });
}

export async function handleAnswer(socket, payload) {
  const { callId, targetUserId, answer } = payload;

  sendToUser(targetUserId, {
    type: "RTC_ANSWER",
    payload: {
      callId,
      from: socket.userId,
      answer,
    },
  });
}

export async function handleIceCandidate(socket, payload) {
  const { callId, targetUserId, candidate } = payload;

  sendToUser(targetUserId, {
    type: "RTC_ICE_CANDIDATE",
    payload: {
      callId,
      from: socket.userId,
      candidate,
    },
  });
}