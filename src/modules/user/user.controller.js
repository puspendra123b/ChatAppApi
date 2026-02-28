import { asyncHandler } from "../../utils/async.handler.js";
import { sendError, sendSuccess } from "../../utils/response.handler.js";
import userRepository from "./user.repository.js";

export const searchUsers = asyncHandler(async (req, res) => {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.trim().length < 2) {
        return sendSuccess(res, [], "Provide at least 2 characters to search");
    }

    const users = await userRepository.searchUsers(q.trim(), currentUserId);
    return sendSuccess(res, users, "Users fetched successfully");
});

export const getMe = asyncHandler(async (req, res) => {
    const { id } = req.user;

    const user = await userRepository.findUserById(id, "email userId avatar bio isOnline lastSeen");

    if (!user) {
        return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, { user }, "User profile fetched");
});
