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
        if (!user) return res.status(404).json("User not found ❌");

        const validPassword = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!validPassword)
            return res.status(400).json("Wrong password ❌");

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET
        );

        res.json({ token, user });
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
