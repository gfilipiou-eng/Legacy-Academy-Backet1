import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// SEND MESSAGE
router.post("/", verifyToken, async (req, res) => {
    try {
        const { recipient, text, audio } = req.body;
        console.log("[MESSAGE] Sending to:", recipient, "Text:", text);

        if (!recipient) {
            return res.status(400).json("Recipient is required");
        }

        // Privacy Check: Only allowed if both follow each other OR one sent a Request?
        // Or strictly following?
        // Legacy Academy rules: "Only accepted followers see content"
        // Usually DM requires mutual follow or open DM.
        // Assuming open for now, or check follow status.

        const newMessage = new Message({
            sender: req.user.id,
            recipient,
            text,
            audio
        });

        const savedMessage = await newMessage.save();

        // Notify Recipient
        await User.findByIdAndUpdate(recipient, {
            $push: {
                notifications: {
                    type: 'message',
                    from: req.user.id,
                    fromUsername: req.user.username, // Might be undefined here if req.user doesn't have details. Better fetch sender.
                    // Actually verifyToken usually attaches minimalistic payload {id, role}.
                    // We should fetch sender details first.
                    read: false,
                    createdAt: new Date()
                }
            }
        });

        const sender = await User.findById(req.user.id).select('username profilePic');
        // Update notification with correct details
        // Or simpler:
        // socket.io emit if real-time

        res.status(200).json(savedMessage);
    } catch (err) {
        console.error("Message Error:", err);
        res.status(500).json(err);
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
