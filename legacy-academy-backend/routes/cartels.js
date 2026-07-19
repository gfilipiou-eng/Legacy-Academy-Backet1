import express from "express";
import Cartel from "../models/Cartel.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// CREATE CARTEL
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
    try {
        const { name, description, coverImage, pin } = req.body;
        let image = req.body.image || "";
        if (req.file) { image = req.file.path; }
        
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
            pin: pin || "",
            isPrivate: !!pin,
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
        const cartels = await Cartel.find().select("-pin")
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
        const cartel = await Cartel.findById(req.params.id).select("-pin")
            .populate("creator", "username profilePic")
            .populate("members", "username profilePic role");
        res.status(200).json(cartel);
    } catch (err) {
        res.status(500).json(err);
    }
});


// DELETE CARTEL
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const cartel = await Cartel.findById(req.params.id);
        if (!cartel) return res.status(404).json("Cartel not found");

        if (cartel.creator.toString() !== req.user.id && req.user.role !== 'Founder') {
            return res.status(403).json("You can only delete your own cartel");
        }

        await Post.deleteMany({ cartelId: cartel._id });
        await cartel.deleteOne();
        res.status(200).json("Cartel deleted successfully");
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
            const { pin } = req.body;
            if (cartel.isPrivate && cartel.pin) {
                if (cartel.pin !== pin) {
                    return res.status(403).json("Invalid PIN. Access denied.");
                }
            }
            await cartel.updateOne({ $push: { members: req.user.id } });
            res.status(200).json("Joined cartel");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});
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
        // Check if user is a member
        const cartel = await Cartel.findById(req.params.id);
        if (!cartel) return res.status(404).json("Cartel not found");
        if (!cartel.members.includes(req.user.id) && req.user.role !== 'Founder') {
            return res.status(403).json("Intel is encrypted. You must be a member of this cartel to view its posts.");
        }

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
