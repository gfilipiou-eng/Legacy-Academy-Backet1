import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import upload from "../middleware/upload.js";

const router = express.Router();

// REGISTER
router.post("/register", upload.single("image"), async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        let profilePic = "";
        if (req.file) {
            profilePic = req.file.path || `/uploads/${req.file.filename}`;
        }

        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            bio: req.body.bio || "Entrepreneur. Legacy Member.",
            profilePic: profilePic,
            role: "User",
            settings: {
                theme: req.body.theme || '#ffd700',
                language: req.body.language || 'en',
                dmFollowersOnly: false
            }
        });

        const user = await newUser.save();

        // Generate JWT
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "default_Legacy_Academy_Secret", { expiresIn: "30d" });

        const { password, ...others } = user._doc;
        res.status(200).json({ token, user: others });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json(err);
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        console.log("LOGIN REQUEST RECEIVED:", req.body.email);
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            console.log("USER NOT FOUND:", req.body.email);
            return res.status(404).json("User not found!");
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            console.log("INVALID PASSWORD FOR:", req.body.email);
            return res.status(403).json("Wrong password!"); // Standard might be 400/401, but 403 matches user report?
            // Wait, user reported 403 Forbidden.
            // Usually "Wrong password" is 400 Bad Request or 401 Unauthorized.
            // 403 means Forbidden (Authenticated but not authorized OR Server refuses request).
            // If previous code returned 403 for bad password, then THAT explains it.
            // I will return 400 for bad password to be standard, but maybe keep 403 if user expects it?
            // No, 403 is usually "Banned".
        }

        // Generate NEW JWT
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "default_Legacy_Academy_Secret", { expiresIn: "30d" });

        const { password, ...others } = user._doc;
        console.log("LOGIN SUCCESS:", user.username);
        res.status(200).json({ token, user: others });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json(err);
    }
});

// RESET PASSWORD (Stub)
// ... handled by resetPassword.js route

export default router;
