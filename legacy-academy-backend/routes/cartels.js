import express from "express";
import Cartel from "../models/Cartel.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// CREATE CARTEL
router.post("/", verifyToken, async (req, res) => {
    try {
        const { name, description, image, coverImage } = req.body;
        
        // Ensure name is unique
        const existing = await Cartel.findOne({ name });
        if (existing) {
            return res.status(400).json("Cartel name already exists!");
        }

        const newCartel = new Cartel({
            name,
            description,
            image,
            coverImage,
            creator: req.user.id,
            members: [req.user.id] // Creator joins automatically
        });

        const savedCartel = await newCartel.save();
        res.status(200).json(savedCartel);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET ALL CARTELS (EXPLORE)
router.get("/", verifyToken, async (req, res) => {
    try {
        const cartels = await Cartel.find()
            .populate("creator", "username profilePic")
            .sort({ createdAt: -1 });
        res.status(200).json(cartels);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET A CARTEL
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const cartel = await Cartel.findById(req.params.id)
            .populate("creator", "username profilePic")
            .populate("members", "username profilePic role");
        res.status(200).json(cartel);
    } catch (err) {
        res.status(500).json(err);
    }
});

// JOIN / LEAVE CARTEL
router.post("/:id/join", verifyToken, async (req, res) => {
    try {
        const cartel = await Cartel.findById(req.params.id);
        if (!cartel) return res.status(404).json("Cartel not found");

        if (cartel.members.includes(req.user.id)) {
            // Leave
            await cartel.updateOne({ $pull: { members: req.user.id } });
            res.status(200).json("Left cartel");
        } else {
            // Join
            await cartel.updateOne({ $push: { members: req.user.id } });
            res.status(200).json("Joined cartel");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET POSTS IN A CARTEL
router.get("/:id/posts", verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const posts = await Post.find({ cartelId: req.params.id })
            .populate("author", "username profilePic role isPrivate isFollowersOnly followers settings")
            .populate("repostedBy", "username profilePic role isPrivate isFollowersOnly followers settings")
            .populate("comments.user", "username profilePic role settings")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
            
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;
