import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// 1. Λήψη στοιχείων χρήστη (π.χ. για το Profile Page)
router.get("/find/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const { password, ...others } = user._doc; // Φιλτράρουμε το password
        res.status(200).json(others);
    } catch (err) {
        res.status(500).json("Χρήστης δεν βρέθηκε.");
    }
});

// 2. Λήψη όλων των posts ενός συγκεκριμένου χρήστη
router.get("/posts/:userId", async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 3. Update User (Προαιρετικό - π.χ. για Profile Picture στο μέλλον)
router.put("/:id", verifyToken, async (req, res) => {
    if (req.params.id === req.user.id) {
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
        res.status(403).json("Μπορείτε να ενημερώσετε μόνο τον δικό σας λογαριασμό!");
    }
});

// 4. DELETE USER ACCOUNT (The Danger Zone)
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const user = req.user;
        // Only allow users to delete their own account or Founder to delete anyone
        if (req.params.id !== (user.id || user.userId) && user.role !== 'Founder') {
            return res.status(403).json("Μπορείτε να διαγράψετε μόνο τον δικό σας λογαριασμό!");
        }

        // 1. Delete all posts by this user
        await Post.deleteMany({ author: req.params.id });

        // 2. Delete the user
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json("Ο λογαριασμός και όλα τα posts διαγράφηκαν οριστικά.");
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;

