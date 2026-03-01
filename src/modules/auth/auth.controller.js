import { asyncHandler } from "../../utils/async.handler.js";
import userRepository from "../user/user.repository.js";
import { sendError, sendSuccess } from "../../utils/response.handler.js";
import bcrypt from "bcrypt";
import { env } from "../../config/env.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../../utils/common.js";

export const signup = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const userData = await userRepository.findUserByEmail(email, "email");

  if (userData) {
    return sendError(res, "User already exists");
  }

  const saltRounds = Number(env.SALT_ROUND);

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const userPayload = {
    email: email,
    password: hashedPassword,
  };

  const createdUser = await userRepository.createUser(userPayload);

  if (createdUser) {
    return sendSuccess(
      res,
      {
        email: createdUser.email,
        userId: createdUser.userId,
      },
      "User created successfully",
    );
  }
  return sendError(res, "Failed to create user");
});

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const userData = await userRepository.findUserByEmailOrUserId(
    username,
    "email password userId",
  );

  if (!userData) {
    return sendError(res, "User not found");
  }

  const isValidPass = bcrypt.compare(userData.password, password);

  if (isValidPass) {
    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);

    return sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
      },
      "Login successfull",
    );
  }
  return sendError(res, "Invalid userId/email or password", 401);
});

export const refreshTokenHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, "Refresh token is required", 400);
  }

  try {
    // Verify the refresh token
    const decoded = verifyToken(refreshToken);

    if (!decoded) {
      return sendError(res, "Invalid or expired refresh token", 401);
    }

    // Look up the user to make sure they still exist and are active
    const userData = await userRepository.findUserByEmail(
      decoded.email,
      "email userId",
    );

    if (!userData) {
      return sendError(res, "User not found", 401);
    }

    // Generate fresh tokens
    const newAccessToken = generateAccessToken(userData);
    const newRefreshToken = generateRefreshToken(userData);

    return sendSuccess(
      res,
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      "Tokens refreshed successfully",
    );
  } catch (error) {
    return sendError(res, "Invalid or expired refresh token", 401);
  }
});
