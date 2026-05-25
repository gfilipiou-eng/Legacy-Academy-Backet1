import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import upload from "../middleware/upload.js";
import axios from "axios";
import crypto from "crypto";

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
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: "Agent not found." });

        if (!user.password) {
            return res.status(400).json({ message: "Please use Google Sign-In for this account." });
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).json("Invalid clearance codes.");

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "default_Legacy_Academy_Secret", { expiresIn: '30d' });

        const { password, ...others } = user._doc;
        res.status(200).json({ user: others, token });
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
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + 3600000; // 1 hour

        // Save token to user
        user.resetToken = resetToken;
        user.resetTokenExpiry = tokenExpiry;
        await user.save();

        // Send email
        try {
            // Import email module using absolute path to ensure resolution
            const { sendPasswordResetEmail } = await import('../utils/email.js');
            await sendPasswordResetEmail(email, resetToken, user.username);
            res.status(200).json({ success: true, message: "Password reset email sent successfully!" });
        } catch (emailError) {
            console.error("Email send failed:", emailError.message);
            // If it's a configuration error, let the frontend know for debugging
            if (emailError.message.includes('missing')) {
                return res.status(200).json({ success: true, message: "Email configuration missing on server. Check Render env variables." });
            }
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
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "Password reset successful! You can now login." });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// GOOGLE AUTHENTICATION
router.post("/google", async (req, res) => {
    try {
        const { idToken, email, name, picture } = req.body;
        
        let userEmail = email;
        let userName = name;
        let userPicture = picture;

        // Verify with Google if idToken is provided
        if (idToken) {
            try {
                const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
                if (googleRes.data && googleRes.data.email) {
                    userEmail = googleRes.data.email;
                    userName = googleRes.data.name || googleRes.data.given_name || userName;
                    userPicture = googleRes.data.picture || userPicture;
                }
            } catch (err) {
                console.error("Google Token Verification Failed, falling back to body:", err.message);
                if (!userEmail) {
                    return res.status(400).json("Invalid Google Token!");
                }
            }
        }

        if (!userEmail) {
            return res.status(400).json("Google Email is required!");
        }

        // Check if user exists
        let user = await User.findOne({ email: userEmail });

        if (!user) {
            // Register new user with Google info
            const salt = await bcrypt.genSalt(10);
            const randomPassword = Math.random().toString(36).slice(-10); // generate random strong password
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            // Generate a unique clean username
            let baseUsername = (userName || userEmail.split("@")[0])
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "")
                .slice(0, 15);
            if (baseUsername.length < 3) baseUsername = "agent" + Math.floor(100 + Math.random() * 900);
            
            let finalUsername = baseUsername;
            let count = 1;
            while (await User.findOne({ username: finalUsername })) {
                finalUsername = `${baseUsername}${count}`;
                count++;
            }

            const newUser = new User({
                username: finalUsername,
                email: userEmail,
                password: hashedPassword,
                bio: "Operative active. Authorized via Secure Google Protocol.",
                profilePic: userPicture || "",
                role: "User",
                settings: {
                    theme: '#ffd700',
                    language: 'en',
                    dmFollowersOnly: false
                }
            });

            user = await newUser.save();
        }

        // Generate JWT
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "default_Legacy_Academy_Secret", { expiresIn: "30d" });

        const { password, ...others } = user._doc;
        res.status(200).json({ token, user: others });
    } catch (err) {
        console.error("GOOGLE AUTH ERROR:", err);
        res.status(500).json(err);
    }
});

// RESET PASSWORD (Stub)
// ... handled by resetPassword.js route

export default router;
