import express from "express";
import Post from "../models/Post.js";
import upload from "../middleware/upload.js"; // Cloudinary
import { verifyToken } from "../middleware/auth.js"; // Smart auth middleware

const router = express.Router();

// --- FRONTEND ROUTE (SSR) ---
router.get("/", async (req, res) => {
  // API MODE: Return JSON if requested
  if (req.headers.accept && req.headers.accept.includes("application/json") || req.query.json === 'true') {
    try {
      const posts = await Post.find().sort({ createdAt: -1 });
      return res.status(200).json(posts);
    } catch (err) {
      return res.status(500).json(err);
    }
  }

  // --- REACT FRONTEND ---
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Legacy Academy Social</title>
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
  
  <!-- Canvas Confetti for Sparks -->
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800;900&display=swap');
    
    body {
      background: radial-gradient(circle at top left, #0a0a12, #111122, #000000);
      color: white;
      min-height: 100vh;
      overflow-x: hidden;
      font-family: 'Inter', sans-serif;
    }

    ::-webkit-scrollbar { width: 0px; }

    .liquid-glass {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
      border-radius: 24px;
    }

    .antigravity-card {
      transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    }

    .antigravity-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border-color: rgba(255, 255, 255, 0.15);
    }

    /* Founder Golden Glow */
    @keyframes founder-shine {
      0% { filter: drop-shadow(0 0 2px #ffd700); opacity: 0.8; }
      50% { filter: drop-shadow(0 0 8px #ff8c00); opacity: 1; }
      100% { filter: drop-shadow(0 0 2px #ffd700); opacity: 0.8; }
    }

    .founder-badge-glow {
      animation: founder-shine 2s infinite ease-in-out;
      color: #ffd700;
    }

    /* Screen Shake Animation */
    @keyframes shake {
      0% { transform: translate(1px, 1px) rotate(0deg); }
      10% { transform: translate(-1px, -2px) rotate(-1deg); }
      20% { transform: translate(-3px, 0px) rotate(1deg); }
      30% { transform: translate(3px, 2px) rotate(0deg); }
      40% { transform: translate(1px, -1px) rotate(1deg); }
      50% { transform: translate(-1px, 2px) rotate(-1deg); }
      60% { transform: translate(-3px, 1px) rotate(0deg); }
      70% { transform: translate(3px, 1px) rotate(-1deg); }
      80% { transform: translate(-1px, -1px) rotate(1deg); }
      90% { transform: translate(1px, 2px) rotate(0deg); }
      100% { transform: translate(1px, -2px) rotate(-1deg); }
    }
    .shake { animation: shake 0.5s; animation-iteration-count: 1; }
  </style>
</head>
<body class="pb-32">

  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;
    const { motion, AnimatePresence } = window.Motion;

    // --- 🧠 SMART CONFIGURATION ---
    const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000/api" 
      : "https://legacy-academy-backet1.onrender.com/api";

    // --- SOUND & FX UTILS ---
    const playHapticSound = () => {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"); 
        audio.volume = 0.2;
        audio.play().catch(e => {}); 
    };

    const triggerDeleteFX = () => {
        // 1. Audio
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/265/265-preview.mp3"); // Sci-fi zap
        audio.volume = 0.4;
        audio.play().catch(()=>{});

        // 2. Screen Shake
        const body = document.querySelector('body');
        body.classList.add('shake');
        setTimeout(() => body.classList.remove('shake'), 500);

        // 3. Particle Sparks (Confetti)
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#ef4444', '#ff0000', '#7f1d1d'], // RED SPARKS
            disableForReducedMotion: true
        });
    };

    // --- ICONS (SVG) ---
    const Icons = {
        X: (props) => <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>,
        Menu: (props) => <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
        LogOut: (props) => <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
        Shield: (props) => <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
        ShieldCheck: (props) => <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>,
        User: (props) => <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
        Settings: (props) => <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
        Plus: (props) => <svg {...props} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
        Image: (props) => <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
    };

    // --- FOUNDER BADGE COMPONENT ---
    const FounderBadge = () => (
      <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-2.5 py-1 rounded-full border border-yellow-500/30 ml-2 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
        <Icons.ShieldCheck className="founder-badge-glow w-3 h-3 text-yellow-500" />
        <span className="text-[9px] font-black text-yellow-500 tracking-wider uppercase">FOUNDER</span>
      </div>
    );

    // --- COMPONENTS ---
    const SideMenu = ({ isOpen, onClose, user, logout }) => (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]" />
            <motion.div 
               initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}} 
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed left-0 top-0 h-full w-72 liquid-glass z-[70] p-6 rounded-none rounded-r-3xl border-r border-white/10 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <span className="font-bold text-xl tracking-tighter italic">LEGACY MENU</span>
                <div onClick={onClose} className="cursor-pointer opacity-50 hover:opacity-100"><Icons.X /></div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl mb-6 border border-white/5">
                 <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg overflow-hidden shrink-0">
                    {user?.username?.[0]?.toUpperCase() || '?'}
                 </div>
                 <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white leading-none">{user.username}</p>
                      {user.role === 'Founder' && <Icons.ShieldCheck className="w-4 h-4 text-yellow-500 founder-badge-glow" />}
                    </div>
                    {user.role === 'Founder' ? 
                       <span className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-wider mt-1">Global Admin</span> :
                       <p className="text-xs text-blue-400 font-bold uppercase tracking-wide mt-1">{user.role}</p>
                    }
                 </div>
              </div>

              <div className="space-y-3 flex-1">
                 <div className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all group">
                    <Icons.User size={20} className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white font-medium">Profile</span>
                 </div>
                 {user.role === 'Founder' && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-500/10 to-transparent text-yellow-400 border border-yellow-500/20 rounded-xl cursor-pointer hover:bg-yellow-500/20 transition-all shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                       <Icons.Shield size={20} className="founder-badge-glow" /> <span className="font-bold">Admin Panel</span>
                    </div>
                 )}
                 <div className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all group">
                    <Icons.Settings size={20} className="text-gray-400 group-hover:text-white" /> <span className="text-gray-300 group-hover:text-white font-medium">Settings</span>
                 </div>
              </div>

              <button onClick={logout} className="flex items-center gap-3 p-4 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all font-bold mt-auto border border-red-500/10 hover:border-red-500/30">
                 <Icons.LogOut size={20} /> Logout
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );

    const Auth = ({ setUser }) => {
      const [isLogin, setIsLogin] = useState(true);
      const [form, setForm] = useState({ email: '', password: '', username: '' });

      const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const url = \`\${API_URL}\${endpoint}\`;
        
        console.log("🔗 Attempting connection to:", url);
        
        try {
          const res = await axios.post(url, form);
          
          if(isLogin){
             // Store token and user data
             localStorage.setItem('token', res.data.token);
             localStorage.setItem('user', JSON.stringify(res.data.user));
             setUser(res.data.user);
             alert("✅ Success! Welcome, " + res.data.user.username);
          } else {
             setIsLogin(true);
             alert("✅ Account created successfully! You can now login.");
          }
        } catch (err) { 
           // EMERGENCY FIX: Detailed Error Handling
           console.error("🔴 DEBUG ERROR:", err);
           
           if (!err.response) {
              // No response = Server not reachable
              alert("⏳ Server at Render is not responding. It may be spinning up (cold start). Please wait 30-60 seconds and try again.");
           } else if (err.response.status === 404) {
              // URL wrong
              alert("❌ 404: Authentication endpoint not found. Check API_URL configuration.");
           } else if (err.response.status === 400) {
              // Bad request (validation error)
              const msg = err.response.data?.message || err.response.data || "Validation Error";
              alert("⚠️ " + msg);
           } else if (err.response.status === 401) {
              // Unauthorized (wrong password, user doesn't exist)
              alert("🔒 Authentication Failed: " + (err.response.data?.message || "Invalid credentials"));
           } else {
              // Generic error
              const msg = err.response.data?.message || err.response.data || "Unknown Server Error";
              alert("❌ Error: " + msg);
           }
        }
      };

      return (
        <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#222_0%,_#000_100%)] z-[-1]" />
           <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="liquid-glass p-8 w-full max-w-md relative z-10">
             <h2 className="text-4xl font-black text-center mb-8 italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
               {isLogin ? 'LOGIN' : 'SIGN UP'}
             </h2>
             <form onSubmit={handleSubmit} className="space-y-4">
               {!isLogin && (
                 <input type="text" placeholder="Username" className="w-full p-4 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:bg-black/40 outline-none transition focus:border-blue-500" 
                 onChange={e => setForm({...form, username: e.target.value})} />
               )}
               <input type="email" placeholder="Email" className="w-full p-4 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:bg-black/40 outline-none transition focus:border-blue-500"
               onChange={e => setForm({...form, email: e.target.value})} />
               <input type="password" placeholder="Password" className="w-full p-4 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:bg-black/40 outline-none transition focus:border-blue-500"
               onChange={e => setForm({...form, password: e.target.value})} />
               <button className="w-full py-4 bg-white text-black font-black uppercase rounded-xl active:scale-95 transition-all hover:bg-gray-200 mt-4 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                 {isLogin ? 'ACCESS TERMINAL' : 'CREATE IDENTITY'}
               </button>
             </form>
             <p className="text-center mt-6 text-sm text-gray-500 cursor-pointer hover:text-white transition" onClick={() => setIsLogin(!isLogin)}>
               {isLogin ? "Need access? Register" : "Have ID? Login"}
             </p>
           </motion.div>
        </div>
      );
    };

    const CreatePostModal = ({ isOpen, onClose, refresh, user }) => {
       const [data, setData] = useState({ title: '', desc: '' });
       const [image, setImage] = useState(null);
       const [loading, setLoading] = useState(false);

       const handleSubmit = async (e) => {
          e.preventDefault();
          setLoading(true);
          const formData = new FormData();
          formData.append('title', data.title);
          formData.append('desc', data.desc);
          formData.append('user', JSON.stringify({ userId: user._id, role: user.role })); 
          if(image) formData.append('image', image);
          
          try {
             const token = localStorage.getItem('token');
             await axios.post(\`\${API_URL}/posts\`, formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: \`Bearer \${token}\` }});
             refresh(); onClose();
             setData({title:'',desc:''}); setImage(null);
          } catch(e) { alert("Upload Failed"); } 
          finally { setLoading(false); }
       };

       return (
         <AnimatePresence>
            {isOpen && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                  <motion.div initial={{scale:0.9, y:50, opacity:0}} animate={{scale:1, y:0, opacity:1}} exit={{scale:0.9, y:50, opacity:0}} className="liquid-glass w-full max-w-lg p-8 relative z-10 bg-[#111]">
                     <div onClick={onClose} className="absolute top-6 right-6 cursor-pointer opacity-50 hover:opacity-100"><Icons.X/></div>
                     <h2 className="text-2xl font-black italic uppercase mb-6">Create Transmission</h2>
                     <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="text" placeholder="Title" value={data.title} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-white outline-none font-bold" onChange={e=>setData({...data, title: e.target.value})} />
                        <textarea placeholder="Message..." value={data.desc} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-white outline-none h-32 resize-none" onChange={e=>setData({...data, desc: e.target.value})} />
                        <label className="flex items-center gap-3 bg-white/5 p-4 rounded-xl cursor-pointer hover:bg-white/10 transition group">
                           <div className="text-gray-500 group-hover:text-white"><Icons.Image/></div>
                           <span className="text-sm font-bold text-gray-400 group-hover:text-white uppercase">{image ? "Image Selected" : "Attach Image"}</span>
                           <input type="file" hidden onChange={e=>setImage(e.target.files[0])} />
                        </label>
                        <button disabled={loading} className="w-full py-4 bg-white text-black font-black uppercase rounded-xl hover:scale-[1.02] active:scale-95 transition shadow-lg">{loading ? "UPLOADING..." : "PUBLISH"}</button>
                     </form>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
       );
    };

    // --- MAIN APP ---
    const App = () => {
      const [user, setUser] = useState(null);
      const [posts, setPosts] = useState([]);
      const [isMenuOpen, setIsMenuOpen] = useState(false);
      const [isModalOpen, setIsModalOpen] = useState(false);

      useEffect(() => {
          try {
            const u = localStorage.getItem('user');
            if(u) setUser(JSON.parse(u));
          } catch(e) {}
      }, []);

      useEffect(() => { if (user) fetchPosts(); }, [user]);

      const fetchPosts = async () => {
        try {
            const res = await axios.get(API_URL + '/posts?json=true');
            setPosts(res.data);
        } catch(e) {}
      };

      const logout = () => { localStorage.clear(); setUser(null); setIsMenuOpen(false); };
      
      const handleDelete = async (postId) => {
          if(!confirm("Founder Override: Permanently delete this object?")) return;
          
          // TRIGGER SPARK FX
          triggerDeleteFX();

          try {
             // Artificial Delay to enjoy the explosion
             await new Promise(r => setTimeout(r, 600));
             
             await axios.delete(\`\${API_URL}/posts/\${postId}\`, { 
                 headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }, 
                 data: { user: JSON.stringify({ userId: user._id, role: user.role }) }
             });
             fetchPosts();
          } catch(e) { alert("Delete failed"); }
      };

      const handleMenuOpen = () => {
          setIsMenuOpen(true);
          playHapticSound(); 
      };

      if (!user) return <Auth setUser={setUser} />;

      return (
        <div className="max-w-xl mx-auto min-h-screen relative">
          
          <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} user={user} logout={logout} />
          
          <header className="liquid-glass sticky top-4 mx-4 p-4 z-50 flex justify-between items-center bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
            <button onClick={handleMenuOpen} className="p-2 hover:bg-white/10 rounded-full transition active:scale-90">
              <Icons.Menu size={24} />
            </button>
            <h1 className="text-xl font-black italic tracking-tighter bg-gradient-to-tr from-white to-gray-400 bg-clip-text text-transparent">LEGACY</h1>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg border border-white/20">
               {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
          </header>

          <main className="p-4 mt-6 space-y-6 pb-32">
            {posts.map(post => {
              const isFounderPost = post.role === 'Founder';
              return (
                <div key={post._id} className={\`liquid-glass antigravity-card p-0 overflow-hidden border group bg-black/20 \${isFounderPost ? 'border-yellow-500/20' : 'border-white/10'}\`}>
                  <div className="p-4 flex items-center justify-between bg-gradient-to-b from-white/5 to-transparent">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-black/40 rounded-full flex items-center justify-center font-bold text-gray-300 border border-white/10 shadow-inner">{post.username ? post.username[0] : '?'}</div>
                          <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base leading-tight text-white">{post.title}</h3>
                                {isFounderPost && <FounderBadge />}
                              </div>
                              <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mt-0.5">@{post.username}</p>
                          </div>
                      </div>
                      {(user.role === 'Founder' || post.author === (user._id || user.userId)) && (
                          <button onClick={() => handleDelete(post._id)} className="text-red-500 opacity-40 hover:opacity-100 transition p-2 hover:bg-red-500/10 rounded-full"><Icons.X size={18} /></button>
                      )}
                  </div>
                  
                  {post.image && <img src={post.image} className="w-full h-72 object-cover bg-black/50" alt="post" loading="lazy" />}
                  
                  <div className="p-5">
                      <p className="opacity-80 text-sm leading-relaxed font-light text-gray-200 whitespace-pre-wrap">{post.desc}</p>
                      <div className="mt-4 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest border-t border-white/5 pt-3 text-gray-600">
                          <span>{new Date(post.createdAt || Date.now()).toLocaleDateString()}</span>
                          {isFounderPost && <span className="text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)] founder-badge-glow">OFFICIAL TRANSMISSION</span>}
                      </div>
                  </div>
                </div>
              );
            })}
            {posts.length === 0 && <div className="text-center mt-20 text-gray-600 text-xs uppercase tracking-widest animate-pulse">Waiting for Signal...</div>}
          </main>

          <button onClick={() => setIsModalOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-white text-black rounded-full shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-4 border-black/20">
            <Icons.Plus />
          </button>
          
          <CreatePostModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} refresh={fetchPosts} user={user} />
        </div>
      );
    };

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>
  `;
  res.send(html);
});

// --- API ROUTES ---
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    let user = req.user;
    if (typeof user === 'string') user = JSON.parse(user);

    const newPost = new Post({
      title: req.body.title,
      desc: req.body.desc || req.body.description,
      image: req.file ? req.file.path : "",
      author: user.id || user.userId,
      username: user.username,
      role: user.role,
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) { res.status(500).json(err); }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const user = req.user;
    const isOwner = post.author === (user.id || user.userId);
    const isFounder = user.role === "Founder" || user.role === "Admin";
    if (!isOwner && !isFounder) return res.status(403).json("Forbidden");
    await post.deleteOne();
    res.status(200).json("Deleted");
  } catch (e) { res.status(500).json(e); }
});

export default router;
