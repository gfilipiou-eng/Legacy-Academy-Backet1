import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from './api';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Icons } from './components/Icons';
import { TRANSLATIONS, useTranslation } from './translations';
import { playSound, explodeEffect } from './utils/sounds';

// --- API & UTIL CONFIG ---
const API_URL = axios.defaults.baseURL;
const BASE_URL = API_URL.replace('/api', '');

const resolveMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const parseHashtags = (text) => text ? text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) => part.startsWith('#') ? <span key={i} className="hashtag text-yellow-500 font-bold">{part}</span> : part) : text;


// --- COMPONENTS ---

const SettingsModal = ({ isOpen, onClose, user, logout }) => {
    const { t, lang } = useTranslation(user);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
            <div className="bg-[#111] border border-yellow-500/20 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-black italic text-yellow-500 uppercase">{t('SETTINGS')}</h2>
                    <button onClick={onClose}><Icons.X className="w-6 h-6 text-gray-400" /></button>
                </div>
                <div className="p-4 space-y-2">
                    <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-between">
                        <span className="font-bold text-gray-300">{t('THEME')}</span>
                        <div className="flex gap-2">
                            {['cobalt', 'crimson', 'emerald', 'violet'].map(c => (
                                <div key={c} onClick={() => { localStorage.setItem('theme', c); document.documentElement.setAttribute('data-theme', c); playSound('click'); }} className={`w-6 h-6 rounded-full cursor-pointer bg-gray-500 hover:border-white border border-white/20`} style={{ backgroundColor: c === 'cobalt' ? 'blue' : c === 'crimson' ? 'red' : c === 'emerald' ? 'green' : 'purple' }} />
                            ))}
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-between">
                        <span className="font-bold text-gray-300">Language</span>
                        <select defaultValue={lang} onChange={(e) => { localStorage.setItem('language', e.target.value); window.location.reload(); }} className="bg-black text-white p-2 rounded border border-white/10 outline-none text-xs font-bold uppercase">
                            <option value="en">ENGLISH</option>
                            <option value="el">GREEK</option>
                        </select>
                    </div>
                    <button onClick={logout} className="w-full py-4 bg-red-500/10 text-red-500 font-black uppercase rounded-2xl mt-4 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                        {t('LOGOUT')}
                    </button>
                    <button onClick={() => { if (confirm(t('CONFIRM_DELETE'))) alert('Feature coming soon'); }} className="w-full py-3 text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:text-red-500 transition-colors">
                        {t('DELETE_ACCOUNT')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CreateModal = ({ isOpen, onClose, onSuccess, user }) => {
    const { t } = useTranslation(user);
    const [preview, setPreview] = useState(null);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
            <div className="w-full max-w-lg bg-[#111] rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg font-black italic text-yellow-500 uppercase flex items-center gap-2"><Icons.Plus className="w-5 h-5" /> NEW INTEL</h2>
                    <button onClick={onClose}><Icons.X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden shrink-0">
                            {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{user.username[0]}</div>}
                        </div>
                        <textarea id="post-desc" placeholder="What's the intel, Agent?" className="flex-1 bg-transparent border-none text-white resize-none h-24 outline-none text-lg p-2 placeholder-gray-600" />
                    </div>

                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('post-file').click()}>
                        {preview ? (
                            <div className="w-full h-64 rounded-xl overflow-hidden relative">
                                <img src={preview} className="w-full h-full object-cover" />
                                <button onClick={(e) => { e.stopPropagation(); setPreview(null); document.getElementById('post-file').value = ''; }} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"><Icons.X className="w-4 h-4 text-white" /></button>
                            </div>
                        ) : (
                            <div className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all">
                                <Icons.Camera className="w-8 h-8 text-gray-500" />
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">ADD MEDIA</span>
                            </div>
                        )}
                        <input type="file" id="post-file" hidden onChange={(e) => {
                            if (e.target.files[0]) setPreview(URL.createObjectURL(e.target.files[0]));
                        }} />
                    </div>

                    <button onClick={async () => {
                        const desc = document.getElementById('post-desc').value;
                        const file = document.getElementById('post-file').files[0];
                        if (!desc && !file) return alert("EMPTY INTEL");
                        const button = document.getElementById('publish-btn');
                        button.innerText = "UPLOADING...";
                        button.disabled = true;

                        const fd = new FormData();
                        fd.append('desc', desc);
                        if (file) fd.append('image', file);
                        try {
                            await axios.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                            onSuccess();
                            setPreview(null);
                            playSound('magic');
                            explodeEffect();
                        } catch (e) { alert("DEPLOY FAILED"); button.innerText = "PUBLISH INTEL"; button.disabled = false; }
                    }} id="publish-btn" className="w-full py-4 bg-yellow-500 rounded-xl font-black uppercase text-black hover:scale-105 transition-transform shadow-lg shadow-yellow-500/20">{t('PUBLISH_INTEL')}</button>
                </div>
            </div>
        </div>
    );
};

const SideMenu = ({ isOpen, onClose, user, logout, onViewProfile, onOpenSettings, onOpenNotifications, setActiveTab }) => {
    const { t } = useTranslation(user);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] flex">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="relative w-3/4 max-w-xs bg-[#050505] border-r border-yellow-500/20 p-6 flex flex-col h-full shadow-[0_0_50px_rgba(234,179,8,0.1)]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-600 to-black p-[2px]">
                        <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center overflow-hidden">
                            {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <span className="text-xl font-black text-white">{user.username[0]}</span>}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black italic text-lg text-white">{user.username}</h3>
                        <div className="text-[9px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded uppercase font-bold tracking-widest w-fit">{user.role || 'AGENT'}</div>
                    </div>
                </div>

                <div className="space-y-1 flex-1">
                    <button onClick={() => { setActiveTab('home'); onClose(); }} className="w-full p-4 hover:bg-white/5 rounded-xl flex items-center gap-4 font-bold text-gray-400 hover:text-white transition-all"><Icons.Home className="w-5 h-5" /> {t('HOME')}</button>
                    <button onClick={() => { onViewProfile(user); onClose(); }} className="w-full p-4 hover:bg-white/5 rounded-xl flex items-center gap-4 font-bold text-gray-400 hover:text-white transition-all"><Icons.User className="w-5 h-5" /> {t('PROFILE')}</button>
                    <button onClick={onOpenNotifications} className="w-full p-4 hover:bg-white/5 rounded-xl flex items-center gap-4 font-bold text-gray-400 hover:text-white transition-all"><Icons.Bell className="w-5 h-5" /> {t('ALERTS')}</button>
                    <button onClick={onOpenSettings} className="w-full p-4 hover:bg-white/5 rounded-xl flex items-center gap-4 font-bold text-gray-400 hover:text-white transition-all"><Icons.Settings className="w-5 h-5" /> {t('SETTINGS')}</button>
                </div>

                <button onClick={logout} className="w-full p-4 bg-red-900/10 text-red-500 rounded-xl font-black uppercase flex items-center justify-center gap-2 mt-4 hover:bg-red-900/30 transition-all text-sm">
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
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchUsers();
    }, [userId, type]);

    if (loading) return <div className="text-center py-10"><div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-2" /><span className="text-gray-500 text-[10px] uppercase font-black">{t('SCANNING')}</span></div>;
    if (list.length === 0) return <div className="text-center py-20 opacity-30"><Icons.Users className="w-12 h-12 mx-auto mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">{t('ZERO_AGENTS')}</p></div>;

    return (
        <div className="space-y-3">
            {list.map(u => (
                <button key={u._id} onClick={() => { playSound('pop'); onViewProfile(u); }} className="w-full p-5 glass-3d flex items-center gap-4 hover:border-yellow-500/30 active:scale-95 transition-all border-none group">
                    <div className={"w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 shadow-2xl overflow-hidden transition-transform group-hover:scale-105 " + (u.role === 'Founder' ? 'founder-avatar' : 'bg-gradient-to-tr from-gray-800 to-black border-white/5')}>
                        {u.profilePic ? <img src={resolveMediaUrl(u.profilePic)} className="w-full h-full object-cover" alt={u.username} /> : u.username?.[0]?.toUpperCase()}
                    </div>
                </button>
            ))}
        </div>
    );
};

const ProfileModal = ({ isOpen, onClose, profileUser, currentUser, posts, allUsers, onViewProfile, onUpdate }) => {
    const { t } = useTranslation(currentUser);
    const [tab, setTab] = useState('posts');
    const [following, setFollowing] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isRequested, setIsRequested] = useState(false);
    const userPosts = posts.filter(p => p.username === profileUser?.username);
    const isOwnProfile = profileUser?.username === currentUser?.username;
    const isFounder = (currentUser?.role === 'Founder');

    useEffect(() => { if (profileUser?.username) { fetchUserData(); setTab('posts'); } }, [profileUser]);

    const fetchUserData = async () => {
        if (!profileUser?.username) return;
        try {
            const res = await axios.get('/users/username/' + profileUser.username);
            setUserData(res.data);
            const currentId = currentUser?._id;
            setFollowing(res.data.followers?.includes(currentId));
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
        playSound('delete');
        try {
            await axios.delete('/users/' + userData._id);
            onClose();
        } catch (e) { alert('Unauthorized'); }
    };

    const profileFileRef = useRef();
    const [uploading, setUploading] = useState(false);

    const handleProfilePicUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('image', file);
        try {
            const res = await axios.post('/users/profile-pic', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (isOwnProfile) {
                localStorage.setItem('user', JSON.stringify(res.data));
                setUserData(res.data);
            }
        } catch (e) { alert('UPLOAD FAILED'); }
        setUploading(false);
    };

    if (!isOpen || !profileUser) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative bg-[#111] border border-white/10 w-full max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-black/40">
                    <button onClick={onClose}><Icons.Back className="w-6 h-6 rotate-180" /></button>
                    <div className="flex-1 font-black italic">{profileUser.username.toUpperCase()}</div>
                </div>

                <div className="p-8 text-center bg-white/5 border-b border-white/5">
                    <div onClick={() => isOwnProfile && profileFileRef.current.click()} className={"w-28 h-28 mx-auto rounded-full bg-gray-800 border-4 border-black shadow-2xl relative overflow-hidden group cursor-pointer " + (isOwnProfile ? 'hover:border-yellow-500' : '')}>
                        {userData?.profilePic ? <img src={resolveMediaUrl(userData.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-black">{profileUser.username[0]}</div>}
                        <input type="file" ref={profileFileRef} hidden onChange={handleProfilePicUpload} />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black italic text-white uppercase">{profileUser.username}</h2>
                    <div className="flex justify-center gap-6 mt-6">
                        <div onClick={() => setTab('posts')} className="text-center cursor-pointer"><span className="font-black text-xl block">{userPosts.length}</span><p className="text-[8px] text-gray-500 uppercase">{t('POSTS')}</p></div>
                        <div onClick={() => setTab('followers')} className="text-center cursor-pointer"><span className="font-black text-xl block">{userData?.followers?.length || 0}</span><p className="text-[8px] text-gray-500 uppercase">{t('FOLLOWERS')}</p></div>
                        <div onClick={() => setTab('following')} className="text-center cursor-pointer"><span className="font-black text-xl block">{userData?.following?.length || 0}</span><p className="text-[8px] text-gray-500 uppercase">{t('FOLLOWING')}</p></div>
                    </div>

                    <div className="mt-6 flex gap-2">
                        {!isOwnProfile && (
                            <button onClick={handleFollow} className={"flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all " + (following ? 'bg-white/5 border border-white/10 text-gray-400' : 'bg-yellow-500 text-black')}>
                                {following ? t('UNFOLLOW') : t('FOLLOW')}
                            </button>
                        )}
                        {isFounder && !isOwnProfile && <button onClick={handleDeleteAgent} className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Icons.Trash className="w-5 h-5" /></button>}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {tab === 'posts' && (
                        <div className="grid grid-cols-3 gap-1">
                            {userPosts.map(post => (
                                <div key={post._id} className="aspect-square bg-gray-900 overflow-hidden relative group">
                                    {post.image ? <img src={resolveMediaUrl(post.image)} className="w-full h-full object-cover" /> : <div className="p-2 text-[8px]">{post.desc}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                    {tab === 'followers' && <UserList userId={userData?._id} type="followers" onViewProfile={onViewProfile} currentUser={currentUser} />}
                </div>
            </motion.div>
        </div>
    );
};

const PostCard = ({ post, user, onDelete, onViewProfile }) => {
    const { t } = useTranslation(user);
    const [liked, setLiked] = useState((post.likes || []).includes(user._id));
    const [likesCount, setLikesCount] = useState((post.likes || []).length);
    const isFounder = user.role === 'Founder';
    const isAuthor = (typeof post.author === 'object' ? post.author._id : post.author) === user._id;

    const handleLike = async () => {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
        playSound('pop');
        try { await axios.put(`/posts/${post._id}/like`); } catch (e) { }
    };

    const author = typeof post.author === 'string' ? { username: 'Unknown', _id: post.author } : post.author;

    return (
        <div className="glass-3d p-0 overflow-hidden mb-6 rounded-3xl border border-white/5 bg-[#0a0a0a]">
            <div className="p-4 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewProfile(author)}>
                    <div className={"w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 " + (author.role === 'Founder' ? 'border-yellow-500 text-yellow-500' : 'border-gray-700 text-gray-400')}>
                        {author.profilePic ? <img src={resolveMediaUrl(author.profilePic)} className="w-full h-full object-cover rounded-full" /> : author.username?.[0]}
                    </div>
                    <div>
                        <div className="font-black italic text-sm tracking-wide flex items-center gap-1">
                            {author.username}
                            {author.role === 'Founder' && <Icons.Shield className="w-3 h-3 text-yellow-500" />}
                        </div>
                    </div>
                </div>
                {(isFounder || isAuthor) && (
                    <button onClick={onDelete} className="p-2 text-gray-600 hover:text-red-500 transition-colors"><Icons.Trash className="w-5 h-5" /></button>
                )}
            </div>

            {post.desc && <div className="px-4 py-2 text-sm font-medium text-gray-300 leading-relaxed">{parseHashtags(post.desc)}</div>}

            {post.image && (
                <div className="w-full mt-2 bg-black border-y border-white/5">
                    <img src={resolveMediaUrl(post.image)} className="w-full max-h-[500px] object-contain" />
                </div>
            )}

            {post.videoUrl && (
                <div className="w-full mt-2 bg-black border-y border-white/5">
                    <video src={resolveMediaUrl(post.videoUrl)} controls className="w-full max-h-[500px]" />
                </div>
            )}

            <div className="p-4 flex items-center gap-6">
                <button onClick={handleLike} className={"flex items-center gap-2 font-bold transition-colors " + (liked ? 'text-red-500' : 'text-gray-400 hover:text-white')}>
                    <Icons.Heart className={"w-6 h-6 " + (liked ? 'fill-current' : '')} />
                    <span>{likesCount}</span>
                </button>
            </div>
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

    const fetchPosts = async () => {
        try {
            const r = await axios.get('/posts?limit=100');
            setPosts(r.data);
        } catch (e) { console.error("Fetch posts failed", e); }
    };

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

    if (!user) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center relative z-10 glass-3d p-8 rounded-3xl">
                <h1 className="text-6xl font-black italic text-white mb-10">LEGACY</h1>
                <input type="email" placeholder="EMAIL" id="login-email" className="cyber-input text-center w-full mb-4" />
                <input type="password" placeholder="PASSWORD" id="login-pass" className="cyber-input text-center w-full mb-4" />
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
                }} className="w-full py-4 bg-yellow-500 rounded-xl text-black font-black uppercase text-lg hover:scale-105 transition-all">ENTER SYSTEM</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white max-w-xl mx-auto border-x border-white/5 pb-24 relative overflow-hidden shadow-2xl">
            <div className="liquid-bg fixed inset-0 z-0" />

            <header className="sticky top-0 p-4 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
                <button onClick={() => { setMenuOpen(true); playSound('click'); }} className="p-2 bg-white/5 rounded-xl"><Icons.Menu className="w-6 h-6 text-white" /></button>
                <div onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); playSound('click'); }} className="text-2xl font-black italic tracking-tighter cursor-pointer">LEGACY <span className="text-yellow-500">INTEL</span></div>
                <div className="flex gap-2">
                    <button onClick={() => { setCreateOpen(true); playSound('pop'); }} className="p-2 bg-yellow-500 text-black rounded-xl shadow-lg shadow-yellow-500/20"><Icons.Plus className="w-6 h-6" /></button>
                </div>
            </header>

            <main className="relative z-10 p-4 space-y-6">
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

            {/* OVERLAYS */}
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
                        onOpenNotifications={() => { }} // Placeholder functionality
                    />
                )}
            </AnimatePresence>

            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} logout={logout} />
            <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} profileUser={profileUser} currentUser={user} posts={posts} allUsers={users} onViewProfile={viewProfile} />

            <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 flex justify-around z-50">
                <button onClick={() => { setActiveTab('home'); }} className={`p-2 ${activeTab === 'home' ? 'text-yellow-500' : 'text-gray-500'}`}><Icons.Home className="w-6 h-6" /></button>
                <button onClick={() => { setActiveTab('profile'); viewProfile(user); }} className={`p-2 ${activeTab === 'profile' ? 'text-yellow-500' : 'text-gray-500'}`}><Icons.User className="w-6 h-6" /></button>
            </div>
        </div>
    );
};

export default App;
