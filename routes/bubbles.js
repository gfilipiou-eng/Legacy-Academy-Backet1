import express from "express";
import Bubble from "../models/Bubble.js";
import { verifyToken } from "../middleware/auth.js";
import User from "../models/User.js";

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

// POST create a new bubble
router.post("/", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.length > 100) {
      return res.status(400).json({ error: "Text must be between 1 and 100 characters." });
    }

    const newBubble = new Bubble({
      text,
      creator: req.user.id
    });

    const savedBubble = await newBubble.save();
    
    // Populate creator info before returning
    const populatedBubble = await Bubble.findById(savedBubble._id).populate("creator", "username profilePic");
    
    res.status(201).json(populatedBubble);
  } catch (err) {
    console.error("Error creating bubble:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
