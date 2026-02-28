const userSockets = new Map();

export function addSocket(userId, socket) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socket);
}

export function removeSocket(userId, socket) {
  if (!userSockets.has(userId)) return;

  userSockets.get(userId).delete(socket);

  if (userSockets.get(userId).size === 0) {
    userSockets.delete(userId);
  }
}

function getSockets(userId) {
  return userSockets.get(userId) || new Set();
}

/**
 * Check if a user has any active WebSocket connections.
 */
export function isUserOnline(userId) {
  const sockets = getSockets(userId);
  return sockets.size > 0;
}

/**
 * Get the count of active connections for a user.
 */
export function getUserSocketCount(userId) {
  return getSockets(userId).size;
}

export function sendToUser(userId, event) {
  const sockets = getSockets(userId);
  sockets.forEach((socket) => {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(event));
    }
  });
}
