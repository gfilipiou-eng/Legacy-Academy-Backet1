import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Send a message
router.post("/", verifyToken, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json("Auth required");
        const senderId = req.user.id || req.user.userId;
        const { recipient, text } = req.body;

        if (!recipient || !text) {
            return res.status(400).json("Recipient and text are required");
        }

        // Optional: Check if recipient allows messages (e.g. followers only)
        const targetUser = await User.findById(recipient);
        if (targetUser?.isFollowersOnly) {
            const isFollower = targetUser.followers.some(id => String(id) === String(senderId));
            if (!isFollower) {
                return res.status(403).json("This agent only accepts messages from followers.");
            }
        }

        const newMessage = new Message({
            sender: senderId,
            recipient,
            text
        });

        const savedMessage = await newMessage.save();

        // Send Notification
        await User.findByIdAndUpdate(recipient, {
            $push: {
                notifications: {
                    type: 'message',
                    from: senderId,
                    fromUsername: req.user.username,
                    text: text.length > 50 ? text.substring(0, 50) + '...' : text,
                    read: false,
                    createdAt: new Date()
                }
            }
        });

        res.status(201).json(savedMessage);
    } catch (err) {
        res.status(500).json(err);
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

export default router;
