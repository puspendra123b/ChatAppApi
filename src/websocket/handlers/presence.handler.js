import chatRepository from "../../modules/chat/chat.repository.js";
import { sendToUser } from "../socketRegistry.js";

/**
 * Broadcast user presence (online/offline) to all their chat partners.
 * Finds all chats the user is a member of, then notifies each partner.
 */
export async function broadcastPresence(userId, isOnline) {
    try {
        const chats = await chatRepository.getUserChats(userId);

        // Collect unique partner user IDs
        const partnerIds = new Set();
        for (const chat of chats) {
            for (const member of chat.members) {
                const memberId = member._id ? member._id.toString() : member.toString();
                if (memberId !== userId.toString()) {
                    partnerIds.add(memberId);
                }
            }
        }

        const event = {
            type: isOnline ? "USER_ONLINE" : "USER_OFFLINE",
            payload: {
                userId: userId.toString(),
                isOnline,
                lastSeen: isOnline ? null : new Date().toISOString(),
            },
        };

        // Send to each partner
        for (const partnerId of partnerIds) {
            sendToUser(partnerId, event);
        }
    } catch (err) {
        console.error("Failed to broadcast presence:", err);
    }
}

/**
 * Forward typing indicator to the other members of a chat.
 */
export async function handleTyping(socket, payload) {
    const { chatId, isTyping } = payload;
    const senderId = socket.userId;

    if (!chatId) return;

    try {
        const chat = await chatRepository.getChatById(chatId);
        if (!chat) return;

        // Verify sender is a member
        if (!chat.members.some((id) => id.toString() === senderId.toString())) {
            return;
        }

        // Send typing event to the other member(s)
        for (const memberId of chat.members) {
            const memberIdStr = memberId.toString();
            if (memberIdStr !== senderId.toString()) {
                sendToUser(memberIdStr, {
                    type: isTyping ? "TYPING_START" : "TYPING_STOP",
                    payload: {
                        chatId,
                        userId: senderId.toString(),
                    },
                });
            }
        }
    } catch (err) {
        console.error("Failed to handle typing:", err);
    }
}
