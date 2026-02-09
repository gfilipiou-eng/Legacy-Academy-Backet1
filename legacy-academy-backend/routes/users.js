import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// GET ALL USERS (Search)
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select('username role profilePic isPrivate followers following requests bio');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json([]);
    }
});

// GET USER BY ID
router.get("/find/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("User not found");
        const { password, ...others } = user._doc;
        res.status(200).json(others);
    } catch (err) {
        res.status(500).json(err);
    }
});

// FOLLOW / UNFOLLOW Logic
router.post("/:id/follow", verifyToken, async (req, res) => {
    if (req.user.id === req.params.id) {
        return res.status(403).json("You cannot follow yourself");
    }

    try {
        const targetUser = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!targetUser || !currentUser) return res.status(404).json("User not found");

        // UNFOLLOW / CANCEL REQUEST CHECK
        if (targetUser.followers.includes(req.user.id)) {
            // Already following -> Unfollow
            await targetUser.updateOne({ $pull: { followers: req.user.id } });
            await currentUser.updateOne({ $pull: { following: req.params.id } });
            return res.status(200).json({ message: "Unfollowed" });
        }

        if (targetUser.requests && targetUser.requests.includes(req.user.id)) {
            // Request pending -> Cancel Request
            await targetUser.updateOne({ $pull: { requests: req.user.id } });
            return res.status(200).json({ message: "Request Cancelled" });
        }

        // FOLLOW ACTION
        if (targetUser.isPrivate) {
            // PRIVATE -> Send Request
            await targetUser.updateOne({
                $push: {
                    requests: req.user.id,
                    notifications: {
                        type: 'follow', // technically 'request'
                        from: req.user.id,
                        fromUsername: currentUser.username,
                        fromProfilePic: currentUser.profilePic,
                        read: false
                    }
                }
            });
            return res.status(200).json({ message: "Request Sent" });
        } else {
            // PUBLIC -> Follow Directly
            await targetUser.updateOne({
                $push: {
                    followers: req.user.id,
                    notifications: {
                        type: 'follow',
                        from: req.user.id,
                        fromUsername: currentUser.username,
                        fromProfilePic: currentUser.profilePic,
                        read: false
                    }
                }
            });
            await currentUser.updateOne({ $push: { following: req.params.id } });
            return res.status(200).json({ message: "Followed" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// ACCEPT FOLLOW REQUEST
// Route likely matched by frontend: /api/users/requests/:requesterId/accept
router.post("/requests/:requesterId/accept", verifyToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const requesterId = req.params.requesterId;

        if (!currentUser.requests.includes(requesterId)) {
            return res.status(403).json("Authorization failed: No request found in logs.");
        }

        // Move from requests to followers
        await currentUser.updateOne({
            $pull: { requests: requesterId },
            $push: { followers: requesterId }
        });

        // Add current user to requester's following
        const requester = await User.findById(requesterId);
        await requester.updateOne({ $push: { following: req.user.id } });

        res.status(200).json("Request Accepted");
    } catch (err) {
        res.status(500).json(err);
    }
});

// DECLINE FOLLOW REQUEST
router.post("/requests/:requesterId/decline", verifyToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const requesterId = req.params.requesterId;

        if (!currentUser.requests.includes(requesterId)) {
            return res.status(403).json("No request found");
        }

        await currentUser.updateOne({ $pull: { requests: requesterId } });
        res.status(200).json("Request Declined");
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
