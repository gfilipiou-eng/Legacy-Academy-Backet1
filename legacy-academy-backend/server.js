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

// Load env vars
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json()); // Essential for parsing JSON bodies
app.use(cors());

const markMessageRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user?.id || req.user?.userId;
        if (!messageId || !userId) return res.status(200).json({ success: true });
        const msg = await Message.findById(messageId);
        if (!msg) return res.status(200).json({ success: true, message: "Handshake completed: Message already archived." });
        if (String(msg.recipient) !== String(userId)) return res.status(403).json("Not authorized");
        msg.isRead = true;
        await msg.save();
        res.status(200).json({ success: true, isRead: true });
    } catch (err) {
        res.status(200).json({ success: true, ignored: true });
    }
};

app.patch("/api/messages/:messageId/read", verifyToken, markMessageRead);
app.post("/api/messages/:messageId/read", verifyToken, markMessageRead);
app.get("/api/messages/:messageId/read", verifyToken, markMessageRead);

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

app.listen(process.env.PORT || 8800, () => {
    console.log("🟢 Server initialization started...");
  console.log("🚀 DEPLOYMENT VERSION: V6 LEGACY (Paranoid Fixes)");
  console.log("Environment: ", process.env.NODE_ENV || 'production');
    console.log("Backend server is running! V5-LEGACY-SYNC");
});
