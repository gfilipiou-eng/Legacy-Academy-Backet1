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
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    const sep = path.includes('?') ? '&' : '?';
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Helpers for Youtube detection/embed
const isYouTubeUrl = (url) => {
    if (!url) return false;
    try {
        return /^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i.test(url);
    } catch (e) { return false; }
};
const getYouTubeEmbedUrl = (url) => {
    const m = /^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i.exec(url || '');
    if (!m) return null;
    return `https://www.youtube.com/embed/${m[1]}`;
};

const parseHashtags = (text) => text ? text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) => part.startsWith('#') ? <span key={i} className="text-blue-400 font-medium hover:underline cursor-pointer">{part}</span> : part) : text;
const isUserOnline = (u, currentUser) => {
    if (!u || !u.lastSeen) return false;
    // Rule: Only show online status if the user follows me (the current viewer)
    const isFollower = u.following?.includes(currentUser?._id) || (currentUser && u.following?.includes(String(currentUser._id)));
    if (!isFollower && u._id !== currentUser?._id) return false;

    try { return (Date.now() - new Date(u.lastSeen).getTime()) < 60000; } catch (e) { return false; }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d`;

        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) { return ''; }
};

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
            <div className="w-full max-w-5xl h-auto md:h-[90vh] bg-[#0a0a0a] rounded-none md:rounded-3xl overflow-hidden flex flex-col md:flex-row border-none md:border md:border-white/10 shadow-2xl shrink-0 my-auto">
                {/* Image Section - Responsive height */}
                <div className="w-full md:flex-1 bg-black flex items-center justify-center relative shadow-inner overflow-hidden max-h-[50vh] min-h-[30vh] md:max-h-full md:h-full shrink-0">
                    {(post.image || post.videoUrl || post.thumbnailUrl) ? (
                        (isYouTubeUrl(post.videoUrl || post.thumbnailUrl || post.image || '')) ? (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                                <iframe title="youtube" src={getYouTubeEmbedUrl(post.videoUrl || post.thumbnailUrl || post.image)} className="max-w-full max-h-full" style={{ width: '100%', height: '100%' }} frameBorder="0" allowFullScreen />
                            </div>
                        ) : (post.videoUrl || (post.image && post.image.match(/(mp4|mov|webm)$/i))) ? (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                                <video src={resolveMediaUrl(post.videoUrl || post.image)} autoPlay muted loop playsInline controls className="max-w-full max-h-full" />
                            </div>
                        ) : (
                            <img src={resolveMediaUrl(post.image || post.thumbnailUrl)} className="max-w-full max-h-full object-contain" />
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
                                {post.author?.role === 'Founder' ? (
                                    <span className="text-[10px] text-red-600 mt-1 uppercase font-black tracking-widest drop-shadow-sm">FOUNDER</span>
                                ) : (
                                    <span className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">MEMBER</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {isOwner && <button onClick={() => onEdit(post)} className="p-3 text-gray-500 hover:text-blue-500 transition-colors"><Icons.Settings className="w-5 h-5" /></button>}
                            {(isOwner || isFounder) && <button onClick={() => { if (confirm("Terminate intel packet?")) { onDelete(post._id); onClose(); } }} className="p-3 text-gray-500 hover:text-red-500 transition-colors"><Icons.Trash className="w-5 h-5" /></button>}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20 md:max-h-full">
                        <div className="mb-6 text-sm text-gray-200 border-l-2 border-yellow-500/30 pl-3 py-1 font-medium leading-relaxed italic">{parseHashtags(post.desc)}</div>
                        <div className="space-y-4 pb-4">
                            <AnimatePresence>
                                {post.comments?.map((c, i) => (
                                    <CommentItem key={c._id || i} comment={c} post={post} user={user} onEdit={onEditComment} onDelete={onDeleteComment} />
                                ))}
                                {post.comments?.length === 0 && <div className="text-center py-10 text-gray-600 text-[10px] uppercase font-bold tracking-widest">No strategic discussion yet.</div>}
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

const NotificationItem = ({ note, onViewProfile, onOpenPost, onOpenChat, onAcceptRequest, onRejectRequest }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-all cursor-pointer border-b border-white/5 group"
            onClick={() => {
                if (note.type === 'message') onOpenChat(note.sender);
                else if (note.type === 'follow_request') onViewProfile(note.sender);
                else if (note.post || note.postId) onOpenPost(note.post || note.postId);
                else onViewProfile(note.sender);
                playSound('pop');
            }}
        >
            <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden border-2 border-white/10 group-hover:border-yellow-500/50 transition-all shadow-lg">
                    {note.fromProfilePic ? <img src={resolveMediaUrl(note.fromProfilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={note.fromUsername} />}
                </div>
                {note.type === 'like' && <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1 border-2 border-black"><Icons.Heart className="w-3 h-3 text-white fill-current" /></div>}
                {note.type === 'comment' && <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-black"><Icons.MessageCircle className="w-3 h-3 text-white fill-current" /></div>}
                {note.type === 'message' && <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-black"><Icons.Mail className="w-3 h-3 text-white" /></div>}
                {note.type === 'follow' && <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border-2 border-black"><Icons.UserPlus className="w-3 h-3 text-black" /></div>}
                {note.type === 'follow_request' && <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1 border-2 border-black"><Icons.Shield className="w-3 h-3 text-white" /></div>}
            </div>
            <div className="flex-1">
                <div className="text-sm">
                    <span className="font-black text-white group-hover:text-yellow-500 transition-colors uppercase tracking-tight">{note.fromUsername}</span>
                    <span className="text-gray-500 text-[10px] sm:text-[11px] ml-1 uppercase tracking-widest font-bold">
                        {note.type === 'follow' ? 'joined your network' :
                            note.type === 'like' ? 'endorsed intel' :
                                note.type === 'comment' ? 'briefed post' :
                                    note.type === 'message' ? 'encrypted message' :
                                        note.type === 'mention' ? 'flagged you' :
                                            note.type === 'follow_request' ? 'clearance req' : ''}
                    </span>
                </div>
                {note.text && <div className="text-xs text-gray-400 mt-1 line-clamp-1 italic font-medium">"{note.text}"</div>}
                <div className="flex items-center gap-3 mt-2">
                    <div className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">{formatDate(note.createdAt)}</div>
                    {!note.read && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-glow-yellow" />}
                </div>

                {note.type === 'follow_request' && (
                    <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => onAcceptRequest(note.from)} className="flex-1 py-1.5 bg-yellow-500 text-black text-[10px] font-black rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-500/20 uppercase tracking-widest">Authorize</button>
                        <button onClick={() => onRejectRequest(note.from)} className="flex-1 py-1.5 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-all uppercase tracking-widest">Deny</button>
                    </div>
                )}
            </div>
            {note.postImage && (
                <div className="w-12 h-12 rounded-xl bg-gray-800 border border-white/10 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    <img src={resolveMediaUrl(note.postImage)} className="w-full h-full object-cover opacity-60" />
                </div>
            )}
        </motion.div>
    );
};

const StoriesBar = ({ stories, onViewStory }) => {
    if (!stories || stories.length === 0) return null;
    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-4 border-b border-white/5 bg-black/40">
            {stories.map((story, i) => (
                <div key={i} onClick={() => onViewStory(story)} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-500 to-red-600">
                        <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-gray-900">
                            {story.author?.profilePic ? <img src={resolveMediaUrl(story.author.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={story.author?.username} />}
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide max-w-[60px] truncate">{story.author?.username}</span>
                </div>
            ))}
        </div>
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
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{
                rotateX: 5, rotateY: 5,
                z: 20,
                transition: { duration: 0.3 }
            }}
            viewport={{ once: true }}
            className="glass-card mb-4 rounded-3xl overflow-hidden relative border transform transition-all bg-black/40 border-white/5 active:scale-[0.98]"
        >
            {/* WRAPPER LINK FOR DETAILS */}
            <div className="p-4" >
                <div className="flex items-start gap-3">
                    <div onClick={(e) => { e.stopPropagation(); onViewProfile(post.author) }} className="cursor-pointer shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                            {post.author?.profilePic ? <img src={resolveMediaUrl(post.author.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={post.author?.username} />}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span onClick={(e) => { e.stopPropagation(); onViewProfile(post.author) }} className="font-bold text-base text-white hover:underline cursor-pointer leading-tight flex items-center gap-1">
                                    {post.author?.username}
                                    {isPostAuthorFounder && <span className="bg-red-600/80 text-white text-[10px] px-2 py-0.5 rounded font-black tracking-wider ml-1 border border-red-500/20">FOUNDER</span>}
                                </span>
                                <span className={`text-xs ${isPostAuthorFounder ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
                                    @{post.author?.username?.toLowerCase()} · {formatDate(post.createdAt)}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {isOwner && (
                                    <button onClick={(e) => { e.stopPropagation(); onEditPost(post); }} className="text-gray-500 hover:text-blue-500 p-3 hover:bg-blue-500/10 rounded-full transition-all">
                                        <Icons.Settings className="w-5 h-5" />
                                    </button>
                                )}
                                {(isOwner || isFounder) && (
                                    <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); if (confirm("Terminate intel packet?")) handleDelete(); }} className="text-gray-500 hover:text-red-500 p-5 -m-2 hover:bg-red-500/10 rounded-full transition-all group/trash z-[50]">
                                        <Icons.Trash className="w-5 h-5 group-hover/trash:scale-125" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* POST TEXT CONTENT */}
                        {/* POST TEXT CONTENT */}
                        <div onClick={() => {
                            const isVid = (isYouTubeUrl(post.videoUrl) || post.videoUrl || (post.image && post.image.match(/\.(mp4|mov|webm)$/i)));
                            if (!isVid) onOpenDetail(post);
                        }} className={`mt-1 text-sm text-white/90 whitespace-pre-wrap break-words mb-2 font-normal ${(isYouTubeUrl(post.videoUrl) || post.videoUrl || (post.image && post.image.match(/\.(mp4|mov|webm)$/i))) ? '' : 'cursor-pointer'}`}>
                            {parseHashtags(post.desc)}
                        </div>

                        {/* MEDIA CONTENT */}
                        {(post.image || post.videoUrl) && (
                            <div onDoubleClick={handleDoubleTap} className="mt-2 rounded-xl overflow-hidden border border-white/10 relative shadow-sm bg-black/50" style={{ maxHeight: '500px' }}>
                                {/* DETECT VIDEO VS IMAGE - DO NOT ZOOM VIDEOS TO PREVENT GLITCHES */}
                                {isYouTubeUrl(post.videoUrl) ? (
                                    <div className="w-full aspect-video bg-black">
                                        <iframe title="youtube-feed" src={getYouTubeEmbedUrl(post.videoUrl)} className="w-full h-full" frameBorder="0" allowFullScreen />
                                    </div>
                                ) : (post.videoUrl || (post.image && post.image.match(/\.(mp4|mov|webm)$/i))) ? (
                                    <video src={resolveMediaUrl(post.videoUrl || post.image)} autoPlay muted loop playsInline controls className="w-full h-auto max-h-[600px] object-contain bg-black" />
                                ) : post.image ? (
                                    <img onClick={() => onOpenDetail(post)} src={resolveMediaUrl(post.image)} className="w-full h-auto max-h-[600px] object-contain bg-black cursor-pointer" loading="lazy" />
                                ) : null}
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

const ChatModal = ({ isOpen, onClose, user, allUsers, initialChatUser }) => {
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState({});
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef();

    const fetchMessages = async (otherUserId) => {
        try {
            const res = await axios.get(`/messages/conversation/${otherUserId}`);
            setMessages(prev => ({ ...prev, [otherUserId]: res.data }));
        } catch (e) { console.error('Failed to fetch messages', e); }
    };

    useEffect(() => {
        if (isOpen && initialChatUser) setActiveChat(initialChatUser);
    }, [isOpen, initialChatUser]);

    useEffect(() => {
        if (!isOpen || !activeChat) return;
        fetchMessages(activeChat._id);
        const interval = setInterval(() => fetchMessages(activeChat._id), 3000);
        return () => clearInterval(interval);
    }, [isOpen, activeChat]);

    useEffect(() => { if (activeChat) scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeChat]);

    const handleSend = async () => {
        if (!inputText.trim() || !activeChat) return;
        const text = inputText;
        setInputText('');
        try {
            const res = await axios.post('/messages', { recipient: activeChat._id, text });
            setMessages(prev => ({
                ...prev,
                [activeChat._id]: [...(prev[activeChat._id] || []), res.data]
            }));
            playSound('pop');
        } catch (e) {
            console.error('Send failed', e);
            setInputText(text); // Restore text on failure
        }
    };

    // In Chat list render, compute online status
    // (replace later in JSX)

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-5xl h-full sm:h-[85vh] bg-black sm:rounded-3xl border border-white/10 flex overflow-hidden shadow-2xl">
                <div className={`w-full sm:w-80 border-r border-white/10 flex flex-col ${activeChat ? 'hidden sm:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-white/10 flex justify-between items-center"><h2 className="text-xl font-black italic">CHATS</h2><button onClick={onClose} className="sm:hidden"><Icons.X className="w-6 h-6" /></button></div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {allUsers.filter(u => u._id !== user?._id).map(u => {
                            const online = isUserOnline(u, user);
                            return (
                                <div key={u._id} onClick={() => setActiveChat(u)} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${activeChat?._id === u._id ? 'bg-white/5' : ''}`}>
                                    <div className="relative"><div className={`w-12 h-12 rounded-full bg-gray-900 border border-white/10 overflow-hidden shadow-md`}>{u.profilePic ? <img src={resolveMediaUrl(u.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={u.username} />}</div><div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${online ? 'bg-green-500' : 'bg-gray-600'}`} /></div>
                                    <div><div className="font-bold text-sm text-white flex items-center gap-2">{u?.username} {u.role === 'Founder' && <span className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider shadow-glow-red">FOUNDER</span>}</div><div className={`text-[10px] ${online ? 'text-green-500' : 'text-gray-500'} uppercase tracking-tighter`}>{online ? 'Active Now' : 'Offline'}</div></div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className={`flex-1 flex flex-col bg-[#050505] ${!activeChat ? 'hidden sm:flex' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-black/50 backdrop-blur-xl">
                                <button onClick={() => setActiveChat(null)} className="sm:hidden"><Icons.Back className="w-6 h-6" /></button>
                                <div className="w-10 h-10 rounded-full border border-yellow-500/30 overflow-hidden">{activeChat?.profilePic ? <img src={resolveMediaUrl(activeChat.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={activeChat?.username} />}</div>
                                <div><div className="font-bold text-sm">{activeChat?.username}</div><div className={`text-[10px] ${isUserOnline(activeChat, user) ? 'text-green-500 font-bold uppercase tracking-widest' : 'text-gray-500 uppercase tracking-tighter'}`}>{isUserOnline(activeChat, user) ? 'Active Now' : 'Offline'}</div></div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {(messages[activeChat._id] || []).map((m, i) => (
                                    <div key={i} className={`flex ${String(m.sender) === String(user?._id) ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-md ${String(m.sender) === String(user?._id) ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1a1a1a] text-white rounded-bl-none'}`}>
                                            {m.text}
                                            <div className="text-[9px] opacity-50 text-right mt-1">{formatDate(m.createdAt)}</div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={scrollRef} />
                            </div>
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
    const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
    const [isFollowersOnly, setIsFollowersOnly] = useState(user?.isFollowersOnly || false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setIsPrivate(user.isPrivate || false);
            setIsFollowersOnly(user.isFollowersOnly || false);
        }
    }, [user]);


    const handleSave = async (key, val) => {
        setSaving(true);
        try {
            const res = await axios.put('/users/settings', { [key]: val });
            updateUserState(res.data);

            if (key === 'isPrivate') setIsPrivate(val);
            if (key === 'isFollowersOnly') setIsFollowersOnly(val);
            playSound('pop');
        } catch (e) {
            console.error("Settings update failed", e);
            // Revert state on error?
            if (key === 'isPrivate') setIsPrivate(!val);
            if (key === 'isFollowersOnly') setIsFollowersOnly(!val);
            alert("Connection to neural link failed. Try again.");
        }
        finally { setSaving(false); }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-sm h-full sm:h-auto bg-[#0a0a0a] sm:border border-white/10 sm:rounded-[2rem] overflow-hidden animate-pop-in shadow-2xl flex flex-col">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                    <h2 className="font-bold uppercase tracking-widest text-xs text-gray-400">Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Icons.X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    <div className="p-4 flex items-center justify-between bg-white/5 rounded-2xl border border-white/5 transition-all hover:border-yellow-500/30 group">
                        <div>
                            <div className="text-sm font-bold text-white group-hover:text-yellow-500 transition-colors">Private Account</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Only accepted followers see content</div>
                        </div>
                        <div onClick={() => {
                            if (saving) return;
                            const newVal = !isPrivate;
                            setIsPrivate(newVal);
                            handleSave('isPrivate', newVal);
                        }} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${isPrivate ? 'bg-yellow-500' : 'bg-gray-700'} ${saving ? 'opacity-50' : ''}`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${isPrivate ? 'translate-x-5' : ''}`} />
                        </div>
                    </div>

                    <div className="p-4 flex items-center justify-between bg-white/5 rounded-2xl border border-white/5 transition-all hover:border-blue-500/30 group">
                        <div>
                            <div className="text-sm font-bold text-white group-hover:text-blue-500 transition-colors">Guard Chat</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-tighter">Messages only from your followers</div>
                        </div>
                        <div onClick={() => {
                            if (saving) return;
                            const newVal = !isFollowersOnly;
                            setIsFollowersOnly(newVal);
                            handleSave('isFollowersOnly', newVal);
                        }} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${isFollowersOnly ? 'bg-blue-500' : 'bg-gray-700'} ${saving ? 'opacity-50' : ''}`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${isFollowersOnly ? 'translate-x-5' : ''}`} />
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Interface Theme</div>
                        <div className="flex gap-2">
                            {['#ffd700', '#3b82f6', '#ef4444', '#10b981', '#ffffff'].map(c => (
                                <button key={c} onClick={() => { document.documentElement.style.setProperty('--gold-primary', c); localStorage.setItem('themeColor', c); }} className="w-8 h-8 rounded-full border border-white/10 hover:scale-110 transition-transform" style={{ background: c }} />
                            ))}
                        </div>
                    </div>

                    <button onClick={logout} className="w-full text-left p-4 hover:bg-red-500/10 flex items-center justify-between text-red-500 font-black text-sm border border-red-500/20 rounded-2xl transition-all hover:scale-[0.98]">
                        <span className="tracking-[0.2em]">TERMINATE SESSION</span>
                        <Icons.Logout className="w-5 h-5" />
                    </button>

                    {saving && <div className="text-[10px] text-yellow-500 text-center font-bold animate-pulse">SYNCING WITH NEURAL LINK...</div>}
                </div>
            </div>
        </div >
    );
};

const ProfileModal = ({ isOpen, onClose, profileUser, currentUser, posts, allUsers = [], onViewProfile, onOpenDetail, onFollow, followLoading = {}, onUpdateUser }) => {
    const [userData, setUserData] = useState(null);
    const [activeList, setActiveList] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(currentUser?.bio || "");
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, POSTS, VIDEO
    const fileRef = useRef(null);

    useEffect(() => {
        if (currentUser) setBio(currentUser.bio || "");
    }, [currentUser]);

    const userPosts = (posts || []).filter(p => {
        const pId = String(p.author?._id || p.author || '');
        const uId = String(profileUser?._id || (typeof profileUser === 'string' ? profileUser : ''));
        const uName = profileUser?.username || '';
        const matchesUser = (pId && uId && pId === uId) || (p.username && uName && p.username === uName);

        if (!matchesUser) return false;
        if (p.isStory) return false; // Hide stories from grid

        if (activeTab === 'VIDEO') return isYouTubeUrl(p.videoUrl) || (p.videoUrl || (p.image && p.image.match(/\.(mp4|mov|webm)$/i)));
        if (activeTab === 'POSTS') return !p.videoUrl && !isYouTubeUrl(p.videoUrl) && !(p.image && p.image.match(/\.(mp4|mov|webm)$/i));
        return true;
    });

    useEffect(() => {
        if (profileUser?._id === currentUser?._id) {
            setUserData(currentUser);
        } else if (profileUser?._id) {
            axios.get(`/users/find/${profileUser._id || profileUser}`).then(res => setUserData(res.data)).catch(() => setUserData(profileUser));
        }
    }, [profileUser, currentUser]);

    if (!isOpen || !profileUser) return null;

    const displayUser = (profileUser?._id === currentUser?._id || profileUser === currentUser?._id) ? currentUser : (userData || profileUser);
    const isMe = displayUser?._id === currentUser?._id;

    const getListUsers = () => {
        if (!activeList || !displayUser) return [];
        const ids = activeList === 'followers' ? displayUser.followers : displayUser.following;
        return allUsers.filter(u => ids?.includes(u._id));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ y: '100dvh' }} animate={{ y: 0 }} exit={{ y: '100dvh' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative bg-[#0a0a0a] w-full max-w-lg h-[100dvh] sm:h-[85vh] sm:rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl">
                <div className="flex-none p-4 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] z-50">
                    <button onClick={() => {
                        if (activeList) setActiveList(null);
                        else if (isEditing) setIsEditing(false);
                        else onClose();
                    }} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"><Icons.Back className="w-6 h-6 text-white" /></button>
                    <div className="font-bold text-white text-sm uppercase tracking-widest">{activeList ? (activeList === 'followers' ? 'Followers' : 'Following') : (isEditing ? 'Edit Profile' : displayUser?.username)}</div>
                    <div className="w-10" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#050505] overscroll-y-contain pb-32">
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
                    ) : isEditing ? (
                        <div className="p-6 text-center space-y-8 animate-fade-in">
                            <div onClick={() => fileRef.current.click()} className="w-32 h-32 mx-auto rounded-full bg-gray-800 overflow-hidden border-4 border-yellow-500 cursor-pointer relative group shadow-2xl shadow-yellow-500/10">
                                {displayUser?.profilePic ? <img src={resolveMediaUrl(displayUser.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar size="large" name={displayUser?.username} />}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Camera className="w-10 h-10 text-white" /></div>
                            </div>
                            <input type="file" ref={fileRef} hidden onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    // Immediate local update
                                    const localUrl = URL.createObjectURL(file);
                                    setUserData(prev => ({ ...prev, profilePic: localUrl })); // Optimistic update
                                    if (currentUser && displayUser && String(currentUser._id) === String(displayUser._id)) {
                                        onUpdateUser({ ...currentUser, profilePic: localUrl });
                                    }

                                    const fd = new FormData(); fd.append('image', file);
                                    try {
                                        const res = await axios.post('/users/profile-pic', fd);
                                        const updatedUser = res.data;
                                        // Cache-break the new image
                                        if (updatedUser.profilePic) {
                                            const sep = updatedUser.profilePic.includes('?') ? '&' : '?';
                                            updatedUser.profilePic += `${sep}t=${Date.now()}`;
                                        }
                                        localStorage.setItem('user', JSON.stringify(updatedUser));
                                        if (onUpdateUser) onUpdateUser(updatedUser);
                                    } catch (e) { alert("Failed to update."); }
                                }
                            }} />

                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Bio</label>
                                <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-yellow-500 outline-none resize-none h-32" placeholder="Tell your story..." />
                            </div>

                            <button onClick={async () => {
                                try {
                                    const res = await axios.put(`/users/${displayUser?._id}`, { bio });
                                    if (res.data) {
                                        localStorage.setItem('user', JSON.stringify(res.data));
                                        if (onUpdateUser) onUpdateUser(res.data);
                                    }
                                    setIsEditing(false);
                                } catch (e) { console.error(e); alert("Failed to update bio."); }
                            }} className="w-full py-4 bg-yellow-500 rounded-2xl text-black font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform text-sm">Save Changes</button>
                        </div>
                    ) : (
                        <div className="p-4 sm:p-6 pb-20">
                            <div className="flex items-center gap-4 sm:gap-8 mb-6">
                                <div className={`w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gray-800 overflow-hidden border-2 cursor-pointer shadow-xl shrink-0 ${displayUser?.role === 'Founder' ? 'border-red-600 shadow-red-600/30' : 'border-yellow-500 shadow-yellow-500/20'}`}>
                                    {displayUser?.profilePic ? <img src={resolveMediaUrl(displayUser.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar size="large" name={displayUser?.username} />}
                                </div>
                                <div className="flex-1 flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <div className="flex flex-col items-center">
                                        <div className="font-black text-white text-lg sm:text-2xl leading-none">{(userPosts || []).length}</div>
                                        <div className="text-[9px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Posts</div>
                                    </div>
                                    <div onClick={() => setActiveList('followers')} className="flex flex-col items-center cursor-pointer hover:bg-white/10 p-1 rounded-lg transition-all">
                                        <div className="font-black text-yellow-500 text-lg sm:text-2xl leading-none">{displayUser?.followers?.length || 0}</div>
                                        <div className="text-[9px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Followers</div>
                                    </div>
                                    <div onClick={() => setActiveList('following')} className="flex flex-col items-center cursor-pointer hover:bg-white/10 p-1 rounded-lg transition-all">
                                        <div className="font-black text-white text-lg sm:text-2xl leading-none">{displayUser?.following?.length || 0}</div>
                                        <div className="text-[9px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Following</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6 px-1">
                                <div className="font-black text-white text-xl mb-1 flex items-center gap-2">
                                    {displayUser?.username || "Unknown Agent"}
                                    {displayUser?.role === 'Founder' && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-black tracking-wider shadow-glow-red">FOUNDER</span>}
                                </div>
                                <div className="text-sm text-gray-300 leading-relaxed max-w-sm whitespace-pre-wrap font-medium mb-4">{displayUser?.bio || "Entrepreneur. Legacy Member."}</div>

                                {isMe ? (
                                    <button onClick={() => setIsEditing(true)} className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 uppercase tracking-widest hover:bg-white/10 transition-colors">Edit Profile</button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onFollow(displayUser?._id || displayUser)}
                                            disabled={!!followLoading[displayUser?._id]}
                                            className={`flex-1 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 ${displayUser?.followers?.includes(currentUser?._id) || displayUser?.followRequests?.includes(currentUser?._id) ? 'bg-white/5 text-white border border-white/10' : 'bg-yellow-500 text-black hover:bg-yellow-400'} ${followLoading[displayUser?._id] ? 'opacity-60 cursor-wait' : ''}`}
                                        >
                                            {followLoading[displayUser?._id] ? '...' : (displayUser?.followers?.includes(currentUser?._id) ? 'FOLLOWING' : displayUser?.followRequests?.includes(currentUser?._id) ? 'REQUESTED' : 'FOLLOW')}
                                        </button>
                                        <button
                                            onClick={() => { onClose(); onOpenChat(displayUser); }}
                                            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-black hover:bg-white/10 transition-all active:scale-95"
                                        >
                                            <Icons.MessageCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="w-full h-px bg-white/10 mb-4" />

                            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
                                {['ALL', 'POSTS', 'VIDEO'].map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === tab ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:text-white'}`}>{tab}</button>
                                ))}
                            </div>

                            {userPosts.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 text-xs uppercase tracking-widest font-bold">No Content Found</div>
                            ) : (
                                <div className="grid grid-cols-3 gap-1 pb-20">
                                    {userPosts.map(p => (
                                        <div
                                            key={p._id}
                                            onClick={() => onOpenDetail(p)}
                                            className="aspect-square bg-gray-900 border border-white/5 rounded-md overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                                        >
                                            {(isYouTubeUrl(p.videoUrl) || p.thumbnailUrl) ? (
                                                <img src={p.thumbnailUrl ? resolveMediaUrl(p.thumbnailUrl) : `https://img.youtube.com/vi/${(p.videoUrl || '').match(/^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i)?.[1]}/hqdefault.jpg`} className="w-full h-full object-cover" />
                                            ) : (p.videoUrl || (p.image && p.image.match(/\.(mp4|mov|webm)$/i))) ? (
                                                <div className="relative w-full h-full">
                                                    <video src={resolveMediaUrl(p.videoUrl || p.image)} muted className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                                        <Icons.Play className="w-6 h-6 text-white/80" />
                                                    </div>
                                                </div>
                                            ) : p.image ? (
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
    const [creating, setCreating] = useState(false);
    const [isStory, setIsStory] = useState(false);
    const fileRef = useRef(null);
    if (!isOpen) return null;
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Quick client-side duration check for video files (<= 10s)
        if (file.type.startsWith('video')) {
            const url = URL.createObjectURL(file);
            const vid = document.createElement('video');
            vid.preload = 'metadata';
            vid.src = url;
            const dur = await new Promise((resolve) => {
                vid.onloadedmetadata = () => { resolve(vid.duration || 0); URL.revokeObjectURL(url); };
                vid.onerror = () => { resolve(0); URL.revokeObjectURL(url); };
            });
            if (dur && dur > 10) {
                alert('Video must be 10 seconds or shorter. Please trim your clip.');
                e.target.value = '';
                return;
            }
            setPreview(URL.createObjectURL(file));
            setIsVideo(true);
        } else {
            setPreview(URL.createObjectURL(file));
            setIsVideo(false);
        }
    };
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-sm glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
                    <h2 className="text-xl font-black italic mb-4 text-white">UPLOAD</h2>
                    <div className="flex gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10">
                            {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <DefaultAvatar name={user.username} />}
                        </div>
                        <textarea id="c-desc" placeholder="Decrypt your thoughts..." className="flex-1 bg-transparent text-sm outline-none text-white resize-none h-20 placeholder-gray-500" />
                    </div>

                    {/* YouTube URL input */}
                    <div className="mb-3">
                        <input id="c-youtube" placeholder="YouTube URL (optional)" className="w-full bg-black/20 border border-white/5 rounded-xl p-2 text-sm text-white outline-none placeholder-gray-500" onChange={(e) => {
                            const v = e.target.value || '';
                            if (isYouTubeUrl(v)) {
                                const m = /^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i.exec(v);
                                const thumb = m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
                                setPreview(thumb);
                                setIsVideo(true);
                            } else if (!v) {
                                setPreview(null);
                                setIsVideo(false);
                            }
                        }} />
                        <div className="text-[10px] text-gray-400 mt-1">Note: YouTube links cannot be automatically verified for duration — please ensure the video is 10 seconds or shorter.</div>
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
                    <div className="flex gap-4 items-center mb-4">
                        <div onClick={() => setIsStory(!isStory)} className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors border border-white/5">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isStory ? 'border-yellow-500 bg-yellow-500' : 'border-gray-500'}`}>
                                {isStory && <Icons.Check className="w-3 h-3 text-black font-bold" />}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-widest ${isStory ? 'text-yellow-500' : 'text-gray-500'}`}>Add to Story (24h)</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs hover:bg-white/10 text-white uppercase tracking-widest">CANCEL</button>
                        <button disabled={creating} onClick={async () => {
                            if (creating) return;
                            const desc = document.getElementById('c-desc').value;
                            const youtube = document.getElementById('c-youtube').value;
                            const file = fileRef.current.files[0];
                            if (!desc && !file && !youtube) return;
                            const fd = new FormData(); fd.append('desc', desc);
                            if (youtube) fd.append('videoUrl', youtube.trim());
                            else if (file) fd.append('image', file);
                            fd.append('isStory', isStory);

                            try {
                                setCreating(true);
                                await axios.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                onSuccess(); playSound('pop');
                                // clear inputs
                                document.getElementById('c-desc').value = '';
                                document.getElementById('c-youtube').value = '';
                                setPreview(null); fileRef.current.value = '';
                                setIsStory(false);
                            } catch (e) { console.error('Create post failed', e); alert('Post failed'); } finally { setCreating(false); }
                        }} className={`flex-1 py-3 ${creating ? 'opacity-60 cursor-wait' : 'bg-yellow-500 hover:bg-yellow-400'} rounded-xl text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform`}>{creating ? '...' : (isStory ? 'POST STORY' : 'POST')}</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const EditPostModal = ({ isOpen, onClose, onSuccess, post }) => {
    const [desc, setDesc] = useState(post?.desc || '');
    const [preview, setPreview] = useState(post?.image ? resolveMediaUrl(post.image) : null);
    const [isVideo, setIsVideo] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        if (post) {
            setDesc(post.desc || '');
            setPreview(post.image ? resolveMediaUrl(post.image) : (post.thumbnailUrl ? resolveMediaUrl(post.thumbnailUrl) : null));
            setIsVideo(post.videoUrl ? true : (post.image?.match(/\.(mp4|mov|webm)$/i) ? true : false));
            // initialize youtube field when editing
            const isYT = isYouTubeUrl(post?.videoUrl);
            setTimeout(() => {
                const el = document.getElementById('edit-youtube');
                if (el) el.value = isYT ? post.videoUrl : '';
            }, 0);
        }
    }, [post]);

    if (!isOpen) return null;

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type.startsWith('video')) {
            const url = URL.createObjectURL(file);
            const vid = document.createElement('video');
            vid.preload = 'metadata';
            vid.src = url;
            const dur = await new Promise((resolve) => {
                vid.onloadedmetadata = () => { resolve(vid.duration || 0); URL.revokeObjectURL(url); };
                vid.onerror = () => { resolve(0); URL.revokeObjectURL(url); };
            });
            if (dur && dur > 10) {
                alert('Video must be 10 seconds or shorter. Please trim your clip.');
                e.target.value = '';
                return;
            }
            setPreview(URL.createObjectURL(file));
            setIsVideo(true);
        } else {
            setPreview(URL.createObjectURL(file));
            setIsVideo(false);
        }
    };

    const handleSave = async () => {
        if (saving) return;
        const fd = new FormData();
        fd.append('desc', desc);
        const file = fileRef.current?.files[0];
        const yt = document.getElementById('edit-youtube')?.value;
        if (yt && yt.trim()) fd.append('videoUrl', yt.trim());
        if (file) fd.append('image', file);

        try {
            setSaving(true);
            await axios.put(`/posts/${post._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            onSuccess();
            playSound('pop');
        } catch (e) {
            console.error("Edit failed", e);
            alert('Update failed');
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-sm glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl modal-content-scroller custom-scrollbar">
                <h2 className="text-xl font-black italic mb-4 text-white uppercase tracking-tighter">EDIT POST</h2>
                <div className="flex flex-col gap-4">
                    <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Update content..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none h-32 resize-none placeholder-gray-600" />
                    <div className="mb-3">
                        <input id="edit-youtube" placeholder="YouTube URL (optional)" className="w-full bg-black/20 border border-white/5 rounded-xl p-2 text-sm text-white outline-none placeholder-gray-500" onChange={(e) => {
                            const v = e.target.value || '';
                            if (isYouTubeUrl(v)) {
                                const m = /^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i.exec(v);
                                const thumb = m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
                                setPreview(thumb ? thumb : null);
                                setIsVideo(true);
                            } else if (!v) {
                                setPreview(null);
                                setIsVideo(false);
                            }
                        }} />
                    </div>

                    <div onClick={() => fileRef.current.click()} className="cursor-pointer mb-4">
                        {preview ? (
                            <div className="w-full h-48 rounded-2xl overflow-hidden relative bg-black border border-white/10 shadow-inner">
                                {isVideo ? <video src={preview} className="w-full h-full object-contain" controls /> : <img src={preview} className="w-full h-full object-cover" />}
                                <button onClick={(e) => { e.stopPropagation(); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors"><Icons.X className="w-3 h-3 text-white" /></button>
                            </div>
                        ) : (
                            <div className="w-full py-8 border border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all text-gray-500 cursor-pointer">
                                <Icons.Image className="w-8 h-8 opacity-50" />
                                <span className="text-xs font-bold uppercase tracking-widest">Update Media</span>
                            </div>
                        )}
                        <input type="file" ref={fileRef} accept="image/*,video/*" hidden onChange={handleFileChange} />
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs hover:bg-white/10 text-white uppercase tracking-widest">CANCEL</button>
                        <button disabled={saving} onClick={handleSave} className={`flex-1 py-3 ${saving ? 'opacity-60 cursor-wait' : 'bg-yellow-500 hover:bg-yellow-400'} rounded-xl text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform`}>{saving ? '...' : 'SAVE CHANGES'}</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const App = () => {
    const [user, setUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', username: '' });

    const handleAuthInputChange = (e) => {
        const { id, value } = e.target;
        const key = id.replace('l-', '').replace('r-', '').replace('f-', '');
        setFormData(prev => ({ ...prev, [key]: value }));
    };
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
    const [followLoading, setFollowLoading] = useState({}); // per-user follow loading state
    const [authMode, setAuthMode] = useState('login');
    const [chatTarget, setChatTarget] = useState(null);
    const registerFileRef = useRef(null);
    const [registerPreview, setRegisterPreview] = useState(null);

    const updateUserState = (newData) => {
        if (!newData) {
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return;
        }
        setUser(prev => {
            const current = prev || JSON.parse(localStorage.getItem('user') || '{}');
            const merged = { ...current, ...newData };
            // Preserve cache-breakers (?t=...) if base path is identical
            if (current.profilePic && newData.profilePic && current.profilePic.split('?')[0] === newData.profilePic.split('?')[0]) {
                merged.profilePic = current.profilePic;
            }
            localStorage.setItem('user', JSON.stringify(merged));
            return merged;
        });
    };


    useEffect(() => {
        const saved = localStorage.getItem('user');
        if (saved) setUser(JSON.parse(saved));

        const savedTheme = localStorage.getItem('themeColor');
        if (savedTheme) {
            document.documentElement.style.setProperty('--gold-primary', savedTheme);
        }
    }, []);

    // Use a ref to track the last user ID we initialized for, to avoid loops
    const lastInitializedId = useRef(null);

    useEffect(() => {
        if (user && user._id !== lastInitializedId.current) {
            lastInitializedId.current = user._id;
            fetchPosts();
            fetchUsers();
            startHeartbeat();
            startUserPoll();
            startPostPoll();
            fetchNotifications();
            startNotificationPoll();
        } else if (!user) {
            lastInitializedId.current = null;
            stopHeartbeat();
            stopUserPoll();
            stopPostPoll();
            stopNotificationPoll();
        }
        return () => { }; // Cleanup handled by functions
    }, [user]);

    const fetchPosts = async () => { try { const res = await axios.get('/posts?limit=20'); setPosts(res.data); } catch (e) { } };
    const fetchUsers = async () => { try { const res = await axios.get('/users'); setUsers(res.data); } catch (e) { } };

    // Notifications
    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await axios.get('/users/notifications');
            setAlerts(res.data);
            const updatedUser = { ...user, notifications: res.data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (e) { console.error('Fetch notifications failed', e); }
    };

    const markAllNotificationsRead = async () => {
        try {
            await axios.put('/users/notifications/read');
            const updatedAlerts = alerts.map(a => ({ ...a, read: true }));
            setAlerts(updatedAlerts);
            const updatedUser = { ...user, notifications: updatedAlerts };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (e) { console.error('Mark read failed', e); }
    };

    // Polling for notifications (simple fallback to websockets)
    let _notifInterval = null;
    const startNotificationPoll = () => { stopNotificationPoll(); _notifInterval = setInterval(fetchNotifications, 20000); };
    const stopNotificationPoll = () => { if (_notifInterval) { clearInterval(_notifInterval); _notifInterval = null; } };

    // Heartbeat for presence
    // Heartbeat for presence (updates lastSeen in DB)
    let _hbInterval = null;
    const startHeartbeat = () => { stopHeartbeat(); axios.put('/users/heartbeat').catch(() => { }); _hbInterval = setInterval(() => { axios.put('/users/heartbeat').catch(() => { }); }, 10000); };
    const stopHeartbeat = () => { if (_hbInterval) { clearInterval(_hbInterval); _hbInterval = null; } };

    // User Presence Polling (refresh user list to see online status)
    let _userInterval = null;
    const startUserPoll = () => { stopUserPoll(); _userInterval = setInterval(fetchUsers, 15000); };
    const stopUserPoll = () => { if (_userInterval) { clearInterval(_userInterval); _userInterval = null; } };

    // Post Polling for Real-Time feed
    let _postInterval = null;
    const startPostPoll = () => { stopPostPoll(); _postInterval = setInterval(fetchPosts, 5000); };
    const stopPostPoll = () => { if (_postInterval) { clearInterval(_postInterval); _postInterval = null; } };


    // react to activeTab change to mark notifications read
    useEffect(() => {
        if (activeTab === 'alerts' && user?.notifications?.some(n => !n.read)) {
            markAllNotificationsRead();
        }
    }, [activeTab, user]);



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
        if (!targetId || !user) return;
        setFollowLoading(prev => ({ ...prev, [targetId]: true }));
        try {
            const res = await axios.post(`/users/${targetId}/follow`);
            const { followers, following, message } = res.data;

            setUsers(prev => prev.map(u => String(u._id) === String(targetId) ? { ...u, followers } : u));
            if (profileUser && String(profileUser._id) === String(targetId)) {
                setProfileUser(prev => ({ ...prev, followers }));
            }

            if (following) {
                updateUserState({ following });
            } else {
                fetchUsers(); // Refresh for requests
            }

            if (message === 'Requested') alert("Verification requested from agent.");
            playSound('pop');
        } catch (e) { console.error('Follow failed', e); }
        finally { setFollowLoading(prev => { const copy = { ...prev }; delete copy[targetId]; return copy; }); }
    };

    const handleAcceptRequest = async (requesterId) => {
        try {
            await axios.post(`/users/requests/${requesterId}/accept`);
            fetchNotifications();
            fetchUsers();
            playSound('pop');
        } catch (e) { console.error('Accept request failed', e); }
    };

    const handleRejectRequest = async (requesterId) => {
        try {
            await axios.post(`/users/requests/${requesterId}/reject`);
            fetchNotifications();
            playSound('pop');
        } catch (e) { console.error('Reject request failed', e); }
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
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.reload();
    };
    const handleOpenChat = (u) => { setChatTarget(u); setIsChatOpen(true); };
    const deleteNotifications = async () => { try { await axios.delete('/users/notifications'); setAlerts([]); const u = { ...user, notifications: [] }; setUser(u); localStorage.setItem('user', JSON.stringify(u)); } catch (e) { } };

    if (!user) return (
        <div className="app-container">
            <div className="min-h-full bg-black flex items-center justify-center p-6 relative overflow-hidden">
                <div className="liquid-bg" />
                <div className="w-full max-w-sm glass-panel p-8 rounded-[2rem] text-center shadow-2xl shadow-yellow-500/5">
                    <div className="flex flex-col items-center mb-8">
                        <img src="/image/Logo.png?v=4" className="h-28 w-auto object-contain mb-2" alt="Legacy Logo" />
                    </div>
                    <div className="space-y-4">
                        {authMode === 'login' && (
                            <>
                                <div className="relative">
                                    <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="email" placeholder="Agent Email" id="l-email" value={formData.email} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-yellow-500 shadow-inner" />
                                </div>
                                <div className="relative">
                                    <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type={showPassword ? "text" : "password"} placeholder="Security Key" id="l-password" value={formData.password} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white font-bold outline-none focus:border-yellow-500 shadow-inner" />
                                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                        {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <button disabled={authLoading} onClick={async () => {
                                    setAuthLoading(true);
                                    try {
                                        const res = await axios.post('/auth/login', { email: formData.email, password: formData.password });
                                        localStorage.setItem('token', res.data.token);
                                        localStorage.setItem('user', JSON.stringify(res.data.user));
                                        setUser(res.data.user);
                                    } catch (e) {
                                        alert(e.response?.data?.message || "Access Denied.");
                                    } finally {
                                        setAuthLoading(false);
                                    }
                                }} className="w-full liquid-btn py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                    {authLoading ? "DECRYPTING..." : "INITIALIZE SESSION"}
                                </button>
                                <div className="flex justify-between text-xs text-gray-500 px-2">
                                    <span onClick={() => { setAuthMode('register'); setFormData({ email: '', password: '', username: '' }); }} className="cursor-pointer hover:text-white">Join Protocol</span>
                                    <span onClick={() => { setAuthMode('forgot'); setFormData({ email: '', password: '', username: '' }); }} className="cursor-pointer hover:text-white">Forgot Key?</span>
                                </div>
                            </>
                        )}
                        {authMode === 'register' && (
                            <>
                                <div onClick={() => registerFileRef.current.click()} className="w-24 h-24 mx-auto rounded-full bg-gray-800 overflow-hidden border-2 border-dashed border-gray-600 cursor-pointer relative group hover:border-yellow-500 mb-4 flex items-center justify-center">
                                    {registerPreview ? <img src={registerPreview} className="w-full h-full object-cover" /> : <Icons.Camera className="w-8 h-8 text-gray-400 group-hover:text-yellow-500" />}
                                    <input type="file" ref={registerFileRef} hidden accept="image/*" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) setRegisterPreview(URL.createObjectURL(file));
                                    }} />
                                </div>
                                <div className="relative mb-3">
                                    <Icons.User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" placeholder="Codename" id="r-username" value={formData.username} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-bold outline-none focus:border-yellow-500 shadow-inner text-sm" />
                                </div>
                                <div className="relative mb-3">
                                    <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="email" placeholder="Agent Email" id="r-email" value={formData.email} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-bold outline-none focus:border-yellow-500 shadow-inner text-sm" />
                                </div>
                                <div className="relative mb-3">
                                    <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type={showPassword ? "text" : "password"} placeholder="Create Key" id="r-password" value={formData.password} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-12 text-white font-bold outline-none focus:border-yellow-500 shadow-inner text-sm" />
                                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                        {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="relative mb-4">
                                    <textarea placeholder="Bio (Optional)" id="r-bio" value={formData.bio || ''} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm outline-none focus:border-yellow-500 shadow-inner resize-none h-20" />
                                </div>

                                <button disabled={authLoading} onClick={async () => {
                                    setAuthLoading(true);
                                    try {
                                        const fd = new FormData();
                                        fd.append('username', formData.username);
                                        fd.append('email', formData.email);
                                        fd.append('password', formData.password);
                                        if (formData.bio) fd.append('bio', formData.bio);
                                        if (registerFileRef.current.files[0]) fd.append('image', registerFileRef.current.files[0]);

                                        await axios.post('/auth/register', fd);
                                        alert("Protocol Joined. Login now.");
                                        setAuthMode('login');
                                    } catch (e) {
                                        alert(e.response?.data?.message || "Registration Failed.");
                                    } finally {
                                        setAuthLoading(false);
                                    }
                                }} className="w-full liquid-btn py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                    {authLoading ? "ENCRYPTING..." : "JOIN PROTOCOL"}
                                </button>
                                <div className="text-xs text-gray-500 cursor-pointer hover:text-white text-center mt-2" onClick={() => setAuthMode('login')}>Back to Login</div>
                            </>
                        )}
                        {authMode === 'forgot' && (
                            <>
                                <p className="text-sm text-gray-400 mb-2">Enter your email to receive a reset key.</p>
                                <div className="relative">
                                    <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="email" placeholder="Agent Email" id="f-email" value={formData.email} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-yellow-500 shadow-inner" />
                                </div>
                                <button disabled={authLoading} onClick={async () => {
                                    setAuthLoading(true);
                                    try {
                                        await axios.post('/auth/forgot-password', { email: formData.email });
                                        alert("If this email is in our database, a reset key has been sent.");
                                        setAuthMode('login');
                                    } catch (e) {
                                        alert("Reset request failed.");
                                    } finally {
                                        setAuthLoading(false);
                                    }
                                }} className="w-full liquid-btn py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                    {authLoading ? "TRANSMITTING..." : "SEND RESET KEY"}
                                </button>
                                <div className="text-xs text-gray-500 cursor-pointer hover:text-white text-center" onClick={() => setAuthMode('login')}>Back to Login</div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );

    // FIX: Safe search filtering to prevent crash on missing desc/author
    const filteredPosts = posts.filter(p => {
        if (p.isStory) return false;
        const q = searchQuery.toLowerCase();
        const descMatch = p.desc ? p.desc.toLowerCase().includes(q) : false;
        const authorMatch = p.author?.username ? p.author.username.toLowerCase().includes(q) : (p.username ? p.username.toLowerCase().includes(q) : false);
        return descMatch || authorMatch;
    });

    const stories = posts.filter(p => {
        if (!p.isStory) return false;
        const createdAt = new Date(p.createdAt).getTime();
        const now = Date.now();
        return (now - createdAt) < 24 * 60 * 60 * 1000;
    });

    return (
        <div className="app-container">
            <div className="min-h-full bg-black text-white relative font-sans overflow-hidden flex flex-col">
                <div className="liquid-bg" />
                <header className="sticky top-0 z-[100] bg-black/60 backdrop-blur-2xl border-b border-white/10 shrink-0">
                    <div className="w-full px-4 sm:px-6 py-2 sm:py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src="/image/Logo.png?v=4" className="h-12 sm:h-20 w-auto object-contain transition-all" alt="Logo" />
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={(e) => { e.stopPropagation(); setActiveTab('alerts'); playSound('pop'); if (navigator.vibrate) navigator.vibrate(10); }} className="relative p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors active:scale-95 transition-transform">
                                <Icons.Bell className={`w-5 h-5 ${user?.notifications?.some(n => !n.read) ? 'text-yellow-500 fill-yellow-500 animate-pulse' : 'text-gray-400'}`} />
                                {user?.notifications?.some(n => !n.read) && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-black shadow-glow-red" />}
                            </button>

                            <button onClick={() => setIsChatOpen(true)} className="relative p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <Icons.MessageCircle className="w-5 h-5" />
                                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-black shadow-glow-red" />
                            </button>
                            <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <Icons.Settings className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto no-scrollbar p-0 pb-60">
                    <div className="pt-0 sm:pt-4 max-w-4xl mx-auto">
                        {activeTab === 'alerts' ? (
                            <div className="animate-fade-in p-4 sm:p-8">
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <h2 className="text-xl font-bold text-white/90">Notifications</h2>
                                    {alerts.length > 0 && (
                                        <button onClick={deleteNotifications} className="p-2 bg-white/5 rounded-full hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-colors">
                                            <Icons.Trash className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {alerts.length === 0 ? <div className="text-center text-gray-500 py-10 font-bold uppercase tracking-widest text-xs">No visible threats.</div> : alerts.map((n, i) => <NotificationItem key={i} note={n} onViewProfile={viewProfile} onOpenChat={handleOpenChat} onAcceptRequest={handleAcceptRequest} onRejectRequest={handleRejectRequest} onOpenPost={(id) => { const p = posts.find(p => p._id === id); if (p) setSelectedPost(p); }} />)}
                            </div>
                        ) : (
                            <>
                                {activeTab !== 'search' && <StoriesBar stories={stories} onViewStory={(s) => setSelectedPost(s)} />}
                                <div className="p-4 sm:p-8">
                                    {activeTab === 'search' && (
                                        <div className="mb-8 space-y-4 animate-fade-in">
                                            <div className="relative"><Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search usernames or #hashtags..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:border-yellow-500 transition-all shadow-inner" /></div>
                                            <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar">{['#legacy', '#hustle', '#crypto', '#boxing'].map(t => <span key={t} onClick={() => setSearchQuery(t)} className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-400 cursor-pointer hover:text-white hover:bg-white/10 transition-colors border border-white/5">{t}</span>)}</div>
                                        </div>
                                    )}
                                    <div className="space-y-6">
                                        {(activeTab === 'search' ? (posts.filter(p => !p.isStory && (p.desc + p.author?.username).toLowerCase().includes(searchQuery.toLowerCase()))) : filteredPosts).map(p => <PostCard key={p._id} post={p} user={user} onLike={handleLike} onDislike={handleDislike} onComment={handleComment} onDelete={handleDeletePost} onViewProfile={viewProfile} onOpenDetail={setSelectedPost} onShare={handleShare} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onEditPost={(post) => { setPostToEdit(post); setIsEditOpen(true); }} loadingActions={loadingActions} />)}
                                        {posts.length === 0 && (
                                            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                                                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                                                <div className="text-yellow-500 font-black text-sm uppercase tracking-[0.2em] animate-pulse">Decrypting Feed...</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>

                {(!isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost) && (
                    <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 flex justify-center z-[1000] pointer-events-none">
                        <div className="liquid-glass-nav h-[65px] w-full max-w-lg rounded-[2rem] px-5 flex items-center justify-between shadow-2xl border border-white/10 pointer-events-auto">
                            <button onClick={() => { setActiveTab('home'); playSound('pop'); if (navigator.vibrate) navigator.vibrate(10); }} className={`nav-item-btn ${activeTab === 'home' ? 'nav-item-active' : ''}`}><Icons.Home className="w-5 h-5" /></button>
                            <button onClick={() => { setActiveTab('search'); playSound('pop'); if (navigator.vibrate) navigator.vibrate(10); }} className={`nav-item-btn ${activeTab === 'search' ? 'nav-item-active' : ''}`}><Icons.Search className="w-5 h-5" /></button>

                            <button onClick={() => { setIsCreateOpen(true); playSound('sweep'); }} className="nav-center-action">
                                <Icons.Plus className="w-7 h-7 text-yellow-500" />
                            </button>

                            <button onClick={() => { logout(); playSound('sword'); }} className="nav-logout-btn"><Icons.Logout className="w-5 h-5" /></button>

                            <button onClick={() => { viewProfile(user); playSound('pop'); }} className={`p-0.5 rounded-full border-2 transition-all ${activeTab === 'profile' ? 'border-yellow-500' : 'border-transparent'}`}>
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-white/5">
                                    {user?.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <div className="center w-full h-full text-[11px] font-bold text-yellow-500">{user?.username?.[0]}</div>}
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                <ChatModal isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); setChatTarget(null); }} user={user} allUsers={users} initialChatUser={chatTarget} />
                <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} logout={logout} user={user} onUpdateUser={updateUserState} />
                <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profileUser={profileUser} currentUser={user} posts={posts} allUsers={users} onViewProfile={viewProfile} onOpenDetail={setSelectedPost} onFollow={handleFollow} onOpenChat={handleOpenChat} followLoading={followLoading} onUpdateUser={updateUserState} />
                <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={() => { setIsCreateOpen(false); fetchPosts(); }} user={user} />
                <EditPostModal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setPostToEdit(null); }} onSuccess={() => { setIsEditOpen(false); setPostToEdit(null); fetchPosts(); }} post={postToEdit} />
                {selectedPost && <PostDetailModal post={selectedPost} user={user} onClose={() => setSelectedPost(null)} onLike={handleLike} onDislike={handleDislike} onShare={handleShare} onComment={handleComment} onDelete={handleDeletePost} onEdit={(p) => { setPostToEdit(p); setIsEditOpen(true); }} onDeleteComment={handleDeleteComment} onEditComment={handleEditComment} loadingActions={loadingActions} />}

            </div>
        </div>
    );
};

export default App;
