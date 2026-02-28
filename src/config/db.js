// src/config/db.js

import mongoose from 'mongoose'
import { env } from './env.js';

export async function connectDB() {
  try {
    await mongoose.connect(env.DB_URI, {
      autoIndex: false,
      maxPoolSize: 20,
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });

  } catch (error) {
    console.error("Failed to connect DB:", error);
    throw error;
  }
}
