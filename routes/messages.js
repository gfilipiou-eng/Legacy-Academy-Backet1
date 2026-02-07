import express from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

import upload from "../middleware/upload.js";

const router = express.Router();

// Status check to verify connectivity
router.get("/", (req, res) => res.status(200).json({ status: "Neural link active", protocol: "MESSAGES_V1" }));
router.get("/status", (req, res) => res.status(200).json({ status: "Neural link active", timestamp: new Date() }));

// Send a message (Updated for Audio Support)
router.post("/", upload.single("file"), verifyToken, async (req, res) => {
    const reqId = Math.random().toString(36).substring(7);
    console.log(`[${reqId}] MESSAGE ATTEMPT - Body keys:`, Object.keys(req.body || {}));

    try {
        if (!req.user) return res.status(401).json("Neural interface not recognized.");
        const senderId = req.user.id || req.user.userId;
        const { recipient, text } = req.body;
        console.log(`[${reqId}] Message from ${senderId} to ${recipient}. Text preview: ${text?.substring(0, 20)}`);

        if (!recipient) {
            return res.status(400).json("Recipient is required");
        }

        if (!text && !req.file) {
            return res.status(400).json("Intelligence required (text or audio)");
        }

        const targetUser = await User.findById(recipient);
        if (!targetUser) {
            console.warn(`[${reqId}] Recipient not found: ${recipient}`);
            return res.status(404).json("Recipient not found in neural database.");
        }

        let audioUrl = "";
        if (req.file) {
            audioUrl = req.file.path || "";
            if (audioUrl.startsWith('uploads')) {
                audioUrl = '/' + audioUrl.replace(/\\/g, '/');
            }
        }

        const newMessage = new Message({
            sender: senderId,
            recipient,
            text: text || "",
            audioUrl
        });

        const savedMessage = await newMessage.save();

        // Send Notification
        await User.findByIdAndUpdate(recipient, {
            $push: {
                notifications: {
                    type: 'message',
                    from: senderId,
                    fromUsername: req.user.username,
                    text: text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : "Sent a voice note.",
                    read: false,
                    createdAt: new Date()
                }
            }
        });

        res.status(201).json(savedMessage);
    } catch (err) {
        console.error("MESSAGE ERROR:", err);
        res.status(500).json({ error: "Neural link transmission failed", detail: err.message });
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
