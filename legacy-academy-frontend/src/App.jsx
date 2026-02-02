import React, { useState, useEffect, useRef } from 'react';
import axios from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './components/Icons';
import { useTranslation } from './translations';
import { playSound, explodeEffect } from './utils/sounds';

// --- CONFIG ---
const API_URL = axios.defaults.baseURL;
const BASE_URL = API_URL.replace('/api', '');

const resolveMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const parseHashtags = (text) => text ? text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) => part.startsWith('#') ? <span key={i} className="text-blue-400 font-medium hover:underline cursor-pointer">{part}</span> : part) : text;

// --- UTILS ---
const applyTheme = (color) => {
    const root = document.documentElement;
    let primary = '#3b82f6';
    if (color === 'gold') primary = '#d4af37';
    if (color === 'red') primary = '#ef4444';
    if (color === 'green') primary = '#22c55e';
    if (color === 'purple') primary = '#a855f7';

    const styleTag = document.getElementById('theme-override') || document.createElement('style');
    styleTag.id = 'theme-override';
    document.head.appendChild(styleTag);
    styleTag.innerHTML = `
        .accent-text { color: ${primary} !important; }
        .accent-bg { background-color: ${primary} !important; }
        .accent-border { border-color: ${primary} !important; }
    `;
};

// --- COMPONENTS ---

const NotificationItem = ({ note, onDelete, onViewProfile }) => {
    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group border-b border-white/5">
            <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10" onClick={(e) => { e.stopPropagation(); onViewProfile(note.sender) }}>
                {note.sender?.profilePic ? <img src={resolveMediaUrl(note.sender.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-sm text-gray-400">{note.sender?.username?.[0]}</div>}
            </div>
            <div className="flex-1 text-sm">
                <span className="font-bold text-white mr-1" onClick={(e) => { e.stopPropagation(); onViewProfile(note.sender) }}>{note.sender?.username}</span>
                <span className="text-gray-400 font-normal">
                    {note.type === 'like' && 'liked your post.'}
                    {note.type === 'comment' && 'commented: "Nice work"'}
                    {note.type === 'follow' && 'started following you.'}
                    {note.type === 'message' && 'sent you a message.'}
                </span>
                <div className="text-[10px] text-gray-600 mt-0.5">2h ago</div>
            </div>
            {note.type === 'follow' ?
                <button className="px-3 py-1.5 bg-blue-600 rounded-lg text-xs font-bold text-white">Follow</button> :
                (note.postImage && <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-800"><img src={note.postImage} className="w-full h-full object-cover" /></div>)
            }
        </motion.div>
    );
};

const UserListModal = ({ isOpen, onClose, users, title, currentUser, onViewProfile }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm bg-[#1a1a1a] rounded-2xl overflow-hidden h-96 flex flex-col shadow-2xl border border-white/5">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]">
                    <span className="font-bold text-white text-base capitalize">{title}</span>
                    <button onClick={onClose}><Icons.X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {users.map(u => (
                        <div key={u._id} onClick={() => { onViewProfile(u); onClose(); }} className="p-3 flex items-center gap-3 hover:bg-white/5 rounded-xl cursor-pointer">
                            <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden">
                                {u.profilePic ? <img src={resolveMediaUrl(u.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{u.username[0]}</div>}
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-sm text-white">{u.username}</div>
                                <div className="text-xs text-gray-500">Legacy Member</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const Highlights = () => {
    const items = ['Gym', 'Biz', 'Travel', 'Cars'];
    return (
        <div className="flex gap-4 overflow-x-auto px-4 py-2 custom-scrollbar no-scrollbar mb-2">
            <div className="flex flex-col items-center gap-1 cursor-pointer">
                <div className="w-16 h-16 rounded-full border border-gray-700 flex items-center justify-center bg-white/5">
                    <Icons.Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-gray-400 font-medium">New</span>
            </div>
            {items.map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-16 h-16 rounded-full border border-gray-800 bg-gray-900 p-0.5">
                        <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-900" />
                        </div>
                    </div>
                    <span className="text-xs text-gray-300 font-medium">{item}</span>
                </div>
            ))}
        </div>
    );
};

const CreateModal = ({ isOpen, onClose, onSuccess, user }) => {
    const { t } = useTranslation(user);
    const [preview, setPreview] = useState(null);
    const [isVideo, setIsVideo] = useState(false);
    const fileRef = useRef(null);
    if (!isOpen) return null;
    const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { setPreview(URL.createObjectURL(file)); setIsVideo(file.type.startsWith('video')); } };
    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/90">
            <div className="w-full max-w-sm bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/10 shadow-3xl">
                <div className="p-3 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
                    <h2 className="text-sm font-bold text-white">New Post</h2>
                    <button onClick={onClose}><Icons.X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden shrink-0">
                            {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full center text-gray-500 font-bold">{user.username[0]}</div>}
                        </div>
                        <textarea id="post-desc" placeholder="Write something..." className="flex-1 bg-transparent border-none text-white resize-none h-20 outline-none text-sm placeholder-gray-500" />
                    </div>
                    <div onClick={() => fileRef.current.click()} className="cursor-pointer">
                        {preview ? (
                            <div className="w-full h-48 rounded-lg overflow-hidden relative bg-black border border-white/10">
                                {isVideo ? <video src={preview} className="w-full h-full object-contain" controls /> : <img src={preview} className="w-full h-full object-cover" />}
                                <button onClick={(e) => { e.stopPropagation(); setPreview(null); fileRef.current.value = ''; }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full"><Icons.X className="w-3 h-3 text-white" /></button>
                            </div>
                        ) : (
                            <div className="w-full py-8 border border-gray-800 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all">
                                <Icons.Image className="w-6 h-6 text-gray-500" />
                                <span className="text-xs font-bold text-gray-500">Add Photo/Video</span>
                            </div>
                        )}
                        <input type="file" ref={fileRef} accept="image/*,video/*" hidden onChange={handleFileChange} />
                    </div>
                    <button onClick={async () => {
                        const desc = document.getElementById('post-desc').value;
                        const file = fileRef.current.files[0];
                        if (!desc && !file) return;
                        const btn = document.getElementById('btn-upload'); btn.innerText = "Posting..."; btn.disabled = true;
                        const fd = new FormData(); fd.append('desc', desc); if (file) fd.append('image', file);
                        try { await axios.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); onSuccess(); setPreview(null); playSound('pop'); }
                        catch (e) { alert("Failed"); btn.innerText = "Share"; btn.disabled = false; }
                    }} id="btn-upload" className="w-full py-3 bg-blue-600 rounded-lg text-sm font-bold text-white hover:bg-blue-700">{t('POST') || 'Share'}</button>
                </div>
            </div>
        </div>
    );
};

const ChatModal = ({ isOpen, onClose, user, following }) => {
    const [messages, setMessages] = useState({});
    const [txt, setTxt] = useState('');
    const [activeChat, setActiveChat] = useState(null);
    const bottomRef = useRef(null);

    // Mock response logic
    useEffect(() => {
        if (messages[activeChat?._id]?.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            const lastMsg = messages[activeChat._id][messages[activeChat._id].length - 1];
            if (lastMsg.sender === user._id) {
                setTimeout(() => {
                    const reply = { id: Date.now(), text: "Received.", sender: activeChat._id, createdAt: new Date().toISOString() };
                    setMessages(prev => ({ ...prev, [activeChat._id]: [...(prev[activeChat._id] || []), reply] }));
                }, 2000);
            }
        }
    }, [messages, activeChat]);

    if (!isOpen) return null;

    const sendMessage = () => {
        if (!txt.trim()) return;
        const msg = { id: Date.now(), text: txt, sender: user._id, createdAt: new Date().toISOString() };
        setMessages(prev => ({ ...prev, [activeChat._id]: [...(prev[activeChat._id] || []), msg] }));
        setTxt('');
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-0 sm:p-4">
            <div className="w-full max-w-4xl h-full sm:h-[85vh] bg-black sm:rounded-3xl flex overflow-hidden sm:border border-white/10">
                {/* LIST */}
                <div className={`w-full sm:w-80 border-r border-white/10 flex flex-col ${activeChat ? 'hidden sm:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-white">Chats</h2>
                        <button onClick={onClose} className="sm:hidden"><Icons.X className="w-6 h-6 text-white" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {following.map(u => (
                            <div key={u._id} onClick={() => setActiveChat(u)} className="p-4 flex items-center gap-3 hover:bg-white/5 cursor-pointer">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden">
                                        {u.profilePic ? <img src={resolveMediaUrl(u.profilePic)} className="w-full h-full object-cover" /> : <div className="center w-full h-full text-gray-500 font-bold">{u.username[0]}</div>}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-white text-sm">{u.username}</div>
                                    <div className="text-gray-500 text-xs">Active now</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CONVERSATION */}
                <div className={`flex-1 flex flex-col bg-[#050505] ${!activeChat ? 'hidden sm:flex' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-[#111]">
                                <button onClick={() => setActiveChat(null)} className="sm:hidden"><Icons.Back className="w-6 h-6 text-white" /></button>
                                <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden">
                                    {activeChat.profilePic ? <img src={resolveMediaUrl(activeChat.profilePic)} className="w-full h-full object-cover" /> : <div className="center w-full h-full">{activeChat.username[0]}</div>}
                                </div>
                                <div className="font-bold text-white text-sm">{activeChat.username}</div>
                                <Icons.Info className="w-6 h-6 text-white ml-auto" />
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {(messages[activeChat._id] || []).map((m, i) => (
                                    <div key={i} className={`flex ${m.sender === user._id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${m.sender === user._id ? 'bg-blue-600 text-white' : 'bg-[#262626] text-white'}`}>
                                            {m.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            <div className="p-3 bg-[#111] flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center"><Icons.Camera className="w-5 h-5" /></div>
                                <input value={txt} onChange={e => setTxt(e.target.value)} placeholder="Message..." className="flex-1 bg-[#222] rounded-full px-4 py-2 text-white text-sm outline-none border-none" />
                                {txt && <button onClick={sendMessage} className="text-blue-500 font-bold text-sm">Send</button>}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <Icons.MessageCircle className="w-16 h-16 mx-auto mb-2 opacity-50" />
                                <p>Your messages</p>
                                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Send Message</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ isOpen, onClose, user, logout }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative bg-[#1a1a1a] w-full max-w-sm rounded-xl overflow-hidden p-0 shadow-2xl">
                <div className="p-4 border-b border-white/5 font-bold text-center text-white">Settings</div>
                <div className="p-4 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Theme Color</label>
                        <div className="flex gap-4 justify-center">
                            {['blue', 'red', 'green', 'gold', 'purple'].map(c => (
                                <button key={c} onClick={() => applyTheme(c)} className={`w-8 h-8 rounded-full border-2 border-[#333] hover:scale-110 transition-transform`} style={{ backgroundColor: c === 'gold' ? '#d4af37' : c === 'blue' ? '#3b82f6' : c === 'red' ? '#ef4444' : c === 'green' ? '#22c55e' : '#a855f7' }} />
                            ))}
                        </div>
                    </div>
                </div>
                <button onClick={logout} className="w-full py-4 text-red-500 font-bold border-t border-white/5 hover:bg-white/5 transition-colors">Log Out</button>
            </div>
        </div>
    );
};

const ProfileModal = ({ isOpen, onClose, profileUser, currentUser, posts, allUsers, onViewProfile }) => {
    const [userData, setUserData] = useState(profileUser);
    const userPosts = posts.filter(p => p.username === profileUser?.username);
    const isOwnProfile = profileUser?.username === currentUser?.username;

    if (!isOpen || !profileUser) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative bg-black w-full max-w-lg h-[95vh] sm:rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl">

                <div className="p-3 flex items-center justify-between border-b border-white/10">
                    <button onClick={onClose}><Icons.Back className="w-6 h-6 text-white" /></button>
                    <div className="font-bold text-white text-sm">{profileUser.username}</div>
                    <Icons.Menu className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-20 h-20 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                {profileUser.profilePic ? <img src={resolveMediaUrl(profileUser.profilePic)} className="w-full h-full object-cover" /> : <div className="center w-full h-full text-white font-bold text-xl">{profileUser.username[0]}</div>}
                            </div>
                            <div className="flex gap-6 text-center">
                                <div><div className="font-bold text-white text-lg">{userPosts.length}</div><div className="text-xs text-gray-400">Posts</div></div>
                                <div><div className="font-bold text-white text-lg">1.2M</div><div className="text-xs text-gray-400">Followers</div></div>
                                <div><div className="font-bold text-white text-lg">0</div><div className="text-xs text-gray-400">Following</div></div>
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="font-bold text-white">{profileUser.username}</div>
                            <div className="text-sm text-gray-300">Entrepreneur.</div>
                        </div>

                        <div className="flex gap-2 mb-6">
                            {isOwnProfile ? (
                                <button className="flex-1 bg-[#262626] text-white font-semibold py-1.5 rounded-lg text-sm">Edit Profile</button>
                            ) : (
                                <>
                                    <button className="flex-1 bg-blue-600 text-white font-semibold py-1.5 rounded-lg text-sm">Follow</button>
                                    <button className="flex-1 bg-[#262626] text-white font-semibold py-1.5 rounded-lg text-sm">Message</button>
                                </>
                            )}
                        </div>

                        <Highlights />
                    </div>

                    <div className="border-t border-white/10">
                        <div className="flex">
                            <button className="flex-1 py-3 border-b border-white text-white"><Icons.Grid className="w-5 h-5 mx-auto" /></button>
                            <button className="flex-1 py-3 text-gray-500"><Icons.User className="w-5 h-5 mx-auto" /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-0.5 mt-0.5">
                            {userPosts.map(p => (
                                <div key={p._id} className="aspect-square bg-gray-900 border border-black overflow-hidden relative">
                                    {p.image ? <img src={resolveMediaUrl(p.image)} className="w-full h-full object-cover" /> : null}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// --- MAIN APP ---

const App = () => {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('home');
    const [createOpen, setCreateOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);

    // Initial Mock Alerts
    const [alerts, setAlerts] = useState([
        { id: 1, type: 'like', sender: { username: 'tristan_tate', profilePic: '/uploads/tristan.jpg' }, postImage: 'https://via.placeholder.com/50' },
        { id: 2, type: 'comment', sender: { username: 'charlie', profilePic: '' }, postImage: 'https://via.placeholder.com/50' },
    ]);

    const { t } = useTranslation(user);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);

    useEffect(() => {
        if (user) {
            fetchPosts();
            fetchUsers();
        }
    }, [user]);

    const fetchPosts = async () => { try { const r = await axios.get('/posts?limit=100'); setPosts(r.data); } catch (e) { } };
    const fetchUsers = async () => { try { const r = await axios.get('/users'); setUsers(r.data); } catch (e) { } };

    // NAVIGATION
    const handleNav = (tab) => {
        setActiveTab(tab);
        if (tab === 'search') setSearchOpen(true);
        if (tab === 'chat') setChatOpen(true);
        if (tab === 'profile') viewProfile(user);
    };

    const logout = () => { localStorage.clear(); setUser(null); window.location.reload(); };
    const viewProfile = (u) => { setProfileUser(u); setProfileOpen(true); };

    // LOGIN SCREEN
    if (!user) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            <div className="w-full max-w-sm text-center relative z-10 p-8">
                <h1 className="text-4xl font-extrabold italic text-white mb-8">LEGACY</h1>
                <input type="email" placeholder="Username, email" id="login-email" className="w-full bg-[#1c1c1c] border border-[#333] rounded-lg p-3 text-white text-sm mb-3 outline-none focus:border-gray-500 transition-colors" />
                <input type="password" placeholder="Password" id="login-pass" className="w-full bg-[#1c1c1c] border border-[#333] rounded-lg p-3 text-white text-sm mb-6 outline-none focus:border-gray-500 transition-colors" />
                <button onClick={async () => {
                    const email = document.getElementById('login-email').value;
                    const password = document.getElementById('login-pass').value;
                    if (!email || !password) return alert("Please enter credentials");
                    try {
                        const res = await axios.post('/auth/login', { email, password });
                        localStorage.setItem('token', res.data.token);
                        localStorage.setItem('user', JSON.stringify(res.data.user));
                        setUser(res.data.user);
                    } catch (e) { alert("Invalid credentials"); }
                }} className="w-full py-3 bg-blue-600 rounded-lg text-white text-sm font-bold hover:bg-blue-700 transition-colors">Log in</button>
                <div className="mt-8 text-xs text-gray-500">Don't have an account? <span className="text-white font-bold cursor-pointer">Sign up</span></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white max-w-xl mx-auto border-x border-[#1a1a1a] pb-20 relative shadow-2xl">

            {/* HEADER */}
            <header className="sticky top-0 px-4 py-3 z-40 bg-black/90 backdrop-blur-md border-b border-[#1a1a1a] flex items-center justify-between">
                <div className="text-xl font-bold italic tracking-tighter cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>LEGACY</div>
                <div className="flex gap-4 items-center">
                    <button onClick={() => setCreateOpen(true)}><Icons.Plus className="w-6 h-6 text-white" /></button>
                    <button onClick={() => setChatOpen(true)} className="relative">
                        <Icons.MessageCircle className="w-6 h-6 text-white" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold">2</div>
                    </button>
                </div>
            </header>

            <main className="relative z-10">
                {activeTab === 'alerts' ? (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-xl text-white">Notifications</h2>
                        </div>
                        <div className="space-y-1">
                            {alerts.map((n) => <NotificationItem key={n.id} note={n} onViewProfile={viewProfile} onDelete={() => { }} />)}
                        </div>
                    </div>
                ) : (
                    // Post list
                    <div className="divide-y divide-[#1a1a1a]">
                        <Highlights />
                        {posts.map(post => (
                            <div key={post._id} className="bg-black pb-4">
                                <div className="px-3 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => viewProfile(post.author || { username: 'Unknown' })}>
                                        <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden">
                                            {(post.author?.profilePic) ? <img src={resolveMediaUrl(post.author.profilePic)} className="w-full h-full object-cover" /> : null}
                                        </div>
                                        <span className="font-semibold text-sm text-white">{(post.author?.username) || 'Unknown'}</span>
                                    </div>
                                    <Icons.Menu className="w-4 h-4 text-white rotate-90" />
                                </div>
                                <div className="w-full bg-[#111] aspect-square overflow-hidden flex items-center justify-center">
                                    {post.image ? <img src={resolveMediaUrl(post.image)} className="w-full h-full object-cover" /> : <span className="text-gray-700">No Image</span>}
                                </div>
                                <div className="px-3 py-3">
                                    <div className="flex justify-between mb-2">
                                        <div className="flex gap-4">
                                            <Icons.Heart className="w-6 h-6 text-white hover:text-gray-400 cursor-pointer" />
                                            <Icons.MessageCircle className="w-6 h-6 text-white hover:text-gray-400 cursor-pointer" />
                                            <Icons.Send className="w-6 h-6 text-white hover:text-gray-400 cursor-pointer" />
                                        </div>
                                        <Icons.Bookmark className="w-6 h-6 text-white hover:text-gray-400 cursor-pointer" />
                                    </div>
                                    <div className="font-bold text-sm mb-1">{post.likes?.length || 0} likes</div>
                                    <div className="text-sm">
                                        <span className="font-bold mr-2">{(post.author?.username) || 'user'}</span>
                                        {post.desc && <span className="text-gray-100">{parseHashtags(post.desc)}</span>}
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1 uppercase">2 HOURS AGO</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* MODALS */}
            <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => { setCreateOpen(false); fetchPosts(); }} user={user} />
            <SettingsModal isOpen={false} onClose={() => { }} user={user} logout={logout} />
            <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} profileUser={profileUser} currentUser={user} posts={posts} allUsers={users} onViewProfile={viewProfile} />
            <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} user={user} following={users} />

            {/* SEARCH OVERLAY */}
            {searchOpen && (
                <div className="fixed inset-0 z-[150] bg-black p-4">
                    <div className="relative mb-4">
                        <Icons.Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <input autoFocus placeholder="Search" className="w-full bg-[#262626] rounded-xl py-2.5 pl-10 text-white outline-none" />
                    </div>
                    <button onClick={() => setSearchOpen(false)} className="text-blue-500 text-sm font-bold">Cancel</button>
                </div>
            )}

            {/* BOTTOM NAV */}
            <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-black border-t border-[#1a1a1a] flex justify-around items-center py-3 z-50">
                <button onClick={() => handleNav('home')}><Icons.Home className={`w-6 h-6 ${activeTab === 'home' ? 'text-white' : 'text-gray-500'}`} /></button>
                <button onClick={() => handleNav('search')}><Icons.Search className={`w-6 h-6 ${activeTab === 'search' ? 'text-white' : 'text-gray-500'}`} /></button>
                <button onClick={() => setCreateOpen(true)}><Icons.Plus className="w-6 h-6 text-white border-2 border-white rounded-lg p-0.5" /></button>
                <button onClick={() => handleNav('alerts')}><Icons.Heart className={`w-6 h-6 ${activeTab === 'alerts' ? 'text-white' : 'text-gray-500'}`} /></button>
                <button onClick={() => handleNav('profile')}>
                    <div className={`w-6 h-6 rounded-full bg-gray-500 overflow-hidden border-2 ${activeTab === 'profile' ? 'border-white' : 'border-transparent'}`}>
                        {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : null}
                    </div>
                </button>
            </div>
        </div>
    );
};

export default App;
