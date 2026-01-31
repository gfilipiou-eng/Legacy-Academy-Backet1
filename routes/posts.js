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
    const total = posts.length;

    let html = `
      <html>
      <head>
        <title>Legacy Academy Posts</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f4f4f4; 
            color: #333; 
          }
          .container { max-width: 800px; margin: 0 auto; }
          h1 { text-align: center; color: #222; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 20px; font-size: 1.1em; }
          
          /* Search Bar Styles */
          .search-wrapper {
            text-align: center;
            margin-bottom: 30px;
          }
          #searchInput {
            padding: 12px 20px;
            width: 100%;
            max-width: 400px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 25px;
            outline: none;
            transition: all 0.3s;
          }
          #searchInput:focus {
            border-color: #0077cc;
            box-shadow: 0 0 8px rgba(0, 119, 204, 0.2);
          }
          
          .post { 
            background: white; 
            border: 1px solid #ddd; 
            padding: 25px; 
            margin-bottom: 30px; 
            border-radius: 12px; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.08); 
            transition: transform 0.2s;
          }
          /* .post:hover { transform: translateY(-2px); } */
          
          /* Responsive Image */
          .post img { 
            width: 100%; 
            height: auto; 
            display: block; 
            margin: 20px 0; 
            border-radius: 8px; 
            object-fit: cover;
          }
          
          .post h2 { margin: 0 0 10px 0; color: #111; font-size: 1.8em; }
          .post p { line-height: 1.6; color: #444; font-size: 1.05em; margin-bottom: 15px; }
          
          .meta { 
            font-size: 0.9em; 
            color: #888; 
            border-top: 1px solid #eee; 
            padding-top: 15px; 
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .nav { text-align: center; margin-top: 50px; margin-bottom: 30px; }
          .nav a { 
            text-decoration: none; 
            color: #fff; 
            background: #0077cc; 
            padding: 12px 25px; 
            border-radius: 30px; 
            font-weight: 600;
            transition: background 0.2s, transform 0.2s;
            display: inline-block;
          }
          .nav a:hover { background: #005fa3; transform: translateY(-2px); }

          /* Mobile Tweaks */
          @media (max-width: 600px) {
            body { padding: 10px; }
            .post { padding: 15px; }
            .post h2 { font-size: 1.5em; }
          }
          
          .no-results {
            text-align: center;
            color: #777;
            display: none;
            margin-top: 40px;
          }
        </style>
        <script>
          function filterPosts() {
            const query = document.getElementById("searchInput").value.toLowerCase();
            const posts = document.getElementsByClassName("post");
            let visibleCount = 0;
            
            for (let i = 0; i < posts.length; i++) {
              const title = posts[i].getElementsByTagName("h2")[0].innerText.toLowerCase();
              const desc = posts[i].getElementsByTagName("p")[0].innerText.toLowerCase();
              
              if (title.includes(query) || desc.includes(query)) {
                posts[i].style.display = "";
                visibleCount++;
              } else {
                posts[i].style.display = "none";
              }
            }
            
            // Show "No results" message if needed
            const noResults = document.getElementById("no-results");
            if (visibleCount === 0) {
              noResults.style.display = "block";
            } else {
              noResults.style.display = "none";
            }
          }
        </script>
      </head>
      <body>
        <div class="container">
          <h1>Legacy Academy Posts</h1>
          <p class="subtitle">Total posts: ${total}</p>
          
          <div class="search-wrapper">
            <input type="text" id="searchInput" onkeyup="filterPosts()" placeholder="🔍 Search posts by title or description...">
          </div>
          
          <div id="posts-list">
            ${posts.map(post => `
              <div class="post">
                <h2>${post.title}</h2>
                <img src="${post.image}" alt="${post.title}" onerror="this.src='https://via.placeholder.com/800x400?text=No+Image'" />
                <p>${post.desc}</p>
                <div class="meta">
                  <span>📅 ${new Date(post.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            `).join("")}
          </div>
          
          <div id="no-results" class="no-results">
            <h3>No posts found matching your search.</h3>
          </div>
          
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
