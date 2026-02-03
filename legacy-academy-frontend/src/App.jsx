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
    const sep = path.includes('?') ? '&' : '?';
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const parseHashtags = (text) => text ? text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) => part.startsWith('#') ? <span key={i} className="text-blue-400 font-medium hover:underline cursor-pointer">{part}</span> : part) : text;

// --- COMPONENTS ---

const DefaultAvatar = ({ name, size = "normal" }) => {
    const COLORS = [
        'from-red-500 to-orange-600', 'from-blue-500 to-cyan-600', 'from-emerald-500 to-green-600',
        'from-violet-500 to-purple-600', 'from-amber-500 to-yellow-600', 'from-rose-500 to-pink-600',
        'from-indigo-500 to-blue-600', 'from-teal-500 to-emerald-600'
    ];
    const hash = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const gradient = COLORS[hash % COLORS.length];

    return (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-inner relative overflow-hidden`}>
            <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
            {name ? <span className={`${size === "large" ? "text-3xl" : "text-sm"} font-black uppercase select-none`}>{name.substring(0, 1)}</span> : <Icons.User className={`${size === "large" ? "w-10 h-10" : "w-1/2 h-1/2"} opacity-80`} />}
        </div>
    );
};

const CommentItem = ({ comment, post, user, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);

    // PERMISSIONS:
    // 1. Comment Author -> Edit, Delete
    // 2. Post Author -> Delete Only
    // 3. Founder -> Delete, Edit (Everything)
    const isFounder = user?.role === 'Founder';
    const currentCommentAuthorId = comment.authorId || comment.user?._id || comment.userId;
    const isCommentAuthor = String(currentCommentAuthorId) === String(user?._id);
    const isPostAuthor = String(post.author?._id || post.author) === String(user?._id);

    const canEdit = isCommentAuthor || isFounder;
    const canDelete = isCommentAuthor || isPostAuthor || isFounder;

    const handleSave = () => {
        onEdit(post._id, comment._id, editText);
        setIsEditing(false);
    };

    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="flex gap-3 items-start group/comment relative">
            <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10 shadow-sm flex items-center justify-center text-xs font-bold text-white">
                {comment.user?.profilePic || comment.authorProfilePic ? <img src={resolveMediaUrl(comment.user?.profilePic || comment.authorProfilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={comment.user?.username || comment.authorName} />}
            </div>

            <div className="flex-1">
                <div className={`bg-white/10 rounded-2xl px-4 py-2 shadow-lg backdrop-blur-sm border border-white/5 transition-all ${isEditing ? 'bg-white/20' : ''}`}>
                    <span className="font-bold text-xs mr-2 text-yellow-500 shadow-black drop-shadow-sm">{comment.user?.username || comment.authorName}</span>
                    {isEditing ? (
                        <div className="mt-1">
                            <input autoFocus value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-black/50 border border-white/20 rounded-lg px-2 py-1 text-xs text-white outline-none mb-2" />
                            <div className="flex gap-2">
                                <button onClick={handleSave} className="text-[10px] uppercase font-bold text-green-500 hover:text-green-400">Save</button>
                                <button onClick={() => setIsEditing(false)} className="text-[10px] uppercase font-bold text-gray-400 hover:text-white">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-200">{comment.text}</span>
                    )}
                </div>

                {/* ACTIONS */}
                <div className="flex gap-3 mt-1 ml-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                    {canEdit && !isEditing && <button onClick={() => setIsEditing(true)} className="text-[10px] text-gray-500 hover:text-blue-400 font-bold uppercase tracking-widest">Edit</button>}
                    {canDelete && <button onClick={() => onDelete(post._id, comment._id)} className="text-[10px] text-gray-500 hover:text-red-500 font-bold uppercase tracking-widest">Delete</button>}
                </div>
            </div>
        </motion.div>
    );
};

const PostDetailModal = ({ post, user, onClose, onLike, onDislike, onShare, onComment, onDelete, onEdit, onDeleteComment, onEditComment, loadingActions }) => {
    if (!post) return null;
    const [commentText, setCommentText] = useState('');
    const isOwner = String(post.author?._id || post.author) === String(user?._id);

    return (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-start md:justify-center p-0 md:p-4 overflow-y-auto">
            <button onClick={onClose} className="fixed top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 z-[500] shadow-xl"><Icons.X className="w-6 h-6 text-white" /></button>
            <div className="w-full max-w-5xl h-fit md:h-[90vh] bg-[#0a0a0a] rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row border-none md:border md:border-white/10 shadow-2xl shrink-0 my-auto">
                {/* Image Section - Responsive height */}
                <div className="w-full md:flex-1 bg-black flex items-center justify-center relative shadow-inner overflow-hidden max-h-[50vh] min-h-[30vh] md:max-h-full md:h-full shrink-0">
                    {post.image ? (
                        post.videoUrl || post.image.match(/(mp4|mov|webm)$/i) ? (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                                <video src={resolveMediaUrl(post.videoUrl || post.image)} controls className="max-w-full max-h-full" />
                            </div>
                        ) : (
                            <img src={resolveMediaUrl(post.image)} className="max-w-full max-h-full object-contain" />
                        )
                    ) : <div className="p-10 text-center font-black text-2xl text-white italic bg-gradient-to-br from-yellow-500/20 to-black w-full h-full flex items-center justify-center uppercase tracking-tighter">{post.desc}</div>}
                </div>

                {/* Info Section - Fixed height or scrolling */}
                <div className="w-full md:w-[450px] flex flex-col bg-[#050505] border-l border-white/5 h-fit md:h-full">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                {post.author?.profilePic ? <img src={resolveMediaUrl(post.author.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={post.author?.username} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-white leading-none">{post.author?.username}</span>
                                <span className="text-[10px] text-yellow-500 mt-1 uppercase font-black tracking-widest">High Integrity</span>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {isOwner && <button onClick={() => onEdit(post)} className="p-2 text-gray-500 hover:text-blue-500 transition-colors"><Icons.Settings className="w-5 h-5" /></button>}
                            {isOwner && <button onClick={() => { if (confirm("Delete Intel?")) { onDelete(post._id); onClose(); } }} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Icons.Trash className="w-5 h-5" /></button>}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20 max-h-[60vh] md:max-h-full">
                        <div className="mb-6 text-sm text-gray-200 border-l-2 border-yellow-500/30 pl-3 py-1 font-medium leading-relaxed italic">{parseHashtags(post.desc)}</div>
                        <div className="space-y-4 pb-4">
                            <AnimatePresence>
                                {post.comments?.map((c, i) => (
                                    <CommentItem key={c._id || i} comment={c} post={post} user={user} onEdit={onEditComment} onDelete={onDeleteComment} />
                                ))}
                                {post.comments?.length === 0 && <div className="text-center py-10 text-gray-600 text-[10px] uppercase font-bold tracking-widest">No strategic resonance yet.</div>}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/5 bg-black sticky bottom-0 z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-6">
                                <button disabled={loadingActions?.[post._id]} onClick={() => onLike(post._id)} className={`flex items-center gap-2 group transition-all active:scale-125 ${loadingActions?.[post._id] ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <Icons.Heart className={`w-6 h-6 transition-all ${(Array.isArray(post.likes) && post.likes.includes(user?._id)) ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-white'}`} />
                                    <span className="text-xs font-black text-gray-500">{post.likes?.length || 0}</span>
                                </button>
                                <button onClick={() => onDislike(post._id)} className="flex items-center gap-2 group transition-all active:scale-125">
                                    <Icons.ThumbsDown className={`w-6 h-6 transition-all ${(Array.isArray(post.dislikes) && post.dislikes.includes(user?._id)) ? 'text-yellow-500' : 'text-gray-400 group-hover:text-white'}`} />
                                    <span className="text-xs font-black text-gray-500">{post.dislikes?.length || 0}</span>
                                </button>
                                <button onClick={() => onShare(post)} className="text-gray-400 hover:text-white transition-colors active:rotate-45"><Icons.Send className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); if (!commentText.trim()) return; onComment(post._id, commentText); setCommentText(''); }} className="flex gap-2 items-center bg-white/5 rounded-2xl px-4 py-2 border border-white/5 focus-within:border-yellow-500/50 transition-all">
                            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Engage..." className="flex-1 bg-transparent text-sm outline-none text-white py-2 placeholder-gray-600" />
                            <button disabled={!commentText.trim()} className="text-yellow-500 font-black text-xs uppercase tracking-widest disabled:opacity-20">Post</button>
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
                {note.sender?.profilePic ? <img src={resolveMediaUrl(note.sender.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={note.sender?.username} />}
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

const PostCard = ({ post, user, onLike, onDislike, onComment, onDelete, onViewProfile, onOpenDetail, onShare, onEditComment, onDeleteComment, onEditPost, loadingActions }) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showHeart, setShowHeart] = useState(false);
    const isFounder = user?.role === 'Founder';
    const isPostAuthorFounder = post.author?.role === 'Founder';
    const isOwner = post.author?._id === user?._id || post.author === user?._id;
    const dislikeCount = post.dislikes?.length || 0;

    const handleComment = (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        onComment(post._id, commentText);
        setCommentText('');
    };

    const handleDelete = () => {
        onDelete(post._id);
    };

    const handleDoubleTap = (e) => {
        e.stopPropagation();
        const isLiked = Array.isArray(post.likes) && post.likes.some(id => String(id) === String(user?._id));
        if (!isLiked) {
            onLike(post._id);
        }
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
    };

    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`glass-card mb-4 rounded-3xl overflow-hidden relative border bg-[#050505] transform transition-all ${isPostAuthorFounder ? 'border-yellow-500/50 shadow-[0_0_30px_-5px_rgba(234,179,8,0.15)]' : 'border-white/5'}`}>
            {/* WRAPPER LINK FOR DETAILS */}
            <div className="p-4" >
                <div className="flex items-start gap-3">
                    <div onClick={(e) => { e.stopPropagation(); onViewProfile(post.author) }} className="cursor-pointer shrink-0">
                        <div className={`w-12 h-12 rounded-full bg-gray-800 overflow-hidden border ${isPostAuthorFounder ? 'border-yellow-500 shadow-md shadow-yellow-500/20' : 'border-white/10'}`}>
                            {post.author?.profilePic ? <img src={resolveMediaUrl(post.author.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={post.author?.username} />}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span onClick={(e) => { e.stopPropagation(); onViewProfile(post.author) }} className="font-bold text-base text-white hover:underline cursor-pointer leading-tight flex items-center gap-1">
                                    {post.author?.username}
                                    {isPostAuthorFounder && <Icons.Shield className="w-3 h-3 text-yellow-500 fill-current" />}
                                </span>
                                <span className="text-gray-500 text-xs">@{post.author?.username?.toLowerCase()} · 2h</span>
                            </div>
                            <div className="flex gap-1">
                                {isOwner && (
                                    <button onClick={(e) => { e.stopPropagation(); onEditPost(post); }} className="text-gray-500 hover:text-blue-500 p-1">
                                        <Icons.Settings className="w-4 h-4" />
                                    </button>
                                )}
                                {(isOwner || isFounder) && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="text-gray-500 hover:text-red-500 p-1">
                                        <Icons.Trash className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* POST TEXT CONTENT */}
                        <div onClick={() => onOpenDetail(post)} className="mt-1 text-sm text-white/90 whitespace-pre-wrap break-words cursor-pointer mb-2 font-normal">
                            {parseHashtags(post.desc)}
                        </div>

                        {/* MEDIA CONTENT */}
                        {post.image && (
                            <div onClick={() => onOpenDetail(post)} onDoubleClick={handleDoubleTap} className="mt-2 rounded-xl overflow-hidden border border-white/10 relative shadow-sm cursor-pointer bg-black/50" style={{ maxHeight: '500px' }}>
                                {/* DETECT VIDEO VS IMAGE - SIMPLE CHECK BASED ON EXTENSION OR TYPE field if available. Using onError fallback for safety */}
                                {post.videoUrl || (post.image.match(/\.(mp4|mov|webm)$/i)) ? (
                                    <video src={resolveMediaUrl(post.videoUrl || post.image)} controls className="w-full h-full object-cover max-h-[500px]" />
                                ) : (
                                    <img src={resolveMediaUrl(post.image)} className="w-full h-full object-cover max-h-[500px]" loading="lazy" />
                                )}
                                <AnimatePresence>
                                    {showHeart && (
                                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                            <Icons.Heart className="w-24 h-24 text-yellow-500 fill-yellow-500 drop-shadow-2xl" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* ACTIONS BAR - BLUESKY STYLE */}
                        <div className="flex items-center justify-between mt-4 pr-4 max-w-md">
                            <button onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }} className="flex items-center gap-1.5 group text-gray-500 hover:text-blue-400 transition-colors">
                                <div className="p-1.5 rounded-full group-hover:bg-blue-500/10"><Icons.MessageCircle className="w-5 h-5" /></div>
                                <span className="text-xs font-medium">{post.comments?.length || 0}</span>
                            </button>

                            <button disabled={loadingActions?.[post._id]} onClick={(e) => { e.stopPropagation(); if (!loadingActions?.[post._id]) onLike(post._id); }} className={`flex items-center gap-1.5 group transition-colors ${loadingActions?.[post._id] ? 'opacity-50 cursor-not-allowed' : ''} ${(Array.isArray(post.likes) && post.likes.some(id => String(id) === String(user?._id))) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
                                <div className="p-1.5 rounded-full group-hover:bg-red-500/10"><Icons.Heart className={`w-5 h-5 ${(Array.isArray(post.likes) && post.likes.some(id => String(id) === String(user?._id))) ? 'fill-current' : ''}`} /></div>
                                <span className="text-xs font-medium">{post.likes?.length || 0}</span>
                            </button>

                            <button onClick={(e) => { e.stopPropagation(); onDislike(post._id); }} className={`flex items-center gap-1.5 group transition-colors ${(Array.isArray(post.dislikes) && post.dislikes.some(id => String(id) === String(user?._id))) ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}>
                                <div className="p-1.5 rounded-full group-hover:bg-yellow-500/10"><Icons.ThumbsDown className="w-5 h-5" /></div>
                                <span className="text-xs font-medium">{dislikeCount}</span>
                            </button>

                            <button onClick={(e) => { e.stopPropagation(); onShare(post); }} className="flex items-center gap-1.5 group text-gray-500 hover:text-green-400 transition-colors">
                                <div className="p-1.5 rounded-full group-hover:bg-green-500/10"><Icons.Send className="w-5 h-5" /></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* INLINE COMMENTS EXPANSION */}
            <AnimatePresence>
                {showComments && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-[#0a0a0a]/50 border-t border-white/5 overflow-hidden">
                        <div className="p-4 space-y-4">
                            {post.comments?.map((c, idx) => (
                                <CommentItem key={c._id || idx} comment={c} post={post} user={user} onEdit={onEditComment} onDelete={onDeleteComment} />
                            ))}
                            <form onSubmit={handleComment} className="flex gap-3 items-center mt-4">
                                <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden shrink-0">
                                    {user?.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={user?.username} />}
                                </div>
                                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Post your reply..." className="flex-1 bg-transparent border-b border-gray-700 py-2 text-sm text-white outline-none focus:border-yellow-500 placeholder-gray-600" />
                                <button disabled={!commentText.trim()} className="text-blue-500 font-bold text-sm disabled:opacity-50">Post</button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ... ChatModal, SettingsModal, ProfileModal, CreateModal same logic ...
// Re-inserting them to ensure full file integrity

const ChatModal = ({ isOpen, onClose, user, allUsers }) => {
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState({});
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef();

    useEffect(() => { if (activeChat) scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeChat]);
    const handleSend = () => {
        if (!inputText.trim()) return;
        const msg = { id: Date.now(), text: inputText, sender: user?._id, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
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
                        {allUsers.filter(u => u._id !== user?._id).map(u => (
                            <div key={u._id} onClick={() => setActiveChat(u)} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${activeChat?._id === u._id ? 'bg-white/5' : ''}`}>
                                <div className="relative"><div className="w-12 h-12 rounded-full bg-gray-900 border border-white/10 overflow-hidden shadow-md">{u.profilePic ? <img src={resolveMediaUrl(u.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={u.username} />}</div><div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" /></div>
                                <div><div className="font-bold text-sm text-white">{u?.username}</div><div className="text-[10px] text-gray-500 uppercase tracking-tighter">Online • Agent</div></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`flex-1 flex flex-col bg-[#050505] ${!activeChat ? 'hidden sm:flex' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-black/50 backdrop-blur-xl">
                                <button onClick={() => setActiveChat(null)} className="sm:hidden"><Icons.Back className="w-6 h-6" /></button>
                                <div className="w-10 h-10 rounded-full border border-yellow-500/30 overflow-hidden">{activeChat?.profilePic ? <img src={resolveMediaUrl(activeChat.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={activeChat?.username} />}</div>
                                <div><div className="font-bold text-sm">{activeChat?.username}</div><div className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Active Now</div></div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">{(messages[activeChat._id] || []).map((m, i) => (<div key={i} className={`flex ${m.sender === user?._id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-md ${m.sender === user?._id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1a1a1a] text-white rounded-bl-none'}`}>{m.text}<div className="text-[9px] opacity-50 text-right mt-1">{m.time}</div></div></div>))}<div ref={scrollRef} /></div>
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

const SettingsModal = ({ isOpen, onClose, logout, user, onUpdateUser }) => {
    const [isPrivate, setIsPrivate] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(user?.bio || "Entrepreneur. Legacy Member.");
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
                            {user?.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar size="large" name={user?.username} />}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Camera className="w-8 h-8" /></div>
                        </div>
                        <input type="file" ref={fileRef} hidden onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const fd = new FormData(); fd.append('image', file);
                                try {
                                    const res = await axios.post('/users/profile-pic', fd);
                                    alert("Profile Updated!");
                                    const updatedUser = res.data;
                                    localStorage.setItem('user', JSON.stringify(updatedUser));
                                    onUpdateUser(updatedUser);
                                } catch (e) { alert("Failed to update."); }
                            }
                        }} />
                        <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-yellow-500 outline-none resize-none h-24" placeholder="Enter your bio..." />
                        <button onClick={async () => {
                            try {
                                const res = await axios.put(`/users/${user?._id}`, { bio });
                                alert("Bio Updated!");
                                if (res.data) {
                                    localStorage.setItem('user', JSON.stringify(res.data));
                                    onUpdateUser(res.data);
                                } else {
                                    const updatedUser = { ...user, bio };
                                    localStorage.setItem('user', JSON.stringify(updatedUser));
                                    onUpdateUser(updatedUser);
                                }
                                setIsEditing(false);
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

const ProfileModal = ({ isOpen, onClose, profileUser, currentUser, posts, allUsers = [], onViewProfile, onOpenDetail, onFollow }) => {
    const [userData, setUserData] = useState(profileUser);
    const [activeList, setActiveList] = useState(null); // 'followers' | 'following' | null
    const userPosts = posts.filter(p => p.author?._id === profileUser?._id || p.author === profileUser?._id || p.username === profileUser?.username);

    useEffect(() => {
        if (profileUser?._id === currentUser?._id) {
            setUserData(currentUser);
        } else if (profileUser?._id) {
            axios.get(`/users/find/${profileUser._id || profileUser}`).then(res => setUserData(res.data)).catch(() => setUserData(profileUser));
        }
    }, [profileUser, currentUser]);

    if (!isOpen || !profileUser) return null;

    const displayUser = (profileUser?._id === currentUser?._id) ? currentUser : userData;

    const getListUsers = () => {
        if (!activeList || !displayUser) return [];
        const ids = activeList === 'followers' ? displayUser.followers : displayUser.following;
        return allUsers.filter(u => ids?.includes(u._id));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative bg-[#0a0a0a] w-full max-w-lg h-full sm:h-[85vh] sm:rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl">
                <div className="flex-none p-4 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] z-50">
                    <button onClick={() => activeList ? setActiveList(null) : onClose()} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"><Icons.Back className="w-6 h-6 text-white" /></button>
                    <div className="font-bold text-white text-sm uppercase tracking-widest">{activeList ? (activeList === 'followers' ? 'Followers' : 'Following') : displayUser?.username}</div>
                    <div className="w-10" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#050505]">
                    {activeList ? (
                        <div className="p-2 space-y-2">
                            {getListUsers().length === 0 && <div className="p-4 text-center text-gray-500">No users found.</div>}
                            {getListUsers().map(u => (
                                <div key={u._id} onClick={() => { onViewProfile(u); setActiveList(null); }} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                        {u.profilePic ? <img src={resolveMediaUrl(u.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={u.username} />}
                                    </div>
                                    <div className="font-bold text-white text-sm">{u?.username}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-800 overflow-hidden border-2 border-yellow-500 shadow-lg shadow-yellow-500/20 shrink-0">
                                    {displayUser?.profilePic ? <img src={resolveMediaUrl(displayUser.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar size="large" name={displayUser?.username} />}
                                </div>
                                <div className="flex gap-4 sm:gap-8 text-center flex-1 justify-end px-2">
                                    <div><div className="font-black text-white text-lg sm:text-xl">{userPosts.length}</div><div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Posts</div></div>
                                    <div onClick={() => setActiveList('followers')} className="cursor-pointer hover:scale-105 transition-transform">
                                        <div className="font-black text-white text-lg sm:text-xl text-yellow-500">{displayUser?.followers?.length || 0}</div>
                                        <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Followers</div>
                                    </div>
                                    <div onClick={() => setActiveList('following')} className="cursor-pointer hover:scale-105 transition-transform">
                                        <div className="font-black text-white text-lg sm:text-xl">{displayUser?.following?.length || 0}</div>
                                        <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Following</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6 px-1">
                                <div className="font-black text-white text-xl mb-1 flex items-center justify-center gap-2">
                                    {displayUser?.username || "Unknown Agent"}
                                    {displayUser?.role === 'Founder' && <Icons.Shield className="w-5 h-5 text-yellow-500 fill-current" />}
                                </div>
                                <div className="text-sm text-gray-300 leading-relaxed max-w-sm whitespace-pre-wrap font-medium mb-4">{displayUser?.bio || "Entrepreneur. Legacy Member."}</div>

                                {displayUser?._id !== currentUser?._id && (
                                    <button
                                        onClick={() => onFollow(displayUser?._id || displayUser)}
                                        className={`w-full py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${displayUser?.followers?.includes(currentUser?._id) ? 'bg-white/5 text-white border border-white/10' : 'bg-yellow-500 text-black hover:bg-yellow-400'}`}
                                    >
                                        {displayUser?.followers?.includes(currentUser?._id) ? 'FOLLOWING' : 'FOLLOW'}
                                    </button>
                                )}
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
                        {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={user.username} />}
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

const EditPostModal = ({ isOpen, onClose, onSuccess, post }) => {
    const [desc, setDesc] = useState(post?.desc || '');
    const [preview, setPreview] = useState(post?.image ? resolveMediaUrl(post.image) : null);
    const [isVideo, setIsVideo] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        if (post) {
            setDesc(post.desc || '');
            setPreview(post.image ? resolveMediaUrl(post.image) : null);
            setIsVideo(post.videoUrl ? true : (post.image?.match(/\.(mp4|mov|webm)$/i) ? true : false));
        }
    }, [post]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            setIsVideo(file.type.startsWith('video'));
        }
    };

    const handleSave = async () => {
        const fd = new FormData();
        fd.append('desc', desc);
        const file = fileRef.current?.files[0];
        if (file) fd.append('image', file);

        try {
            await axios.put(`/posts/${post._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            onSuccess();
            playSound('pop');
        } catch (e) {
            console.error("Edit failed", e);
        }
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-sm glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                <h2 className="text-xl font-black italic mb-4 text-white uppercase tracking-tighter">EDIT INTEL</h2>
                <div className="flex flex-col gap-4">
                    <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Update intelligence..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none h-32 resize-none placeholder-gray-600" />
                    <div onClick={() => fileRef.current.click()} className="cursor-pointer">
                        {preview ? (
                            <div className="w-full h-48 rounded-2xl overflow-hidden relative bg-black border border-white/10">
                                {isVideo ? <video src={preview} className="w-full h-full object-contain" controls /> : <img src={preview} className="w-full h-full object-cover" />}
                                <button onClick={(e) => { e.stopPropagation(); setPreview(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors"><Icons.X className="w-3 h-3 text-white" /></button>
                            </div>
                        ) : (
                            <div className="w-full py-8 border border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all text-gray-500">
                                <Icons.Image className="w-8 h-8 opacity-50" />
                                <span className="text-xs font-bold uppercase tracking-widest">Update Media</span>
                            </div>
                        )}
                        <input type="file" ref={fileRef} accept="image/*,video/*" hidden onChange={handleFileChange} />
                    </div>
                </div>
                <div className="flex gap-4 mt-6">
                    <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs text-white uppercase tracking-widest">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-yellow-500 rounded-xl text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform">Update</button>
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
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [postToEdit, setPostToEdit] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null); // For Zoom View
    const [loadingActions, setLoadingActions] = useState({}); // per-post loading state for optimistic UI
    const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'forgot'

    useEffect(() => { const saved = localStorage.getItem('user'); if (saved) setUser(JSON.parse(saved)); }, []);
    useEffect(() => { if (user) { fetchPosts(); fetchUsers(); } }, [user]);

    const fetchPosts = async () => { try { const res = await axios.get('/posts?limit=20'); setPosts(res.data); } catch (e) { } };
    const fetchUsers = async () => { try { const res = await axios.get('/users'); setUsers(res.data); } catch (e) { } };

    const handleLike = async (postId) => {
        const userId = user?._id;
        if (!userId) return;

        // 1. OPTIMISTIC UPDATE (Instant Feedback)
        setPosts(prev => prev.map(p => {
            if (String(p._id) !== String(postId)) return p;
            const likes = Array.isArray(p.likes) ? [...p.likes] : [];
            const dislikes = Array.isArray(p.dislikes) ? p.dislikes.filter(id => String(id) !== String(userId)) : [];
            const hasLiked = likes.some(id => String(id) === String(userId));
            const newLikes = hasLiked ? likes.filter(id => String(id) !== String(userId)) : [...likes, userId];
            return { ...p, likes: newLikes, dislikes };
        }));

        setLoadingActions(prev => ({ ...prev, [postId]: true }));
        if (navigator.vibrate) navigator.vibrate(50);
        playSound('pop');

        try {
            const res = await axios.put(`/posts/${postId}/like`);
            // 2. SERVER SYNC (Only if valid arrays returned)
            const { likes, dislikes } = res.data;
            if (Array.isArray(likes) && Array.isArray(dislikes)) {
                setPosts(prev => prev.map(p => String(p._id) === String(postId) ? { ...p, likes, dislikes } : p));
                if (selectedPost && String(selectedPost._id) === String(postId)) {
                    setSelectedPost(prev => ({ ...prev, likes, dislikes }));
                }
            }
        } catch (e) {
            console.error('Like failed', e);
            // Revert would go here, but omitted for speed/simplicity as failures are rare
        } finally {
            setLoadingActions(prev => { const copy = { ...prev }; delete copy[postId]; return copy; });
        }
    };

    const handleDislike = async (postId) => {
        const userId = user?._id;
        if (!userId) return;

        // 1. OPTIMISTIC UPDATE
        setPosts(prev => prev.map(p => {
            if (String(p._id) !== String(postId)) return p;
            const dislikes = Array.isArray(p.dislikes) ? [...p.dislikes] : [];
            const likes = Array.isArray(p.likes) ? p.likes.filter(id => String(id) !== String(userId)) : [];
            const hasDisliked = dislikes.some(id => String(id) === String(userId));
            const newDislikes = hasDisliked ? dislikes.filter(id => String(id) !== String(userId)) : [...dislikes, userId];
            return { ...p, likes, dislikes: newDislikes };
        }));

        setLoadingActions(prev => ({ ...prev, [postId]: true }));
        if (navigator.vibrate) navigator.vibrate(50);
        playSound('pop');

        try {
            const res = await axios.put(`/posts/${postId}/dislike`);
            // 2. SERVER SYNC (Validate Data First)
            const { likes, dislikes } = res.data;
            if (Array.isArray(likes) && Array.isArray(dislikes)) {
                setPosts(prev => prev.map(p => String(p._id) === String(postId) ? { ...p, likes, dislikes } : p));
                if (selectedPost && String(selectedPost._id) === String(postId)) {
                    setSelectedPost(prev => ({ ...prev, likes, dislikes }));
                }
            }
        } catch (e) {
            console.error('Dislike failed', e);
        } finally {
            setLoadingActions(prev => { const copy = { ...prev }; delete copy[postId]; return copy; });
        }
    };
    const handleComment = async (postId, text) => {
        try {
            const res = await axios.post(`/posts/${postId}/comment`, { text });
            const updatedComments = res.data;
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updatedComments } : p));
            if (selectedPost?._id === postId) setSelectedPost(prev => ({ ...prev, comments: updatedComments }));
        } catch (e) { }
    };

    const handleFollow = async (targetId) => {
        try {
            const res = await axios.post(`/users/${targetId}/follow`);
            setUsers(prev => prev.map(u => u._id === targetId ? { ...u, followers: res.data.followers } : u));
            setUser(prev => {
                const isFollowing = res.data.isFollowing;
                if (isFollowing) return { ...prev, following: [...(prev.following || []), targetId] };
                return { ...prev, following: (prev.following || []).filter(id => id !== targetId) };
            });
            if (profileUser?._id === targetId || profileUser === targetId) {
                setProfileUser(prev => ({ ...prev, followers: res.data.followers }));
            }
            playSound('pop');
        } catch (e) { }
    };

    // FIX: Real Share Functionality
    const handleShare = async (post) => {
        const shareData = {
            title: 'Legacy Academy Intel',
            text: `Check out this post by ${post.author?.username}`,
            url: window.location.href // Ideally this would be a direct post link
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (e) { }
        } else {
            navigator.clipboard.writeText(shareData.url);
            alert("Link copied to clipboard.");
        }
    };

    // COMMENT MANAGEMENT
    const handleDeleteComment = async (postId, commentId) => {
        try {
            await axios.delete(`/posts/${postId}/comment/${commentId}`);
            setPosts(prev => prev.map(p => {
                if (p._id === postId) {
                    const filtered = p.comments.filter(c => c._id !== commentId);
                    if (selectedPost?._id === postId) setSelectedPost(prev => ({ ...prev, comments: filtered }));
                    return { ...p, comments: filtered };
                }
                return p;
            }));
            playSound('sword');
        } catch (err) {
            console.error("Failed to delete comment", err);
        }
    };

    const handleEditComment = async (postId, commentId, text) => {
        try {
            const res = await axios.put(`/posts/${postId}/comment/${commentId}`, { text });
            const updatedComments = res.data;
            setPosts(prev => prev.map(p => {
                if (p._id === postId) {
                    if (selectedPost?._id === postId) setSelectedPost(prev => ({ ...prev, comments: updatedComments }));
                    return { ...p, comments: updatedComments };
                }
                return p;
            }));
        } catch (e) {
            console.error("Failed to edit comment", e);
        }
    };

    const handleDeletePost = async (postId) => { if (confirm("Permanently delete this intel?")) { try { await axios.delete(`/posts/${postId}`); setPosts(prev => prev.filter(p => p._id !== postId)); playSound('sword'); explodeEffect(); } catch (e) { } } };

    const viewProfile = (u) => { setProfileUser(u); setIsProfileOpen(true); };
    const logout = () => { localStorage.clear(); setUser(null); window.location.reload(); };

    if (!user) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative">
            <div className="liquid-bg" />
            <div className="w-full max-w-sm glass-panel p-8 rounded-[2rem] text-center shadow-2xl shadow-yellow-500/5">
                <div className="flex flex-col items-center mb-8">
                    <img src="/image/Logo.png" className="w-28 h-28 mb-2" alt="Legacy Logo" />
                </div>
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
        const authorMatch = p.author?.username ? p.author.username.toLowerCase().includes(q) : (p.username ? p.username.toLowerCase().includes(q) : false);
        return descMatch || authorMatch;
    });

    return (
        <div className="min-h-screen bg-black text-white relative font-sans">
            <div className="liquid-bg" />
            <header className="sticky top-0 z-50 px-4 py-4 flex items-center justify-between bg-black/50 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
                <div className="flex items-center gap-2">
                    <img src="/image/Logo.png" className="w-10 h-10" alt="Logo" />
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTab('alerts')} className="relative p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <Icons.Bell className={`w-5 h-5 ${user?.notifications?.some(n => !n.read) ? 'text-yellow-500 fill-yellow-500 animate-pulse' : 'text-gray-400'}`} />
                        {user?.notifications?.some(n => !n.read) && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-black shadow-glow-red" />}
                    </button>
                    <button onClick={() => setIsCreateOpen(true)} className="p-2 bg-yellow-500 rounded-xl text-black shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform"><Icons.Plus className="w-5 h-5" /></button>
                    <button onClick={() => setIsChatOpen(true)} className="relative p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Icons.MessageCircle className="w-5 h-5" /><div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-black shadow-glow-red" /></button>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Icons.Settings className="w-5 h-5 text-gray-400" /></button>
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
                            {(activeTab === 'search' ? (posts.filter(p => (p.desc + p.author?.username).toLowerCase().includes(searchQuery.toLowerCase()))) : posts).map(p => <PostCard key={p._id} post={p} user={user} onLike={handleLike} onDislike={handleDislike} onComment={handleComment} onDelete={handleDeletePost} onViewProfile={viewProfile} onOpenDetail={setSelectedPost} onShare={handleShare} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onEditPost={(post) => { setPostToEdit(post); setIsEditOpen(true); }} loadingActions={loadingActions} />)}
                            {posts.length === 0 && (
                                <div className="h-96 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                                    <div className="text-yellow-500 font-black text-sm uppercase tracking-[0.2em] animate-pulse">Decrypting Feed...</div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-50">
                <div className="liquid-glass-nav h-[68px] rounded-[2rem] px-5 flex items-center justify-between shadow-2xl">
                    <button onClick={() => setActiveTab('home')} className={`nav-item-btn ${activeTab === 'home' ? 'nav-item-active' : ''}`}><Icons.Home className="w-5 h-5" /></button>
                    <button onClick={() => setActiveTab('search')} className={`nav-item-btn ${activeTab === 'search' ? 'nav-item-active' : ''}`}><Icons.Search className="w-5 h-5" /></button>

                    {/* CENTER ACTION */}
                    <button onClick={() => setIsCreateOpen(true)} className="nav-center-action">
                        <Icons.Plus className="w-7 h-7 text-yellow-500" />
                    </button>

                    <button onClick={logout} className="nav-logout-btn"><Icons.Logout className="w-5 h-5" /></button>

                    <button onClick={() => viewProfile(user)} className={`p-0.5 rounded-full border-2 transition-all ${activeTab === 'profile' ? 'border-yellow-500' : 'border-transparent'}`}>
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-white/5">
                            {user?.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <div className="center w-full h-full text-[11px] font-bold text-yellow-500">{user?.username?.[0]}</div>}
                        </div>
                    </button>
                </div>
            </div>

            <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} user={user} allUsers={users} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} logout={logout} user={user} onUpdateUser={setUser} />
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profileUser={profileUser} currentUser={user} posts={posts} allUsers={users} onViewProfile={viewProfile} onOpenDetail={setSelectedPost} onFollow={handleFollow} />
            <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={() => { setIsCreateOpen(false); fetchPosts(); }} user={user} />
            <EditPostModal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setPostToEdit(null); }} onSuccess={() => { setIsEditOpen(false); setPostToEdit(null); fetchPosts(); }} post={postToEdit} />
            {selectedPost && <PostDetailModal post={selectedPost} user={user} onClose={() => setSelectedPost(null)} onLike={handleLike} onDislike={handleDislike} onShare={handleShare} onComment={handleComment} onDelete={handleDeletePost} onEdit={(p) => { setPostToEdit(p); setIsEditOpen(true); }} onDeleteComment={handleDeleteComment} onEditComment={handleEditComment} loadingActions={loadingActions} />}


        </div>
    );
};

export default App;
