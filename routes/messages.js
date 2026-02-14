import express from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

import upload from "../middleware/upload.js";

const router = express.Router();

// Status check to verify connectivity
router.get("/", (req, res) => res.status(200).json({ status: "Neural link active", protocol: "WHISPERS_V1" }));
router.get("/status", (req, res) => res.status(200).json({ status: "Neural link active", timestamp: new Date() }));

// 🔥 WHISPERS AUTO-DELETE: Mark message as read (starts 5-second countdown)
router.patch("/:messageId/read", verifyToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id || req.user.userId;

        const message = await Message.findById(messageId);
        if (!message) return res.status(200).json({ success: true, message: "Handshake completed: Message already archived." });

        // Only recipient can mark as read
        if (String(message.recipient) !== String(userId)) {
            return res.status(403).json("Not authorized");
        }

        // Mark as read with timestamp
        message.read = true;
        message.readAt = new Date();
        await message.save();

        console.log(`[WHISPER] Message ${messageId} marked as read. Will self-destruct in 5 seconds.`);
        res.status(200).json({ success: true, readAt: message.readAt });
    } catch (err) {
        console.error("Mark-as-read error:", err);
        res.status(500).json(err);
    }
});

// Compatibility alias: POST fallback for mark-as-read
router.post("/:messageId/read", verifyToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id || req.user.userId;
        const message = await Message.findById(messageId);
        if (!message) return res.status(200).json({ success: true, message: "Handshake completed: Message already archived." });
        if (String(message.recipient) !== String(userId)) return res.status(403).json("Not authorized");
        message.read = true;
        message.readAt = new Date();
        await message.save();
        res.status(200).json({ success: true, readAt: message.readAt });
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/:messageId/read", verifyToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id || req.user.userId;
        const message = await Message.findById(messageId);
        if (!message) return res.status(200).json({ success: true, message: "Handshake completed: Message already archived." });
        if (String(message.recipient) !== String(userId)) return res.status(403).json("Not authorized");
        message.read = true;
        message.readAt = new Date();
        await message.save();
        res.status(200).json({ success: true, readAt: message.readAt });
    } catch (err) {
        res.status(500).json(err);
    }
});

// 🔥 WHISPERS AUTO-DELETE CLEANUP: Run every minute to delete expired messages
const cleanupExpiredWhispers = async () => {
    try {
        const fiveSecondsAgo = new Date(Date.now() - 5 * 1000);
        const result = await Message.deleteMany({
            readAt: { $ne: null, $lt: fiveSecondsAgo }
        });
        if (result.deletedCount > 0) {
            console.log(`[WHISPERS CLEANUP] 🔥 Auto-deleted ${result.deletedCount} expired whispers`);
        }
    } catch (err) {
        console.error("[WHISPERS CLEANUP] Error:", err);
    }
};

// Run cleanup every 5 seconds
setInterval(cleanupExpiredWhispers, 5 * 1000);
console.log("🔥 WHISPERS AUTO-DELETE activated. Messages self-destruct 5 seconds after reading.");


// Send a message (Updated for Audio Support)
router.post("/", upload.single("file"), verifyToken, async (req, res) => {
    const reqId = Math.random().toString(36).substring(7);
    const logPrefix = `[${reqId}] [WHISPER_SEND_V5]`;

    // Debug logging for FormData/Body issues
    console.log(`${logPrefix} Start. Content-Type:`, req.headers['content-type']);
    console.log(`${logPrefix} Body keys:`, Object.keys(req.body || {}));
    if (req.file) console.log(`${logPrefix} File present: ${req.file.originalname}`);

    try {
        if (!req.user) {
            console.error(`${logPrefix} FAILED: No req.user after verifyToken`);
            return res.status(401).json("Neural interface not recognized.");
        }
        const senderId = req.user.id || req.user.userId || req.user._id;

        // FAIL-SAFE BODY ACCESS
        const body = req.body || {};
        const recipient = body.recipient;
        const text = body.text;

        console.log(`[MESSAGE] Processing send request. Recipient: ${recipient}, HasFile: ${!!req.file}`);

        if (!recipient) {
            console.error(`${logPrefix} FAILED: No recipient provided`);
            return res.status(400).json("Recipient identifier required.");
        }

        // Validate recipient ID
        if (!mongoose.Types.ObjectId.isValid(recipient)) {
            console.error(`${logPrefix} FAILED: Invalid recipient ID format: ${recipient}`);
            return res.status(400).json("Invalid recipient identifier format (expected 24-char hex).");
        }

        // Validate sender ID
        if (!mongoose.Types.ObjectId.isValid(senderId)) {
            console.error(`${logPrefix} FAILED: Invalid sender ID from token: ${senderId}`);
            return res.status(401).json("Neural state corruption: Invalid token payload.");
        }

        if (!text && !req.file) {
            console.error(`[${reqId}] FAILED: No content (text or audio) provided`);
            return res.status(400).json("Intelligence packet must contain text or audio.");
        }

        const targetUser = await User.findById(recipient);
        if (!targetUser) {
            console.warn(`[${reqId}] FAILED: Recipient not found: ${recipient}`);
            return res.status(404).json("Recipient not found in neural database.");
        }

        let audioUrl = "";
        if (req.file) {
            audioUrl = req.file.path || "";
            if (audioUrl.startsWith('uploads')) {
                audioUrl = '/' + audioUrl.replace(/\\/g, '/');
            }
        }

        // Explicitly cast strings to ObjectIds with validation to prevent Mongoose cast errors
        let senderOid, recipientOid;
        try {
            senderOid = new mongoose.Types.ObjectId(String(senderId));
            recipientOid = new mongoose.Types.ObjectId(String(recipient));
        } catch (castErr) {
            console.error(`${logPrefix} CAST ERROR:`, castErr.message, { senderId, recipient });
            return res.status(400).json({ error: "Invalid ID format for sender or recipient.", detail: castErr.message });
        }

        // PREVENT SELF-MESSAGING
        if (String(senderOid) === String(recipientOid)) {
            console.warn(`${logPrefix} SELF-WHISPER REJECTED: ${senderId}`);
            return res.status(400).json({ error: "Self-whisper protocol denied. You cannot send messages to yourself." });
        }

        // GUARD CHAT CHECK: Only followers can message if recipient enabled setting
        const dmGuard = !!(targetUser.settings?.dmFollowersOnly);
        if (dmGuard) {
            const followersList = Array.isArray(targetUser.followers) ? targetUser.followers : [];
            const isFollower = followersList.some(id => String(id) === String(senderOid));

            if (!isFollower && req.user.role !== 'Founder') {
                console.warn(`${logPrefix} GUARD REJECTION: Sender ${senderId} is not a follower of ${recipient}`);
                return res.status(403).json({
                    error: "GUARD PROTOCOL ACTIVE",
                    message: "This operative only accepts intelligence from authorized followers."
                });
            }
        }

        const newMessage = new Message({
            sender: senderOid,
            recipient: recipientOid,
            text: (text || "").toString().trim(),
            audioUrl
        });

        const savedMessage = await newMessage.save();
        console.log(`${logPrefix} Message SAVED. ID: ${savedMessage._id}`);

        // Send notification using DB user data to avoid token-sync issues
        try {
            const sender = await User.findById(senderOid).lean();
            const fromName = sender?.username || req.user?.username || 'User';
            const fromPic = sender?.profilePic || req.user?.profilePic || '';

            const notifPayload = {
                type: 'message',
                from: senderOid,
                fromUsername: fromName,
                fromProfilePic: fromPic,
                text: text ? (String(text).length > 50 ? String(text).substring(0, 50) + '...' : String(text)) : "Sent a voice note.",
                read: false,
                createdAt: new Date()
            };

            await User.findByIdAndUpdate(recipientOid, {
                $push: { notifications: notifPayload }
            });
            console.log(`${logPrefix} Notification pushed to ${recipientOid}`);
        } catch (notifErr) {
            // Non-fatal - log but don't fail the request
            console.warn(`${logPrefix} Notification failed (non-fatal):`, notifErr && notifErr.message);
        }

        // 🔥 REAL-TIME EMIT
        const io = req.app.get('io');
        if (io) {
            io.to(String(recipientOid)).emit('message.received', savedMessage);
            console.log(`${logPrefix} Broadcast 'message.received' to recipient ${recipientOid}`);
        }

        res.status(201).json(savedMessage);
    } catch (err) {
        console.error(`${logPrefix} CRITICAL ERROR:`, (err && (err.stack || err.message)) || err);
        const errorDetail = err && (err.message || String(err));
        res.status(500).json({
            error: "Neural link transmission failed",
            message: "An internal protocol error occurred while deploying the whisper.",
            detail: errorDetail,
            path: req.originalUrl,
            requestId: reqId,
            version: "v4.4-hardened-guard"
        });
    }
});

// Get messages between two users
router.get("/conversation/:otherUserId", verifyToken, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json("Auth required");
        const currentUserId = req.user.id || req.user.userId;
        const otherUserId = req.params.otherUserId;

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
});

// Get recent chats/conversations list for a user
router.get("/conversations", verifyToken, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json("Auth required");
        const userId = req.user.id || req.user.userId;

        // Find all unique users I've chatted with
        const messages = await Message.find({
            $or: [{ sender: userId }, { recipient: userId }]
        }).sort({ createdAt: -1 });

        const chats = [];
        const seen = new Set();

        for (const msg of messages) {
            const otherId = String(msg.sender) === String(userId) ? String(msg.recipient) : String(msg.sender);
            if (!seen.has(otherId)) {
                seen.add(otherId);
                chats.push({
                    otherId,
                    lastMessage: msg.text,
                    updatedAt: msg.createdAt
                });
            }
        }

        res.status(200).json(chats);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Clear conversation (User requested fix for 404)
router.delete("/conversation/:otherUserId", verifyToken, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json("Auth required");
        const currentUserId = req.user.id || req.user.userId;
        const otherUserId = req.params.otherUserId;

        // Delete where (sender=me AND recipient=them) OR (sender=them AND recipient=me)
        await Message.deleteMany({
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId }
            ]
        });

        res.status(200).json("Conversation neutralized.");
    } catch (err) {
        res.status(500).json(err);
    }
});

// Clear conversation (POST alternative for better compatibility)
router.post("/conversation/clear/:otherUserId", verifyToken, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json("Auth required");
        const currentUserId = req.user.id || req.user.userId;
        const otherUserId = req.params.otherUserId;

        if (!otherUserId || otherUserId === 'undefined' || otherUserId === 'null') {
            console.error("CLEAR CHAT FAILED: Invalid otherUserId param", otherUserId);
            return res.status(400).json("Identification protocol failed: ID missing.");
        }

        // Delete where (sender=me AND recipient=them) OR (sender=them AND recipient=me)
        const result = await Message.deleteMany({
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId }
            ]
        });

        console.log(`[CLEAR] Conversation between ${currentUserId} and ${otherUserId} neutralized. Deleted: ${result.deletedCount}`);
        res.status(200).json("Conversation neutralized.");
    } catch (err) {
        console.error("CLEAR CHAT ERROR:", err);
        res.status(500).json(err);
    }
});

export default router;
