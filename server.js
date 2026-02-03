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
  res.status(200).json({ status: "healthy", deployed: "v2" });
});

// DIAGNOSTIC LOGGING - All requests logged for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`📡 [${timestamp}] ${req.method} ${req.originalUrl} - FORCE DEPLOY v2`);
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
app.use("/reset-password", resetPasswordRoutes);

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
// MongoDB Connection
const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    console.error("❌ FATAL ERROR: MONGO_URL is not defined.");
    console.error("   Please set MONGO_URL in your Render Environment Variables.");
    return;
  }

  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUrl);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    // Δεν κάνουμε exit για να μην κρασάρει ολόκληρο το app, αλλά το log είναι κρίσιμο
  }
};

connectDB();

// Start Server
const PORT = process.env.PORT || 5000;

console.log("🟡 Starting Express server on port", PORT);

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} 🚀`);
  console.log(`📍 Backend URL: https://legacy-academy-backet1.onrender.com`);

  // KEEP-ALIVE: Self-ping every 10 minutes to prevent Render from sleeping
  setInterval(() => {
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    axios.get(baseUrl)
      .then(() => console.log("⚡ Keep-Alive: Server is awake"))
      .catch((err) => console.log("⚠️ Keep-Alive ping failed (this is normal on first boot)"));
  }, 600000); // 600,000ms = 10 minutes
});

// Handle server errors
server.on('error', (err) => {
  console.error("🔥 Server error:", err);
  process.exit(1);
});
