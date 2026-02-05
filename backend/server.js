import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Uploads public folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// Initial root route (για να μην εμφανίζεται "Cannot GET /")
app.get("/", (req, res) => {
  res.send("Legacy Academy API is running 🚀");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", deployed: "V14-STABLE-FINAL" });
});

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} 🚀`));
