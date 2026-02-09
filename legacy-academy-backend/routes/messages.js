import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js"; // Needed for FormData

const router = express.Router();

// SEND MESSAGE (Using upload.single('file') for audio support)
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
    try {
        const { recipient: recipientId, text } = req.body;
        const currentUserId = req.user.id;

        // Audio handling
        const audioUrl = req.file ? req.file.path : null;

        if (!recipientId) return res.status(400).json("Recipient is required");

        const recipientUser = await User.findById(recipientId);
        if (!recipientUser) return res.status(404).json("Target user no longer exists");

        // GUARD CHAT CHECK
        // If recipient has Guard Chat enabled, sender MUST be a follower
        if (recipientUser.isFollowersOnly) {
            const isFollower = recipientUser.followers.map(id => String(id)).includes(String(currentUserId));
            const isAdmin = req.user.role === 'Admin' || req.user.role === 'Founder';
            if (!isFollower && !isAdmin && String(recipientId) !== String(currentUserId)) {
                return res.status(403).json("GUARD CHAT ACTIVE: You must follow this user to communicate.");
            }
        }

        const newMessage = new Message({
            sender: currentUserId,
            recipient: recipientId,
            text: text || "",
            audio: audioUrl || ""
        });

        const savedMessage = await newMessage.save();

        // Notify Recipient
        const sender = await User.findById(currentUserId);
        await User.findByIdAndUpdate(recipientId, {
            $push: {
                notifications: {
                    type: 'message',
                    from: currentUserId,
                    fromUsername: sender.username,
                    fromProfilePic: sender.profilePic,
                    read: false,
                    createdAt: new Date()
                }
            }
        });

        res.status(200).json(savedMessage);
    } catch (err) {
        console.error("Message Error:", err);
        res.status(500).json("Transmission failed: Secure link interrupted.");
    }
});

// GET CONVERSATION
router.get("/:userId", verifyToken, async (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const currentUserId = req.user.id;

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

export default router;
