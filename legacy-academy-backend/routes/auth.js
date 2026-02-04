import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import upload from "../middleware/upload.js"; // Import upload middleware

const router = express.Router();

/**
 * REGISTER
 */
// Safe Upload Middleware Wrapper
const safeUpload = (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err) {
            console.error("Upload Middleware Error (Ignored for Register):", err.message);
            // We continue without a file if upload fails (e.g. Cloudinary missing)
            // But if it's a critical multer error, we might want to warn.
            // For now, let's allow registration to proceed without image.
            return next();
        }
        next();
    });
};

router.post("/register", safeUpload, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Format profile pic path if uploaded
        let profilePicPath = "";
        if (req.file && req.file.path) {
            profilePicPath = req.file.path;
            // Normalize local storage paths
            if (profilePicPath.startsWith('uploads')) {
                profilePicPath = '/' + profilePicPath.replace(/\\/g, '/');
            }
        }

        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            profilePic: profilePicPath,
            isPrivate: req.body.isPrivate === 'true' || req.body.isPrivate === true,
            isFollowersOnly: req.body.isFollowersOnly === 'true' || req.body.isFollowersOnly === true,
            settings: {
                theme: 'gold',
                language: 'en',
                soundEnabled: true,
                notifications: true,
                notificationSound: req.body.notificationSound || 'pop'
            }
        });

        const savedUser = await newUser.save();

        // Auto-login: Generate Token
        const token = jwt.sign(
            {
                id: savedUser._id,
                username: savedUser.username,
                role: savedUser.role || 'User'
            },
            process.env.JWT_SECRET || 'legacysecret123'
        );

        const { password, ...userData } = savedUser._doc;

        res.status(201).json({
            message: "User registered successfully ✅",
            token,
            user: { ...userData, id: savedUser._id }
        });

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json(err);
    }
});

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            console.log(`Login failed: User ${req.body.email} not found`);
            return res.status(404).json({ message: "User not found ❌" });
        }

        const validPassword = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!validPassword) {
            console.log(`Login failed for ${req.body.email}: Password mismatch`);
            return res.status(400).json({ message: "Wrong password ❌" });
        }

        // Ban Check
        if (user.isBanned && user.banExpires && new Date() < user.banExpires) {
            const timeLeft = Math.ceil((new Date(user.banExpires) - new Date()) / (1000 * 60 * 60 * 24));
            return res.status(403).json({
                message: `Your access is suspended for ${timeLeft} more days. Reason: ${user.banReason || 'Suspicious Activity'}`
            });
        }

        // Include username and role in the JWT
        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                role: user.role || 'User'
            },
            process.env.JWT_SECRET || 'legacysecret123'
        );

        // Return user without password
        const { password, ...userData } = user._doc;

        res.json({
            token,
            user: {
                ...userData,
                _id: user._id,
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role || 'User'
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * FORGOT PASSWORD - Request Reset
 */
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal if email exists for security
            return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
        }

        // Generate reset token
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + 3600000; // 1 hour

        // Save token to user
        user.resetToken = resetToken;
        user.resetTokenExpiry = tokenExpiry;
        await user.save();

        // Send email
        try {
            const { sendPasswordResetEmail } = await import('../config/email.js');
            await sendPasswordResetEmail(email, resetToken, user.username);
            res.status(200).json({ success: true, message: "Password reset email sent successfully! ✅" });
        } catch (emailError) {
            console.error("Email send failed:", emailError);
            res.status(200).json({ success: true, message: "Reset initiated. Check your email." });
        }
    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * RESET PASSWORD - Confirm Reset
 */
router.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token ❌" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "Password reset successful! ✅ You can now login." });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
