import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables FIRST!
// Load environment variables FIRST!
dotenv.config();

console.log("🟢 Server initialization started...");
console.log("Environment: ", process.env.NODE_ENV || 'production');
console.log("Port: ", process.env.PORT || 5000);

// Verify Cloudinary Config
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("⚠️  WARNING: Cloudinary configuration is missing in .env. Falling back to local storage.");
}

import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import userRoutes from "./routes/users.js";
import resetPasswordRoutes from "./routes/resetPassword.js";
import messageRoutes from "./routes/messages.js";

// Import email service AFTER dotenv.config() - non-critical
console.log("Loading email service...");
import "./config/email.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  res.status(200).json({ status: "healthy", deployed: "V15-CHAT-FIX" });
});

app.get("/api/messages/debug", (req, res) => {
  res.json({ message: "Messages endpoint is active (V13 Sync)", time: new Date() });
});

app.get("/api/ping", (req, res) => res.json({ status: "pong", time: new Date() }));

// DIAGNOSTIC LOGGING - All requests logged for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`📡 [${timestamp}] ${req.method} ${req.originalUrl} - V13 SYNC FINAL`);
  if (req.method !== 'GET') {
    console.log(`   Headers:`, {
      auth: req.headers.authorization ? 'Present' : 'Missing',
      contentType: req.headers['content-type'],
      origin: req.headers.origin
    });
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/reset-password", resetPasswordRoutes);

// 404 - Should be at the end
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    console.log(`❌ API 404: ${req.method} ${req.originalUrl}`);
    return res.status(404).json({ error: "Endpoint Not Found", path: req.originalUrl });
  }
  res.status(404).send("Not Found");
});

// Static Uploads Serving (For Local Storage Fallback)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'))); // Alias for compatibility

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err.message);
  if (err.message && err.message.includes('Cloudinary')) {
    return res.status(500).json({ message: 'System Error: Image upload service not configured.' });
  }
  res.status(500).json({
    message: err.message || "An unexpected system error occurred",
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
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT} 🚀`);
    console.log(`📍 Backend URL: https://legacy-academy-backet1.onrender.com`);
    console.log(`🌐 Server started - accepting connections`);
    console.log(`📌 Test: curl http://localhost:${PORT}/api/health`);

    // KEEP-ALIVE: Self-ping every 10 minutes to prevent Render from sleeping
    // Delayed by 5 seconds to avoid early startup issues
    setTimeout(() => {
      setInterval(() => {
        try {
          const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
          axios.get(baseUrl, { timeout: 5000 })
            .then(() => console.log("⚡ Keep-Alive: Server is awake"))
            .catch(() => { }); // Silently fail if server is down
        } catch (err) {
          // Silently fail
        }
      }, 600000); // 600,000ms = 10 minutes
    }, 5000);
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error("🔥 Server error:", err);
    process.exit(1);
  });
} catch (err) {
  console.error("🔴 Failed to start server:", err.message);
  console.error(err.stack);
  process.exit(1);
}
