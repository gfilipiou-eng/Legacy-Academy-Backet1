import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoute from "./routes/users.js";
import authRoute from "./routes/auth.js";
import postRoute from "./routes/posts.js";
import messageRoute from "./routes/messages.js"; // New route file needed
import Message from "./models/Message.js";
import User from "./models/User.js";
import { verifyToken } from "./middleware/auth.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import http from 'http';
import { Server } from 'socket.io';

// Load env vars
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json()); // Essential for parsing JSON bodies
app.use(cors());

// --- SOCKET.IO SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Map to track user status by socket ID
const userSocketMap = new Map(); // socket.id -> userId

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET] New client connected: ${socket.id}`);

  socket.on('join', (userId) => {
    socket.join(userId);
    userSocketMap.set(socket.id, userId);
    console.log(`📡 [SOCKET] User ${userId} joined room: ${userId}`);

    // Broadcast they are online
    io.emit('user.status', { userId, status: 'online', lastSeen: new Date() });
  });

  socket.on('logout', async (userId) => {
    if (userId) {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date(Date.now() - 600000) }); // Set to 10 mins ago
      io.emit('user.status', { userId, status: 'offline', lastSeen: new Date(Date.now() - 600000) });
    }
  });

  socket.on('disconnect', async (reason) => {
    const userId = userSocketMap.get(socket.id);
    if (userId) {
      // Set to 1 minute ago to show offline (since threshold is 5 mins, maybe better to set it further back)
      const offlineTime = new Date(Date.now() - 600000); // 10 mins ago guaranteed offline
      await User.findByIdAndUpdate(userId, { lastSeen: offlineTime });
      io.emit('user.status', { userId, status: 'offline', lastSeen: offlineTime });
      userSocketMap.delete(socket.id);
    }
    console.log(`🔌 [SOCKET] Client disconnected: ${socket.id} Reason: ${reason}`);
  });
});

// DB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    deployed: "V16 (Real Usernames in Notifications + Live Un-Repost on Profile)",
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Routes
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/messages", messageRoute);

const PORT = process.env.PORT || 8800;
server.listen(PORT, () => {
  console.log("🟢 Server initialization started...");
  console.log(`🚀 DEPLOYMENT VERSION: V8 (Cloudinary Cleanup)`);
  console.log(`Backend server is running on port ${PORT}!`);
});
