import { asyncHandler } from "../../utils/async.handler.js";
import userRepository from "../user/user.repository.js";
import { sendError, sendSuccess } from "../../utils/response.handler.js";
import bcrypt from "bcrypt";
import { env } from "../../config/env.js";
import {
  generateAccessToken,
  generateRefreshToken,
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
