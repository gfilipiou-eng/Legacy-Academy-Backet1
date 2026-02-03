const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? "http://localhost:5000/api" : "https://legacy-academy-backet1.onrender.com/api";

let token = "";

// Register
document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("regUsername").value,
      email: document.getElementById("regEmail").value,
      password: document.getElementById("regPassword").value
    })
  });
  alert(await res.json().message);
});

// Login
document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("loginEmail").value,
      password: document.getElementById("loginPassword").value
    })
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    alert(`Logged in as ${data.username}`);
    loadPosts();
  } else {
    alert(data.error);
  }
});

// Create Post
document.getElementById("postForm").addEventListener("submit", async e => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("text", document.getElementById("postText").value);
  const fileInput = document.getElementById("postImage");
  if (fileInput.files[0]) formData.append("image", fileInput.files[0]);

  const res = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData
  });
  document.getElementById("postText").value = "";
  fileInput.value = "";
  loadPosts();
});

// Load Posts
async function loadPosts() {
  const res = await fetch(`${API_URL}/posts`);
  const posts = await res.json();
  const container = document.getElementById("postsContainer");
  container.innerHTML = "";
  posts.forEach(p => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${p.user}</strong>: ${p.text}<br>${p.image ? `<img src="http://localhost:5000/uploads/${p.image}" width="200">` : ""}<hr>`;
    container.appendChild(div);
  });
}

loadPosts();
