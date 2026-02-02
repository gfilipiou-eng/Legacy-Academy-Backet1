import React, { useState, useEffect, useRef } from 'react';
import axios from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './components/Icons';
import { useTranslation } from './translations';
import { playSound } from './utils/sounds';

// --- CONFIG ---
const API_URL = axios.defaults.baseURL;
const BASE_URL = API_URL.replace('/api', '');

const resolveMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const parseHashtags = (text) => text ? text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) => part.startsWith('#') ? <span key={i} className="text-blue-400 font-medium hover:underline cursor-pointer">{part}</span> : part) : text;

// --- COMPONENTS ---

const DefaultAvatar = ({ name, size = "normal" }) => (
    <div className={`w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-gray-500`}>
        <Icons.User className={`${size === "large" ? "w-10 h-10" : "w-1/2 h-1/2"}`} />
    </div>
);

const PostDetailModal = ({ post, user, onClose, onLike, onDislike, onComment, onDelete }) => {
    if (!post) return null;
    const [commentText, setCommentText] = useState('');
    const isOwner = post.author?._id === user._id || post.author === user._id;

    return (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 z-50"><Icons.X className="w-6 h-6 text-white" /></button>
            <div className="w-full max-w-4xl h-[90vh] bg-[#0a0a0a] rounded-3xl overflow-hidden flex flex-col md:flex-row border border-white/10 shadow-2xl">
                <div className="flex-1 bg-black flex items-center justify-center relative shadow-inner">
                    {post.image ? <img src={resolveMediaUrl(post.image)} className="max-w-full max-h-full object-contain" /> : <div className="p-10 text-center font-bold text-2xl text-white italic">{post.desc}</div>}
                </div>
                <div className="w-full md:w-[400px] flex flex-col bg-[#111] border-l border-white/10">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                {post.author?.profilePic ? <img src={resolveMediaUrl(post.author.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={post.author?.username} />}
                            </div>
                            <span className="font-bold text-white">{post.author?.username}</span>
                        </div>
                        {isOwner && <button onClick={() => { onDelete(post._id); onClose(); }} className="text-red-500 hover:text-red-400"><Icons.Trash className="w-5 h-5" /></button>}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="mb-4 text-sm text-gray-300">{parseHashtags(post.desc)}</div>
                        <div className="space-y-4">
                            {post.comments?.map((c, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                        {c.authorProfilePic || c.user?.profilePic ? <img src={resolveMediaUrl(c.authorProfilePic || c.user?.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar />}
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-bold text-white mr-2">{c.authorName || c.user?.username}</span>
                                        <span className="text-gray-400">{c.text}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/10 bg-black/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-4">
                                <button onClick={() => onLike(post._id)}><Icons.Heart className={`w-7 h-7 ${post.likes?.includes(user._id) ? 'fill-red-500 stroke-red-500' : 'text-white'}`} /></button>
                                <button onClick={() => onDislike(post._id)}><Icons.ThumbsDown className="w-7 h-7 text-white hover:text-red-500" /></button>
                                <Icons.Send className="w-7 h-7 text-white" />
                            </div>
                            <Icons.Bookmark className="w-7 h-7 text-white" />
                        </div>
                        <div className="font-bold text-white text-sm mb-2">{post.likes?.length} Likes</div>
                        <form onSubmit={(e) => { e.preventDefault(); onComment(post._id, commentText); setCommentText(''); }} className="flex gap-2">
                            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-transparent text-sm outline-none text-white placeholder-gray-500" />
                            <button className="text-blue-500 font-bold text-sm">Post</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotificationItem = ({ note, onViewProfile }) => {
    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer border-b border-white/5">
            <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10" onClick={(e) => { e.stopPropagation(); onViewProfile(note.sender) }}>
                {note.sender?.profilePic ? <img src={resolveMediaUrl(note.sender.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar />}
            </div>
            <div className="flex-1 text-sm">
                <span className="font-bold text-white mr-1" onClick={(e) => { e.stopPropagation(); onViewProfile(note.sender) }}>{note.sender?.username}</span>
                <span className="text-gray-400 font-normal">
                    {note.type === 'like' && 'liked your post.'}
                    {note.type === 'comment' && 'commented.'}
                    {note.type === 'follow' && 'started following you.'}
                    {note.type === 'message' && 'sent you a message.'}
                </span>
                <div className="text-[10px] text-gray-600 mt-0.5">Just now</div>
            </div>
            {note.type === 'follow' ?
                <button className="px-3 py-1.5 bg-blue-600 rounded-lg text-xs font-bold text-white text-3d">Follow Back</button> :
                (note.postImage && <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-800"><img src={note.postImage} className="w-full h-full object-cover" /></div>)
            }
        </motion.div>
    );
};

const PostCard = ({ post, user, onLike, onDislike, onComment, onDelete, onViewProfile, onOpenDetail }) => {
    const [showComments, setShowComments] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [commentText, setCommentText] = useState('');
    const isOwner = post.author?._id === user._id || post.author === user._id;

    const handleComment = (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        onComment(post._id, commentText);
        setCommentText('');
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="glass-card mb-6 rounded-3xl overflow-hidden relative group">
            <div className="p-4 flex items-center justify-between relative">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewProfile(post.author)}>
                    <div className="w-12 h-12 rounded-full border-2 border-yellow-500/50 overflow-hidden bg-gray-900 shadow-lg shadow-yellow-500/10">
                        {post.author?.profilePic ? <img src={resolveMediaUrl(post.author.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar />}
                    </div>
                    <div><h4 className="font-bold text-sm text-white drop-shadow-md">{post.author?.username}</h4><p className="text-[10px] text-gray-400 uppercase tracking-widest leading-none">Verified Agent</p></div>
                </div>

                <div className="relative">
                    {isOwner ? (
                        <button onClick={() => onDelete(post._id)} className="p-2 hover:bg-red-500/20 rounded-full transition-colors group/delete">
                            <Icons.Trash className="w-6 h-6 text-gray-400 group-hover/delete:text-red-500 transition-colors" />
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Icons.Menu className="w-6 h-6 text-gray-400 rotate-90" /></button>
                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-10 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-20 w-40 overflow-hidden backdrop-blur-xl">
                                        <button onClick={() => { onDislike(post._id); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-3 text-gray-300 hover:bg-white/5 text-xs font-bold uppercase border-t border-white/5">
                                            <Icons.ThumbsDown className="w-4 h-4" /> Dislike
                                        </button>
                                        <button className="w-full flex items-center gap-2 px-4 py-3 text-gray-300 hover:bg-white/5 text-xs font-bold uppercase border-t border-white/5">
                                            <Icons.Shield className="w-4 h-4" /> Report
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            </div>

            {post.image ? (
                <div onClick={() => onOpenDetail(post)} className="aspect-square bg-black overflow-hidden relative shadow-inner cursor-pointer">
                    <img src={resolveMediaUrl(post.image)} className="w-full h-full object-contain bg-black" />
                </div>
            ) : (
                <div onClick={() => onOpenDetail(post)} className="p-8 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center min-h-[300px] cursor-pointer">
                    <p className="text-xl md:text-2xl font-black text-center text-white italic leading-relaxed">
                        "{post.desc}"
                    </p>
                </div>
            )}

            <div className="p-4 bg-gradient-to-b from-transparent to-black/40">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => onLike(post._id)} className="hover:scale-110 active:scale-90 transition-transform"><Icons.Heart className={`w-8 h-8 drop-shadow-lg ${post.likes?.includes(user._id) ? 'fill-red-500 stroke-red-500' : 'text-white'}`} /></button>
                        <button onClick={() => setShowComments(!showComments)} className="hover:scale-110 active:scale-90 transition-transform"><Icons.MessageCircle className="w-7 h-7 text-white drop-shadow-lg" /></button>
                        <Icons.Send className="w-7 h-7 text-white hover:scale-110 active:scale-90 transition-transform cursor-pointer drop-shadow-lg" />
                    </div>
                    <Icons.Bookmark className="w-7 h-7 text-white cursor-pointer hover:scale-110 active:scale-90 transition-transform drop-shadow-lg" />
                </div>

                <div className="font-bold text-sm mb-2 text-white/90">{post.likes?.length || 0} Likes</div>

                {post.image && (
                    <div className="text-sm mb-3">
                        <span className="font-bold mr-2 text-white">{post.author?.username}</span>
                        <span className="text-gray-200">{parseHashtags(post.desc)}</span>
                    </div>
                )}

                <button onClick={() => setShowComments(!showComments)} className="text-xs text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors">
                    {post.comments?.length > 0 ? `View all ${post.comments.length} comments` : 'Add a comment'}
                </button>

                <AnimatePresence>
                    {showComments && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 space-y-4 overflow-hidden">
                            {post.comments?.map((c, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10 shadow-sm flex items-center justify-center text-xs font-bold text-white">
                                        {c.authorProfilePic || c.user?.profilePic ? <img src={resolveMediaUrl(c.authorProfilePic || c.user?.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar />}
                                    </div>
                                    <div className="bg-white/10 rounded-2xl px-4 py-2 flex-1 shadow-lg backdrop-blur-sm border border-white/5">
                                        <span className="font-bold text-xs mr-2 text-yellow-500 shadow-black drop-shadow-sm">{c.authorName || c.user?.username}</span>
                                        <span className="text-xs text-gray-200">{c.text}</span>
                                    </div>
                                </div>
                            ))}
                            <form onSubmit={handleComment} className="flex gap-2 items-center pt-2">
                                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-xs outline-none focus:border-yellow-500 shadow-inner" />
                                <button className="text-yellow-500 font-black text-xs uppercase px-2 hover:text-yellow-400 disabled:opacity-50">Post</button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const ChatModal = ({ isOpen, onClose, user, allUsers }) => {
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState({});
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef();

    useEffect(() => { if (activeChat) scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeChat]);
    const handleSend = () => {
        if (!inputText.trim()) return;
        const msg = { id: Date.now(), text: inputText, sender: user._id, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => ({ ...prev, [activeChat._id]: [...(prev[activeChat._id] || []), msg] }));
        setInputText('');
        playSound('pop');
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-5xl h-full sm:h-[85vh] bg-black sm:rounded-3xl border border-white/10 flex overflow-hidden shadow-2xl shadow-yellow-500/10">
                <div className={`w-full sm:w-80 border-r border-white/10 flex flex-col ${activeChat ? 'hidden sm:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-white/10 flex justify-between items-center"><h2 className="text-xl font-black italic">CHATS</h2><button onClick={onClose} className="sm:hidden"><Icons.X className="w-6 h-6" /></button></div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {allUsers.filter(u => u._id !== user._id).map(u => (
                            <div key={u._id} onClick={() => setActiveChat(u)} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${activeChat?._id === u._id ? 'bg-white/5' : ''}`}>
                                <div className="relative"><div className="w-12 h-12 rounded-full bg-gray-900 border border-white/10 overflow-hidden shadow-md">{u.profilePic ? <img src={resolveMediaUrl(u.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar />}</div><div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" /></div>
                                <div><div className="font-bold text-sm text-white">{u.username}</div><div className="text-[10px] text-gray-500 uppercase tracking-tighter">Online • Agent</div></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`flex-1 flex flex-col bg-[#050505] ${!activeChat ? 'hidden sm:flex' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-black/50 backdrop-blur-xl">
                                <button onClick={() => setActiveChat(null)} className="sm:hidden"><Icons.Back className="w-6 h-6" /></button>
                                <div className="w-10 h-10 rounded-full border border-yellow-500/30 overflow-hidden">{activeChat.profilePic ? <img src={resolveMediaUrl(activeChat.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar />}</div>
                                <div><div className="font-bold text-sm">{activeChat.username}</div><div className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Active Now</div></div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">{(messages[activeChat._id] || []).map((m, i) => (<div key={i} className={`flex ${m.sender === user._id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-md ${m.sender === user._id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1a1a1a] text-white rounded-bl-none'}`}>{m.text}<div className="text-[9px] opacity-50 text-right mt-1">{m.time}</div></div></div>))}<div ref={scrollRef} /></div>
                            <div className="p-4 bg-black/50 border-t border-white/5 flex items-center gap-4">
                                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 text-sm outline-none focus:border-blue-500 shadow-inner" />
                                <button onClick={handleSend} className="text-blue-500 font-bold text-sm tracking-widest uppercase hover:scale-105 transition-transform">Send</button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center"><div><Icons.MessageCircle className="w-16 h-16 text-gray-800 mx-auto mb-4" /><h3 className="font-black italic text-2xl tracking-tighter">YOUR MESSAGES</h3><p className="text-gray-500 text-sm mt-2">Send secret intel to other agents.</p></div></div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ isOpen, onClose, logout, user }) => {
    const [isPrivate, setIsPrivate] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(user.bio || "Entrepreneur. Legacy Member.");
    const fileRef = useRef(null);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl overflow-hidden animate-pop-in shadow-2xl">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="font-bold uppercase tracking-widest text-sm text-gray-400">Settings</h2>
                    <button onClick={onClose}><Icons.X className="w-5 h-5" /></button>
                </div>
                {isEditing ? (
                    <div className="p-6 text-center space-y-4">
                        <h3 className="text-white font-bold text-lg">Update Profile</h3>
                        <div onClick={() => fileRef.current.click()} className="w-24 h-24 mx-auto rounded-full bg-gray-800 overflow-hidden border-2 border-yellow-500 cursor-pointer relative group shadow-lg">
                            {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar size="large" />}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Camera className="w-8 h-8" /></div>
                        </div>
                        <input type="file" ref={fileRef} hidden onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const fd = new FormData(); fd.append('image', file);
                                try { await axios.post('/users/profile-pic', fd); alert("Profile Updated! Please refresh."); window.location.reload(); } catch (e) { alert("Failed to update."); }
                            }
                        }} />
                        <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-yellow-500 outline-none resize-none h-24" placeholder="Enter your bio..." />
                        <button onClick={async () => {
                            try {
                                await axios.put(`/users/${user._id}`, { bio });
                                alert("Bio Updated Successfully.");
                                window.location.reload();
                            } catch (e) { console.error(e); alert("Failed to update bio."); }
                        }} className="w-full py-3 bg-yellow-500 rounded-xl text-black font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform">SAVE CHANGES</button>
                        <button onClick={() => setIsEditing(false)} className="text-sm text-gray-500 hover:text-white font-bold uppercase tracking-wider">Cancel</button>
                    </div>
                ) : (
                    <div className="p-2">
                        <div className="p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 cursor-pointer rounded-xl">
                            <span className="text-sm font-bold text-gray-300">Private Account</span>
                            <div onClick={() => setIsPrivate(!isPrivate)} className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${isPrivate ? 'bg-green-500' : 'bg-gray-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isPrivate ? 'translate-x-4' : ''}`} />
                            </div>
                        </div>
                        <button onClick={() => setIsEditing(true)} className="w-full text-left p-4 hover:bg-white/5 flex items-center justify-between text-sm rounded-xl font-bold text-gray-300"><span>Edit Profile</span><Icons.ChevronRight className="w-4 h-4 text-gray-600" /></button>
                        <button onClick={logout} className="w-full text-left p-4 hover:bg-red-500/10 flex items-center justify-between text-red-500 font-bold text-sm border-t border-white/5 rounded-xl"><span>LOG OUT</span><Icons.Logout className="w-4 h-4" /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProfileModal = ({ isOpen, onClose, profileUser, currentUser, posts, allUsers = [], onViewProfile, onOpenDetail }) => {
    const [userData, setUserData] = useState(profileUser);
    const [activeList, setActiveList] = useState(null); // 'followers' | 'following' | null
    const userPosts = posts.filter(p => p.username === profileUser?.username);

    useEffect(() => {
        if (profileUser?.username) {
            axios.get(`/users/username/${profileUser.username}`).then(res => setUserData(res.data)).catch(() => setUserData(profileUser));
        }
    }, [profileUser]);

    if (!isOpen || !profileUser) return null;

    // Get List Data
    const getListUsers = () => {
        if (!activeList || !userData) return [];
        const ids = activeList === 'followers' ? userData.followers : userData.following;
        return allUsers.filter(u => ids?.includes(u._id));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative bg-[#0a0a0a] w-full max-w-lg h-full sm:h-[85vh] sm:rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl">
                <div className="flex-none p-4 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] z-50">
                    <button onClick={() => activeList ? setActiveList(null) : onClose()} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"><Icons.Back className="w-6 h-6 text-white" /></button>
                    <div className="font-bold text-white text-sm uppercase tracking-widest">{activeList ? (activeList === 'followers' ? 'Followers' : 'Following') : profileUser.username}</div>
                    <div className="w-10" /> {/* Spacer to balance the larger back button */}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#050505]">
                    {activeList ? (
                        <div className="p-2 space-y-2">
                            {getListUsers().length === 0 && <div className="p-4 text-center text-gray-500">No users found.</div>}
                            {getListUsers().map(u => (
                                <div key={u._id} onClick={() => { onViewProfile(u); setActiveList(null); }} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                        {u.profilePic ? <img src={resolveMediaUrl(u.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar />}
                                    </div>
                                    <div className="font-bold text-white text-sm">{u.username}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-800 overflow-hidden border-2 border-yellow-500 shadow-lg shadow-yellow-500/20 shrink-0">
                                    {profileUser.profilePic ? <img src={resolveMediaUrl(profileUser.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar size="large" />}
                                </div>
                                <div className="flex gap-4 sm:gap-8 text-center flex-1 justify-end px-2">
                                    <div><div className="font-black text-white text-lg sm:text-xl">{userPosts.length}</div><div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Posts</div></div>
                                    <div onClick={() => setActiveList('followers')} className="cursor-pointer hover:scale-105 transition-transform">
                                        <div className="font-black text-white text-lg sm:text-xl text-yellow-500">{userData?.followers?.length || 0}</div>
                                        <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Followers</div>
                                    </div>
                                    <div onClick={() => setActiveList('following')} className="cursor-pointer hover:scale-105 transition-transform">
                                        <div className="font-black text-white text-lg sm:text-xl">{userData?.following?.length || 0}</div>
                                        <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Following</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6 px-1">
                                <div className="font-black text-white text-xl mb-2">{profileUser.username}</div>
                                <div className="text-sm text-gray-300 leading-relaxed max-w-sm whitespace-pre-wrap font-medium">{profileUser.bio || "Entrepreneur. Legacy Member."}</div>
                            </div>

                            <div className="w-full h-px bg-white/10 mb-4" />

                            {userPosts.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 text-xs uppercase tracking-widest font-bold">No Intel Uploaded Yet</div>
                            ) : (
                                <div className="grid grid-cols-3 gap-1 pb-20">
                                    {userPosts.map(p => (
                                        <div key={p._id} onClick={() => onOpenDetail(p)} className="aspect-square bg-gray-900 border border-white/5 rounded-md overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center">
                                            {p.image ? (
                                                <img src={resolveMediaUrl(p.image)} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="p-2 text-center break-words w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black">
                                                    <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold leading-tight">{p.desc?.substring(0, 25)}...</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const CreateModal = ({ isOpen, onClose, onSuccess, user }) => {
    const [preview, setPreview] = useState(null);
    const [isVideo, setIsVideo] = useState(false);
    const fileRef = useRef(null);
    if (!isOpen) return null;
    const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { setPreview(URL.createObjectURL(file)); setIsVideo(file.type.startsWith('video')); } };
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-sm glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                <h2 className="text-xl font-black italic mb-4 text-white">UPLOAD INTEL</h2>
                <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10">
                        {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar />}
                    </div>
                    <textarea id="c-desc" placeholder="Decrypt your thoughts..." className="flex-1 bg-transparent text-sm outline-none text-white resize-none h-20 placeholder-gray-500" />
                </div>
                <div onClick={() => fileRef.current.click()} className="cursor-pointer mb-4">
                    {preview ? (
                        <div className="w-full h-48 rounded-2xl overflow-hidden relative bg-black border border-white/10 shadow-inner">
                            {isVideo ? <video src={preview} className="w-full h-full object-contain" controls /> : <img src={preview} className="w-full h-full object-cover" />}
                            <button onClick={(e) => { e.stopPropagation(); setPreview(null); fileRef.current.value = ''; }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors"><Icons.X className="w-3 h-3 text-white" /></button>
                        </div>
                    ) : (
                        <div className="w-full py-8 border border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all text-gray-500 cursor-pointer">
                            <Icons.Image className="w-8 h-8 opacity-50" />
                            <span className="text-xs font-bold uppercase tracking-widest">Add Media</span>
                        </div>
                    )}
                    <input type="file" ref={fileRef} accept="image/*,video/*" hidden onChange={handleFileChange} />
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs hover:bg-white/10 text-white uppercase tracking-widest">CANCEL</button>
                    <button onClick={async () => {
                        const desc = document.getElementById('c-desc').value;
                        const file = fileRef.current.files[0];
                        if (!desc && !file) return;
                        const fd = new FormData(); fd.append('desc', desc); if (file) fd.append('image', file);
                        try { await axios.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); onSuccess(); playSound('pop'); } catch (e) { }
                    }} className="flex-1 py-3 bg-yellow-500 rounded-xl text-black font-black text-xs hover:bg-yellow-400 uppercase tracking-widest shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform">POST</button>
                </div>
            </motion.div>
        </div>
    );
};

const App = () => {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null); // For Zoom View
    const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'forgot'

    useEffect(() => { const saved = localStorage.getItem('user'); if (saved) setUser(JSON.parse(saved)); }, []);
    useEffect(() => { if (user) { fetchPosts(); fetchUsers(); } }, [user]);

    const fetchPosts = async () => { try { const res = await axios.get('/posts?limit=100'); setPosts(res.data); } catch (e) { } };
    const fetchUsers = async () => { try { const res = await axios.get('/users'); setUsers(res.data); } catch (e) { } };
    const handleLike = async (postId) => { try { const res = await axios.put(`/posts/${postId}/like`); setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: res.data.likes } : p)); playSound('pop'); } catch (e) { } };
    const handleDislike = async (postId) => { try { await axios.put(`/posts/${postId}/dislike`); alert("Dislike registered."); } catch (e) { } };
    const handleComment = async (postId, text) => { try { const res = await axios.post(`/posts/${postId}/comment`, { text }); setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: res.data } : p)); } catch (e) { } };

    const handleDeletePost = async (postId) => { if (confirm("Permanently delete this intel?")) { try { await axios.delete(`/posts/${postId}`); setPosts(prev => prev.filter(p => p._id !== postId)); } catch (e) { } } };

    const viewProfile = (u) => { setProfileUser(u); setIsProfileOpen(true); };
    const logout = () => { localStorage.clear(); setUser(null); window.location.reload(); };

    if (!user) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative">
            <div className="liquid-bg" />
            <div className="w-full max-w-sm glass-panel p-8 rounded-[2rem] text-center shadow-2xl shadow-yellow-500/5">
                <h1 className="text-4xl font-black italic gold-text mb-8">LEGACY</h1>
                <div className="space-y-4">
                    {authMode === 'login' && (
                        <>
                            <input type="email" placeholder="Agent Email" id="l-email" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-yellow-500 shadow-inner" />
                            <input type="password" placeholder="Security Key" id="l-pass" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-yellow-500 shadow-inner" />
                            <button onClick={async () => {
                                const email = document.getElementById('l-email').value; const password = document.getElementById('l-pass').value;
                                try { const res = await axios.post('/auth/login', { email, password }); localStorage.setItem('token', res.data.token); localStorage.setItem('user', JSON.stringify(res.data.user)); setUser(res.data.user); } catch (e) { alert("Access Denied."); }
                            }} className="w-full liquid-btn py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-transform">INITIALIZE SESSION</button>
                            <div className="flex justify-between text-xs text-gray-500 px-2">
                                <span onClick={() => setAuthMode('register')} className="cursor-pointer hover:text-white">Join Protocol</span>
                                <span onClick={() => setAuthMode('forgot')} className="cursor-pointer hover:text-white">Forgot Key?</span>
                            </div>
                        </>
                    )}
                    {authMode === 'register' && (
                        <>
                            <input type="text" placeholder="Codename (Username)" id="r-user" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-yellow-500 shadow-inner" />
                            <input type="email" placeholder="Agent Email" id="r-email" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-yellow-500 shadow-inner" />
                            <input type="password" placeholder="Create Key" id="r-pass" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-yellow-500 shadow-inner" />
                            <button onClick={async () => {
                                const username = document.getElementById('r-user').value; const email = document.getElementById('r-email').value; const password = document.getElementById('r-pass').value;
                                try { await axios.post('/auth/register', { username, email, password }); alert("Protocol Joined. Login now."); setAuthMode('login'); } catch (e) { alert("Registration Failed."); }
                            }} className="w-full liquid-btn py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-transform">JOIN PROTOCOL</button>
                            <div className="text-xs text-gray-500 cursor-pointer hover:text-white" onClick={() => setAuthMode('login')}>Back to Login</div>
                        </>
                    )}
                    {authMode === 'forgot' && (
                        <>
                            <p className="text-sm text-gray-400 mb-2">Enter your email to receive a reset key.</p>
                            <input type="email" placeholder="Agent Email" id="f-email" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-yellow-500 shadow-inner" />
                            <button onClick={() => alert("Reset Key Sent (Simulation)")} className="w-full liquid-btn py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-transform">SEND KEY</button>
                            <div className="text-xs text-gray-500 cursor-pointer hover:text-white" onClick={() => setAuthMode('login')}>Back to Login</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    // FIX: Safe search filtering to prevent crash on missing desc/author
    const filteredPosts = posts.filter(p => {
        const q = searchQuery.toLowerCase();
        const descMatch = p.desc ? p.desc.toLowerCase().includes(q) : false;
        const authorMatch = p.author?.username ? p.author.username.toLowerCase().includes(q) : false;
        return descMatch || authorMatch;
    });

    return (
        <div className="min-h-screen bg-black text-white relative font-sans">
            <div className="liquid-bg" />
            <header className="sticky top-0 z-50 px-4 py-4 flex items-center justify-between bg-black/50 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
                <h1 className="text-2xl font-black italic tracking-tighter gold-text drop-shadow-md">LEGACY</h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCreateOpen(true)} className="p-2 bg-yellow-500 rounded-xl text-black shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform"><Icons.Plus className="w-5 h-5" /></button>
                    <button onClick={() => setIsChatOpen(true)} className="relative p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Icons.MessageCircle className="w-5 h-5" /><div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-black shadow-glow-red" /></button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 pb-32">
                {activeTab === 'alerts' ? (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold mb-6 px-2 text-white/90">Notifications</h2>
                        {alerts.length === 0 ? <div className="text-center text-gray-500 py-10 font-bold uppercase tracking-widest text-xs">No visible threats.</div> : alerts.map((n, i) => <NotificationItem key={i} note={n} onViewProfile={viewProfile} />)}
                    </div>
                ) : (
                    <>
                        {activeTab === 'search' && (
                            <div className="mb-8 space-y-4 animate-fade-in">
                                <div className="relative"><Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search usernames or #hashtags..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:border-yellow-500 transition-all shadow-inner" /></div>
                                <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar">{['#legacy', '#hustle', '#crypto', '#boxing'].map(t => <span key={t} onClick={() => setSearchQuery(t)} className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-400 cursor-pointer hover:text-white hover:bg-white/10 transition-colors border border-white/5">{t}</span>)}</div>
                            </div>
                        )}
                        <div className="space-y-6">
                            {(activeTab === 'search' ? filteredPosts : posts).map(p => <PostCard key={p._id} post={p} user={user} onLike={handleLike} onDislike={handleDislike} onComment={handleComment} onDelete={handleDeletePost} onViewProfile={viewProfile} onOpenDetail={setSelectedPost} />)}
                            {posts.length === 0 && <div className="h-96 center text-gray-700 font-bold text-sm uppercase tracking-widest italic">Decrypting Feed...</div>}
                        </div>
                    </>
                )}
            </main>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
                <div className="liquid-nav h-16 rounded-full px-6 flex items-center justify-between border border-white/10 shadow-2xl backdrop-blur-3xl bg-black/40">
                    <button onClick={() => setActiveTab('home')} className={`p-3 transition-all ${activeTab === 'home' ? 'text-white scale-110 drop-shadow-[0_0_10px_white]' : 'text-gray-500'}`}><Icons.Home className="w-6 h-6" /></button>
                    <button onClick={() => setActiveTab('search')} className={`p-3 transition-all ${activeTab === 'search' ? 'text-white scale-110 drop-shadow-[0_0_10px_white]' : 'text-gray-500'}`}><Icons.Search className="w-6 h-6" /></button>

                    <div className="w-16 h-16 bg-gradient-to-tr from-yellow-600 to-yellow-400 -mt-8 rounded-full border-4 border-black shadow-2xl shadow-yellow-500/30 cursor-pointer hover:scale-105 active:scale-95 transition-all z-50 flex items-center justify-center p-0"
                        onClick={() => setIsCreateOpen(true)}>
                        <Icons.Plus className="w-8 h-8 text-black drop-shadow-md" />
                    </div>

                    <button onClick={() => setActiveTab('alerts')} className={`p-3 transition-all ${activeTab === 'alerts' ? 'text-white scale-110 drop-shadow-[0_0_10px_white]' : 'text-gray-500'}`}><Icons.Bell className="w-6 h-6" /></button>
                    <button onClick={() => viewProfile(user)} className={`p-3 transition-all text-white/40 hover:text-white`}><div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden bg-gray-900 shadow-md">{user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <div className="center w-full h-full text-[10px]">{user.username?.[0]}</div>}</div></button>
                </div>
            </div>

            <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} user={user} allUsers={users} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} logout={logout} user={user} />
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profileUser={profileUser} currentUser={user} posts={posts} allUsers={users} onViewProfile={viewProfile} onOpenDetail={setSelectedPost} />
            <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={() => { setIsCreateOpen(false); fetchPosts(); }} user={user} />
            {selectedPost && <PostDetailModal post={selectedPost} user={user} onClose={() => setSelectedPost(null)} onLike={handleLike} onDislike={handleDislike} onComment={handleComment} onDelete={handleDeletePost} />}

            <div className="fixed top-4 right-4 z-50"><button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-black/50 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors"><Icons.Settings className="w-5 h-5 text-gray-400" /></button></div>
        </div>
    );
};

export default App;
