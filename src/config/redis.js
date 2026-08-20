import Redis from "ioredis";
import { env } from "./env.js";

let redis;

export async function connectRedis() {
  return new Promise((resolve, reject) => {
    redis = new Redis(env.REDIS_URI, {
      tls: {},
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        if (times > 10) {
          console.error("Redis: max retries reached, giving up");
          return null; // stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    redis.on("ready", () => {
      console.log("Redis connected and ready");
      resolve();
    });

    redis.on("error", (err) => {
      console.error("Redis error:", err.message);
      // Reject only on the first connection attempt
      if (!redis.status || redis.status === "connecting") {
        reject(err);
      }
    });
  });
}

export function getRedis() {
  if (!redis) {
    throw new Error("Redis not initialized");
  }
  return redis;
}
