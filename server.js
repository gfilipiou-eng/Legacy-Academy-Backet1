import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import userRoutes from "./routes/users.js";
import resetPasswordRoutes from "./routes/resetPassword.js";

// Import email service to initialize it
import "./config/email.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("Legacy Academy API is running 🚀");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/reset-password", resetPasswordRoutes);

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
