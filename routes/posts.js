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

    // 1. Get unique Month-Year combinations for the dropdown
    const dates = [...new Set(posts.map(post => {
      return new Date(post.createdAt).toLocaleDateString("en-US", { month: 'long', year: 'numeric' });
    }))];

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
          
          /* Controls Container (Search + Filter) */
          .controls {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
          }
          
          .search-wrapper { flex: 1; min-width: 250px; }
          .filter-wrapper { flex: 0 0 200px; }
          
          input, select {
            padding: 12px 20px;
            width: 100%;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 25px;
            outline: none;
            transition: all 0.3s;
            box-sizing: border-box;
          }
          
          input:focus, select:focus {
            border-color: #0077cc;
            box-shadow: 0 0 8px rgba(0, 119, 204, 0.2);
          }
          
          /* Custom Select Arrow */
          select {
            appearance: none;
            background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
            background-repeat: no-repeat;
            background-position: right .7em top 50%;
            background-size: .65em auto;
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

          @media (max-width: 600px) {
            body { padding: 10px; }
            .post { padding: 15px; }
            .post h2 { font-size: 1.5em; }
            .controls { flex-direction: column; }
            .filter-wrapper { flex: 1; }
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
            const dateFilter = document.getElementById("dateFilter").value;
            const posts = document.getElementsByClassName("post");
            let visibleCount = 0;
            
            for (let i = 0; i < posts.length; i++) {
              const title = posts[i].getElementsByTagName("h2")[0].innerText.toLowerCase();
              const desc = posts[i].getElementsByTagName("p")[0].innerText.toLowerCase();
              const dateSpan = posts[i].querySelector(".meta span").innerText; // e.g., "📅 January 31, 2026"
              
              const matchesSearch = title.includes(query) || desc.includes(query);
              const matchesDate = dateFilter === "all" || dateSpan.includes(dateFilter);
              
              if (matchesSearch && matchesDate) {
                posts[i].style.display = "";
                visibleCount++;
              } else {
                posts[i].style.display = "none";
              }
            }
            
            const noResults = document.getElementById("no-results");
            noResults.style.display = visibleCount === 0 ? "block" : "none";
          }
        </script>
      </head>
      <body>
        <div class="container">
          <h1>Legacy Academy Posts</h1>
          <p class="subtitle">Total posts: ${total}</p>
          
          <div class="controls">
            <div class="search-wrapper">
              <input type="text" id="searchInput" onkeyup="filterPosts()" placeholder="🔍 Search posts...">
            </div>
            <div class="filter-wrapper">
              <select id="dateFilter" onchange="filterPosts()">
                <option value="all">📅 All Dates</option>
                ${dates.map(date => `<option value="${date}">${date}</option>`).join("")}
              </select>
            </div>
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
            <h3>No posts found matching your filters.</h3>
            <p>Try clearing your search or selecting "All Dates"</p>
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
