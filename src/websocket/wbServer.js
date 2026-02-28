import { WebSocketServer } from "ws";
import { wsAuthenticate } from "./wsAuth.js";
import { addSocket, removeSocket, isUserOnline } from "./socketRegistry.js";
import { handleEvent } from "./wsRouter.js";
import { broadcastPresence } from "./handlers/presence.handler.js";
import { User } from "../modules/user/user.model.js";

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (socket, request) => {
    const user = wsAuthenticate(request);

    if (!user) {
      socket.close();
      return;
    }

    socket.userId = user.id;
    socket.isAlive = true;

    // Check if this is the first socket for this user (new online event)
    const wasOnline = isUserOnline(user.id);
    addSocket(socket.userId, socket);

    if (!wasOnline) {
      // User just came online → update DB and broadcast
      try {
        await User.findByIdAndUpdate(user.id, {
          isOnline: true,
          lastSeen: null,
        });
      } catch (err) {
        console.error("Failed to update user online status:", err);
      }
      broadcastPresence(user.id, true);
      console.log(`✅ User ${user.id} is now ONLINE`);
    }

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("message", async (raw) => {
      try {
        const data = JSON.parse(raw);
        await handleEvent(socket, data);
      } catch (err) {
        console.error("Invalid WS message", err);
      }
    });

    socket.on("close", async () => {
      removeSocket(socket.userId, socket);

      // Check if user has no more sockets (fully offline)
      if (!isUserOnline(socket.userId)) {
        try {
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date(),
          });
        } catch (err) {
          console.error("Failed to update user offline status:", err);
        }
        broadcastPresence(socket.userId, false);
        console.log(`🔴 User ${socket.userId} is now OFFLINE`);
      }
    });

    socket.on("error", async () => {
      removeSocket(socket.userId, socket);

      if (!isUserOnline(socket.userId)) {
        try {
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date(),
          });
        } catch (err) {
          console.error("Failed to update user offline status:", err);
        }
        broadcastPresence(socket.userId, false);
      }
    });
  });

  // 🔁 Global heartbeat interval
  const interval = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (!socket.isAlive) {
        return socket.terminate();
      }

      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  console.log("WebSocket initialized");
}