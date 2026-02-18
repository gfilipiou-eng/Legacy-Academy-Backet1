import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js"; // Needed for FormData

const router = express.Router();

// Mark message as read (1-Minute Burn Timer)
const markMessageRead = async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const userId = req.user.id;
        const msg = await Message.findById(messageId);
        if (!msg) return res.status(200).json({ success: true, message: "Handshake completed: Message already archived." });
        if (String(msg.recipient) !== String(userId)) return res.status(403).json("Not authorized");

        // WHISPER PROTOCOL: Burn after 1 minute
        // We set readAt now. Cleanup happens on GET.
        msg.isRead = true;
        msg.readAt = new Date();
        await msg.save();

        res.status(200).json({ success: true, isRead: true });
    } catch (err) {
        res.status(500).json(err);
    }
};

router.patch("/:messageId/read", verifyToken, markMessageRead);
router.post("/:messageId/read", verifyToken, markMessageRead);
router.get("/:messageId/read", verifyToken, markMessageRead);

// SEND MESSAGE (Using upload.single('file') for audio support)
// FIXED: Middleware order swapped to ensure Multer runs before Auth (for FormData body access if needed)
router.post("/", upload.single("file"), verifyToken, async (req, res) => {
    try {
        // Validation: Ensure req.body exists (multer should populate it)
        if (!req.body) {
            console.error("Messages Error: req.body is undefined");
            return res.status(400).json({ error: "Request body missing", detail: "Multipart parsing failed" });
        }

        // FAIL-SAFE BODY ACCESS
        const body = req.body || {};
        const recipientId = body.recipient;
        const text = body.text;

        console.log(`[MESSAGE] Processing send request. Recipient: ${recipientId}, HasFile: ${!!req.file}`);

        if (!req.user) return res.status(401).json("Auth failed");
        const currentUserId = req.user.id;

        // File handling - detect type from mimetype
        let audioUrl = "";
        let imageUrl = "";
        if (req.file) {
            const filePath = req.file.path || req.file.secure_url || req.file.url || "";
            const mime = req.file.mimetype || "";
            if (mime.startsWith("image")) {
                imageUrl = filePath;
            } else {
                audioUrl = filePath;
            }
        }

        if (!recipientId) return res.status(400).json("Recipient is required");

        const recipientUser = await User.findById(recipientId);
        if (!recipientUser) return res.status(404).json("Target user no longer exists");

        const dmGuard = !!(recipientUser.settings?.dmFollowersOnly);
        if (dmGuard) {
            const isFollower = Array.isArray(recipientUser.followers) && recipientUser.followers.some(id => String(id) === String(currentUserId));
            if (!isFollower && req.user.role !== 'Founder') {
                return res.status(403).json("Messages restricted to followers");
            }
        }

        const newMessage = new Message({
            sender: currentUserId,
            recipient: recipientId,
            text: text || "",
            audio: audioUrl,
            image: imageUrl
        });

        const savedMessage = await newMessage.save();

        // 🔥 REAL-TIME EMIT
        const io = req.app.get('io');
        if (io) {
            const senderUser = await User.findById(currentUserId).select('username profilePic');
            io.to(String(recipientId)).emit('message.received', savedMessage);
            if (senderUser) {
                io.to(String(recipientId)).emit('notification.received', {
                    type: 'message',
                    fromUsername: senderUser.username,
                    fromProfilePic: senderUser.profilePic
                });
            }
        }

        res.status(200).json(savedMessage);
    } catch (err) {
        console.error("Message Error:", err);
        res.status(500).json("Transmission failed: Secure link interrupted.");
    }
});

// GET CONVERSATION
const getConversation = async (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const currentUserId = req.user.id;

        // WHISPER CLEANUP: Delete messages read > 1 minute ago
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

        // Clean up messages in this specific conversation
        await Message.deleteMany({
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId }
            ],
            isRead: true,
            readAt: { $lt: oneMinuteAgo }
        });

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
};

router.get("/conversation/:userId", verifyToken, getConversation);
router.get("/:userId", verifyToken, getConversation);

export default router;
