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
      image: req.file ? req.file.path : "",
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία του post", error: err });
  }
});

/**
 * GET ALL POSTS
 */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    console.log("Posts from DB:", posts); // 👈 Debug log
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

/**
 * GET SINGLE POST
 */
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Το post δεν βρέθηκε");
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

/**
 * DELETE POST
 */
router.delete("/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json("Το post διαγράφηκε επιτυχώς");
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;
