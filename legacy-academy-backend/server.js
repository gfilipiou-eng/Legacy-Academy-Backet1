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

// Verify Cloudinary Config
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("⚠️  WARNING: Cloudinary configuration is missing in .env. Falling back to local storage.");
}

import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import userRoutes from "./routes/users.js";
import resetPasswordRoutes from "./routes/resetPassword.js";

// Import email service AFTER dotenv.config()
import "./config/email.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Test Route
app.get("/", (req, res) => {
  res.redirect("/api/posts");
});

// Routes
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method !== 'GET') console.log("📦 Body:", JSON.stringify(req.body).substring(0, 100));
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);

  // KEEP-ALIVE: Self-ping every 10 minutes to prevent Render from sleeping
  setInterval(() => {
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    axios.get(baseUrl)
      .then(() => console.log("⚡ Keep-Alive: Server is awake"))
      .catch((err) => console.log("⚠️ Keep-Alive ping failed (this is normal on first boot)"));
  }, 600000); // 600,000ms = 10 minutes
});
