import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { deleteCloudinaryFile } from "../utils/cloudinaryCleanup.js";

const router = express.Router();

// UPDATE PROFILE PICTURE
router.post("/profile-pic", verifyToken, upload.single("image"), async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json("Agent not found.");

        // 🗑️ CLOUDINARY CLEANUP: Delete OLD profile pic before setting new one
        const oldPic = user.profilePic;

        let profilePic = user.profilePic;
        if (req.file) {
            // If Cloudinary is used, req.file.path or req.file.secure_url will be the URL
            // If disk storage is used, we need to prefix with /uploads/
            profilePic = req.file.path || `/uploads/${req.file.filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { profilePic } },
            { new: true }
        ).select("-password");

        // Delete old pic AFTER successful update (so if update fails, we don't lose the old pic)
        if (oldPic && oldPic !== profilePic) {
            deleteCloudinaryFile(oldPic).catch(() => { });
        }

        // Broadcast real-time update
        const io = req.app.get('io');
        if (io) io.emit('user.updated', updatedUser);

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error("Profile Pic Update Error:", err);
        res.status(500).json(err);
    }
});

// REMOVE COVER PICTURE (Premium Background)
router.delete("/cover-pic", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json("Agent not found.");

        const oldPic = user.coverPic;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $unset: { coverPic: "" } },
            { new: true }
        ).select("-password");

        if (oldPic) {
            deleteCloudinaryFile(oldPic).catch(() => { });
        }

        // Broadcast real-time update
        const io = req.app.get('io');
        if (io) io.emit('user.updated', updatedUser);

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error("Cover Pic Delete Error:", err);
        res.status(500).json(err);
    }
});

// UPDATE COVER PICTURE (Premium Background)
router.post("/cover-pic", verifyToken, upload.single("image"), async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json("Agent not found.");

        const oldPic = user.coverPic;
        let coverPic = user.coverPic;

        if (req.file) {
            coverPic = req.file.path || `/uploads/${req.file.filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { coverPic } },
            { new: true }
        ).select("-password");

        if (oldPic && oldPic !== coverPic) {
            deleteCloudinaryFile(oldPic).catch(() => { });
        }

        // Broadcast real-time update
        const io = req.app.get('io');
        if (io) io.emit('user.updated', updatedUser);

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error("Cover Pic Update Error:", err);
        res.status(500).json(err);
    }
});

// GET ALL USERS (Search)
router.get("/", verifyToken, async (req, res) => {
    try {
        const users = await User.find().select('username role profilePic coverPic isPrivate followers following followRequests bio profileDescriptor founderAffiliation settings lastSeen');
        const mappedUsers = users.map(u => ({
            ...u._doc,
            followRequests: u.followRequests || []
        }));
        res.status(200).json(mappedUsers);
    } catch (err) {
        res.status(500).json([]);
    }
});

// Get user by username
router.get("/username/:username", async (req, res) => {
    try {
        const usernameParam = decodeURIComponent(req.params.username).trim();
        const safeRegex = new RegExp("^" + usernameParam.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i");
        const user = await User.findOne({ username: { $regex: safeRegex } }).select('-password');
        if (!user) return res.status(404).json("User not found");
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get public posts of a user by username for public view-only Linktree profile view
router.get("/public/posts/:username", async (req, res) => {
    try {
        const usernameParam = decodeURIComponent(req.params.username).trim();
        const safeRegex = new RegExp("^" + usernameParam.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i");
        const user = await User.findOne({ username: { $regex: safeRegex } });
        if (!user) return res.status(404).json("Agent not found.");
        const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json([]);
    }
});

// GET NOTIFICATIONS (with auto-heal for 'Someone' usernames)
router.get("/notifications", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const user = await User.findById(userId).lean();
        if (!user) return res.status(200).json([]);

        const followers = (user.followers || []).map(id => String(id));

        // Collect IDs that need healing (stored as 'Someone' or blank)
        const needsHeal = (user.notifications || []).filter(n =>
            n.from && (!n.fromUsername || n.fromUsername === 'Someone' || n.fromUsername === 'Unknown')
        );

        // Heal in background: look up real usernames and patch DB
        if (needsHeal.length > 0) {
            const uniqueIds = [...new Set(needsHeal.map(n => String(n.from)))];
            const actors = await User.find({ _id: { $in: uniqueIds } }).select('_id username profilePic').lean();
            const actorMap = {};
            actors.forEach(a => { actorMap[String(a._id)] = a; });

            // Patch each broken notification in DB
            for (const n of needsHeal) {
                const actor = actorMap[String(n.from)];
                if (actor) {
                    await User.updateOne(
                        { _id: userId, "notifications._id": n._id },
                        { $set: { "notifications.$.fromUsername": actor.username, "notifications.$.fromProfilePic": actor.profilePic || '' } }
                    );
                }
            }
        }

        // Re-fetch after potential healing
        const freshUser = needsHeal.length > 0 ? await User.findById(userId).lean() : user;

        const filteredNotifications = (freshUser.notifications || []).filter(n => {
            if (n.type === 'follow_request') {
                const fId = String(n.from);
                if (followers.includes(fId)) return false;
            }
            return true;
        }).map(n => ({
            ...n,
            sender: {
                _id: n.from,
                username: n.fromUsername,
                profilePic: n.fromProfilePic
            }
        }));

        res.status(200).json(filteredNotifications.reverse());
    } catch (err) {
        console.error("Get notifications error:", err);
        res.status(500).json(err);
    }
});

// FOLLOW / UNFOLLOW Logic (FACEBOOK STYLE)
router.post("/:id/follow", verifyToken, async (req, res) => {
    if (req.user.id === req.params.id) {
        return res.status(403).json("You cannot follow yourself");
    }

    try {
        const targetUser = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!targetUser || !currentUser) return res.status(404).json("User not found");

        const targetId = req.params.id;
        const currentId = req.user.id;
        const io = req.app.get('io');

        // 1. UNFOLLOW IF ALREADY FOLLOWING
        if (targetUser.followers.map(id => id.toString()).includes(currentId)) {
            await targetUser.updateOne({ $pull: { followers: currentId } });
            await currentUser.updateOne({ $pull: { following: targetId } });

            const updatedTarget = await User.findById(targetId).select('-password');
            const updatedCurrent = await User.findById(currentId).select('-password');

            // 🔥 REAL-TIME SYNC: Emit updates for both users
            if (io) {
                io.emit('user.updated', updatedTarget);
                io.emit('user.updated', updatedCurrent);
            }

            return res.status(200).json({
                message: "Unfollowed",
                followers: updatedTarget.followers,
                following: updatedCurrent.following
            });
        }

        // 2. PRIVATE: send follow request
        const targetIsPrivate = !!(targetUser.isPrivate || targetUser.isFollowersOnly);
        if (targetIsPrivate) {
            const alreadyRequested = targetUser.followRequests?.some(id => String(id) === String(currentId));
            if (!alreadyRequested) {
                await targetUser.updateOne({
                    $addToSet: { followRequests: String(currentId) },
                    $push: {
                        notifications: {
                            $each: [{
                                type: 'follow_request',
                                from: String(currentId),
                                fromUsername: currentUser.username,
                                fromProfilePic: currentUser.profilePic,
                                read: false,
                                createdAt: new Date()
                            }],
                            $position: 0
                        }
                    }
                });

                // 🔥 REAL-TIME NOTIF
                if (io) {
                    io.to(String(targetId)).emit('notification.received', {
                        type: 'follow_request',
                        fromUsername: currentUser.username,
                        fromProfilePic: currentUser.profilePic
                    });
                }
            }
            return res.status(200).json({ message: "Request sent", requested: true, followers: targetUser.followers });
        }

        // 3. PUBLIC FOLLOW (INSTANT)
        await targetUser.updateOne({
            $addToSet: { followers: String(currentId) },
            $push: {
                notifications: {
                    $each: [{
                        type: 'follow',
                        from: String(currentId),
                        fromUsername: currentUser.username,
                        fromProfilePic: currentUser.profilePic,
                        read: false,
                        createdAt: new Date()
                    }],
                    $position: 0
                }
            }
        });

        // 🔥 REAL-TIME NOTIF
        if (io) {
            io.to(String(targetId)).emit('notification.received', {
                type: 'follow',
                fromUsername: currentUser.username,
                fromProfilePic: currentUser.profilePic
            });
        }
        await currentUser.updateOne({ $addToSet: { following: String(targetId) } });

        const updatedTarget = await User.findById(targetId).select('-password');
        const updatedCurrent = await User.findById(currentId).select('-password');

        // 🔥 REAL-TIME SYNC: Emit updates for both users
        if (io) {
            io.emit('user.updated', updatedTarget);
            io.emit('user.updated', updatedCurrent);
        }

        return res.status(200).json({
            message: "Followed",
            following: updatedCurrent.following,
            followers: updatedTarget.followers
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

// ACCEPT FOLLOW REQUEST
router.post("/requests/:requesterId/accept", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const requesterId = req.params.requesterId;
        const { notificationId } = req.body || {};
        const io = req.app.get('io');

        console.log(`[ACCEPT REQ] [LEGACY] User ${userId} processing acceptance of ${requesterId}`);

        if (!mongoose.Types.ObjectId.isValid(requesterId)) {
            return res.status(200).json({ status: "invalid_id_ignored" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json("Agent not found.");

        // Force cleanup regardless of request existence (to fix stuck notifications)
        await User.findByIdAndUpdate(userId, {
            $pull: {
                followRequests: requesterId,
                notifications: {
                    $or: [
                        { _id: notificationId },
                        { from: requesterId, type: 'follow_request' },
                        { from: new mongoose.Types.ObjectId(requesterId), type: 'follow_request' }
                    ]
                }
            }
        });

        // Add follower if not already following
        if (!user.followers?.some(id => String(id) === String(requesterId))) {
            await User.findByIdAndUpdate(userId, { $addToSet: { followers: String(requesterId) } });
        }

        // Update requester
        await User.findByIdAndUpdate(requesterId, {
            $addToSet: { following: String(userId) },
            $push: {
                notifications: {
                    type: 'follow_accepted',
                    from: String(userId),
                    fromUsername: user.username,
                    fromProfilePic: user.profilePic || '',
                    text: `Accepted your follow request.`,
                    read: false,
                    createdAt: new Date()
                }
            }
        });

        // 🔥 REAL-TIME SYNC: Emit updates for both users
        if (io) {
            io.to(String(requesterId)).emit('notification.received', {
                type: 'follow_accepted',
                fromUsername: user.username,
                fromProfilePic: user.profilePic
            });
            const updatedReq = await User.findById(requesterId).select('-password');
            const updatedMe = await User.findById(userId).select('-password');
            io.emit('user.updated', updatedReq);
            io.emit('user.updated', updatedMe);
        }

        const finalMe = await User.findById(userId).select('-password');
        res.status(200).json({
            message: "Request Accepted",
            notifications: finalMe.notifications,
            followers: finalMe.followers,
            following: finalMe.following,
            followRequests: finalMe.followRequests
        });
    } catch (err) {
        console.error("Accept Error", err);
        // IDEMPOTENCY: If it fails, return 200 anyway to allow UI to update (assuming it was already done)
        res.status(200).json({ message: "Request processed (idempotent)", error: err.message });
    }
});

// DECLINE FOLLOW REQUEST
router.post("/requests/:requesterId/decline", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const requesterId = req.params.requesterId;
        const io = req.app.get('io');

        // Always try to cleanup, even if request missing
        const updatedMe = await User.findByIdAndUpdate(userId, {
            $pull: {
                followRequests: requesterId,
                notifications: { from: requesterId, type: 'follow_request' }
            }
        }, { new: true }).select('-password');

        if (io) io.emit('user.updated', updatedMe);

        res.status(200).json({
            message: "Request Declined",
            notifications: updatedMe.notifications,
            followRequests: updatedMe.followRequests
        });
    } catch (err) { res.status(500).json(err); }
});

// REJECT (Alias for Decline if frontend uses 'reject')
router.post("/requests/:requesterId/reject", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const requesterId = req.params.requesterId ? String(req.params.requesterId).trim() : null;
        const io = req.app.get('io');

        // Always try to cleanup
        const updatedMe = await User.findByIdAndUpdate(userId, {
            $pull: {
                followRequests: requesterId,
                notifications: { from: requesterId, type: 'follow_request' }
            }
        }, { new: true }).select('-password');

        if (io) io.emit('user.updated', updatedMe);

        res.status(200).json({
            message: "Request Rejected",
            notifications: updatedMe.notifications,
            followRequests: updatedMe.followRequests
        });
    } catch (err) {
        res.status(200).json({ status: "ignored_error" });
    }
});

// Route moved below to fix conflict

// UPDATE USER SETTINGS (Privacy, Theme, Language)
router.put("/settings", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        if (!userId) return res.status(401).json("Unauthorized - Neural Interface missing");

        console.log('Settings update request:', req.body);

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
        ).select("-password");

        // SYNC ACROSS POSTS & COMMENTS
        const { username, profilePic } = updateData;
        if (username || profilePic) {
            const postUpdate = {};
            if (username) postUpdate["comments.$[elem].authorName"] = username;
            if (profilePic) postUpdate["comments.$[elem].authorProfilePic"] = profilePic;

            await Post.updateMany(
                { "comments.authorId": userId },
                { $set: postUpdate },
                { arrayFilters: [{ "elem.authorId": userId }] }
            );
        }

        console.log('Updated user:', updatedUser);

        // Sync to posts
        if (updateData.isPrivate !== undefined || updateData.isFollowersOnly !== undefined) {
            const pUpdate = {};
            if (updateData.isPrivate !== undefined) pUpdate.isPrivate = updateData.isPrivate;
            if (updateData.isFollowersOnly !== undefined) pUpdate.isFollowersOnly = updateData.isFollowersOnly;
            await Post.updateMany({ author: req.user.id }, { $set: pUpdate });
        }

        // Broadcast real-time update
        const io = req.app.get('io');
        if (io) io.emit('user.updated', updatedUser);

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error("Settings Update Error:", err);
        res.status(500).json(err);
    }
});

// HEARTBEAT (Online Status Update)
router.put("/heartbeat", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
        res.status(200).json("Heartbeat ACK");
    } catch (err) {
        res.status(500).json(err);
    }
});

// UPDATE USER (Moved here to avoid conflict with /settings)
router.put("/:id", verifyToken, async (req, res) => {
    if (req.user.id === req.params.id) {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { $set: req.body },
                { new: true }
            );

            // SYNC ACROSS POSTS & COMMENTS
            const userId = req.params.id;
            const { username, profilePic } = req.body;
            if (username || profilePic) {
                const postUpdate = {};
                if (username) postUpdate["comments.$[elem].authorName"] = username;
                if (profilePic) postUpdate["comments.$[elem].authorProfilePic"] = profilePic;

                await Post.updateMany(
                    { "comments.authorId": userId },
                    { $set: postUpdate },
                    { arrayFilters: [{ "elem.authorId": userId }] }
                );
            }

            // Broadcast real-time update
            const io = req.app.get('io');
            if (io) io.emit('user.updated', updatedUser);

            res.status(200).json(updatedUser);
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        return res.status(403).json("You can update only your account!");
    }
});

// GET USER BY ID (With Privacy Guard)
router.get("/find/:id", verifyToken, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json("Invalid Agent ID");
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("User not found");

        const { password, email, ...others } = user._doc;
        res.status(200).json({
            ...others,
            followRequests: user.followRequests || [],
            isRequested: user.followRequests?.some(id => String(id) === String(req.user?.id || req.user?.userId))
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

// DELETE NOTIFICATIONS
router.delete("/notifications", verifyToken, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $set: { notifications: [] }
        });
        res.status(200).json("Notifications cleared");
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
