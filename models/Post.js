import express from "express";
import Post from "../models/Post.js";
import upload from "../middleware/multer.js"; // Το middleware που φτιάξαμε πριν

const router = express.Router();

// 1. Δημιουργία Post (Create)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      desc: req.body.desc,
      image: req.file ? req.file.path : "", // Παίρνει το URL από το Cloudinary
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία του post", error: err });
  }
});

// 2. Λήψη όλων των Posts (Read All)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }); // Τα νεότερα πρώτα
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. Λήψη συγκεκριμένου Post (Read Single)
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Το post δεν βρέθηκε");
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. Διαγραφή Post (Delete)
router.delete("/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json("Το post διαγράφηκε επιτυχώς");
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;