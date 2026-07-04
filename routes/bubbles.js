import express from "express";
import Bubble from "../models/Bubble.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// GET all active bubbles
router.get("/", verifyToken, async (req, res) => {
  try {
    const bubbles = await Bubble.find().populate("creator", "username profilePic");
    res.status(200).json(bubbles);
  } catch (err) {
    console.error("Error fetching bubbles:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST a new bubble
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Text is required" });
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.path;
    }

    const newBubble = new Bubble({
      text: text.trim(),
      image: imageUrl,
      creator: req.user.id || req.user.userId,
      fromUsername: req.user.username,
      fromProfilePic: req.user.profilePic || ""
    });

    const savedBubble = await newBubble.save();
    res.status(201).json(savedBubble);
  } catch (err) {
    console.error("Error creating bubble:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE a bubble
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const bubble = await Bubble.findById(req.params.id);
    if (!bubble) {
      return res.status(404).json({ error: "Bubble not found" });
    }
    
    // Check if the user is the creator
    if (bubble.creator.toString() !== (req.user.id || req.user.userId)) {
      return res.status(403).json({ error: "You can only delete your own bubbles" });
    }
    
    await bubble.deleteOne();
    res.status(200).json({ message: "Bubble deleted successfully" });
  } catch (err) {
    console.error("Error deleting bubble:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
