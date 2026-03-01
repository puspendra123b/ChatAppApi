import { asyncHandler } from "../../utils/async.handler.js";
import userRepository from "../user/user.repository.js";
import { sendError, sendSuccess } from "../../utils/response.handler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../../utils/common.js";
import { Otp } from "../otp/otp.model.js";
import { sendOtpEmail } from "../../services/emailService.js";

/** Generate a random 6-digit OTP */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── SEND OTP ──────────────────────────────────────────────
// POST /auth/send-otp  { email, purpose: "signup" | "login" }
export const sendOtp = asyncHandler(async (req, res) => {
  const { email, purpose = "signup" } = req.body;

  if (!email) {
    return sendError(res, "Email is required", 400);
  }

  const existingUser = await userRepository.findUserByEmail(email, "email");

  // For signup: user must NOT exist yet
  if (purpose === "signup" && existingUser) {
    return sendError(res, "An account with this email already exists");
  }

  // For login: user MUST exist
  if (purpose === "login" && !existingUser) {
    return sendError(res, "No account found with this email");
  }

  // Rate-limit: max 1 OTP per email per 60 seconds
  const recentOtp = await Otp.findOne({
    email,
    purpose,
    createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
  });

  if (recentOtp) {
    return sendError(res, "Please wait 60 seconds before requesting a new OTP", 429);
  }

  // Delete any old OTPs for this email + purpose
  await Otp.deleteMany({ email, purpose });

  const code = generateOtp();

  await Otp.create({ email, code, purpose });

  // Send email
  try {
    await sendOtpEmail(email, code, purpose);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return sendError(res, "Failed to send OTP email. Check SMTP config.", 500);
  }

  return sendSuccess(res, { email }, "OTP sent successfully");
});

// ─── VERIFY OTP ────────────────────────────────────────────
// POST /auth/verify-otp  { email, code, purpose }
// Returns a short-lived verification token to use in signup
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code, purpose = "signup" } = req.body;

  if (!email || !code) {
    return sendError(res, "Email and OTP code are required", 400);
  }

  const otpDoc = await Otp.findOne({ email, purpose });

  if (!otpDoc) {
    return sendError(res, "OTP expired or not found. Please request a new one.", 400);
  }

  // Max 5 attempts
  if (otpDoc.attempts >= 5) {
    await Otp.deleteOne({ _id: otpDoc._id });
    return sendError(res, "Too many failed attempts. Please request a new OTP.", 400);
  }

  if (otpDoc.code !== code) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    return sendError(res, `Invalid OTP. ${5 - otpDoc.attempts} attempts remaining.`, 400);
  }

  // OTP is valid
  if (purpose === "login") {
    // For login OTP, directly log the user in
    const userData = await userRepository.findUserByEmail(email, "email userId");

    if (!userData) {
      return sendError(res, "User not found", 400);
    }

    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);

    // Clean up OTP
    await Otp.deleteOne({ _id: otpDoc._id });

    return sendSuccess(
      res,
      { accessToken, refreshToken },
      "Login successful",
    );
  }

  // For signup: return a short-lived verification token (valid 15 min)
  const otpVerifyToken = jwt.sign(
    { email, purpose: "email-verified" },
    env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  // Mark as verified but keep it alive for reference
  otpDoc.verified = true;
  await otpDoc.save();

  return sendSuccess(
    res,
    { email, otpToken: otpVerifyToken },
    "Email verified successfully",
  );
});

// ─── SIGNUP (updated: requires otpToken) ────────────────────
// POST /auth/signup  { email, password, otpToken }
export const signup = asyncHandler(async (req, res) => {
  const { email, password, otpToken } = req.body;

  if (!email || !password) {
    return sendError(res, "Email and password are required", 400);
  }

  if (!otpToken) {
    return sendError(res, "Email verification is required. Please verify your email first.", 400);
  }

  // Verify the OTP token
  let decoded;
  try {
    decoded = jwt.verify(otpToken, env.JWT_SECRET);
  } catch {
    return sendError(res, "Email verification expired. Please verify again.", 400);
  }

  if (decoded.email !== email || decoded.purpose !== "email-verified") {
    return sendError(res, "Invalid verification token", 400);
  }

  // Check user doesn't already exist
  const existingUser = await userRepository.findUserByEmail(email, "email");
  if (existingUser) {
    return sendError(res, "User already exists");
  }

  const saltRounds = Number(env.SALT_ROUND);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const createdUser = await userRepository.createUser({
    email,
    password: hashedPassword,
  });

  if (createdUser) {
    const accessToken = generateAccessToken(createdUser);
    const refreshToken = generateRefreshToken(createdUser);

    // Clean up any remaining OTPs
    await Otp.deleteMany({ email });

    return sendSuccess(
      res,
      {
        accessToken,
        refreshToken,
        email: createdUser.email,
        userId: createdUser.userId,
      },
      "Account created successfully",
    );
  }
  return sendError(res, "Failed to create user");
});

// ─── LOGIN (password-based, unchanged) ──────────────────────
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const userData = await userRepository.findUserByEmailOrUserId(
    username,
    "email password userId",
  );

  if (!userData) {
    return sendError(res, "User not found");
  }

  const isValidPass = await bcrypt.compare(password, userData.password);

  if (isValidPass) {
    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);

    return sendSuccess(
      res,
      { accessToken, refreshToken },
      "Login successful",
    );
  }
  return sendError(res, "Invalid userId/email or password", 401);
});

// ─── REFRESH TOKEN ──────────────────────────────────────────
export const refreshTokenHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, "Refresh token is required", 400);
  }

  try {
    const decoded = verifyToken(refreshToken);

    if (!decoded) {
      return sendError(res, "Invalid or expired refresh token", 401);
    }

    const userData = await userRepository.findUserByEmail(
      decoded.email,
      "email userId",
    );

    if (!userData) {
      return sendError(res, "User not found", 401);
    }

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
