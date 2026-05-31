import express from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { handleBotMention } from "../utils/botHandlers.js";
import { cleanupExpiredMessages, cleanupSnapchatMessages } from "../utils/messageRetention.js";

const router = express.Router();

// Mark message as read
const markMessageRead = async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const userId = req.user.id;
        const msg = await Message.findById(messageId);
        if (!msg) return res.status(200).json({ success: true, message: "Handshake completed: Message already archived." });
        if (String(msg.recipient) !== String(userId)) return res.status(403).json("Not authorized");

        msg.isRead = true;
        msg.readAt = new Date();
        await msg.save();

        // Snapchat Mode: If the message is not locked, schedule a 5-second burn timer
        if (!msg.isLocked) {
            setTimeout(async () => {
                try {
                    const message = await Message.findById(messageId);
                    if (message && !message.isLocked) {
                        const mediaToDelete = [];
                        if (message.audio) mediaToDelete.push(message.audio);
                        if (message.image) mediaToDelete.push(message.image);
                        if (mediaToDelete.length > 0) {
                            const { deleteCloudinaryFiles } = await import("../utils/cloudinaryCleanup.js");
                            await deleteCloudinaryFiles(mediaToDelete).catch(() => { });
                        }
                        await Message.deleteOne({ _id: messageId });

                        // Notify both users' clients to remove the message in real-time
                        const io = req.app.get('io');
                        if (io) {
                            io.to(String(message.sender)).emit("message.deleted", {
                                messageId: message._id,
                                conversationWith: message.recipient,
                            });
                            io.to(String(message.recipient)).emit("message.deleted", {
                                messageId: message._id,
                                conversationWith: message.sender,
                            });
                        }
                    }
                } catch (burnErr) {
                    console.error("[BURN PROTOCOL ERROR]", burnErr);
                }
            }, 5000);
        }

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
        // Cleanup (safe)
        try {
            await cleanupExpiredMessages({ app: req.app });
        } catch (cleanupErr) {
            console.error('Cleanup error:', cleanupErr);
        }

        // Validation: Ensure req.body exists (multer should populate it)
        const body = req.body || {};
        const recipientId = body.recipient;
        const text = body.text;

        console.log(`[MESSAGE] Processing send request. Recipient: ${recipientId}, HasFile: ${!!req.file}`);

        if (!req.user) return res.status(401).json("Auth failed");
        const currentUserId = req.user.id;

        // File handling - ROBUST type detection (mimetype + extension + cloudinary URL)
        let audioUrl = "";
        let imageUrl = "";
        try {
            if (req.file) {
                const filePath = req.file.path || req.file.secure_url || req.file.url || "";
                const mime = (req.file.mimetype || "").toLowerCase();
                const origName = (req.file.originalname || "").toLowerCase();

                // Triple-check: mimetype OR file extension OR cloudinary URL pattern
                const isImage = mime.startsWith("image")
                    || /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif|avif)$/i.test(origName)
                    || filePath.includes("/image/upload/");

                console.log(`[MESSAGE FILE] mime=${mime}, name=${origName}, path=${filePath}, isImage=${isImage}`);

                if (isImage) {
                    imageUrl = filePath;
                } else {
                    audioUrl = filePath;
                }
            }
        } catch (fileErr) {
            console.error('File handling error:', fileErr);
        }

        if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json("Invalid or missing recipient ID");
        }

        // Check recipient (safe)
        let recipientUser;
        try {
            recipientUser = await User.findById(recipientId);
        } catch (recipientErr) {
            console.error('Recipient fetch error:', recipientErr);
            return res.status(404).json("Target user no longer exists");
        }
        
        if (!recipientUser) return res.status(404).json("Target user no longer exists");

        // DM guard (safe)
        try {
            const dmGuard = !!(recipientUser.settings?.dmFollowersOnly);
            if (dmGuard) {
                const isFollower = Array.isArray(recipientUser.followers) && recipientUser.followers.some(id => String(id) === String(currentUserId));
                if (!isFollower && req.user.role !== 'Founder') {
                    return res.status(403).json("Messages restricted to followers");
                }
            }
        } catch (guardErr) {
            console.error('DM guard error:', guardErr);
            // Continue even if guard fails
        }

        const newMessage = new Message({
            sender: currentUserId,
            recipient: recipientId,
            text: text || "",
            audio: audioUrl,
            image: imageUrl
        });

        const savedMessage = await newMessage.save();

        // 🔥 REAL-TIME EMIT & PERSISTENCE (fire and forget all of it)
        const io = req.app.get('io');
        if (io) {
            try {
                const senderUser = await User.findById(currentUserId).select('username profilePic');
                io.to(String(recipientId)).emit('message.received', savedMessage);
                io.to(String(currentUserId)).emit('message.received', savedMessage); // Live sync for sender's other devices
                if (senderUser) {
                    // Save to DB for historical/offline access
                    User.findByIdAndUpdate(recipientId, {
                        $push: {
                            notifications: {
                                $each: [{
                                    type: 'message',
                                    from: currentUserId,
                                    fromUsername: senderUser.username,
                                    fromProfilePic: senderUser.profilePic,
                                    read: false,
                                    createdAt: new Date()
                                }],
                                $position: 0
                            }
                        }
                    }).catch(notifSaveErr => console.error('Notification save error:', notifSaveErr));

                    // Emit real-time signal
                    io.to(String(recipientId)).emit('notification.received', {
                        type: 'message',
                        fromUsername: senderUser.username,
                        fromProfilePic: senderUser.profilePic
                    });
                }
            } catch (notifErr) {
                console.error('Notification error:', notifErr);
            }

            // --- BOT AUTOMATION ---
            console.log("🤖 [MESSAGE_ROUTE] Triggering bot mention handler...");
            // Fire and forget so it doesn't block the response
            handleBotMention(savedMessage, io).catch(err => console.error("Bot Handler Error:", err));
        }

        res.status(200).json(savedMessage);
    } catch (err) {
        console.error("Message Error:", err);
        // Even if we have an error, try to send a basic response
        res.status(500).json("Transmission failed.");
    }
});

// GET CONVERSATION
const getConversation = async (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const currentUserId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
            return res.status(200).json([]); // Return empty conversation for invalid IDs
        }

        await cleanupSnapchatMessages({
            app: req.app,
            currentUserId,
            chatUserId: otherUserId
        });

        await cleanupExpiredMessages({
            app: req.app,
            query: {
                $or: [
                    { sender: currentUserId, recipient: otherUserId },
                    { sender: otherUserId, recipient: currentUserId }
                ],
            },
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

router.get("/:messageId/lock", verifyToken, async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const userId = req.user.id;
        const msg = await Message.findById(messageId);
        if (!msg) return res.status(404).json("Message not found");

        if (String(msg.sender) !== String(userId) && String(msg.recipient) !== String(userId)) {
            return res.status(403).json("Not authorized to view this message");
        }

        res.status(200).json({ success: true, isLocked: !!msg.isLocked });
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/:userId", verifyToken, getConversation);

router.patch("/:messageId/lock", verifyToken, async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const userId = req.user.id;
        const locked = !!req.body.locked;

        const msg = await Message.findById(messageId);
        if (!msg) return res.status(404).json("Message not found");

        if (String(msg.sender) !== String(userId) && String(msg.recipient) !== String(userId)) {
            return res.status(403).json("Not authorized to modify this message");
        }

        msg.isLocked = locked;
        await msg.save();

        const deletedMessages = !msg.isLocked
            ? await cleanupExpiredMessages({ app: req.app, query: { _id: msg._id } })
            : [];

        res.status(200).json({
            success: true,
            isLocked: msg.isLocked,
            deleted: deletedMessages.length > 0,
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

router.post("/cleanup", verifyToken, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { chatUserId } = req.body;
        if (!chatUserId) {
            return res.status(400).json("chatUserId is required");
        }
        const deleted = await cleanupSnapchatMessages({
            app: req.app,
            currentUserId,
            chatUserId
        });
        res.status(200).json({ success: true, count: deleted.length });
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
