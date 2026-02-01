import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get all users
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select('username role profilePic createdAt');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json([]);
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
        // Σύμφωνα με το Post.js, το field είναι 'author'
        const posts = await Post.find({ author: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 3. Update User
router.put("/:id", verifyToken, async (req, res) => {
    // Χρησιμοποιούμε req.user.id ή req.user.userId ανάλογα με το τι στέλνει το middleware
    const currentUserId = req.user.id || req.user.userId;

    if (req.params.id === currentUserId || req.user.role === 'Founder') {
        try {
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
        res.status(403).json("Δεν έχετε άδεια για αυτή την ενέργεια!");
    }
});

// 4. DELETE USER ACCOUNT
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const currentUserId = req.user.id || req.user.userId;

        // Έλεγχος αν είναι ο ίδιος ο χρήστης ή ο Founder
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

// FOLLOW a user
router.put("/:id/follow", verifyToken, async (req, res) => {
    try {
        const currentUserId = req.user.id || req.user.userId;
        if (req.params.id === currentUserId) {
            return res.status(400).json("You cannot follow yourself");
        }

        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(currentUserId);

        if (!userToFollow || !currentUser) {
            return res.status(404).json("User not found");
        }

        if (!userToFollow.followers.includes(currentUserId)) {
            // Follow
            await userToFollow.updateOne({ $push: { followers: currentUserId } });
            await currentUser.updateOne({ $push: { following: req.params.id } });
            res.status(200).json({
                message: "Followed",
                followers: userToFollow.followers.length + 1,
                isFollowing: true
            });
        } else {
            // Unfollow
            await userToFollow.updateOne({ $pull: { followers: currentUserId } });
            await currentUser.updateOne({ $pull: { following: req.params.id } });
            res.status(200).json({
                message: "Unfollowed",
                followers: userToFollow.followers.length - 1,
                isFollowing: false
            });
        }
    } catch (err) {
        res.status(500).json(err);
    }
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

export default router;
