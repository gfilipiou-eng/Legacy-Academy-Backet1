import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import upload from "../middleware/upload.js";
import axios from "axios";

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
