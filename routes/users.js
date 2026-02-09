import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";
import upload, { profilePicUpload } from "../middleware/upload.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Get all users
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select('username role profilePic isPrivate isFollowersOnly followers following createdAt lastSeen');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json([]);
    }
});

// 1. Heartbeat - Bulletproof (Returns 200 immediately, updates in background)
const heartbeatHandler = (req, res) => {
    // Ensure response is always sent (defensive)
    try {
        res.status(200).json({ status: "alive" });
    } catch (err) {
        console.error("Heartbeat response error:", err && err.message);
        try { res.status(200).json({ status: "alive" }); } catch (e) { /* give up silently */ }
    }

    // Background execution to prevent blocking or 500 errors
    (async () => {
        try {
            const authHeader = (typeof req.header === 'function') ? req.header("Authorization") : req.headers.authorization;
            console.log("📡 Heartbeat hit - auth present:", !!authHeader, "reqId:", req?.requestId || 'no-id');
            if (!authHeader || !String(authHeader).startsWith("Bearer ")) return;

            const token = String(authHeader).substring(7);
            let decoded = null;
            try { decoded = jwt.decode(token); } catch (dErr) { console.warn("Heartbeat token decode failed:", dErr && dErr.message); return; }
            const userId = decoded?.id || decoded?.userId;
            console.log("📡 Heartbeat decoded userId:", userId, "reqId:", req?.requestId || 'no-id');

            if (userId && mongoose.Types.ObjectId.isValid(String(userId))) {
                await User.updateOne(
                    { _id: new mongoose.Types.ObjectId(String(userId)) },
                    { $set: { lastSeen: new Date(), lastActive: new Date() } }
                ).catch((uErr) => { console.warn("Heartbeat DB update failed:", uErr && uErr.message); });
            }
        } catch (e) {
            console.warn("Heartbeat background error:", e && e.message);
        }
    })();
};

router.put('/heartbeat', heartbeatHandler);
router.get('/heartbeat', heartbeatHandler);


// 2. Follow - Absolute Priority
// 2. Follow / Request Logic - Absolute Priority
router.post("/:id/follow", verifyToken, async (req, res) => {
    try {
        const currentUserId = String(req.user?.id || req.user?.userId);
        const targetId = req.params.id;

        if (!currentUserId || !targetId) return res.status(401).json("Encryption failed: Auth missing");
        if (targetId === currentUserId) return res.status(400).json("Self-follow protocol denied.");

        const userToFollow = await User.findById(targetId);
        const currentUser = await User.findById(currentUserId);

        if (!userToFollow || !currentUser) return res.status(404).json("Agent not found.");

        // 1. UNFOLLOW if already following
        if (userToFollow.followers?.some(id => String(id) === currentUserId)) {
            const updatedUser = await User.findByIdAndUpdate(targetId, { $pull: { followers: currentUserId } }, { new: true });
            await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetId } });
            return res.status(200).json({ message: "Unfollowed", isFollowing: false, followers: updatedUser.followers });
        }

        // 2. CANCEL REQUEST if already requested
        if (userToFollow.followRequests?.some(id => String(id) === currentUserId)) {
            await User.findByIdAndUpdate(targetId, {
                $pull: {
                    followRequests: currentUserId,
                    notifications: { from: new mongoose.Types.ObjectId(String(currentUserId)), type: 'follow_request' }
                }
            });
            return res.status(200).json({ message: "Request Cancelled", isRequested: false });
        }

        // 3. HANDLE PRIVATE ACCOUNT (REQUEST)
        if (userToFollow.isPrivate) {
            const updatedUser = await User.findByIdAndUpdate(targetId, {
                $push: {
                    followRequests: currentUserId,
                    notifications: {
                        type: 'follow_request', from: currentUserId, fromUsername: currentUser.username,
                        fromProfilePic: currentUser.profilePic || '', read: false, createdAt: new Date()
                    }
                }
            }, { new: true });
            return res.status(200).json({ message: "Requested", isRequested: true, followRequests: updatedUser.followRequests });
        }

        // 4. PUBLIC FOLLOW (INSTANT)
        const updatedUser = await User.findByIdAndUpdate(targetId, {
            $push: {
                followers: currentUserId,
                notifications: {
                    type: 'follow', from: currentUserId, fromUsername: currentUser.username,
                    fromProfilePic: currentUser.profilePic || '', read: false, createdAt: new Date()
                }
            }
        }, { new: true });

        await User.findByIdAndUpdate(currentUserId, { $push: { following: targetId } });
        res.status(200).json({ message: "Followed", isFollowing: true, followers: updatedUser.followers });
    } catch (err) {
        console.error("🔥 Follow Protocol Error:", err.message);
        res.status(500).json({ message: "System failure", error: err.message });
    }
});

// 1. Λήψη στοιχείων χρήστη
router.get("/find/:id", async (req, res) => {
    try {
        const foundUser = await User.findById(req.params.id).select('username role profilePic bio isPrivate isFollowersOnly followers following createdAt lastSeen');
        if (!foundUser) return res.status(404).json("Χρήστης δεν βρέθηκε.");
        res.status(200).json(foundUser);
    } catch (err) {
        res.status(500).json("Σφάλμα κατά την αναζήτηση χρήστη.");
    }
});

// 2. Λήψη όλων των posts ενός χρήστη (With Privacy Filter)
router.get("/posts/:userId", verifyToken, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.user.id || req.user.userId;

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return res.status(404).json("Agent not found.");

        const isOwner = String(targetUserId) === String(currentUserId);
        const isFollower = targetUser.followers?.some(id => String(id) === String(currentUserId));
        const isPrivate = targetUser.isPrivate || targetUser.isFollowersOnly;

        if (isPrivate && !isOwner && !isFollower && req.user.role !== 'Founder') {
            return res.status(403).json("Intel is encrypted. Clearance restricted to followers.");
        }

        const posts = await Post.find({ author: targetUserId }).sort({ createdAt: -1 });
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
        const requestIdParam = req.params.requestId;
        const requesterId = requestIdParam ? String(requestIdParam).trim() : null;

        console.log(`[ACCEPT REQ] [${req.requestId || 'no-id'}] User ${userId} starting acceptance of ${requesterId}`);

        // Validate requesterId format - Return 200 even if invalid to clear UI safely
        if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
            console.warn(`[ACCEPT REQ] [${req.requestId || 'no-id'}] IGNORED: Invalid ID format: "${requesterId}"`);
            return res.status(200).json({ status: "invalid_id_ignored", detail: "The request ID format was invalid, but we are returning 200 to clear the UI." });
        }

        const user = await User.findById(userId);
        if (!user) {
            console.error(`[ACCEPT REQ] [${req.requestId || 'no-id'}] User not found: ${userId}`);
            return res.status(404).json("Agent not found.");
        }

        console.log(`[ACCEPT REQ] [${req.requestId || 'no-id'}] Checking if ${requesterId} exists in followRequests...`);
        const hasRequest = user.followRequests?.some(id => String(id) === String(requesterId));
        if (!hasRequest) {
            console.warn(`[ACCEPT REQ] [${req.requestId || 'no-id'}] Request ${requesterId} not found in user's list. Cleaning up.`);
            // CLEANUP STALE NOTIFICATION
            try {
                await User.findByIdAndUpdate(userId, {
                    $pull: { notifications: { from: new mongoose.Types.ObjectId(String(requesterId)), type: 'follow_request' } }
                });
            } catch (pErr) { console.warn(`[ACCEPT REQ] cleanup pull failed:`, pErr.message); }

            // Fallback: If it's already a follower, just say OK to clear UI
            if (user.followers?.some(id => String(id) === String(requesterId))) {
                return res.status(200).json("Already a follower.");
            }
            return res.status(200).json("Request expired or canceled.");
        }

        console.log(`[ACCEPT REQ] [${req.requestId || 'no-id'}] Proceeding with DB updates...`);
        // 1. Update self
        await User.findByIdAndUpdate(userId, {
            $pull: {
                followRequests: requesterId,
                notifications: { from: new mongoose.Types.ObjectId(String(requesterId)), type: 'follow_request' }
            },
            $push: { followers: requesterId }
        });

        // 2. Update requester
        await User.findByIdAndUpdate(requesterId, {
            $push: {
                following: userId,
                notifications: {
                    type: 'message',
                    from: userId,
                    fromUsername: user.username,
                    fromProfilePic: user.profilePic || '',
                    text: `Accepted your follow request.`,
                    read: false,
                    createdAt: new Date()
                }
            }
        });

        console.log(`[ACCEPT REQ] [${req.requestId || 'no-id'}] SUCCESS: Accepted request from ${requesterId}`);
        res.status(200).json("Follower accepted");
    } catch (err) {
        console.error(`[ACCEPT REQ] [${req.requestId || 'no-id'}] CRITICAL ERROR:`, err.message);
        res.status(500).json(err);
    }
});

// REJECT follow request
router.post("/requests/:requestId/reject", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const requestIdParam = req.params.requestId;
        const requesterId = requestIdParam ? String(requestIdParam).trim() : null;

        console.log(`[REJECT REQ] User ${userId} attempting to reject request from ${requesterId}`);

        // Validate requesterId format - Return 200 even if invalid to clear UI safely
        if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
            console.warn(`[REJECT REQ] IGNORED: Invalid ID format: "${requesterId}"`);
            return res.status(200).json({ status: "invalid_id_ignored", detail: "Request ID format invalid, clearing UI safely." });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json("Agent not found.");

        const hasRequest = user.followRequests?.some(id => String(id) === String(requesterId));
        if (!hasRequest) {
            console.warn(`[REJECT REQ] Request ${requesterId} not found. Cleaning up stale notification.`);
            // CLEANUP STALE NOTIFICATION
            await User.findByIdAndUpdate(userId, {
                $pull: { notifications: { from: new mongoose.Types.ObjectId(String(requesterId)), type: 'follow_request' } }
            });
            return res.status(200).json("Request already removed.");
        }

        await User.findByIdAndUpdate(userId, {
            $pull: {
                followRequests: requesterId,
                notifications: { from: new mongoose.Types.ObjectId(String(requesterId)), type: 'follow_request' }
            }
        });
        res.status(200).json("Request neutralized.");
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

        // Transform backend 'from' to frontend 'sender' for compatibility
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
        res.status(200).json([]); // Return empty array instead of 500
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
            const existing = await User.findOne({ username: req.body.username });
            if (existing) return res.status(400).json("Identification identifier already reserved by another operative.");

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
    profilePicUpload.single("image")(req, res, (err) => {
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
            // Deep update for comments
            await Post.updateMany(
                { "comments.authorId": userId },
                { $set: { "comments.$[elem].authorProfilePic": imagePath } },
                { arrayFilters: [{ "elem.authorId": userId }] }
            );
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
    try {
        const currentUserId = String(req.user.id || req.user.userId);
        const targetId = String(req.params.id);

        if (targetId !== currentUserId && req.user.role !== 'Founder') {
            return res.status(403).json("Authorization Failed: Operational ID mismatch.");
        }

        const user = await User.findById(targetId);
        if (!user) return res.status(404).json("Agent not found.");

        // Only handle username logic if it's changing
        if (req.body.username) {
            const newUsername = String(req.body.username).trim();
            if (newUsername !== user.username) {
                const existing = await User.findOne({ username: newUsername });
                if (existing && existing._id.toString() !== targetId) {
                    return res.status(400).json("Username already taken.");
                }

                // LOCKOUT REMOVED per user request
                req.body.username = newUsername;
                req.body.lastUsernameChange = new Date();

                // Propagate name change to posts and comments
                await Post.updateMany({ author: targetId }, { $set: { username: req.body.username } });
                await Post.updateMany(
                    { "comments.authorId": targetId },
                    { $set: { "comments.$[elem].authorName": req.body.username } },
                    { arrayFilters: [{ "elem.authorId": targetId }] }
                ).catch(e => console.warn("Comment name sync delay"));
            } else {
                // If username is same, remove it from req.body to prevent unnecessary cycles
                delete req.body.username;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            targetId,
            { $set: req.body },
            { new: true }
        ).select('-password');

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error("USER UPDATE ERROR:", err);
        res.status(500).json({ error: "System error during update", detail: err.message });
    }
});

// BAN USER
router.post("/:id/ban", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Founder') {
            return res.status(403).json("Only Founder can authorize suspension protocols.");
        }
        const { days } = req.body;
        const banExpires = new Date();
        banExpires.setDate(banExpires.getDate() + (days || 3));

        await User.findByIdAndUpdate(req.params.id, {
            isBanned: true,
            banExpires: banExpires,
            banReason: "Suspended by Protocol Commander"
        });

        res.status(200).json("Agent suspended successfully.");
    } catch (err) {
        res.status(500).json(err);
    }
});

// 4. DELETE USER ACCOUNT - Mission Scrub
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const targetId = req.params.id;
        const currentUserId = req.user.id || req.user.userId;

        if (targetId !== currentUserId && req.user.role !== 'Founder') {
            return res.status(403).json("Authorization Failed: Protocol mismatch.");
        }

        // 1. Scrub Followers/Following/Requests Mesh
        await User.updateMany({}, {
            $pull: {
                followers: targetId,
                following: targetId,
                followRequests: targetId
            }
        });

        // 2. Clear Intel Endorsements (Likes/Dislikes)
        await Post.updateMany({}, {
            $pull: {
                likes: targetId,
                dislikes: targetId,
                likesUsers: targetId // If used
            }
        });

        // 3. Purge Agent's Intel (Posts)
        await Post.deleteMany({ author: targetId });

        // 4. Decommission User record
        const user = await User.findByIdAndDelete(targetId);

        if (!user) return res.status(404).json("Agent already neutralized.");

        res.status(200).json("Agent trace eliminated successfully.");
    } catch (err) {
        console.error("DELETION FAILURE:", err);
        res.status(500).json({ error: "System failed to scrub agent record.", detail: err.message });
    }
});

export default router;
