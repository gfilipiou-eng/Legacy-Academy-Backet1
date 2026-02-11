import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET ALL USERS (Search)
router.get("/", verifyToken, async (req, res) => {
    try {
        const users = await User.find().select('username role profilePic isPrivate followers following followRequests bio');
        const mappedUsers = users.map(u => ({
            ...u._doc,
            followRequests: u.followRequests || []
        }));
        res.status(200).json(mappedUsers);
    } catch (err) {
        res.status(500).json([]);
    }
});

// GET NOTIFICATIONS
router.get("/notifications", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json("User not found");
        res.status(200).json(user.notifications.reverse());
    } catch (err) {
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

        // 1. UNFOLLOW IF ALREADY FOLLOWING
        if (targetUser.followers.map(id => id.toString()).includes(currentId)) {
            await targetUser.updateOne({ $pull: { followers: currentId } });
            await currentUser.updateOne({ $pull: { following: targetId } });
            return res.status(200).json({
                message: "Unfollowed",
                followers: targetUser.followers.filter(id => id.toString() !== currentId)
            });
        }

        // 2. PRIVATE: send follow request
        const targetIsPrivate = !!(targetUser.isPrivate || targetUser.isFollowersOnly);
        if (targetIsPrivate) {
            const alreadyRequested = targetUser.followRequests?.some(id => String(id) === String(currentId));
            if (!alreadyRequested) {
                await targetUser.updateOne({
                    $addToSet: { followRequests: currentId },
                    $push: {
                        notifications: {
                            $each: [{
                                type: 'follow_request',
                                from: currentId,
                                fromUsername: currentUser.username,
                                fromProfilePic: currentUser.profilePic,
                                read: false,
                                createdAt: new Date()
                            }],
                            $position: 0
                        }
                    }
                });
            }
            return res.status(200).json({ message: "Request sent", requested: true, followers: targetUser.followers });
        }

        // 3. PUBLIC FOLLOW (INSTANT)
        await targetUser.updateOne({
            $addToSet: { followers: currentId },
            $push: {
                notifications: {
                    $each: [{
                        type: 'follow',
                        from: currentId,
                        fromUsername: currentUser.username,
                        fromProfilePic: currentUser.profilePic,
                        read: false,
                        createdAt: new Date()
                    }],
                    $position: 0
                }
            }
        });
        await currentUser.updateOne({ $addToSet: { following: targetId } });
        return res.status(200).json({ message: "Followed", following: [...currentUser.following, targetId] });
    } catch (err) {
        res.status(500).json(err);
    }
});

// ACCEPT FOLLOW REQUEST
router.post("/requests/:requesterId/accept", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const requesterId = req.params.requesterId;

        if (!mongoose.Types.ObjectId.isValid(requesterId)) {
            return res.status(200).json({ status: "invalid_id_ignored" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json("Agent not found.");

        const hasRequest = user.followRequests?.some(id => String(id) === String(requesterId));
        if (!hasRequest) {
            // Already follower?
            if (user.followers?.some(id => String(id) === String(requesterId))) {
                return res.status(200).json("Already a follower.");
            }
            return res.status(200).json("Request no longer active");
        }

        // 1. Update self
        await User.findByIdAndUpdate(userId, {
            $pull: {
                followRequests: requesterId,
                notifications: { from: new mongoose.Types.ObjectId(String(requesterId)), type: 'follow_request' }
            },
            $addToSet: { followers: requesterId }
        });

        // 2. Update requester
        await User.findByIdAndUpdate(requesterId, {
            $addToSet: { following: userId },
            $push: {
                notifications: {
                    type: 'follow_accepted',
                    from: userId,
                    fromUsername: user.username,
                    fromProfilePic: user.profilePic || '',
                    text: `Accepted your follow request.`,
                    read: false,
                    createdAt: new Date()
                }
            }
        });

        res.status(200).json("Request Accepted");
    } catch (err) {
        console.error("Accept Error", err);
        res.status(500).json(err);
    }
});

// DECLINE FOLLOW REQUEST
router.post("/requests/:requesterId/decline", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const requesterId = req.params.requesterId;
        await User.findByIdAndUpdate(userId, {
            $pull: {
                followRequests: requesterId,
                notifications: { from: new mongoose.Types.ObjectId(String(requesterId)), type: 'follow_request' }
            }
        });
        res.status(200).json("Request Declined");
    } catch (err) { res.status(500).json(err); }
});

// REJECT (Alias for Decline if frontend uses 'reject')
router.post("/requests/:requesterId/reject", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const requesterId = req.params.requesterId;
        await User.findByIdAndUpdate(userId, {
            $pull: {
                followRequests: requesterId,
                notifications: { from: new mongoose.Types.ObjectId(String(requesterId)), type: 'follow_request' }
            }
        });
        res.status(200).json("Request Rejected");
    } catch (err) { res.status(500).json(err); }
});

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

        console.log('Update data:', updateData);

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true }
        ).select("-password");

        console.log('Updated user:', updatedUser);

        // Sync to posts
        if (updateData.isPrivate !== undefined || updateData.isFollowersOnly !== undefined) {
            const pUpdate = {};
            if (updateData.isPrivate !== undefined) pUpdate.isPrivate = updateData.isPrivate;
            if (updateData.isFollowersOnly !== undefined) pUpdate.isFollowersOnly = updateData.isFollowersOnly;
            await Post.updateMany({ author: req.user.id }, { $set: pUpdate });
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error("Settings Update Error:", err);
        res.status(500).json(err);
    }
});

// GET USER BY ID (With Privacy Guard)
router.get("/find/:id", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("User not found");

        const { password, email, ...others } = user._doc;
        res.status(200).json({
            ...others,
            followRequests: user.followRequests || [],
            isRequested: false
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
