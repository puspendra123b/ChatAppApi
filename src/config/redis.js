
import Redis from "ioredis";
import { env } from "./env.js";


let redis;

export async function connectRedis() {
  redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    },
  });

  redis.on("connect", () => {
    console.log("Redis connected");
  });

  redis.on("error", (err) => {
    console.error("Redis error:", err);
  });

  await redis.ping();
}

export function getRedis() {
  if (!redis) {
    throw new Error("Redis not initialized");
  }
  return redis;
}
