import express from "express";
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

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET] New client connected: ${socket.id}`);

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`📡 [SOCKET] Client joined room: ${room}`);
  });

  socket.on('disconnect', (reason) => {
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
    deployed: "V7 (Socket IO Active)",
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
  console.log(`🚀 DEPLOYMENT VERSION: V7 (Socket.io)`);
  console.log(`Backend server is running on port ${PORT}!`);
});
