import express from "express";
import Post from "../models/Post.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/**
 * CREATE POST (with image upload)
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      desc: req.body.desc,
      image: req.file.path,
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

/**
 * GET ALL POSTS
 */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;
