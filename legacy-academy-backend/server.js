import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoute from "./routes/users.js";
import authRoute from "./routes/auth.js";
import postRoute from "./routes/posts.js";
import messageRoute from "./routes/messages.js"; // New route file needed
import Message from "./models/Message.js";
import { verifyToken } from "./middleware/auth.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Load env vars
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
});
app.set("io", io);

// Middleware
app.use(express.json()); // Essential for parsing JSON bodies
app.use(cors());

// DB Connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    deployed: "V6 (Paranoid Fixes)",
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Routes
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);
app.use("/api/messages", messageRoute);

// Serve static assets if in production
// app.use(express.static(path.join(__dirname, "/client/build")));
// app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "/client/build", "index.html"));
// });

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

httpServer.listen(process.env.PORT || 8800, () => {
  console.log("🟢 Server initialization started...");
  console.log("🚀 DEPLOYMENT VERSION: V6.3 (Realtime)");
  console.log("Environment: ", process.env.NODE_ENV || 'production');
  console.log("Backend server is running with Socket.IO");
});
