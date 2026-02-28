import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateAccessToken = (data) => {
  const { _id, email, userId } = data;
  
  const token = jwt.sign({ id: _id, email: email, userId: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  return token;
};

export const generateRefreshToken = (data) => {
  const { _id, email, userId } = data;

  const token = jwt.sign({ id: _id, email: email, userId: userId }, env.JWT_SECRET, {
    expiresIn: env.REF_TOKEN_EXPIRES_IN,
  });
  return token;
};

export const verifyToken = (token) => {
  const isValid = jwt.verify(token, env.JWT_SECRET);

  if (isValid) {
    const decoded = jwt.decode(token, env.JWT_SECRET);
    return decoded;
  }
  return false;
};
