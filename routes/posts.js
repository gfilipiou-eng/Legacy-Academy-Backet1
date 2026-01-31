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
 * GET ALL POSTS - Pretty HTML view
 */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });

    // Count total posts
    const total = posts.length;

    let html = `
      <html>
      <head>
        <title>Legacy Academy Posts</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f4f4f4; color: #333; }
          .container { max-width: 800px; margin: 0 auto; }
          h1 { text-align: center; color: #222; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 30px; font-size: 1.1em; }
          .post { background: white; border: 1px solid #ddd; padding: 20px; margin-bottom: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .post img { max-width: 100%; height: auto; display: block; margin: 15px 0; border-radius: 8px; }
          .post h2 { margin: 0 0 10px 0; color: #111; font-size: 1.8em; }
          .post p { line-height: 1.6; color: #444; margin-bottom: 10px; }
          .meta { font-size: 0.9em; color: #888; border-top: 1px solid #eee; padding-top: 10px; margin-top: 15px; }
          .nav { text-align: center; margin-top: 40px; padding: 20px; border-top: 1px solid #ddd; }
          .nav a { text-decoration: none; color: #fff; background: #0077cc; padding: 10px 20px; border-radius: 5px; transition: background 0.2s; }
          .nav a:hover { background: #005fa3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Legacy Academy Posts</h1>
          <p class="subtitle">Total posts: ${total}</p>
          
          ${posts.map(post => `
            <div class="post">
              <h2>${post.title}</h2>
              <img src="${post.image}" alt="${post.title}" onerror="this.src='https://via.placeholder.com/600x300?text=No+Image'" />
              <p>${post.desc}</p>
              <div class="meta">
                📅 Created: ${new Date(post.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          `).join("")}
          
          <div class="nav">
            <a href="/api/posts/json" target="_blank">📄 View Raw JSON API</a>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    res.status(500).send("Error fetching posts: " + err.message);
  }
});

/**
 * GET ALL POSTS - Raw JSON for API clients
 */
router.get("/json", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts", error: err });
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
