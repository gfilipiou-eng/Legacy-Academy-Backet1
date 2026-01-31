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

export default router;
