import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import upload from "../middleware/upload.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  if (req.headers.accept?.includes("application/json") || req.query.json === 'true') {
    try {
      const posts = await Post.find().populate('author', 'username profilePic role').sort({ createdAt: -1 });
      return res.status(200).json(posts);
    } catch (err) { return res.status(500).json(err); }
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Legacy Academy</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
  <script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
    body { background: linear-gradient(180deg, #000 0%, #050510 50%, #0a0a18 100%); color: white; min-height: 100vh; font-family: 'Inter', sans-serif; }
    ::-webkit-scrollbar { width: 0; }
    
    /* Liquid Glass 3D */
    .glass-3d { 
      background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%); 
      backdrop-filter: blur(40px) saturate(200%); 
      border: 1px solid rgba(255,255,255,0.18); 
      border-radius: 28px; 
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.1);
    }
    
    /* Liquid Glass Menu - Holographic Illusion */
    .menu-liquid {
      background: linear-gradient(160deg, rgba(15,15,35,0.85) 0%, rgba(25,20,50,0.9) 50%, rgba(10,10,25,0.95) 100%);
      backdrop-filter: blur(80px) saturate(180%);
      border-right: 1px solid rgba(255,255,255,0.12);
      box-shadow: 
        30px 0 80px -10px rgba(0,0,0,0.9),
        inset 1px 0 0 rgba(255,255,255,0.15),
        inset 0 1px 0 rgba(255,255,255,0.1);
      position: relative;
      overflow: hidden;
    }
    .menu-liquid::before {
      content: '';
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(ellipse at 20% 20%, rgba(147,51,234,0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(236,72,153,0.1) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .menu-liquid::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%);
      animation: shimmer 8s linear infinite;
      pointer-events: none;
    }
    @keyframes shimmer { 0% { transform: translateX(-100%) rotate(45deg); } 100% { transform: translateX(100%) rotate(45deg); } }
    
    /* Cards */
    .card { transition: all 0.5s cubic-bezier(0.23,1,0.32,1); transform-style: preserve-3d; }
    .card:hover { transform: translateY(-10px) scale(1.02) rotateX(2deg); box-shadow: 0 40px 80px -20px rgba(0,0,0,0.6), 0 0 40px -10px rgba(147,51,234,0.2); }
    
    /* Founder Effects */
    @keyframes glow { 0%,100% { box-shadow: 0 0 25px rgba(255,215,0,0.4); } 50% { box-shadow: 0 0 50px rgba(255,215,0,0.6); } }
    .founder-glow { animation: glow 2s infinite; border-color: rgba(255,215,0,0.5) !important; }
    .founder-avatar { background: linear-gradient(135deg, #ffd700, #ff8c00) !important; color: #000 !important; }
    .hashtag { color: #60a5fa; cursor: pointer; font-weight: 500; }
    
    /* Animations */
    @keyframes like-pop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
    .like-anim { animation: like-pop 0.4s cubic-bezier(0.68,-0.55,0.265,1.55); }
    @keyframes explode { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
    .explode { animation: explode 0.5s ease-out forwards; }
    
    /* Settings Icon */
    .settings-icon { transition: all 0.4s cubic-bezier(0.68,-0.55,0.265,1.55); }
    .settings-icon:hover { filter: drop-shadow(0 0 12px rgba(147,51,234,0.8)); transform: rotate(180deg) scale(1.1); }
    
    /* Menu Items */
    .menu-item {
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .menu-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 3px;
      background: linear-gradient(180deg, #a855f7, #ec4899);
      transform: scaleY(0);
      transition: transform 0.3s ease;
    }
    .menu-item:hover::before { transform: scaleY(1); }
    .menu-item:hover { background: rgba(255,255,255,0.05); padding-left: 1.5rem; }
    
    /* Glass Button */
    .glass-btn {
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      border: 1px solid rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }
    .glass-btn:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); }
  </style>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
const { useState, useEffect, useRef } = React;
const { motion, AnimatePresence } = window.Motion;
const API = location.hostname === "localhost" ? "http://localhost:5000/api" : "https://legacy-academy-backet1.onrender.com/api";

const playSound = (type) => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  
  // Sword Swish / Click
  if (type === 'pop' || type === 'click') {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(2400, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.06);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.08);
  }
  
  // Sword Whoosh / Swipe
  else if (type === 'whoosh' || type === 'swipe') {
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.1);
    filter.Q.value = 2;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }
  
  // Sword Strike / Delete
  else if (type === 'delete' || type === 'strike') {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(600, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.start();
    osc2.start();
    osc.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  }
  
  // Magic / Success
  else if (type === 'magic' || type === 'success') {
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + i * 200, ctx.currentTime + i * 0.08);
      osc.frequency.exponentialRampToValueAtTime(800 + i * 300, ctx.currentTime + i * 0.08 + 0.15);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.2);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.25);
    }
  }
  
  // Error / Block
  else if (type === 'error') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.setValueAtTime(120, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }
};

const explodeEffect = () => confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 }, colors: ['#ff4444', '#ff6666', '#ffd700'], gravity: 1.2, scalar: 0.9 });

const Icons = {
  Menu: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>,
  X: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Plus: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>,
  Heart: p => <svg {...p} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Comment: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Send: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Trash: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Search: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>,
  Image: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>,
  Shield: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>,
  Settings: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Logout: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  ThumbDown: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 14V2M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>,
  User: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Users: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  UserPlus: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>,
  UserCheck: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
  Back: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7M19 12H5"/></svg>,
  Grid: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
};

const parseHashtags = (text) => text ? text.split(/(#\\w+)/g).map((part, i) => part.startsWith('#') ? <span key={i} className="hashtag">{part}</span> : part) : text;

// Profile Modal
const ProfileModal = ({ isOpen, onClose, profileUser, currentUser, posts, allUsers, onViewProfile }) => {
  const [tab, setTab] = useState('posts');
  const [following, setFollowing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [followers, setFollowers] = useState([]);
  const userPosts = posts.filter(p => p.username === profileUser?.username);
  const isOwnProfile = profileUser?.username === currentUser?.username;

  useEffect(() => {
    if (profileUser?.username) {
      fetchUserData();
    }
  }, [profileUser]);

  const fetchUserData = async () => {
    try {
      const res = await axios.get(API + '/users/username/' + profileUser.username);
      setUserData(res.data);
      setFollowing(res.data.followers?.includes(currentUser?._id || currentUser?.id));
    } catch(e) { setUserData(profileUser); }
  };

  const handleFollow = async () => {
    if (!userData?._id) return;
    playSound('pop');
    try {
      const res = await axios.put(API + '/users/' + userData._id + '/follow', {}, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      setFollowing(res.data.isFollowing);
      setUserData({...userData, followers: res.data.isFollowing ? [...(userData.followers || []), currentUser?._id] : (userData.followers || []).filter(f => f !== currentUser?._id)});
      if (res.data.isFollowing) confetti({particleCount:30,spread:50});
    } catch(e) {}
  };

  if (!isOpen || !profileUser) return null;
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]" />
      <motion.div initial={{opacity:0,y:100}} animate={{opacity:1,y:0}} className="fixed inset-x-0 bottom-0 top-16 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg md:top-[5%] md:bottom-[5%] glass-3d z-[101] overflow-hidden flex flex-col rounded-t-[32px] md:rounded-[32px]">
        {/* Header */}
        <div className="p-4 flex items-center gap-4 border-b border-white/10">
          <button onClick={() => { playSound('pop'); onClose(); }} className="p-2 hover:bg-white/10 rounded-full"><Icons.Back className="w-5 h-5" /></button>
          <span className="font-bold text-lg flex-1">{profileUser.username}</span>
          {(userData?.role || profileUser.role) === 'Founder' && <Icons.Shield className="w-5 h-5 text-yellow-500" />}
        </div>
        
        {/* Profile Info */}
        <div className="p-6 text-center border-b border-white/10">
          <div className={"w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold mb-4 " + ((userData?.role || profileUser.role) === 'Founder' ? 'founder-avatar' : 'bg-gradient-to-br from-purple-500 to-pink-500')}>
            {profileUser.username?.[0]?.toUpperCase()}
          </div>
          <h2 className="text-xl font-bold flex items-center justify-center gap-2">
            {profileUser.username}
            {(userData?.role || profileUser.role) === 'Founder' && <span className="px-2 py-0.5 bg-yellow-500/20 rounded-full text-yellow-500 text-xs font-bold">FOUNDER</span>}
          </h2>
          <p className="text-gray-400 text-sm mt-1">{userData?.role || profileUser.role || 'Member'}</p>
          
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center"><span className="font-bold text-lg">{userPosts.length}</span><p className="text-xs text-gray-500">Posts</p></div>
            <div className="text-center"><span className="font-bold text-lg">{userData?.followers?.length || 0}</span><p className="text-xs text-gray-500">Followers</p></div>
            <div className="text-center"><span className="font-bold text-lg">{userData?.following?.length || 0}</span><p className="text-xs text-gray-500">Following</p></div>
          </div>
          
          {!isOwnProfile && (
            <button onClick={handleFollow}
              className={"mt-4 px-8 py-2.5 rounded-full font-bold transition " + (following ? 'bg-white/10 border border-white/20' : 'bg-gradient-to-r from-purple-600 to-pink-600')}>
              {following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button onClick={() => setTab('posts')} className={"flex-1 p-3 flex items-center justify-center gap-2 transition " + (tab === 'posts' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-500')}>
            <Icons.Grid className="w-5 h-5" /> Posts
          </button>
          <button onClick={() => setTab('friends')} className={"flex-1 p-3 flex items-center justify-center gap-2 transition " + (tab === 'friends' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-500')}>
            <Icons.Users className="w-5 h-5" /> Friends
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'posts' && (
            <div className="grid grid-cols-3 gap-1">
              {userPosts.map(post => (
                <div key={post._id} className="aspect-square bg-white/5 rounded-lg overflow-hidden">
                  {post.image ? <img src={post.image} className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 p-2 text-center">{post.title || post.desc?.slice(0,30)}</div>
                  )}
                </div>
              ))}
              {userPosts.length === 0 && <p className="col-span-3 text-center py-10 text-gray-500">No posts yet</p>}
            </div>
          )}
          {tab === 'friends' && (
            <div className="space-y-3">
              {allUsers.filter(u => u.username !== profileUser.username).slice(0,10).map((u, i) => (
                <button key={i} onClick={() => { playSound('pop'); onViewProfile(u); }} className="w-full p-3 bg-white/5 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition">
                  <div className={"w-12 h-12 rounded-full flex items-center justify-center font-bold " + (u.role === 'Founder' ? 'founder-avatar' : 'bg-gradient-to-br from-blue-500 to-purple-500')}>
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1.5"><span className="font-semibold">{u.username}</span>{u.role === 'Founder' && <Icons.Shield className="w-3.5 h-3.5 text-yellow-500" />}</div>
                    <span className="text-xs text-gray-500">{u.role || 'Member'}</span>
                  </div>
                  <Icons.UserPlus className="w-5 h-5 text-purple-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

// Search Modal with Users
const SearchModal = ({ isOpen, onClose, users, onViewProfile }) => {
  const [query, setQuery] = useState('');
  const filtered = users.filter(u => u.username?.toLowerCase().includes(query.toLowerCase()));
  
  if (!isOpen) return null;
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]" />
      <motion.div initial={{opacity:0,y:-50}} animate={{opacity:1,y:0}} className="fixed inset-x-4 top-20 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg glass-3d p-4 z-[101] max-h-[70vh] overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-full px-4 py-3 border border-white/10">
            <Icons.Search className="w-5 h-5 text-gray-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users..." autoFocus className="flex-1 bg-transparent outline-none" />
          </div>
          <button onClick={() => { playSound('pop'); onClose(); }} className="p-2"><Icons.X className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {filtered.map((u, i) => (
            <button key={i} onClick={() => { playSound('pop'); onViewProfile(u); onClose(); }} className="w-full p-3 bg-white/5 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition">
              <div className={"w-12 h-12 rounded-full flex items-center justify-center font-bold " + (u.role === 'Founder' ? 'founder-avatar' : 'bg-gradient-to-br from-purple-500 to-pink-500')}>
                {u.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-1.5"><span className="font-semibold">{u.username}</span>{u.role === 'Founder' && <Icons.Shield className="w-3.5 h-3.5 text-yellow-500" />}</div>
                <span className="text-xs text-gray-500">{u.role || 'Member'}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center py-10 text-gray-500">No users found</p>}
        </div>
      </motion.div>
    </>
  );
};

const PostCard = ({ post, user, onDelete, onViewProfile, onUpdate }) => {
  const userId = user?._id || user?.id;
  const [liked, setLiked] = useState(post.likes?.includes(userId));
  const [disliked, setDisliked] = useState(post.dislikes?.includes(userId));
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [dislikes, setDislikes] = useState(post.dislikes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [deleting, setDeleting] = useState(false);
  const isFounder = post.role === 'Founder';
  const canDelete = user?.role === 'Founder' || post.username === user?.username;

  const handleLike = async () => {
    playSound('pop');
    try {
      await axios.put(API + '/posts/' + post._id + '/like', {}, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      if (liked) { setLiked(false); setLikes(l => l - 1); }
      else { setLiked(true); setLikes(l => l + 1); if (disliked) { setDisliked(false); setDislikes(d => d - 1); } if (isFounder) confetti({ particleCount: 50, spread: 60, colors: ['#ffd700', '#ff8c00'] }); }
    } catch(e) {}
  };
  
  const handleDislike = async () => {
    playSound('pop');
    try {
      await axios.put(API + '/posts/' + post._id + '/dislike', {}, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      if (disliked) { setDisliked(false); setDislikes(d => d - 1); }
      else { setDisliked(true); setDislikes(d => d + 1); if (liked) { setLiked(false); setLikes(l => l - 1); } }
    } catch(e) {}
  };
  
  const handleDelete = async () => { if (!confirm('Delete?')) return; setDeleting(true); playSound('delete'); explodeEffect(); try { await axios.delete(API + '/posts/' + post._id, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }); setTimeout(() => onDelete(post._id), 500); } catch (e) { setDeleting(false); } };
  
  const deleteComment = async (commentId) => {
    playSound('delete'); explodeEffect();
    try {
      await axios.delete(API + '/posts/' + post._id + '/comment/' + commentId, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      setComments(comments.filter(c => c._id !== commentId));
    } catch(e) {}
  };
  
  const addComment = async () => {
    if (!newComment.trim()) return;
    playSound('whoosh');
    try {
      const res = await axios.post(API + '/posts/' + post._id + '/comment', { text: newComment }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }});
      setComments(res.data);
      setNewComment('');
    } catch(e) {}
  };

  return (
    <motion.div layout initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.5}} className={"glass-3d card overflow-hidden " + (isFounder ? 'founder-glow' : '') + (deleting ? ' explode' : '')}>
      <div className="p-4 flex items-center justify-between">
        <button onClick={() => onViewProfile({ username: post.username, role: post.role })} className="flex items-center gap-3 hover:opacity-80 transition">
          <div className={"w-11 h-11 rounded-full flex items-center justify-center font-bold " + (isFounder ? 'founder-avatar' : 'bg-gradient-to-br from-purple-500 to-pink-500')}>{post.username?.[0]?.toUpperCase()}</div>
          <div className="text-left">
            <div className="flex items-center gap-1.5"><span className="font-semibold">{post.username}</span>{isFounder && <Icons.Shield className="w-4 h-4 text-yellow-500" />}</div>
            <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </button>
        {canDelete && <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-500/20 rounded-full transition"><Icons.Trash className="w-5 h-5" /></button>}
      </div>
      {post.image && <img src={post.image} className="w-full aspect-square object-cover" />}
      <div className="p-4">
        <div className="flex items-center gap-5 mb-3">
          <button onClick={handleLike} className={"flex items-center gap-1.5 transition " + (liked ? 'text-red-500 like-anim' : 'text-gray-400 hover:text-white')}><Icons.Heart className={"w-7 h-7 " + (liked ? 'fill-red-500' : '')} fill={liked ? 'currentColor' : 'none'} /><span className="font-medium">{likes}</span></button>
          <button onClick={handleDislike} className={"transition " + (disliked ? 'text-blue-500' : 'text-gray-400 hover:text-white')}><Icons.ThumbDown className="w-6 h-6" fill={disliked ? 'currentColor' : 'none'} /></button>
          <button onClick={() => { setShowComments(!showComments); playSound('pop'); }} className="text-gray-400 hover:text-white flex items-center gap-1.5"><Icons.Comment className="w-6 h-6" /><span>{comments.length}</span></button>
        </div>
        {post.title && <h3 className="font-bold text-lg mb-1">{post.title}</h3>}
        <p className="text-sm text-gray-300 leading-relaxed">{parseHashtags(post.desc)}</p>
        <AnimatePresence>
          {showComments && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="mt-4 border-t border-white/10 pt-4">
              <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                {comments.map(c => (
                  <motion.div key={c._id || c.id} layout className="flex items-start gap-2 group">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">{(c.authorName || c.user)?.[0]?.toUpperCase()}</div>
                    <div className="flex-1"><span className="font-semibold text-sm">{c.authorName || c.user}</span><span className="text-sm text-gray-300 ml-2">{parseHashtags(c.text)}</span></div>
                    {(user?.role === 'Founder' || c.authorName === user?.username || c.user === user?.username) && <button onClick={() => deleteComment(c._id || c.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400"><Icons.Trash className="w-4 h-4" /></button>}
                  </motion.div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Comment..." className="flex-1 bg-white/5 rounded-full px-4 py-2.5 text-sm outline-none border border-white/10" onKeyPress={e => e.key === 'Enter' && addComment()} />
                <button onClick={addComment} className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"><Icons.Send className="w-4 h-4" /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const CreateModal = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState(''); 
  const [desc, setDesc] = useState(''); 
  const [image, setImage] = useState(null); 
  const [preview, setPreview] = useState(null); 
  const [loading, setLoading] = useState(false); 
  const fileRef = useRef();
  
  const submit = async e => { 
    e.preventDefault(); 
    if (!desc && !image) return; 
    setLoading(true); 
    playSound('whoosh'); 
    const fd = new FormData(); 
    if (title) fd.append('title', title); 
    fd.append('desc', desc); 
    if (image) fd.append('image', image);
    
    try { 
      await axios.post(API + '/posts', fd, { 
        headers: { 
          Authorization: 'Bearer ' + localStorage.getItem('token'), 
          'Content-Type': 'multipart/form-data' 
        }
      }); 
      playSound('magic');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); 
      setTitle(''); 
      setDesc(''); 
      setImage(null); 
      setPreview(null); 
      onSuccess(); 
      onClose(); 
    } catch (e) { 
      console.error('Post error:', e);
      playSound('error');
      alert('Failed to create post. Please try again.');
    } 
    setLoading(false); 
  };
  
  if (!isOpen) return null;
  return (<><motion.div initial={{opacity:0}} animate={{opacity:1}} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]" /><motion.div initial={{opacity:0,scale:0.9,y:50}} animate={{opacity:1,scale:1,y:0}} className="fixed inset-x-4 top-[10%] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg glass-3d p-6 z-[101]"><div className="flex justify-between mb-6"><h2 className="text-xl font-bold">New Post</h2><button onClick={() => { playSound('pop'); onClose(); }}><Icons.X className="w-6 h-6" /></button></div><form onSubmit={submit} className="space-y-4"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)" className="w-full p-4 bg-white/5 rounded-2xl outline-none border border-white/10 focus:border-purple-500 transition" /><textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's happening?" rows={3} className="w-full p-4 bg-white/5 rounded-2xl outline-none border border-white/10 resize-none focus:border-purple-500 transition" />{preview && <div className="relative"><img src={preview} className="w-full h-48 object-cover rounded-2xl" /><button type="button" onClick={() => {setImage(null);setPreview(null);}} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full"><Icons.X className="w-4 h-4" /></button></div>}<input ref={fileRef} type="file" hidden accept="image/*" onChange={e => {const f=e.target.files[0];if(f){setImage(f);setPreview(URL.createObjectURL(f));}}} /><button type="button" onClick={() => fileRef.current?.click()} className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10"><Icons.Image className="w-5 h-5 text-purple-400" /> Add Photo</button><motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} type="submit" disabled={loading} className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold disabled:opacity-50 shadow-lg shadow-purple-500/25">{loading ? 'Posting...' : 'Share'}</motion.button></form></motion.div></>);
};

// Settings Modal
const SettingsModal = ({ isOpen, onClose, user, logout }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  if (!isOpen) return null;
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]" />
      <motion.div initial={{opacity:0,y:100}} animate={{opacity:1,y:0}} className="fixed inset-x-4 bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md glass-3d p-6 z-[101]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={() => { playSound('pop'); onClose(); }} className="p-2 hover:bg-white/10 rounded-full"><Icons.X className="w-5 h-5" /></button>
        </div>
        
        <div className="space-y-3">
          {/* Profile Card */}
          <div className="p-4 glass-btn rounded-2xl flex items-center gap-4">
            <div className={"w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold " + (user?.role === 'Founder' ? 'founder-avatar' : 'bg-gradient-to-br from-purple-500 to-pink-500')}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{user?.username}</span>
                {user?.role === 'Founder' && <Icons.Shield className="w-4 h-4 text-yellow-500" />}
              </div>
              <span className="text-sm text-gray-400">{user?.email || user?.role}</span>
            </div>
          </div>
          
          {/* Sound Toggle */}
          <div className="p-4 glass-btn rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔊</span>
              <span>Sound Effects</span>
            </div>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className={"w-12 h-7 rounded-full transition-all " + (soundEnabled ? 'bg-purple-600' : 'bg-white/20')}>
              <div className={"w-5 h-5 bg-white rounded-full transition-all " + (soundEnabled ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>
          
          {/* Theme */}
          <div className="p-4 glass-btn rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎨</span>
              <span>Theme</span>
            </div>
            <span className="text-sm text-purple-400">Dark Mode</span>
          </div>
          
          {/* Language */}
          <div className="p-4 glass-btn rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🌐</span>
              <span>Language</span>
            </div>
            <span className="text-sm text-gray-400">English</span>
          </div>
          
          {/* Privacy */}
          <div className="p-4 glass-btn rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔒</span>
              <span>Privacy</span>
            </div>
            <Icons.Back className="w-4 h-4 rotate-180 text-gray-500" />
          </div>
          
          {/* Logout */}
          <button onClick={() => { playSound('delete'); logout(); onClose(); }} className="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition">
            <Icons.Logout className="w-5 h-5" />
            Logout
          </button>
        </div>
      </motion.div>
    </>
  );
};

const SideMenu = ({ isOpen, onClose, user, logout, onViewProfile, onOpenSettings }) => {
  if (!isOpen) return null;
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[90]" />
      <motion.div 
        initial={{x:'-100%'}} 
        animate={{x:0}} 
        transition={{type:'spring',damping:25,stiffness:200}} 
        onAnimationStart={() => playSound('whoosh')} 
        className="fixed left-0 top-0 h-full w-80 menu-liquid z-[91] p-6 rounded-none rounded-r-[32px] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8 relative z-10">
          <span className="text-2xl font-black italic bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">LEGACY</span>
          <button onClick={() => { playSound('pop'); onClose(); }} className="p-2 hover:bg-white/10 rounded-full transition">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>
        
        {/* User Profile Card */}
        <button onClick={() => { playSound('pop'); onViewProfile(user); onClose(); }} className="flex items-center gap-4 p-4 glass-btn rounded-2xl mb-6 relative z-10">
          <div className={"w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold " + (user?.role === 'Founder' ? 'founder-avatar' : 'bg-gradient-to-br from-purple-500 to-pink-500')}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{user?.username}</span>
              {user?.role === 'Founder' && <Icons.Shield className="w-4 h-4 text-yellow-500" />}
            </div>
            <span className="text-sm text-gray-400">{user?.role || 'Member'}</span>
          </div>
        </button>
        
        {/* Menu Items */}
        <div className="flex-1 space-y-1 relative z-10">
          <button onClick={() => { playSound('pop'); onViewProfile(user); onClose(); }} className="menu-item w-full p-4 rounded-2xl flex items-center gap-3 text-left">
            <Icons.User className="w-5 h-5 text-purple-400" /> 
            <span>Profile</span>
          </button>
          <button onClick={() => { playSound('pop'); onOpenSettings(); onClose(); }} className="menu-item w-full p-4 rounded-2xl flex items-center gap-3 text-left">
            <Icons.Settings className="w-5 h-5 text-purple-400 settings-icon" /> 
            <span>Settings</span>
          </button>
          <button className="menu-item w-full p-4 rounded-2xl flex items-center gap-3 text-left">
            <span className="text-lg">🔔</span>
            <span>Notifications</span>
          </button>
          <button className="menu-item w-full p-4 rounded-2xl flex items-center gap-3 text-left">
            <span className="text-lg">💬</span>
            <span>Messages</span>
          </button>
          {user?.role === 'Founder' && (
            <button className="w-full p-4 rounded-2xl flex items-center gap-3 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 mt-4">
              <Icons.Shield className="w-5 h-5" /> 
              <span>Founder Panel</span>
            </button>
          )}
        </div>
        
        {/* Logout */}
        <button onClick={() => { playSound('delete'); logout(); }} className="p-4 rounded-2xl flex items-center gap-3 text-red-400 border border-red-500/20 hover:bg-red-500/10 transition relative z-10">
          <Icons.Logout className="w-5 h-5" /> 
          <span>Logout</span>
        </button>
      </motion.div>
    </>
  );
};

const Auth = ({ setUser }) => {
  const [mode, setMode] = useState('login'); // login, register, forgot
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    playSound('whoosh');
    
    if (mode === 'forgot') {
      // Send real password reset email
      try {
        const response = await axios.post(API + '/auth/forgot-password', { email: form.email });
        playSound('magic');
        setResetSent(true);
        setLoading(false);
      } catch (error) {
        playSound('error');
        console.error('Forgot password error:', error);
        // Still show success for security (don't reveal if email exists)
        setResetSent(true);
        setLoading(false);
      }
      return;
    }
    
    try {
      const r = await axios.post(API + '/auth/' + (mode === 'login' ? 'login' : 'register'), form);
      if (mode === 'login') {
        localStorage.setItem('token', r.data.token);
        localStorage.setItem('user', JSON.stringify(r.data.user));
        playSound('magic');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setUser(r.data.user);
      } else {
        playSound('success');
        alert('Account created! Please login.');
        setMode('login');
      }
    } catch (e) {
      playSound('error');
      alert(e.response?.data?.message || 'Error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      
      <motion.div 
        initial={{opacity:0,y:30,scale:0.95}} 
        animate={{opacity:1,y:0,scale:1}} 
        className="glass-3d p-8 w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.h1 
          initial={{scale:0.8}} 
          animate={{scale:1}} 
          transition={{type:'spring',damping:10}}
          className="text-5xl font-black italic text-center mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
        >
          LEGACY
        </motion.h1>
        <p className="text-center text-gray-500 mb-8">The Elite Academy</p>
        
        {mode === 'forgot' && resetSent ? (
          <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-4xl">📧</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Check Your Email!</h3>
            <p className="text-gray-400 text-sm mb-2">We've sent a password reset link to:</p>
            <p className="text-purple-400 font-bold mb-4">{form.email}</p>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
              <p className="text-xs text-yellow-200">⏰ Link expires in 1 hour</p>
              <p className="text-xs text-gray-400 mt-1">Check your spam folder if you don't see it</p>
            </div>
            <motion.button 
              type="button"
              whileHover={{scale:1.05}}
              whileTap={{scale:0.95}}
              onClick={() => { 
                setResetSent(false); 
                setMode('login'); 
                playSound('pop');
              }} 
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold shadow-lg shadow-purple-500/25"
            >
              ← Back to Login
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Mode Toggle */}
            {mode !== 'forgot' && (
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => { setMode('login'); playSound('pop'); }} 
                  className={"flex-1 p-3 rounded-xl font-bold transition " + (mode === 'login' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-white/5 text-gray-400')}
                >
                  Login
                </button>
                <button 
                  onClick={() => { setMode('register'); playSound('pop'); }} 
                  className={"flex-1 p-3 rounded-xl font-bold transition " + (mode === 'register' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-white/5 text-gray-400')}
                >
                  Sign Up
                </button>
              </div>
            )}
            
            {mode === 'forgot' && (
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Forgot Password?</h3>
                <p className="text-gray-400 text-sm">Enter your email and we'll send you a reset link</p>
              </div>
            )}
            
            <form onSubmit={submit} className="space-y-4">
              {mode === 'register' && (
                <input 
                  placeholder="Username" 
                  className="w-full p-4 bg-white/5 rounded-2xl outline-none border border-white/10 focus:border-purple-500 transition" 
                  onChange={e => setForm({...form, username: e.target.value})} 
                  required 
                />
              )}
              <input 
                type="email" 
                placeholder="Email" 
                className="w-full p-4 bg-white/5 rounded-2xl outline-none border border-white/10 focus:border-purple-500 transition" 
                onChange={e => setForm({...form, email: e.target.value})} 
                required 
              />
              {mode !== 'forgot' && (
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full p-4 bg-white/5 rounded-2xl outline-none border border-white/10 focus:border-purple-500 transition" 
                  onChange={e => setForm({...form, password: e.target.value})} 
                  required 
                />
              )}
              
              <motion.button 
                whileHover={{scale:1.02}} 
                whileTap={{scale:0.98}}
                disabled={loading} 
                className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 font-bold rounded-2xl disabled:opacity-50 shadow-lg shadow-purple-500/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Processing...
                  </span>
                ) : mode === 'forgot' ? 'Send Reset Link' : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
              </motion.button>
            </form>
            
            {mode === 'login' && (
              <button 
                onClick={() => { setMode('forgot'); playSound('pop'); }} 
                className="w-full text-center mt-4 text-sm text-gray-500 hover:text-purple-400 transition"
              >
                Forgot your password?
              </button>
            )}
            
            {mode === 'forgot' && (
              <button 
                onClick={() => { setMode('login'); playSound('pop'); }} 
                className="w-full text-center mt-4 text-sm text-purple-400 font-bold"
              >
                ← Back to Login
              </button>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  useEffect(() => { const u = localStorage.getItem('user'); if(u) setUser(JSON.parse(u)); }, []);
  useEffect(() => { if(user) { fetchPosts(); fetchUsers(); } }, [user]);

  const fetchPosts = async () => { try { const r = await axios.get(API + '/posts?json=true'); setPosts(r.data); } catch(e){} };
  const fetchUsers = async () => { try { const r = await axios.get(API + '/users', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }}); setUsers(r.data); } catch(e){ setUsers([{username:'LegacyFounder',role:'Founder'},{username:'Member1',role:'User'},{username:'Member2',role:'User'}]); } };
  const logout = () => { localStorage.clear(); setUser(null); };
  const deletePost = id => setPosts(posts.filter(p => p._id !== id));
  const viewProfile = (u) => { setProfileUser(u); setProfileOpen(true); };

  const filtered = posts.filter(p => { if (!search) return true; const s = search.toLowerCase(); return p.title?.toLowerCase().includes(s) || p.desc?.toLowerCase().includes(s) || p.username?.toLowerCase().includes(s); });

  if (!user) return <Auth setUser={setUser} />;

  return (
    <div className="min-h-screen max-w-xl mx-auto border-x border-white/5">
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} user={user} logout={logout} onViewProfile={viewProfile} onOpenSettings={() => setSettingsOpen(true)} />
      <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSuccess={fetchPosts} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} users={users} onViewProfile={viewProfile} />
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} profileUser={profileUser} currentUser={user} posts={posts} allUsers={users} onViewProfile={viewProfile} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} logout={logout} />

      <header className="glass-3d sticky top-4 mx-4 p-3 z-50 flex items-center gap-3">
        <button onClick={() => { setMenuOpen(true); playSound('pop'); }} className="p-2 hover:bg-white/10 rounded-full"><Icons.Menu className="w-6 h-6" /></button>
        <button onClick={() => { setSearchOpen(true); playSound('pop'); }} className="flex-1 flex items-center gap-2 bg-white/5 rounded-full px-4 py-2.5 border border-white/10 text-left">
          <Icons.Search className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500 text-sm">Search users...</span>
        </button>
        <button onClick={() => viewProfile(user)} className={"w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm " + (user?.role === 'Founder' ? 'founder-avatar' : 'bg-gradient-to-br from-purple-500 to-pink-500')}>{user?.username?.[0]?.toUpperCase()}</button>
      </header>

      <main className="p-4 mt-6 space-y-6 pb-32">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-20 text-gray-500"><p className="text-lg">No posts found</p></motion.div> : filtered.map(post => <PostCard key={post._id} post={post} user={user} onDelete={deletePost} onViewProfile={viewProfile} />)}
        </AnimatePresence>
      </main>

      <motion.button whileHover={{scale:1.1,rotate:90}} whileTap={{scale:0.9}} onClick={() => { setCreateOpen(true); playSound('pop'); }} className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/30 z-50"><Icons.Plus className="w-8 h-8" /></motion.button>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
</script>
</body>
</html>`;
  res.send(html);
});

router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    console.log("Creating post:", req.body, "User:", req.user, "File:", req.file);
    const newPost = new Post({
      title: req.body.title || '',
      desc: req.body.desc || req.body.description || '',
      image: req.file?.path || "",
      author: req.user.id || req.user.userId,
      username: req.user.username,
      role: req.user.role
    });
    const savedPost = await newPost.save();
    console.log("Post saved:", savedPost._id);
    res.status(201).json(savedPost);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json("Not found");
    if (post.username !== req.user.username && req.user.role !== "Founder") return res.status(403).json("Forbidden");
    await post.deleteOne();
    res.status(200).json("Deleted");
  } catch (e) { res.status(500).json(e); }
});

// LIKE a post
router.put("/:id/like", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id || req.user.userId;
    if (!post.likes.includes(userId)) {
      await post.updateOne({ $push: { likes: userId }, $pull: { dislikes: userId } });
      res.status(200).json({ message: "Liked", likes: post.likes.length + 1, dislikes: Math.max(0, (post.dislikes?.length || 0) - (post.dislikes?.includes(userId) ? 1 : 0)) });
    } else {
      await post.updateOne({ $pull: { likes: userId } });
      res.status(200).json({ message: "Unliked", likes: post.likes.length - 1, dislikes: post.dislikes?.length || 0 });
    }
  } catch (e) { res.status(500).json(e); }
});

// DISLIKE a post
router.put("/:id/dislike", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user.id || req.user.userId;
    if (!post.dislikes?.includes(userId)) {
      await post.updateOne({ $push: { dislikes: userId }, $pull: { likes: userId } });
      res.status(200).json({ message: "Disliked" });
    } else {
      await post.updateOne({ $pull: { dislikes: userId } });
      res.status(200).json({ message: "Removed dislike" });
    }
  } catch (e) { res.status(500).json(e); }
});

// ADD comment
router.post("/:id/comment", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const newComment = {
      text: req.body.text,
      authorName: req.user.username,
      authorId: req.user.id || req.user.userId,
      createdAt: new Date()
    };
    post.comments.push(newComment);
    await post.save();
    res.status(200).json(post.comments);
  } catch (e) { res.status(500).json(e); }
});

// DELETE comment
router.delete("/:id/comment/:commentId", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json("Comment not found");
    const userId = req.user.id || req.user.userId;
    if (comment.authorId?.toString() !== userId && req.user.role !== "Founder") {
      return res.status(403).json("Forbidden");
    }
    post.comments.pull(req.params.commentId);
    await post.save();
    res.status(200).json("Deleted");
  } catch (e) { res.status(500).json(e); }
});

export default router;
