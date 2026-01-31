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
 * GET ALL POSTS - Pretty HTML view for browser
 */
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    console.log("Posts from DB:", posts); // 👈 Debug log

    let html = `
      <html>
      <head>
        <title>Legacy Academy Posts</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            min-height: 100vh;
          }
          .container { max-width: 1000px; margin: 0 auto; }
          h1 { 
            color: white; 
            text-align: center; 
            margin-bottom: 40px; 
            font-size: 2.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          .posts-count {
            color: rgba(255,255,255,0.9);
            text-align: center;
            margin-bottom: 30px;
            font-size: 1.1rem;
          }
          .post { 
            background: white;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .post:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 12px rgba(0,0,0,0.2);
          }
          .post img { 
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin-bottom: 15px;
          }
          .post h2 { 
            color: #333;
            margin-bottom: 12px;
            font-size: 1.8rem;
          }
          .post p { 
            color: #666;
            line-height: 1.6;
            font-size: 1rem;
          }
          .post-meta {
            color: #999;
            font-size: 0.9rem;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #eee;
          }
          .api-link {
            text-align: center;
            margin-top: 30px;
          }
          .api-link a {
            color: white;
            text-decoration: none;
            background: rgba(255,255,255,0.2);
            padding: 10px 20px;
            border-radius: 6px;
            transition: background 0.2s;
          }
          .api-link a:hover {
            background: rgba(255,255,255,0.3);
          }
          .empty-state {
            text-align: center;
            color: white;
            padding: 60px 20px;
            font-size: 1.2rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏆 Legacy Academy Posts</h1>
          ${posts.length > 0 ? `
            <div class="posts-count">Σύνολο Posts: ${posts.length}</div>
            ${posts.map(post => `
              <div class="post">
                <h2>${post.title}</h2>
                <img src="${post.image}" alt="${post.title}" onerror="this.src='https://via.placeholder.com/600x300?text=Image+Not+Available'" />
                <p>${post.desc}</p>
                <div class="post-meta">
                  📅 Δημιουργήθηκε: ${new Date(post.createdAt).toLocaleDateString('el-GR')}
                </div>
              </div>
            `).join("")}
          ` : `
            <div class="empty-state">
              <p>📭 Δεν υπάρχουν posts ακόμα.</p>
              <p style="margin-top: 20px; font-size: 1rem;">Τρέξε <code style="background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 4px;">npm run seed</code> για να δημιουργήσεις sample posts.</p>
            </div>
          `}
          <div class="api-link">
            <a href="/api/posts/json" target="_blank">📄 View Raw JSON API</a>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
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
