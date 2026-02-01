import express from "express";
import User from "../models/User.js";
import Post from "../models/Post.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

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

export default router;
