import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET ALL USERS (Search)
router.get("/", verifyToken, async (req, res) => {
    try {
        const users = await User.find().select('username role profilePic isPrivate followers following requests bio');
        const mappedUsers = users.map(u => ({
            ...u._doc,
            followRequests: u.requests || []
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

        // 2. CANCEL REQUEST IF PENDING
        if (targetUser.requests && targetUser.requests.map(id => id.toString()).includes(currentId)) {
            await targetUser.updateOne({ $pull: { requests: currentId } });
            await targetUser.updateOne({ $pull: { notifications: { type: 'follow_request', from: currentId } } });
            return res.status(200).json({ message: "Request Cancelled", isRequested: false });
        }

        // 3. START FOLLOW / SEND REQUEST
        if (targetUser.isPrivate) {
            await targetUser.updateOne({
                $addToSet: { requests: currentId },
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
            return res.status(200).json({ message: "Requested", isRequested: true, isPrivate: true });
        } else {
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
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// ACCEPT FOLLOW REQUEST
router.post("/requests/:requesterId/accept", verifyToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const requesterId = req.params.requesterId;

        if (!currentUser) return res.status(404).json("User not found");

        // Idempotency: If already following, return success
        if (currentUser.followers.map(id => id.toString()).includes(requesterId)) {
            return res.status(200).json("Request already accepted");
        }

        // If not in requests, return success anyway (to clear UI) instead of 403
        if (!currentUser.requests.map(id => id.toString()).includes(requesterId)) {
            // return res.status(403).json("Authorization failed: No request found in logs.");
            return res.status(200).json("Request no longer active");
        }

        // Move from requests to followers
        await currentUser.updateOne({
            $pull: { requests: requesterId },
            $addToSet: { followers: requesterId }
        });

        // Add current user to requester's following list
        await User.findByIdAndUpdate(requesterId, {
            $addToSet: { following: req.user.id },
            $push: {
                notifications: {
                    type: 'follow_accepted', // Optional: Notify them they were accepted
                    from: req.user.id,
                    fromUsername: currentUser.username,
                    fromProfilePic: currentUser.profilePic,
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
        const currentUser = await User.findById(req.user.id);
        const requesterId = req.params.requesterId;

        // Just pull it, doesn't matter if it exists or not
        await currentUser.updateOne({ $pull: { requests: requesterId } });

        // Also remove notification if possible
        await currentUser.updateOne({ $pull: { notifications: { type: 'follow_request', from: requesterId } } });

        res.status(200).json("Request Declined");
    } catch (err) {
        res.status(500).json(err);
    }
});

// REJECT (Alias for Decline if frontend uses 'reject')
router.post("/requests/:requesterId/reject", verifyToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const requesterId = req.params.requesterId;
        await currentUser.updateOne({ $pull: { requests: requesterId } });
        await currentUser.updateOne({ $pull: { notifications: { type: 'follow_request', from: requesterId } } });
        res.status(200).json("Request Rejected");
    } catch (err) {
        res.status(500).json(err);
    }
});

// UPDATE USER SETTINGS (Privacy, Theme, Language)
router.put("/settings", verifyToken, async (req, res) => {
    try {
        const { isPrivate, isFollowersOnly, settings, bio, profilePic } = req.body;
        const updateData = {};

        if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
        if (isFollowersOnly !== undefined) updateData.isFollowersOnly = isFollowersOnly;
        if (bio !== undefined) updateData.bio = bio;
        if (profilePic !== undefined) updateData.profilePic = profilePic;

        // Nested settings support
        if (settings) {
            const user = await User.findById(req.user.id);
            updateData.settings = { ...(user.settings || {}), ...settings };
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true }
        ).select("-password");

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

        // CHECK PRIVACY
        const isSelf = String(req.user.id) === String(user._id);
        const isFollower = user.followers.map(id => String(id)).includes(String(req.user.id));
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'Founder';

        if (user.isPrivate && !isSelf && !isFollower && !isAdmin) {
            // Scrub sensitive info for private accounts
            return res.status(200).json({
                ...others,
                followers: user.followers.length,
                following: user.following.length,
                followRequests: user.requests || [], // Map for frontend
                isRequested: user.requests?.map(id => String(id)).includes(String(req.user.id)),
                isPrivate: true,
                isLocked: true // Frontend signal
            });
        }

        res.status(200).json({
            ...others,
            followRequests: user.requests || [],
            isRequested: user.requests?.map(id => String(id)).includes(String(req.user.id))
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
