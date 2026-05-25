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
import { cleanupExpiredMessages, MESSAGE_RETENTION_SWEEP_MS } from "./utils/messageRetention.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import http from 'http';
import { Server } from 'socket.io';

// Load env vars
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- SMART & SECURE MIDDLEWARES ---

// 0. Enable CORS first!
app.use(cors());

// 2. Response Compression (Smart/Fast API)
app.use(compression());

// Middleware
app.use(express.json({ limit: '500mb' })); // Essential for parsing JSON bodies + large file support
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

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
const activeSocketsPerUser = new Map(); // Track multiple tabs/devices per user
let messageRetentionInterval = null;

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET] New client connected: ${socket.id}`);

  socket.on('join', async (userId) => {
    socket.join(userId);
    userSocketMap.set(socket.id, userId);
    
    // Count active connections for this user
    const currentCount = activeSocketsPerUser.get(userId) || 0;
    activeSocketsPerUser.set(userId, currentCount + 1);

    console.log(`📡 [SOCKET] User ${userId} joined room: ${userId} (Active connections: ${currentCount + 1})`);

    // Update DB to current time
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    
    // Broadcast they are online
    io.emit('user.status', { userId, status: 'online', lastSeen: new Date() });
  });

  socket.on('ping_active', async (userId) => {
    if (userId) {
       await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    }
  });

  socket.on('logout', async (userId) => {
    if (userId) {
      activeSocketsPerUser.set(userId, 0);
      const offlineTime = new Date(Date.now() - 600000); // 10 mins ago
      await User.findByIdAndUpdate(userId, { lastSeen: offlineTime }); 
      io.emit('user.status', { userId, status: 'offline', lastSeen: offlineTime });
    }
  });

  socket.on('disconnect', async (reason) => {
    const userId = userSocketMap.get(socket.id);
    if (userId) {
      // Decrease active connections count
      const currentCount = activeSocketsPerUser.get(userId) || 1;
      const newCount = currentCount - 1;
      activeSocketsPerUser.set(userId, newCount);

      userSocketMap.delete(socket.id);

      // Only mark as offline if this was their LAST active connection (e.g. no other tabs open)
      if (newCount <= 0) {
        activeSocketsPerUser.delete(userId);
        const offlineTime = new Date(Date.now() - 600000); // 10 mins ago guaranteed offline
        await User.findByIdAndUpdate(userId, { lastSeen: offlineTime });
        io.emit('user.status', { userId, status: 'offline', lastSeen: offlineTime });
      }
    }
    console.log(`🔌 [SOCKET] Client disconnected: ${socket.id} Reason: ${reason}`);
  });
});

// DB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log("Connected to MongoDB");

    await cleanupExpiredMessages({ io }).catch((err) => {
      console.error("Initial message retention cleanup failed:", err);
    });

    if (!messageRetentionInterval) {
      messageRetentionInterval = setInterval(async () => {
        try {
          await cleanupExpiredMessages({ io });
        } catch (err) {
          console.error("Scheduled message retention cleanup failed:", err);
        }
      }, MESSAGE_RETENTION_SWEEP_MS);

      messageRetentionInterval.unref?.();
    }
  })
  .catch((err) => console.log(err));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    deployed: "V21 (Fix Cross-Origin & Notification Badges)",
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

app.get("/api/users/me/active-connections", verifyToken, (req, res) => {
  const count = activeSocketsPerUser.get(req.user.id) || 1;
  res.json({ activeDevices: count });
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
