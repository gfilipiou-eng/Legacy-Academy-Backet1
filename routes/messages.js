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

// 🔥 WHISPERS AUTO-DELETE: Mark message as read (starts 5-minute countdown)
router.patch("/:messageId/read", verifyToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id || req.user.userId;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json("Message not found");

        // Only recipient can mark as read
        if (String(message.recipient) !== String(userId)) {
            return res.status(403).json("Not authorized");
        }

        // Mark as read with timestamp
        message.read = true;
        message.readAt = new Date();
        await message.save();

        console.log(`[WHISPER] Message ${messageId} marked as read. Will self-destruct in 5 minutes.`);
        res.status(200).json({ success: true, readAt: message.readAt });
    } catch (err) {
        console.error("Mark-as-read error:", err);
        res.status(500).json(err);
    }
});

// 🔥 WHISPERS AUTO-DELETE CLEANUP: Run every minute to delete expired messages
const cleanupExpiredWhispers = async () => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const result = await Message.deleteMany({
            readAt: { $ne: null, $lt: fiveMinutesAgo }
        });
        if (result.deletedCount > 0) {
            console.log(`[WHISPERS CLEANUP] 🔥 Auto-deleted ${result.deletedCount} expired whispers`);
        }
    } catch (err) {
        console.error("[WHISPERS CLEANUP] Error:", err);
    }
};

// Run cleanup every 60 seconds
setInterval(cleanupExpiredWhispers, 60 * 1000);
console.log("🔥 WHISPERS AUTO-DELETE activated. Messages self-destruct 5 minutes after reading.");


// Send a message (Updated for Audio Support)
router.post("/", upload.single("file"), verifyToken, async (req, res) => {
    const reqId = Math.random().toString(36).substring(7);
    const logPrefix = `[${reqId}] [WHISPER_SEND]`;
    console.log(`${logPrefix} Start. Body keys:`, Object.keys(req.body || {}));

    try {
        if (!req.user) {
            console.error(`${logPrefix} FAILED: No req.user after verifyToken`);
            return res.status(401).json("Neural interface not recognized.");
        }
        const senderId = req.user.id || req.user.userId || req.user._id;
        const { recipient, text } = req.body;

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

        // Explicitly cast strings to ObjectIds to prevent Mongoose cast errors
        const senderOid = new mongoose.Types.ObjectId(String(senderId));
        const recipientOid = new mongoose.Types.ObjectId(String(recipient));

        const newMessage = new Message({
            sender: senderOid,
            recipient: recipientOid,
            text: (text || "").trim(),
            audioUrl
        });

        const savedMessage = await newMessage.save();
        console.log(`${logPrefix} Message SAVED. ID: ${savedMessage._id}`);

        // Send notification using DB user data to avoid token-sync issues
        try {
            const sender = await User.findById(senderOid);
            const notifPayload = {
                type: 'message',
                from: senderOid,
                fromUsername: sender?.username || 'User',
                fromProfilePic: sender?.profilePic || '',
                text: text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : "Sent a voice note.",
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

        res.status(201).json(savedMessage);
    } catch (err) {
        console.error(`${logPrefix} CRITICAL ERROR:`, (err && (err.stack || err.message)) || err);
        res.status(500).json({
            error: "Neural link transmission failed",
            detail: err && (err.message || err),
            path: req.originalUrl,
            requestId: reqId,
            version: "v4.2-diagnostic"
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
