import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoute from "./routes/users.js";
import authRoute from "./routes/auth.js";
import postRoute from "./routes/posts.js";
import messageRoute from "./routes/messages.js";
import Message from "./models/Message.js";
import { verifyToken } from "./middleware/auth.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

// Load env vars
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for now, can be restricted later if needed
    methods: ["GET", "POST"]
  }
});

// Pass io to express app for use in routes
app.set("io", io);

// Middleware
app.use(express.json());
app.use(cors());

// DB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

// Socket.io Connection Logic
io.on("connection", (socket) => {
  console.log("📡 New WebSocket connection:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their private channel`);
  });

  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", socket.id);
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    deployed: "V7 (Socket.io Integrated)",
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Routes
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/messages", messageRoute);

httpServer.listen(process.env.PORT || 8800, () => {
  console.log("🟢 Server initialization started...");
  console.log("🚀 DEPLOYMENT VERSION: V7.0 (Socket.io Sync)");
  console.log("Environment: ", process.env.NODE_ENV || 'production');
  console.log("Backend server is running with Socket.io! V5-LEGACY-SYNC");
});
