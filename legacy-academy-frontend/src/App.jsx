import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from './api';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Icons } from './components/Icons';
import { TRANSLATIONS, useTranslation } from './translations';
import { playSound, explodeEffect } from './utils/sounds';

// API Config
const API_URL = axios.defaults.baseURL;
const BASE_URL = API_URL.replace('/api', '');

const resolveMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const parseHashtags = (text) => text ? text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) => part.startsWith('#') ? <span key={i} className="hashtag text-yellow-500 font-bold">{part}</span> : part) : text;

// --- Sub-Components ---

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
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-2"><span className="font-black italic text-white tracking-tight">{u.username.toUpperCase()}</span>{u.role === 'Founder' && <Icons.Shield className="w-4 h-4 text-yellow-500" />}</div>
                        <span className="text-[9px] text-yellow-500/50 font-black tracking-[0.2em] uppercase">{u.role || 'AGENT'}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-yellow-500/10 transition-colors">
                        <Icons.ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-yellow-500" />
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

    useEffect(() => {
        if (profileUser?.username) {
            fetchUserData();
            setTab('posts');
        }
    }, [profileUser]);

    const fetchUserData = async () => {
        if (!profileUser?._id && !profileUser?.id && !profileUser?.username) return;
        try {
            const endpoint = (profileUser._id || profileUser.id) ? `/users/find/${profileUser._id || profileUser.id}` : `/users/username/${profileUser.username}`;
            const res = await axios.get(endpoint);
            setUserData(res.data);
            const currentId = currentUser?._id || currentUser?.id;
            setFollowing(res.data.followers?.includes(currentId));
            setIsRequested(res.data.followRequests?.includes(currentId));
        } catch (e) { setUserData(profileUser); }
    };

    const handleFollow = async () => {
        if (!userData?._id) return;
        playSound('pop');
        try {
            const res = await axios.put('/users/' + userData._id + '/follow');
            if (res.data.isFollowing !== undefined) setFollowing(res.data.isFollowing);
            if (res.data.isRequested !== undefined) setIsRequested(res.data.isRequested);
            if (res.data.isFollowing) {
                setUserData({ ...userData, followers: [...(userData.followers || []), currentUser?._id] });
                confetti({ particleCount: 30, spread: 50 });
            } else if (res.data.isFollowing === false) {
                setUserData({ ...userData, followers: (userData.followers || []).filter(f => f !== currentUser?._id) });
            }
        } catch (e) { }
    };

    const profileFileRef = useRef();
    const [uploading, setUploading] = useState(false);

    const handleProfilePicUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        playSound('whoosh');
        const fd = new FormData();
        fd.append('image', file);
        try {
            const res = await axios.post('/users/profile-pic', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (isOwnProfile) {
                localStorage.setItem('user', JSON.stringify(res.data));
                setUserData(res.data);
            }
            playSound('magic');
            confetti({ particleCount: 50 });
        } catch (e) { alert('UPLOAD FAILED'); }
        setUploading(false);
    };

    if (!isOpen || !profileUser) return null;
    const canView = isOwnProfile || following || isFounder || (!userData?.isPrivate && !userData?.isFollowersOnly);

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]" />
            <motion.div
                initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
                className="fixed inset-x-0 bottom-0 top-16 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl sm:top-[5%] sm:bottom-[5%] menu-liquid z-[101] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-3xl"
            >
                <div className="p-4 sm:p-6 flex items-center gap-3 border-b border-white/5 bg-black/40 backdrop-blur-2xl shrink-0">
                    <button onClick={onClose} className="p-2 sm:p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"><Icons.Back className="w-5 h-5 rotate-180" /></button>
                    <div className="flex-1">
                        <span className="font-black italic text-white uppercase">{profileUser.username}</span>
                    </div>
                    {(userData?.role || profileUser.role) === 'Founder' && <Icons.Shield className="w-6 h-6 text-yellow-500" />}
                </div>

                <div className="p-6 sm:p-8 text-center border-b border-white/5 bg-white/5 backdrop-blur-3xl shrink-0">
                    <div
                        onClick={() => isOwnProfile && profileFileRef.current.click()}
                        className={"w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full flex items-center justify-center text-3xl font-black shadow-2xl mb-4 relative group overflow-hidden border-2 " + (isOwnProfile ? 'cursor-pointer hover:border-yellow-500' : 'border-transparent') + " " + ((userData?.role || profileUser.role) === 'Founder' ? 'founder-avatar' : 'bg-gradient-to-tr from-purple-600 to-orange-500')}
                    >
                        {(userData?.profilePic || profileUser.profilePic) ? <img src={resolveMediaUrl(userData?.profilePic || profileUser.profilePic)} className="w-full h-full object-cover" alt="User" /> : profileUser.username[0].toUpperCase()}
                        {isOwnProfile && <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">{uploading ? '...' : <Icons.Camera className="w-6 h-6" />}</div>}
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
                            <button onClick={handleFollow} className={"flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all " + (following ? 'bg-white/5 border border-white/10 text-gray-400' : isRequested ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500' : 'bg-yellow-500 text-black')}>
                                {following ? t('UNFOLLOW') : isRequested ? t('REQUESTED') : t('FOLLOW')}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {!canView ? (
                        <div className="text-center py-20 px-10 opacity-30">
                            <Icons.Shield className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-sm font-black uppercase tracking-tight">{t('PRIVACY_ELITE')}</p>
                        </div>
                    ) : (
                        <>
                            {tab === 'posts' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {userPosts.map(post => (
                                        <div key={post._id} className="aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:scale-105 transition-transform cursor-pointer relative group">
                                            {post.image ? <img src={resolveMediaUrl(post.image)} className="w-full h-full object-cover" alt="Post" /> : <div className="p-3 text-[10px] text-gray-500 font-bold uppercase">{post.title || post.desc?.slice(0, 30)}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {tab === 'followers' && <UserList userId={userData?._id || profileUser._id} type="followers" onViewProfile={onViewProfile} currentUser={currentUser} />}
                            {tab === 'following' && <UserList userId={userData?._id || profileUser._id} type="following" onViewProfile={onViewProfile} currentUser={currentUser} />}
                        </>
                    )}
                </div>
            </motion.div>
        </>
    );
};

// --- Main App Logic ---

const App = () => {
    const [user, setUser] = useState(null);
    const { t } = useTranslation(user);
    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('home');
    const [menuOpen, setMenuOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [hashtagSearch, setHashtagSearch] = useState('');

    useEffect(() => { const u = localStorage.getItem('user'); if (u) setUser(JSON.parse(u)); }, []);
    useEffect(() => { if (user) { fetchPosts(); fetchUsers(); } }, [user]);

    const fetchPosts = async () => { try { const r = await axios.get('/posts?json=true'); setPosts(r.data); } catch (e) { } };
    const fetchUsers = async () => { try { const r = await axios.get('/users'); setUsers(r.data); } catch (e) { } };

    const logout = () => { localStorage.clear(); setUser(null); };
    const viewProfile = (u) => { setProfileUser(u); setProfileOpen(true); };

    if (!user) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="w-full max-w-md text-center">
                <h1 className="text-5xl font-black italic tracking-tighter text-white mb-10">LEGACY</h1>
                <button onClick={() => {
                    // Simple auth simulation for now, assuming external Login component or redirect
                    alert("Redirecting to login...");
                    window.location.href = BASE_URL + '/api/posts';
                }} className="w-full py-5 bg-yellow-500 rounded-2xl text-black font-black uppercase text-xl">ENTER SYSTEM</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white max-w-xl mx-auto border-x border-white/5 pb-32">
            <div className="liquid-bg" />

            <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} profileUser={profileUser} currentUser={user} posts={posts} allUsers={users} onViewProfile={viewProfile} />

            <header className="sticky top-0 p-4 z-40 bg-black/60 backdrop-blur-lg border-b border-white/5 flex items-center gap-4">
                <button onClick={() => setMenuOpen(true)} className="p-3 bg-white/5 rounded-2xl"><Icons.Menu className="w-5 h-5 text-yellow-500" /></button>
                <span className="flex-1 text-2xl font-black italic tracking-tighter">LEGACY <span className="text-yellow-500">INTEL</span></span>
                <button onClick={() => setActiveTab('notifications')} className="p-3 bg-white/5 rounded-2xl relative">
                    <Icons.Bell className="w-5 h-5 text-gray-500" />
                    <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full" />
                </button>
            </header>

            <main className="p-4">
                <div className="highlights-container no-scrollbar mb-8">
                    <button onClick={() => setCreateOpen(true)} className="flex-shrink-0 flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center border border-white/10 pulse-gold"><Icons.Plus className="text-yellow-500 w-8 h-8" /></div>
                        <span className="text-[8px] font-black uppercase">{t('ADD_INTEL')}</span>
                    </button>
                    {posts.filter(p => p.image).slice(0, 8).map(p => (
                        <div key={p._id} className="flex-shrink-0 flex flex-col items-center gap-2">
                            <div onClick={() => viewProfile({ username: p.username })} className="w-16 h-16 rounded-[24px] overflow-hidden border-2 border-yellow-500 p-0.5"><img src={resolveMediaUrl(p.image)} className="w-full h-full object-cover rounded-[20px]" /></div>
                            <span className="text-[8px] font-black uppercase text-gray-500">{p.username}</span>
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    {posts.map(post => (
                        <div key={post._id} className="glass-3d p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center font-black">
                                    {post.profilePic ? <img src={resolveMediaUrl(post.profilePic)} className="w-full h-full object-cover rounded-xl" /> : post.username[0].toUpperCase()}
                                </div>
                                <span className="font-black italic text-white uppercase">{post.username}</span>
                            </div>
                            {post.image && <img src={resolveMediaUrl(post.image)} className="w-full rounded-2xl mb-4" />}
                            <p className="text-sm font-bold text-gray-400">{parseHashtags(post.desc)}</p>
                        </div>
                    ))}
                </div>
            </main>

            <div className="fixed bottom-0 inset-x-0 p-3 z-50">
                <div className="menu-liquid flex items-center px-4 py-2 rounded-[32px] max-w-lg mx-auto">
                    <button onClick={() => setActiveTab('home')} className="flex-1 py-4 flex flex-col items-center gap-1 group">
                        <Icons.Home className={activeTab === 'home' ? 'text-yellow-500' : 'text-gray-600'} />
                    </button>
                    <button onClick={() => setSearchOpen(true)} className="flex-1 py-4 flex flex-col items-center gap-1">
                        <Icons.Search className="text-gray-600" />
                    </button>
                    <button onClick={() => setCreateOpen(true)} className="w-14 h-14 -mt-10 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-xl shadow-yellow-500/30">
                        <Icons.Plus className="text-black w-8 h-8" />
                    </button>
                    <button onClick={() => setActiveTab('messages')} className="flex-1 py-4 flex flex-col items-center gap-1">
                        <Icons.MessageCircle className="text-gray-600" />
                    </button>
                    <button onClick={() => { viewProfile(user); setActiveTab('home'); }} className="flex-1 py-4 flex flex-col items-center gap-1">
                        <Icons.User className="text-gray-600" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;
