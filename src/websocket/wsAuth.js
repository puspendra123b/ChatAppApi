import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function wsAuthenticate(request) {
  const query = request.url.split("?")[1];
  if (!query) return null;

  const params = new URLSearchParams(query);
  const token = params.get("token");
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return decoded; // must contain userId
  } catch {
    return null;
  }
}

