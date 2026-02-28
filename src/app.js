
import express from 'express'
import cors from "cors";
// const helmet = require("helmet");
// const morgan = require("morgan");

import { errorHandler } from './middlewares/errorHandler.js';
import { connectDB } from './config/db.js';
import authRoutes from "./modules/auth/auth.routes.js"
import chatRoutes from "./modules/chat/chat.routes.js"
import userRoutes from "./modules/user/user.routes.js"

const app = express();

// Core middlewares
// app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging (disable in production if needed)
// if (process.env.NODE_ENV !== "production") {
//   app.use(morgan("dev"));
// }

// Lazy DB connection middleware (connects once, reuses in serverless)
let isDbConnected = false;
app.use(async (req, res, next) => {
  if (!isDbConnected) {
    try {
      await connectDB();
      isDbConnected = true;
      console.log("✅ Database connected");
    } catch (err) {
      console.error("❌ DB connection failed:", err);
      return res.status(500).json({ message: "Database connection failed" });
    }
  }
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Example route mount
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

export default app;