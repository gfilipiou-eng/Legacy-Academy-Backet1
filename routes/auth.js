import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * REGISTER
 */
router.post("/register", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json("User registered successfully ✅");
    } catch (err) {
        res.status(500).json(err);
    }
});

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: "User not found ❌" });

        const validPassword = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!validPassword)
            return res.status(400).json({ message: "Wrong password ❌" });

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
