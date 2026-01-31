import express from "express";
import Post from "../models/Post.js";
import upload from "../middleware/upload.js"; // Cloudinary
import { verifyToken } from "../middleware/auth.js"; // Our smart auth middleware

const router = express.Router();

// --- FRONTEND ROUTE ---
router.get("/", async (req, res) => {
  // If requesting JSON explicitly, serve API
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    try {
      const posts = await Post.find().sort({ createdAt: -1 });
      return res.status(200).json(posts);
    } catch (err) {
      return res.status(500).json(err);
    }
  }

  // Otherwise serve the HTML UI
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Legacy Academy Social</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
  body { margin:0; font-family: 'Inter', sans-serif; background: linear-gradient(135deg,#0f2027,#203a43,#2c5364); color:#fff; min-height: 100vh; }
  .container { max-width: 600px; margin: auto; padding: 20px; padding-bottom: 80px; }
  h1 { text-align: center; margin-bottom: 20px; font-weight: 800; letter-spacing: -1px; background: linear-gradient(to right, #fbc531, #fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  
  /* --- Glassmorphism Card --- */
  .post-card, .post-form { 
    backdrop-filter: blur(16px); 
    background: rgba(255,255,255,0.08); 
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px; 
    padding: 20px; 
    margin-bottom: 25px; 
    box-shadow: 0 8px 32px rgba(0,0,0,0.3); 
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s; 
    position: relative;
    overflow: hidden;
  }
  
  .post-form { position: sticky; top: 10px; z-index: 100; background: rgba(15, 32, 39, 0.9); border: 1px solid rgba(255,255,255,0.15); }
  
  .post-card:hover { transform: translateY(-5px) scale(1.01); box-shadow: 0 15px 45px rgba(0,0,0,0.5); border-color: rgba(255,255,255,0.2); }
  
  .post-card img, .post-card .gif { max-width: 100%; border-radius: 16px; margin: 15px 0; display: block; transition: transform 0.3s; }
  .post-card img:hover, .post-card .gif:hover { transform: scale(1.02); }

  .post-card h2 { margin:0 0 10px 0; font-size:1.4rem; color: #fff; }
  .post-card p { margin: 8px 0; line-height: 1.5; color: #e0e0e0; }
  
  .meta-info { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 15px; display: flex; justify-content: space-between; }
  .hashtags { color: #fbc531; font-weight: 600; margin-bottom: 10px; font-size: 0.9rem; }
  
  /* --- Inputs & Buttons --- */
  .form-group { display: flex; gap: 10px; margin-bottom: 10px; }
  input, textarea, select { 
    width: 100%; 
    padding: 12px; 
    margin: 5px 0; 
    border-radius: 12px; 
    border: 1px solid rgba(255,255,255,0.2); 
    background: rgba(0,0,0,0.3); 
    color: #fff; 
    font-family: inherit;
    box-sizing: border-box;
  }
  input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.4); }
  input:focus, textarea:focus { outline: none; border-color: #fbc531; background: rgba(0,0,0,0.5); }
  
  button { 
    cursor: pointer; 
    padding: 8px 16px; 
    border: none; 
    border-radius: 12px; 
    font-weight: 600; 
    background: rgba(255,255,255,0.15); 
    color: #fff; 
    transition: all 0.2s; 
    font-size: 0.9rem;
    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  }
  button:hover { background: #fbc531; color: #000; transform: scale(1.05); }
  button:active { transform: scale(0.95); }
  button.delete-btn { background: rgba(255,99,72,0.2); color: #ff6348; }
  button.delete-btn:hover { background: #ff6348; color: #fff; }
  
  .buttons { display: flex; gap: 8px; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; }
  
  /* --- Drag & Drop --- */
  .drop-zone {
    border: 2px dashed rgba(255,255,255,0.3);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    color: rgba(255,255,255,0.6);
    margin: 10px 0;
    cursor: pointer;
    transition: all 0.2s;
  }
  .drop-zone:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.5); }
  .drop-zone.dragover { background: rgba(251, 197, 49, 0.1); border-color: #fbc531; color: #fff; transform: scale(1.02); }

  /* --- Like Animation --- */
  .like-animation {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 4rem;
    pointer-events: none;
    animation: pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    z-index: 100;
    text-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }
  @keyframes pop {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
  }

  /* --- Comments --- */
  .comment-section { margin-top: 20px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 16px; }
  .comment { font-size: 0.9rem; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
  .comment:last-child { border-bottom: none; }
  .comment-user { font-weight: bold; color: #fbc531; margin-right: 5px; }
  
  /* --- Mobile Tweaks --- */
  @media (max-width: 600px) {
    .container { padding: 10px; }
    h1 { font-size: 1.5rem; }
  }
</style>
</head>
<body>
<div class="container">
  <h1>Legacy Academy Social</h1>

  <!-- Create Post Form -->
  <div class="post-form">
    <div class="form-group">
        <input type="text" id="username" placeholder="Your username" value="GuestUser" />
        <select id="role">
          <option value="Guest">Guest</option>
          <option value="Owner">Owner</option>
          <option value="Admin">Admin</option>
          <option value="Founder">Founder</option>
        </select>
    </div>
    <input type="text" id="title" placeholder="Post title" />
    <textarea id="desc" placeholder="What's on your mind?" rows="2"></textarea>
    <input type="text" id="hashtags" placeholder="#hashtags" />
    <input type="text" id="gif" placeholder="GIF URL (optional)" />
    
    <!-- Drag & Drop Zone -->
    <div class="drop-zone" id="drop-zone">
        📁 Drag & drop image here or click to select
    </div>
    <input type="file" id="image" style="display:none;" />
    
    <button onclick="createPost()" id="postBtn" style="width:100%; margin-top:10px; background: #fbc531; color: #000;">✨ Create Post</button>
  </div>

  <div id="posts">Loading feed...</div>
</div>

<script>
// Use relative path for production
const apiUrl = "/api/posts?json=true"; // Append query to ensure JSON logic if header fails
let draggedFile = null;

// --- Drag & Drop Logic ---
const dropZone = document.getElementById('drop-zone');
const imageInput = document.getElementById('image');

dropZone.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', () => {
    if (imageInput.files.length > 0) {
        draggedFile = imageInput.files[0];
        dropZone.textContent = "📸 " + draggedFile.name;
        dropZone.style.borderColor = "#fbc531";
    }
});

dropZone.addEventListener('dragover', (e) => { 
    e.preventDefault(); 
    dropZone.classList.add('dragover'); 
});

dropZone.addEventListener('dragleave', () => { 
    dropZone.classList.remove('dragover'); 
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
      draggedFile = e.dataTransfer.files[0];
      dropZone.textContent = "📸 " + draggedFile.name;
      dropZone.style.borderColor = "#fbc531";
  }
});


// Helper to get current user state from inputs
function getUser() {
    return {
        userId: document.getElementById("username").value.replace(/\\s/g, '') || 'anon',
        username: document.getElementById("username").value || 'Anonymous',
        role: document.getElementById("role").value
    };
}

async function fetchPosts(){
  try {
      const res = await fetch(apiUrl, { 
          headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      renderPosts(data);
  } catch(e) {
      document.getElementById("posts").innerHTML = "<p style='text-align:center'>Failed to load posts.</p>";
  }
}

function renderPosts(posts){
  const container = document.getElementById("posts");
  container.innerHTML = "";
  
  if (posts.length === 0) {
      container.innerHTML = "<p style='text-align:center; opacity:0.6'>No posts yet. Be the first!</p>";
      return;
  }

  posts.forEach(post=>{
    const card = document.createElement("div");
    card.className = "post-card";
    
    // Determine permissions (Client-side visual check only, backend ensures security)
    const currentUser = getUser();
    const canEdit = currentUser.role === 'Founder' || post.author === currentUser.userId;
    const canDelete = currentUser.role === 'Founder' || currentUser.role === 'Admin' || post.author === currentUser.userId;
    const isLiked = post.likes && post.likes.includes(currentUser.userId);

    const prettyDate = new Date(post.createdAt).toLocaleDateString("en-US", { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });

    card.innerHTML = \`
      <div class="meta-info">
        <span>@\${post.username || 'Unknown'} • \${post.role || 'Guest'}</span>
        <span>\${prettyDate}</span>
      </div>
      <h2>\${post.title}</h2>
      \${post.image ? \`<img src="\${post.image}" loading="lazy" />\` : ''}
      \${post.gif ? \`<img class="gif" src="\${post.gif}" />\` : ''}
      <p>\${post.desc}</p>
      <div class="hashtags">\${post.hashtags ? post.hashtags.map(h => '#'+h).join(' ') : ''}</div>
      
      <div class="buttons">
        <button onclick='likePost("\${post._id}", this)'>\${isLiked ? '❤️' : '🤍'} \${post.likes ? post.likes.length : 0}</button>
        <button onclick='sharePost("\${post._id}")'>🔗 Share</button>
        \${canEdit ? \`<button onclick='editPostPrompt("\${post._id}")'>✏️ Edit</button>\` : ''}
        \${canDelete ? \`<button class="delete-btn" onclick='deletePost("\${post._id}")'>🗑️</button>\` : ''}
      </div>
      
      <div class="comment-section">
        <h4 style="margin:0 0 10px 0; font-size:0.9rem; opacity:0.8">Comments (\${post.comments.length})</h4>
        \${post.comments.map(c => \`
            <div class="comment">
                <div><span class="comment-user">\${c.username}:</span> \${c.text}</div>
                \${ (currentUser.role === 'Founder' || currentUser.role === 'Admin' || c.author === currentUser.userId) ? 
                    \`<button class="delete-btn" style="padding:2px 8px; font-size:0.7rem" onclick='deleteComment("\${post._id}","\${c._id}")'>X</button>\` : '' 
                }
            </div>
        \`).join("")}
        <div style="display:flex; gap:5px; margin-top:10px;">
            <input type="text" placeholder="Write a comment..." id="comment-\${post._id}" />
            <button onclick='addComment("\${post._id}")'>Post</button>
        </div>
      </div>
    \`;
    container.appendChild(card);
  });
}

async function createPost(){
  const user = getUser();
  const title = document.getElementById("title").value;
  const desc = document.getElementById("desc").value;
  const hashtags = document.getElementById("hashtags").value;
  const gif = document.getElementById("gif").value;

  if(!title || !desc) return alert("Title and Description are required");

  // Disable button
  const btn = document.getElementById("postBtn");
  const originalText = btn.innerText;
  btn.innerText = "Publishing...";
  btn.disabled = true;

  const formData = new FormData();
  formData.append("title", title);
  formData.append("desc", desc);
  formData.append("hashtags", hashtags);
  formData.append("gif", gif); // Singular 'gif' per backend request
  // Bundle user info for the backend AUTH middleware
  formData.append("user", JSON.stringify(user));

  if (draggedFile) {
      formData.append("image", draggedFile);
  }

  try {
      await fetch("/api/posts", { method:"POST", body: formData });
      // Reset form
      document.getElementById("title").value = "";
      document.getElementById("desc").value = "";
      document.getElementById("hashtags").value = "";
      document.getElementById("gif").value = "";
      // Reset Drag Zone
      draggedFile = null;
      dropZone.textContent = "📁 Drag & drop image here or click to select";
      dropZone.style.borderColor = "rgba(255,255,255,0.3)";
      
      fetchPosts();
  } catch(e) {
      alert("Error creating post");
  } finally {
      btn.innerText = originalText;
      btn.disabled = false;
  }
}

async function likePost(id, btn){
  // Animation
  const heart = document.createElement('span');
  heart.className = "like-animation";
  heart.textContent = "❤️";
  // Append to the specific card container (button's parent's parent which is the card)
  const card = btn.closest('.post-card');
  card.appendChild(heart);
  setTimeout(()=>heart.remove(), 800);

  const user = getUser();
  await fetch(\`/api/posts/\${id}/like\`, { 
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ user: JSON.stringify(user) }) // Pass user mock for auth
  });
  fetchPosts();
}

async function sharePost(id){
    alert("Shared to clipboard! 🚀");
}

async function deletePost(id){
  const user = getUser();
  if(!confirm("Delete this post?")) return;
  
  await fetch(\`/api/posts/\${id}\`, {
    method:"DELETE",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ user: JSON.stringify(user) }) // Auth payload
  });
  fetchPosts();
}

async function editPostPrompt(id){
  const newDesc = prompt("Edit your description:");
  if(!newDesc) return;
  
  const user = getUser();
  await fetch(\`/api/posts/\${id}\`,{
    method:"PUT",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ desc: newDesc, user: JSON.stringify(user) }) // Auth payload
  });
  fetchPosts();
}

async function addComment(postId){
  const input = document.getElementById(\`comment-\${postId}\`);
  const text = input.value;
  if(!text) return;
  
  const user = getUser();
  await fetch(\`/api/posts/\${postId}/comments\`,{
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ text, user: JSON.stringify(user) }) // Auth payload
  });
  input.value="";
  fetchPosts();
}

async function deleteComment(postId, commentId){
  const user = getUser();
  if(!confirm("Delete comment?")) return;
  
  await fetch(\`/api/posts/\${postId}/comments/\${commentId}\`,{
    method:"DELETE",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ user: JSON.stringify(user) }) // Auth payload
  });
  fetchPosts();
}

// Initial Load
fetchPosts();
</script>
</body>
</html>
  `;
  res.send(html);
});

// --- API ROUTES (BACKEND LOGIC) ---

// Helper function to handle JSON for 'json=true' query param on GET / if needed
// But primarily mapped to standard REST endpoints below

/**
 * GET ALL POSTS JSON (Explicit)
 */
router.get("/json", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

/**
 * CREATE POST
 */
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const user = req.user; // populated by verifyToken
    console.log("Creating Post with user:", user);

    const newPost = new Post({
      title: req.body.title,
      desc: req.body.desc,
      hashtags: req.body.hashtags ? req.body.hashtags.split(",") : [], // Adjusted to split by comma based on UI placeholder
      image: req.file ? req.file.path : "",
      gif: req.body.gif || "",
      author: user.id || user.userId, // flexible
      username: user.username,        // Store username too for easy display
      role: user.role,
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating post", error: err });
  }
});

/**
 * EDIT POST
 */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found");

    const userId = req.user.id || req.user.userId;
    console.log("Edit requested by:", userId, "Post owner:", post.author);

    // Only author or Admin/Founder can edit
    if (post.author !== userId && !["Admin", "Founder"].includes(req.user.role))
      return res.status(403).json("You can only edit your own posts");

    if (req.body.title) post.title = req.body.title;
    if (req.body.desc) post.desc = req.body.desc;
    if (req.body.hashtags) post.hashtags = req.body.hashtags.split(",");
    if (req.body.gif) post.gif = req.body.gif;

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

/**
 * DELETE POST
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found");

    const userId = req.user.id || req.user.userId;

    if (post.author !== userId && !["Admin", "Founder"].includes(req.user.role))
      return res.status(403).json("You can only delete your own posts");

    await post.deleteOne();
    res.status(200).json("Post deleted");
  } catch (err) {
    res.status(500).json(err);
  }
});

/**
 * ADD COMMENT
 */
router.post("/:id/comments", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found");

    const userId = req.user.id || req.user.userId;

    const comment = {
      _id: new Date().getTime().toString(), // Simple ID gen
      text: req.body.text,
      username: req.user.username,
      author: userId,
    };

    post.comments.push(comment);
    await post.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json(err);
  }
});

/**
 * DELETE COMMENT
 */
router.delete("/:id/comments/:commentId", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found");

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json("Comment not found");

    const userId = req.user.id || req.user.userId;

    if (comment.author !== userId && !["Admin", "Founder"].includes(req.user.role))
      return res.status(403).json("You can only delete your own comments");

    comment.deleteOne(); // Use deleteOne subdocument method
    await post.save();
    res.status(200).json("Comment deleted");
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

/**
 * LIKE POST
 */
router.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Post not found");

    const userId = req.user.id || req.user.userId;

    // Initialize arrays if undefined (legacy fix)
    if (!post.likes) post.likes = [];

    // Check if user already liked
    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
    } else {
      post.likes = post.likes.filter(u => u !== userId);
    }

    await post.save();
    res.status(200).json({ likes: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

export default router;
