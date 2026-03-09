
import "dotenv/config"
import app from "./app.js";
import { connectDB } from "./config/db.js";
import http from "http";
import { initWebSocket } from "./websocket/wbServer.js";
import dns from "dns";
import { connectRedis } from "./config/redis.js";

dns.setDefaultResultOrder("ipv4first");

const PORT = process.env.PORT || 5000;

// Local development: start HTTP server with WebSocket support
if (process.env.NODE_ENV !== "production") {
  async function startServer() {
    try {
      await connectDB();
      console.log("✅ Database connected");

      const server = http.createServer(app);

      initWebSocket(server);
      await connectRedis();

      server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });

      process.on("SIGTERM", () => {
        console.log("SIGTERM received. Shutting down...");
        server.close(() => {
          console.log("Server closed");
          process.exit(0);
        });
      });

    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }

  startServer();
}

// Export app for Vercel serverless deployment
export default app;