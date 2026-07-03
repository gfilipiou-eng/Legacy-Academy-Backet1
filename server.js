import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import http from 'http';
import { Server } from 'socket.io';
import Message from "./models/Message.js";
import { verifyToken } from "./middleware/auth.js";

// Load environment variables FIRST!
// Load environment variables FIRST!
dotenv.config();

// Auto-enable request dump on startup for quick debugging when explicitly opted-in.
// Set REQUEST_DUMP_AUTO=true (e.g., in Render env) and the server will enable
// REQUEST_DUMP=true and default REQUEST_DUMP_TTL_MINUTES=5 (unless you set a different TTL).
if (process.env.REQUEST_DUMP_AUTO === 'true') {
  if (!process.env.REQUEST_DUMP) process.env.REQUEST_DUMP = 'true';
  if (!process.env.REQUEST_DUMP_TTL_MINUTES && !process.env.REQUEST_DUMP_EXPIRES_AT) process.env.REQUEST_DUMP_TTL_MINUTES = '5';
  console.warn(`🔧 REQUEST_DUMP_AUTO enabled: REQUEST_DUMP=true, TTL=${process.env.REQUEST_DUMP_TTL_MINUTES} minute(s)`);
}

const SERVER_VERSION = "V6.2 (Deploy Kick)";
console.log("🟢 Server initialization started...");
console.log("🚀 DEPLOYMENT VERSION:", SERVER_VERSION);
console.log("Environment: ", process.env.NODE_ENV || 'production');
console.log("Port: ", process.env.PORT || 5000);

// Verify Cloudinary Config
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("⚠️  WARNING: Cloudinary configuration is missing in .env. Falling back to local storage.");
}

import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
import resetPasswordRoutes from "./routes/resetPassword.js";
import exchangeRoutes from "./routes/exchange.js";
import bubbleRoutes from "./routes/bubbles.js";
// Import email service AFTER dotenv.config() - non-critical
console.log("Loading email service...");
import "./config/email.js";

const app = express();

// Ensure uploads directory exists for persistent assets
const uploadsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  console.log("📂 Creating uploads directory...");
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- SOCKET.IO SETUP ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all for now to avoid CORS errors during transition
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket'], // Try polling first for better compatibility on Render
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

app.set('io', io);

// Map to track user status by socket ID
const userSocketMap = new Map(); // socket.id -> userId

io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET] New client connected: ${socket.id} (Transport: ${socket.conn.transport.name})`);

  socket.on('join', (room) => {
    socket.join(room);
    userSocketMap.set(socket.id, room);
    console.log(`📡 [SOCKET] Client ${socket.id} joined room: ${room}`);
    // Broadcast they are online
    io.emit('user.status', { userId: room, status: 'online', lastSeen: new Date() });
  });

  socket.on('logout', async (userId) => {
    if (userId) {
      try {
        const User = (await import('./models/User.js')).default;
        await User.findByIdAndUpdate(userId, { lastSeen: new Date(Date.now() - 600000) });
        io.emit('user.status', { userId, status: 'offline', lastSeen: new Date(Date.now() - 600000) });
      } catch (e) { console.error("Logout status update failed", e); }
    }
  });

  socket.on('disconnect', async (reason) => {
    const userId = userSocketMap.get(socket.id);
    if (userId) {
      try {
        const offlineTime = new Date(Date.now() - 600000); // 10 mins ago guaranteed offline
        const User = (await import('./models/User.js')).default;
        await User.findByIdAndUpdate(userId, { lastSeen: offlineTime });
        io.emit('user.status', { userId, status: 'offline', lastSeen: offlineTime });
        userSocketMap.delete(socket.id);
      } catch (e) { console.error("Disconnect status update failed", e); }
    }
    console.log(`🔌 [SOCKET] Client disconnected: ${socket.id} Reason: ${reason}`);
  });

  // LOG TRANSPORT UPGRADES
  socket.conn.on('upgrade', (transport) => {
    console.log(`🚀 [SOCKET] Transport upgraded to ${transport.name} for ${socket.id}`);
  });
});

// CACHE CONTROL - Prevent Cloudflare caching of API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Test Route
app.get("/", (req, res) => {
  res.status(200).json({ status: "Backend is ALIVE ✅", timestamp: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    deployed: "V20 (Fix Forgot Password & Nodemailer)",
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// DIAGNOSTIC LOGGING - All requests logged for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  // Simple request-id for correlation
  try {
    req.requestId = crypto.randomBytes(6).toString('hex');
  } catch (e) {
    req.requestId = (Date.now()).toString(36);
  }
  res.set('X-Request-Id', req.requestId);
  console.log(`📡 [${timestamp}] [${req.requestId}] ${req.method} ${req.originalUrl} - V4 DEPLOY`);
  if (req.method !== 'GET') {
    console.log(`   [${req.requestId}] Headers:`, {
      auth: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type'],
      origin: req.headers.origin
    });
  }
  next();
});

// TEMP: Request dump middleware (short-lived). Enable with env var REQUEST_DUMP=true or set header X-Debug-Requests: 1
// Use with care - may log PII. Will be removed after debugging.
app.use((req, res, next) => {
  // Initialize cached expiry on first invocation (so TTL is calculated at startup/runtime set)
  if (typeof global.__reqDumpExpiry === 'undefined') {
    if (process.env.REQUEST_DUMP_TTL_MINUTES) {
      const mins = parseInt(process.env.REQUEST_DUMP_TTL_MINUTES, 10);
      global.__reqDumpExpiry = isNaN(mins) ? null : Date.now() + mins * 60000;
      if (global.__reqDumpExpiry) console.warn(`🔒 Request dump enabled for ${mins} minute(s); will expire at ${new Date(global.__reqDumpExpiry).toISOString()}`);
    } else if (process.env.REQUEST_DUMP_EXPIRES_AT) {
      const t = Date.parse(process.env.REQUEST_DUMP_EXPIRES_AT);
      global.__reqDumpExpiry = isNaN(t) ? null : t;
      if (global.__reqDumpExpiry) console.warn(`🔒 Request dump will expire at ${new Date(global.__reqDumpExpiry).toISOString()}`);
    } else {
      global.__reqDumpExpiry = null; // no expiry configured
      if (process.env.REQUEST_DUMP === 'true') console.warn('🔒 Request dump enabled indefinitely (no TTL configured)');
    }
  }

  const headerEnabled = req.headers['x-debug-requests'] === '1';
  const envEnabled = process.env.REQUEST_DUMP === 'true';
  const now = Date.now();

  // If TTL expired, turn off env flag for runtime (but allow header override)
  if (global.__reqDumpExpiry && now > global.__reqDumpExpiry) {
    if (envEnabled) {
      console.warn(`🔒 Request dump expired at ${new Date(global.__reqDumpExpiry).toISOString()}; disabling env flag for runtime.`);
      process.env.REQUEST_DUMP = 'false';
    }
    if (!headerEnabled) return next();
  }

  const enabled = envEnabled || headerEnabled;
  if (!enabled) return next();

  const reqId = req.requestId || (Date.now()).toString(36);

  // Mask sensitive headers
  const safeHeaders = { ...req.headers };
  if (safeHeaders.authorization) {
    safeHeaders.authorization = String(safeHeaders.authorization).replace(/(Bearer\s+)(.+)/i, '$1[REDACTED]');
  }

  console.warn(`🔍 [${reqId}] REQUEST DUMP -> ${req.method} ${req.originalUrl}`);
  console.warn(`🔍 [${reqId}] Headers:`, safeHeaders);

  if (req.body) {
    try {
      const preview = typeof req.body === 'object' ? JSON.stringify(req.body, null, 2).slice(0, 2000) : String(req.body).slice(0, 2000);
      console.warn(`🔍 [${reqId}] Body Preview:`, preview);
    } catch (e) {
      console.warn(`🔍 [${reqId}] Body serialize failed:`, e && e.message);
    }
  }

  if (global.__reqDumpExpiry) res.set('X-Debug-Expires', new Date(global.__reqDumpExpiry).toISOString());
  res.set('X-Debug-Dumped', '1');
  next();
});


app.get("/api/debug/routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
    else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) routes.push(`${Object.keys(handler.route.methods).join(',').toUpperCase()} ${middleware.regexp.toString()} ${handler.route.path}`);
      });
    }
  });
  res.json({ status: "Diagnostic Active", count: routes.length, routes });
});

const markMessageRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id || req.user?.userId;
    if (!messageId || !userId) return res.status(200).json({ success: true });
    const message = await Message.findById(messageId);
    if (!message) return res.status(200).json({ success: true, message: "Handshake completed: Message already archived." });
    if (String(message.recipient) !== String(userId)) return res.status(403).json("Not authorized");
    message.read = true;
    message.readAt = new Date();
    await message.save();
    res.status(200).json({ success: true, readAt: message.readAt });
  } catch (err) {
    res.status(200).json({ success: true, ignored: true });
  }
};

app.patch("/api/messages/:messageId/read", verifyToken, markMessageRead);
app.post("/api/messages/:messageId/read", verifyToken, markMessageRead);
app.get("/api/messages/:messageId/read", verifyToken, markMessageRead);

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reset-password", resetPasswordRoutes);
app.use("/api/exchange", exchangeRoutes);
app.use("/api/bubbles", bubbleRoutes);
app.use("/reset-password", resetPasswordRoutes);

// 404 Handler for API
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    console.warn(`❌ 404 ERROR: ${req.method} ${req.originalUrl}`);
    return res.status(404).json({ error: "Endpoint Not Found", path: req.originalUrl });
  }
  next();
});

// Static Uploads Serving (For Local Storage Fallback)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'))); // Alias for compatibility

// Global Error Handler
app.use((err, req, res, next) => {
  const reqId = req?.requestId || 'no-id';
  console.error(`🔥 SERVER ERROR [${reqId}]:`, (err && (err.stack || err.message)) || err);
  if (err && err.message && err.message.includes('Cloudinary')) {
    res.set('X-Request-Id', reqId);
    return res.status(500).json({ message: 'System Error: Image upload service not configured.', requestId: reqId });
  }
  res.set('X-Request-Id', reqId);
  res.status(500).json({
    message: err.message || "An unexpected system error occurred",
    requestId: reqId,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// MongoDB Connection
const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    console.warn("⚠️ WARNING: MONGO_URL is not set. Database connection skipped.");
    return;
  }

  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.warn("⚠️ MongoDB Connection Error (non-fatal):", err.message);
    console.warn("   Server will still run without database connection");
  }
};

// Start connection but don't block server startup
connectDB().catch(err => console.warn("DB connection error:", err.message));

// Start Server
const PORT = process.env.PORT || 5000;

console.log("🟡 Starting Express server on port", PORT);

try {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT} 🚀`);
    console.log(`📡 Deployment Version: ${SERVER_VERSION}`);
    console.log(`🔍 Registered API Bases: /api/auth, /api/posts, /api/users, /api/messages`);

    // Keep-alive ping mechanism (for Render free tier)
    setInterval(() => {
      const selfUrl = `https://legacy-academy-backet1.onrender.com/api/health`;
      axios.get(selfUrl).then(() => {
        // Optional: emit a heart-beat via socket too to keep them alive
        io.emit('heartbeat', { time: new Date() });
        console.log("💓 Keep-alive pulse sent.");
      }).catch(() => { });
    }, 14 * 60 * 1000); // 14 minutes
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error("🔥 Server error:", (err && (err.stack || err)) || err);
    process.exit(1);
  });
} catch (err) {
  console.error("🔴 Failed to start server:", err.message);
  process.exit(1);
}

// Global exception catch
process.on('unhandledRejection', (reason) => {
  console.error('🔥 UNHANDLED REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err);
});
