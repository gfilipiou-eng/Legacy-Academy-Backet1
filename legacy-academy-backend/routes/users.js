import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Get all users
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select('username role profilePic isPrivate followers following createdAt lastSeen');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json([]);
    }
});

// 1. Heartbeat - Standardized & Robust
router.put('/heartbeat', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;

        // Update both lastSeen (for frontend) and lastActive (for request compliance)
        await User.findByIdAndUpdate(userId, {
            $set: {
                lastSeen: new Date(),
                lastActive: new Date()
            }
        });

        res.status(200).json("Heartbeat received");
    } catch (err) {
        console.error("Heartbeat Error:", err.message);
        res.status(200).json({ status: "error_handled" });
    }
});

// 2. Follow - Absolute Priority
router.post("/:id/follow", verifyToken, async (req, res) => {
    try {
        const currentUserId = req.user?.id || req.user?.userId;
        const targetId = req.params.id;

        console.log(`📡 FOLLOW REQ: ${currentUserId} -> ${targetId}`);

        if (!currentUserId || !targetId) return res.status(401).json("Auth error");
        if (targetId === currentUserId) return res.status(400).json("Cannot follow self");

        const userToFollow = await User.findById(targetId);
        const currentUser = await User.findById(currentUserId);

        if (!userToFollow || !currentUser) return res.status(404).json("User not found");

        if (userToFollow.followers?.includes(currentUserId)) {
            const updatedUser = await User.findByIdAndUpdate(targetId, { $pull: { followers: currentUserId } }, { new: true });
            await currentUser.updateOne({ $pull: { following: targetId } });
            return res.status(200).json({ message: "Unfollowed", isFollowing: false, followers: updatedUser.followers });
        }

        const updatedUser = await User.findByIdAndUpdate(targetId, {
            $push: {
                followers: currentUserId,
                notifications: {
                    type: 'follow', from: currentUserId, fromUsername: currentUser.username,
                    fromProfilePic: currentUser.profilePic || '', read: false, createdAt: new Date()
                }
            }
        }, { new: true });

        await currentUser.updateOne({ $push: { following: targetId } });
        res.status(200).json({ message: "Followed", isFollowing: true, followers: updatedUser.followers });
    } catch (err) {
        console.error("🔥 Follow Error:", err.message);
        res.status(500).json({ message: "Follow error", error: err.message });
    }
});

// 1. Λήψη στοιχείων χρήστη
router.get("/find/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("Χρήστης δεν βρέθηκε.");

        const { password, ...others } = user._doc;
        res.status(200).json(others);
    } catch (err) {
        res.status(500).json("Σφάλμα κατά την αναζήτηση χρήστη.");
    }
});

// 2. Λήψη όλων των posts ενός χρήστη
router.get("/posts/:userId", async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get user by username
router.get("/username/:username", async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password');
        if (!user) return res.status(404).json("User not found");
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
});

// ACCEPT follow request
router.post("/requests/:requestId/accept", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const requesterId = req.params.requestId;

        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);

        if (!user.followRequests.includes(requesterId)) return res.status(400).json("No request found");

        await user.updateOne({ $pull: { followRequests: requesterId }, $push: { followers: requesterId } });
        await requester.updateOne({ $push: { following: userId } });

        res.status(200).json("Follower accepted");
    } catch (err) { res.status(500).json(err); }
});

// REJECT follow request
router.post("/requests/:requestId/reject", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        await User.findByIdAndUpdate(userId, { $pull: { followRequests: req.params.requestId } });
        res.status(200).json("Request rejected");
    } catch (err) { res.status(500).json(err); }
});

// GET pending requests
router.get("/requests/pending", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const user = await User.findById(userId);
        const requests = await User.find({ _id: { $in: user.followRequests } }).select("username profilePic role");
        res.status(200).json(requests);
    } catch (err) { res.status(500).json(err); }
});

// GET user notifications
router.get("/notifications", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const user = await User.findById(userId).select('notifications');

        const notifications = (user?.notifications || []).map(n => {
            const doc = n._doc || n;
            return {
                ...doc,
                sender: {
                    _id: doc.from,
                    username: doc.fromUsername,
                    profilePic: doc.fromProfilePic
                }
            };
        });

        const sortedNotifications = notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.status(200).json(sortedNotifications);
    } catch (err) {
        console.error("Get notifications error:", err);
        res.status(200).json([]);
    }
});

// Mark notifications as read
router.put("/notifications/read", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        await User.findByIdAndUpdate(userId, {
            $set: { 'notifications.$[].read': true }
        });
        res.status(200).json({ message: "Notifications marked as read" });
    } catch (err) { res.status(500).json(err); }
});

// DELETE ALL notifications (Clear Log)
router.delete("/notifications", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        await User.findByIdAndUpdate(userId, { $set: { notifications: [] } });
        res.status(200).json("Notifications cleared");
    } catch (err) { res.status(500).json(err); }
});

// DELETE specific notification
router.delete("/notifications/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        await User.findByIdAndUpdate(userId, {
            $pull: { notifications: { _id: req.params.id } }
        });
        res.status(200).json("Notification deleted");
    } catch (err) { res.status(500).json(err); }
});

// Get followers list
router.get("/:id/followers", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("User not found");

        const followers = await User.find({ _id: { $in: user.followers } }).select('username role profilePic');
        res.status(200).json(followers);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get following list
router.get("/:id/following", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("User not found");

        const following = await User.find({ _id: { $in: user.following } }).select('username role profilePic');
        res.status(200).json(following);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Update user settings & privacy
router.put("/settings", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        if (!userId) return res.status(401).json("Unauthorized - Neural Interface missing");

        const oldUser = await User.findById(userId);
        if (!oldUser) return res.status(404).json("Agent not found in mission database");

        const updateData = {};
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'object' && req.body[key] !== null && !Array.isArray(req.body[key])) {
                Object.keys(req.body[key]).forEach(subKey => {
                    updateData[`${key}.${subKey}`] = req.body[key][subKey];
                });
            } else {
                updateData[key] = req.body[key];
            }
        });

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('-password');

        if (req.body.username && req.body.username !== oldUser.username) {
            await Post.updateMany({ author: userId }, { $set: { username: req.body.username } });
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error("CRITICAL SETTINGS FAILURE:", err);
        res.status(500).json({ message: "Neural state corruption during update", error: err.message });
    }
});

// Update profile picture
router.post("/profile-pic", verifyToken, (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err) {
            console.error("Profile Upload Error:", err.message);
            return res.status(500).json({ message: "Upload service failed. Check configurations.", error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        if (!userId) return res.status(401).json("Unauthorized - Agent ID missing");
        if (!req.file || !req.file.path) return res.status(400).json("No valid asset uploaded to terminal.");

        let imagePath = req.file.path;
        if (imagePath.startsWith('uploads')) {
            imagePath = '/' + imagePath.replace(/\\/g, '/');
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { profilePic: imagePath } },
            { new: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json("Agent not found in central core.");

        try {
            await Post.updateMany({ author: userId }, { $set: { profilePic: imagePath } });
        } catch (syncErr) {
            console.warn("Minor sync delay detected.");
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: "SYSTEM ERROR: Asset integration failed.", error: err.message });
    }
});

// 3. Update User (Generic + Username Update Logic)
router.put("/:id", verifyToken, async (req, res) => {
    const currentUserId = req.user.id || req.user.userId;
    if (req.params.id === currentUserId || req.user.role === 'Founder') {
        try {
            if (req.body.username) {
                const user = await User.findById(req.params.id);
                const existing = await User.findOne({ username: req.body.username });
                if (existing && existing._id.toString() !== req.params.id) {
                    return res.status(400).json("Username already taken.");
                }

                if (req.user.role !== 'Founder' && user.lastUsernameChange) {
                    const diffTime = Math.abs(new Date() - new Date(user.lastUsernameChange));
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 3) {
                        return res.status(403).json(`You must wait ${3 - diffDays} more days to change username.`);
                    }
                }
                req.body.lastUsernameChange = new Date();
                await Post.updateMany({ author: req.params.id }, { $set: { username: req.body.username } });
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { $set: req.body },
                { new: true }
            );
            res.status(200).json(updatedUser);
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("Authorization Failed.");
    }
});

// 4. DELETE USER ACCOUNT
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const currentUserId = req.user.id || req.user.userId;
        if (req.params.id === currentUserId || req.user.role === 'Founder') {
            await Post.deleteMany({ author: req.params.id });
            await User.findByIdAndDelete(req.params.id);
            return res.status(200).json("Deleted successfully.");
        }
        return res.status(403).json("Μπορείτε να διαγράψετε μόνο τον δικό σας λογαριασμό!");
    } catch (err) {
        res.status(500).json("Σφάλμα κατά τη διαγραφή.");
    }
});

export default router;
