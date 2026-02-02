import React, { useState, useEffect, useRef } from 'react';
import axios from './api';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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

const parseHashtags = (text) => text ? text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) => part.startsWith('#') ? <span key={i} className="text-yellow-500 font-bold">{part}</span> : part) : text;

// --- COMPONENTS ---

const SettingsModal = ({ isOpen, onClose, user, logout }) => {
    const { t, lang } = useTranslation(user);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative glass-panel w-full max-w-sm rounded-3xl overflow-hidden p-6 space-y-4">
                <div className="flex justify-between items-center text-yellow-500">
                    <h2 className="text-xl font-black italic uppercase"><Icons.Settings className="inline w-6 h-6 mr-2" /> {t('SETTINGS')}</h2>
                    <button onClick={onClose}><Icons.X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
                </div>

                <div className="glass-card p-4 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-gray-300">PRIVATE ACCOUNT</span>
                    <input type="checkbox" defaultChecked={user.isPrivate} className="accent-yellow-500 w-5 h-5 cursor-pointer" />
                </div>

                <div className="glass-card p-4 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-gray-300">{t('THEME')}</span>
                    <div className="flex gap-2">
                        {['cobalt', 'crimson', 'emerald', 'violet'].map(c => (
                            <button key={c} onClick={() => { localStorage.setItem('theme', c); document.documentElement.setAttribute('data-theme', c); playSound('click'); }} className="w-6 h-6 rounded-full border border-white/20" style={{ background: c === 'cobalt' ? 'blue' : c === 'crimson' ? 'red' : c === 'emerald' ? 'green' : 'purple' }} />
                        ))}
                    </div>
                </div>

                <button onClick={logout} className="w-full py-4 bg-red-900/20 text-red-500 border border-red-900/50 rounded-xl font-black uppercase hover:bg-red-900/40 transition-all flex items-center justify-center gap-2">
                    <Icons.Logout className="w-5 h-5" /> {t('LOGOUT')}
                </button>
            </div>
        </div>
    );
};

const CreateModal = ({ isOpen, onClose, onSuccess, user }) => {
    const { t } = useTranslation(user);
    const [preview, setPreview] = useState(null);
    const [isVideo, setIsVideo] = useState(false);
    const fileRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            setIsVideo(file.type.startsWith('video'));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
            <div className="relative glass-panel w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden border-t border-yellow-500/20 shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg font-black italic text-yellow-500 uppercase flex items-center gap-2"><Icons.Plus className="w-5 h-5" /> NEW INTEL</h2>
                    <button onClick={onClose}><Icons.X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-800 overflow-hidden shrink-0 border border-white/10">
                            {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-xl">{user.username[0]}</div>}
                        </div>
                        <textarea id="post-desc" placeholder="Classified Intel..." className="flex-1 bg-transparent border-none text-white resize-none h-20 outline-none text-lg p-2 placeholder-gray-600 font-medium" />
                    </div>

                    <div onClick={() => fileRef.current.click()} className="cursor-pointer group">
                        {preview ? (
                            <div className="w-full h-64 rounded-xl overflow-hidden relative bg-black border border-white/10">
                                {isVideo ? <video src={preview} className="w-full h-full object-contain" controls /> : <img src={preview} className="w-full h-full object-cover" />}
                                <button onClick={(e) => { e.stopPropagation(); setPreview(null); fileRef.current.value = ''; }} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full hover:bg-red-500"><Icons.X className="w-4 h-4 text-white" /></button>
                            </div>
                        ) : (
                            <div className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all bg-white/5">
                                <Icons.Camera className="w-8 h-8 text-gray-500" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-yellow-500">SELECT INTEL (PHOTO/VIDEO)</span>
                            </div>
                        )}
                        <input type="file" ref={fileRef} accept="image/*,video/*" hidden onChange={handleFileChange} />
                    </div>

                    <button onClick={async () => {
                        const desc = document.getElementById('post-desc').value;
                        const file = fileRef.current.files[0];
                        if (!desc && !file) return alert("EMPTY INTEL");

                        const btn = document.getElementById('btn-upload');
                        btn.innerText = "UPLOADING...";
                        btn.disabled = true;

                        const fd = new FormData();
                        fd.append('desc', desc);
                        if (file) fd.append('image', file);
                        try {
                            await axios.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                            onSuccess();
                            setPreview(null);
                            playSound('magic');
                            explodeEffect();
                        } catch (e) { alert("UPLOAD FAILED"); btn.innerText = "PUBLISH INTEL"; btn.disabled = false; }
                    }} id="btn-upload" className="liquid-btn w-full py-4 rounded-xl shadow-lg shadow-yellow-500/20">{t('PUBLISH_INTEL')}</button>
                </div>
            </div>
        </div>
    );
};

const PostCard = ({ post, user, onDelete, onViewProfile }) => {
    const { t } = useTranslation(user);
    const [liked, setLiked] = useState((post.likes || []).includes(user._id));
    const [likesCount, setLikesCount] = useState((post.likes || []).length);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [comments, setComments] = useState(post.comments || []);

    const isFounder = user.role === 'Founder';
    const isAuthor = (typeof post.author === 'object' ? post.author._id : post.author) === user._id;
    const author = typeof post.author === 'string' ? { username: 'Unknown', _id: post.author } : post.author;

    const handleLike = async () => {
        setLiked(!liked);
        if (liked) setLikesCount(c => c - 1); else setLikesCount(c => c + 1);
        playSound('pop');
        try { await axios.put(`/posts/${post._id}/like`); } catch (e) { }
    };

    const handleComment = async () => {
        const text = document.getElementById(`comment-${post._id}`).value;
        if (!text) return;
        playSound('pop');
        const newReview = { text, authorName: user.username, authorId: user._id, createdAt: new Date() };
        setComments([...comments, newReview]);
        document.getElementById(`comment-${post._id}`).value = '';
        try { await axios.put(`/posts/${post._id}/comment`, { text }); } catch (e) { }
    };

    return (
        <div className="glass-card rounded-3xl overflow-hidden mb-6">
            <div className="p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewProfile(author)}>
                    <div className={"w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 overflow-hidden " + (author.role === 'Founder' ? 'founder-glow' : 'border-gray-700')}>
                        {author.profilePic ? <img src={resolveMediaUrl(author.profilePic)} className="w-full h-full object-cover" /> : author.username?.[0]}
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm flex items-center gap-1">
                            {author.username}
                            {author.role === 'Founder' && <Icons.Shield className="w-3 h-3 text-yellow-500" />}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">{new Date(post.createdAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                </div>
                {(isFounder || isAuthor) && <button onClick={onDelete} className="p-2 text-gray-600 hover:text-red-500"><Icons.Trash className="w-5 h-5" /></button>}
            </div>

            {post.desc && <div className="px-5 py-3 text-sm text-gray-200 font-medium leading-relaxed">{parseHashtags(post.desc)}</div>}

            {(post.image || post.videoUrl) && (
                <div className="w-full bg-black">
                    {post.videoUrl ? (
                        <video src={resolveMediaUrl(post.videoUrl)} controls className="w-full max-h-[500px]" />
                    ) : (
                        <img src={resolveMediaUrl(post.image)} className="w-full max-h-[500px] object-contain" />
                    )}
                </div>
            )}

            <div className="p-4 flex items-center gap-6 border-b border-white/5">
                <button onClick={handleLike} className={"flex items-center gap-2 font-bold transition-transform active:scale-90 " + (liked ? 'text-red-500' : 'text-gray-400 hover:text-white')}>
                    <Icons.Heart className={"w-6 h-6 " + (liked ? 'fill-current' : '')} />
                    <span>{likesCount}</span>
                </button>
                <button onClick={() => setCommentsOpen(!commentsOpen)} className="flex items-center gap-2 font-bold text-gray-400 hover:text-white transition-colors">
                    <Icons.MessageCircle className="w-6 h-6" />
                    <span>{comments.length}</span>
                </button>
                <button className="flex items-center gap-2 font-bold text-gray-400 hover:text-red-500 transition-colors">
                    <Icons.ThumbsDown className="w-6 h-6" />
                </button>
            </div>

            <AnimatePresence>
                {commentsOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-black/40">
                        <div className="p-4 space-y-3">
                            {comments.map((c, i) => (
                                <div key={i} className="text-xs">
                                    <span className="font-bold text-yellow-500 mr-2">{c.authorName}:</span>
                                    <span className="text-gray-300">{c.text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t border-white/10 flex gap-2">
                            <input id={`comment-${post._id}`} placeholder="Write a comment..." className="flex-1 bg-transparent text-sm outline-none text-white" />
                            <button onClick={handleComment} className="text-yellow-500 font-bold text-xs uppercase">POST</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SideMenu = ({ isOpen, onClose, user, logout, onViewProfile, onOpenSettings, setActiveTab }) => {
    const { t } = useTranslation(user);
    const notifications = 3; // Mock
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="relative w-3/4 max-w-xs bg-[#0a0a0a] border-r border-yellow-500/20 flex flex-col h-full shadow-2xl p-6">
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
                    <div className={"w-16 h-16 rounded-full border-2 overflow-hidden " + (user.role === 'Founder' ? 'founder-glow' : 'border-white/10')}>
                        {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-2xl text-white bg-gray-900">{user.username[0]}</div>}
                    </div>
                    <div>
                        <div className="gold-text text-xl italic">{user.username}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user.role || 'AGENT'}</div>
                    </div>
                </div>

                <div className="space-y-1 flex-1">
                    {[
                        { icon: Icons.Home, label: t('HOME'), action: () => { setActiveTab('home'); onClose(); } },
                        { icon: Icons.User, label: t('PROFILE'), action: () => { onViewProfile(user); onClose(); } },
                        { icon: Icons.Bell, label: t('ALERTS'), badge: notifications, action: onClose },
                        { icon: Icons.Settings, label: t('SETTINGS'), action: onOpenSettings },
                    ].map((item, i) => (
                        <button key={i} onClick={item.action} className="w-full p-4 hover:bg-white/5 rounded-xl flex items-center justify-between text-gray-400 hover:text-white transition-all group">
                            <div className="flex items-center gap-4 font-bold"><item.icon className="w-5 h-5 group-hover:text-yellow-500 transition-colors" /> {item.label}</div>
                            {item.badge && <div className="bg-red-500 text-white text-[10px] font-bold px-2 rounded-full">{item.badge}</div>}
                        </button>
                    ))}
                </div>

                <button onClick={logout} className="w-full p-4 bg-red-900/10 text-red-500 rounded-xl font-black uppercase flex items-center justify-center gap-2 mt-4 border border-red-900/20 hover:bg-red-900/30">
                    <Icons.Logout className="w-4 h-4" /> {t('LOGOUT')}
                </button>
            </motion.div>
        </div>
    );
};

const UserList = ({ userId, type = 'followers', onViewProfile, currentUser }) => {
    const { t } = useTranslation(currentUser);
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) { setLoading(false); return; }
        const fetchUsers = async () => {
            try {
                const endpoint = type === 'following' ? '/following' : '/followers';
                const res = await axios.get('/users/' + userId + endpoint);
                setList(res.data);
            } catch (e) { }
            setLoading(false);
        };
        fetchUsers();
    }, [userId, type]);

    if (loading) return <div className="text-center py-10"><div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-2" /></div>;
    if (list.length === 0) return <div className="text-center py-20 opacity-30 font-bold uppercase text-xs">{t('ZERO_AGENTS')}</div>;

    return (
        <div className="space-y-3">
            {list.map(u => (
                <button key={u._id} onClick={() => { playSound('pop'); onViewProfile(u); }} className="w-full p-4 glass-card rounded-2xl flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                        {u.profilePic ? <img src={resolveMediaUrl(u.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-white/50">{u.username?.[0]}</div>}
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-sm text-white">{u.username}</div>
                        <div className="text-[9px] text-yellow-500 font-bold uppercase">{u.role || 'AGENT'}</div>
                    </div>
                </button>
            ))}
        </div>
    );
};

const ProfileModal = ({ isOpen, onClose, profileUser, currentUser, posts, allUsers, onViewProfile }) => {
    const { t } = useTranslation(currentUser);
    const [tab, setTab] = useState('posts');
    const [following, setFollowing] = useState(false);
    const [userData, setUserData] = useState(null);
    const userPosts = posts.filter(p => p.username === profileUser?.username);
    const isOwnProfile = profileUser?.username === currentUser?.username;
    const isFounder = (currentUser?.role === 'Founder');

    useEffect(() => { if (profileUser?.username) { fetchUserData(); setTab('posts'); } }, [profileUser]);

    const fetchUserData = async () => {
        if (!profileUser?.username) return;
        try {
            const res = await axios.get('/users/username/' + profileUser.username);
            setUserData(res.data);
            setFollowing(res.data.followers?.includes(currentUser?._id));
        } catch (e) { setUserData(profileUser); }
    };

    const handleFollow = async () => {
        if (!userData?._id) return;
        playSound('pop');
        try {
            const res = await axios.put('/users/' + userData._id + '/follow');
            setFollowing(res.data.isFollowing);
        } catch (e) { }
    };

    const handleDeleteAgent = async () => {
        if (!confirm(t('CONFIRM_DELETE'))) return;
        try { await axios.delete('/users/' + userData._id); onClose(); } catch (e) { }
    };

    const uploadRef = useRef();
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('image', file);
        try {
            const res = await axios.post('/users/profile-pic', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (isOwnProfile) localStorage.setItem('user', JSON.stringify(res.data));
            window.location.reload();
        } catch (e) { }
    };

    if (!isOpen || !profileUser) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative bg-[#111] border border-white/10 w-full max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-black/40">
                    <button onClick={onClose}><Icons.Back className="w-6 h-6 rotate-180 text-white" /></button>
                    <div className="flex-1 font-black italic text-white uppercase">{profileUser.username}</div>
                </div>

                <div className="p-8 text-center bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
                    <div onClick={() => isOwnProfile && uploadRef.current.click()} className={"w-28 h-28 mx-auto rounded-full bg-gray-900 border-4 shadow-2xl overflow-hidden relative group " + (isOwnProfile ? 'cursor-pointer hover:border-yellow-500' : 'border-gray-800')}>
                        {userData?.profilePic ? <img src={resolveMediaUrl(userData.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white">{profileUser.username[0]}</div>}
                        <input type="file" ref={uploadRef} hidden onChange={handleUpload} />
                    </div>
                    <h2 className="text-2xl font-black italic gold-text mt-4 uppercase">{profileUser.username}</h2>

                    <div className="flex justify-center gap-8 mt-6">
                        <div onClick={() => setTab('posts')} className="text-center cursor-pointer"><span className="font-black text-xl text-white block">{userPosts.length}</span><p className="text-[10px] text-gray-500 font-bold uppercase">{t('POSTS')}</p></div>
                        <div onClick={() => setTab('followers')} className="text-center cursor-pointer"><span className="font-black text-xl text-white block">{userData?.followers?.length || 0}</span><p className="text-[10px] text-gray-500 font-bold uppercase">{t('FOLLOWERS')}</p></div>
                    </div>

                    <div className="mt-8 flex gap-3 justify-center">
                        {!isOwnProfile && (
                            <button onClick={handleFollow} className={"px-8 py-3 rounded-xl font-black text-xs uppercase transition-all ring-1 " + (following ? 'bg-transparent ring-white/20 text-white' : 'liquid-btn ring-transparent text-black')}>
                                {following ? t('UNFOLLOW') : t('FOLLOW')}
                            </button>
                        )}
                        {isFounder && !isOwnProfile && <button onClick={handleDeleteAgent} className="p-3 bg-red-900/20 text-red-500 rounded-xl hover:bg-red-900/40"><Icons.Trash className="w-5 h-5" /></button>}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/50">
                    {tab === 'posts' && (
                        <div className="grid grid-cols-3 gap-0.5">
                            {userPosts.map(post => (
                                <div key={post._id} className="aspect-square bg-gray-900 overflow-hidden relative cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                                    {post.videoUrl ? <video src={resolveMediaUrl(post.videoUrl)} className="w-full h-full object-cover" /> : (post.image ? <img src={resolveMediaUrl(post.image)} className="w-full h-full object-cover" /> : <div className="p-2 text-[8px] text-gray-500">{post.desc}</div>)}
                                </div>
                            ))}
                        </div>
                    )}
                    {tab === 'followers' && <div className="p-4"><UserList userId={userData?._id} type="followers" onViewProfile={onViewProfile} currentUser={currentUser} /></div>}
                </div>
            </motion.div>
        </div>
    );
};
// --- MAIN APP ---

const App = () => {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [createOpen, setCreateOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const { t } = useTranslation(user);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (savedUser && token) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchPosts();
            fetchUsers();
        }
    }, [user]);

    const fetchPosts = async () => { try { const r = await axios.get('/posts?limit=100'); setPosts(r.data); } catch (e) { } };
    const fetchUsers = async () => { try { const r = await axios.get('/users'); setUsers(r.data); } catch (e) { } };
    const deletePost = async (postId) => {
        if (!confirm("DELETE INTEL?")) return;
        try {
            await axios.delete(`/posts/${postId}`);
            setPosts(posts.filter(p => p._id !== postId));
            playSound('delete');
        } catch (e) { alert("UNAUTHORIZED"); }
    };

    const logout = () => { localStorage.clear(); setUser(null); window.location.reload(); };
    const viewProfile = (u) => { setProfileUser(u); setProfileOpen(true); };

    // LOGIN SCREEN
    if (!user) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            <div className="liquid-bg" />
            <div className="w-full max-w-md text-center relative z-10 glass-panel p-10 rounded-3xl border-t border-yellow-500/20 shadow-2xl">
                <h1 className="text-7xl font-black italic gold-text mb-2 animate-pulse">LEGACY</h1>
                <p className="text-yellow-500/50 font-bold tracking-[0.5em] text-xs mb-10 uppercase">Global Intelligence Network</p>

                <div className="space-y-4">
                    <input type="email" placeholder="CODENAME (EMAIL)" id="login-email" className="cyber-input w-full text-center" />
                    <input type="password" placeholder="PASSWORD" id="login-pass" className="cyber-input w-full text-center" />

                    <button onClick={async () => {
                        const email = document.getElementById('login-email').value;
                        const password = document.getElementById('login-pass').value;
                        if (!email || !password) return alert("CREDENTIALS REQUIRED");
                        try {
                            const res = await axios.post('/auth/login', { email, password });
                            localStorage.setItem('token', res.data.token);
                            localStorage.setItem('user', JSON.stringify(res.data.user));
                            setUser(res.data.user);
                        } catch (e) { alert("ACCESS DENIED"); }
                    }} className="liquid-btn w-full py-4 rounded-xl shadow-lg shadow-yellow-500/10 mt-6 text-lg">ENTER SYSTEM</button>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <button className="text-[10px] font-bold text-gray-500 uppercase hover:text-white transition-colors">Apply for Access</button>
                        <button className="text-[10px] font-bold text-gray-500 uppercase hover:text-white transition-colors">Lost Credentials</button>
                    </div>
                </div>
            </div>
        </div>
    );

    // MAIN APP
    return (
        <div className="min-h-screen bg-black text-white max-w-xl mx-auto border-x border-white/5 pb-24 relative overflow-hidden shadow-2xl">
            <div className="liquid-bg" />

            <header className="sticky top-0 p-4 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
                <button onClick={() => { setMenuOpen(true); playSound('click'); }} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Icons.Menu className="w-6 h-6 text-white" /></button>
                <div onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); playSound('click'); }} className="text-2xl font-black italic tracking-tighter cursor-pointer gold-text">LEGACY <span className="text-white">OS</span></div>
                <div className="flex gap-2">
                    <button onClick={() => { setCreateOpen(true); playSound('pop'); }} className="p-2 bg-yellow-500 text-black rounded-xl shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform"><Icons.Plus className="w-6 h-6" /></button>
                </div>
            </header>

            <main className="relative z-10 p-4 space-y-6">
                {posts.length === 0 && <div className="text-center py-20 opacity-50 font-black italic">SEARCHING NETWORK...</div>}
                {posts.map(post => (
                    <PostCard
                        key={post._id}
                        post={post}
                        user={user}
                        onDelete={() => deletePost(post._id)}
                        onViewProfile={viewProfile}
                    />
                ))}
            </main>

            <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => { setCreateOpen(false); fetchPosts(); }} user={user} />

            <AnimatePresence>
                {menuOpen && (
                    <SideMenu
                        isOpen={menuOpen}
                        onClose={() => setMenuOpen(false)}
                        user={user}
                        logout={logout}
                        onViewProfile={viewProfile}
                        onOpenSettings={() => { setMenuOpen(false); setSettingsOpen(true); }}
                        setActiveTab={setActiveTab}
                    />
                )}
            </AnimatePresence>

            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} logout={logout} />
            <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} profileUser={profileUser} currentUser={user} posts={posts} allUsers={users} onViewProfile={viewProfile} />

            <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 flex justify-around z-50">
                <button onClick={() => { setActiveTab('home'); }} className={`p-2 transition-colors ${activeTab === 'home' ? 'text-yellow-500' : 'text-gray-500 hover:text-white'}`}><Icons.Home className="w-6 h-6" /></button>
                <button onClick={() => { setActiveTab('profile'); viewProfile(user); }} className={`p-2 transition-colors ${activeTab === 'profile' ? 'text-yellow-500' : 'text-gray-500 hover:text-white'}`}><Icons.User className="w-6 h-6" /></button>
            </div>
        </div>
    );
};

export default App;
