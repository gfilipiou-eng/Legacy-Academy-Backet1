import React, { useState, useEffect, useRef } from 'react';
import axios from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './components/Icons';
import { useTranslation } from './translations';
import { playSound, explodeEffect } from './utils/sounds';

// --- CONFIG ---
const API_URL = axios.defaults.baseURL;
const BASE_URL = API_URL.replace('/api', '');

const resolveMediaUrl = (path, width = null) => {
    if (!path) return '';
    let url = path;
    if (!path.startsWith('http') && !path.startsWith('blob:')) {
        url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    }

    // AUTO-OPTIMIZE CLOUDINARY
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
        const parts = url.split('/upload/');
        // Only inject if not already transformed
        if (!parts[1].startsWith('c_') && !parts[1].startsWith('w_')) {
            const isVideo = url.includes('/video/upload/');
            const transform = width
                ? `w_${width},c_fill,g_face,q_auto,${isVideo ? 'vc_auto' : 'f_auto'}`
                : `c_limit,w_1280,q_auto:eco,${isVideo ? 'vc_auto' : 'f_auto'}`;

            url = `${parts[0]}/upload/${transform}/${parts[1]}`;
        }
    }
    return url;
};

// --- GLOBAL STYLES FOR SAFE AREAS ---
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom, 20px) !important;
        }
    `;
    document.head.appendChild(style);
}

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

const parseHashtags = (text, onClick) => text ? text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) => part.startsWith('#') ? <span key={i} onClick={(e) => { e.stopPropagation(); if (onClick) onClick(part); }} className="text-blue-400 font-medium hover:underline cursor-pointer">{part}</span> : part) : text;
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
        'from-violet-500 to-purple-600', 'from-[var(--gold-primary)]/80 to-[var(--gold-secondary)]', 'from-rose-500 to-pink-600',
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

const ProfileAvatar = ({ user, size = "normal", className, onClick }) => {
    if (!user) return <DefaultAvatar size={size} />;
    const url = user.profilePic || user.fromProfilePic; // Handle user obj or notification obj
    const name = user.username || user.fromUsername;
    const mediaUrl = url ? resolveMediaUrl(url) : null;
    const isVideo = mediaUrl && (mediaUrl.match(/\.(mp4|mov|webm)$/i) || mediaUrl.includes('f_auto:video') || mediaUrl.includes('/video/upload/') || mediaUrl.includes('vc_auto'));

    if (isVideo) {
        return (
            <div className={`w-full h-full bg-gray-900 ${className || ''}`} onClick={onClick}>
                <video
                    src={mediaUrl}
                    className="w-full h-full object-cover pointer-events-none"
                    autoPlay
                    muted
                    loop
                    playsInline
                    disableRemotePlayback
                    onLoadedMetadata={(e) => { e.target.currentTime = 0.1; }}
                />
            </div>
        );
    }

    return mediaUrl ? (
        <img src={mediaUrl} className={`w-full h-full object-cover ${className || ''}`} onClick={onClick} loading="lazy" />
    ) : (
        <DefaultAvatar name={name} size={size} />
    );
};

const CommentItem = ({ comment, post, user, allUsers, onEdit, onDelete, t = (k) => k }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);

    const currentCommentAuthorId = comment.authorId || comment.user?._id || comment.userId;
    const isCommentAuthor = String(currentCommentAuthorId) === String(user?._id);
    const isPostAuthor = String(post.author?._id || post.author) === String(user?._id);
    const isFounder = (comment.user?.role === 'Founder' || allUsers?.find(u => String(u._id) === String(currentCommentAuthorId))?.role === 'Founder');

    const canEdit = isCommentAuthor || user?.role === 'Founder';
    const canDelete = isCommentAuthor || isPostAuthor || user?.role === 'Founder';

    const handleSave = () => {
        if (typeof onEdit === 'function') onEdit(post._id, comment._id, editText);
        setIsEditing(false);
    };

    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -10 }} className="flex gap-2.5 items-start relative mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/5 shadow-lg">
                <ProfileAvatar user={isCommentAuthor ? user : (comment.user || { username: comment.authorName, profilePic: comment.authorProfilePic })} />
            </div>

            <div className="flex-1 min-w-0">
                <div className={`relative inline-block max-w-[95%] rounded-2xl px-3.5 py-2 shadow-2xl backdrop-blur-md border border-white/5 ${isCommentAuthor ? 'bg-blue-600/10 border-blue-500/20 text-right' : 'bg-white/5'}`}>
                    <div className="flex items-center gap-2 mb-1 justify-between flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-[10px] text-gray-500 uppercase tracking-widest">{comment.user?.username || comment.authorName}</span>
                            {isFounder && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded-sm font-black tracking-widest shadow-glow-red">{t('FOUNDER_BADGE')}</span>}
                        </div>
                        <span className="text-[8px] text-gray-700 font-bold">{formatDate(comment.createdAt)}</span>
                    </div>
                    {isEditing ? (
                        <div className="mt-1">
                            <textarea autoFocus value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none mb-2 focus:border-blue-500/50 min-h-[60px] resize-none" />
                            <div className="flex gap-3">
                                <button onClick={handleSave} className="bg-blue-600 px-3 py-1 rounded-lg text-[9px] font-black text-white active:scale-95 transition-all uppercase">{t('SAVE')}</button>
                                <button onClick={() => setIsEditing(false)} className="bg-white/5 px-3 py-1 rounded-lg text-[9px] font-black text-gray-400 active:scale-95 transition-all uppercase">{t('CANCEL')}</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {comment.text && <span className="text-[13px] text-white/90 leading-relaxed font-medium whitespace-pre-wrap break-words">{comment.text}</span>}
                            {comment.audioUrl && (
                                <div className="flex flex-col gap-1.5 mt-1">
                                    <div className="flex items-center gap-1.5 text-[8px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 w-fit px-2 py-0.5 rounded border border-blue-500/20">
                                        <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" /> VOICE NOTE
                                    </div>
                                    <audio controls src={resolveMediaUrl(comment.audioUrl)} className="w-full h-8 opacity-90 max-w-[220px]" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 mt-1 ml-1">
                    {canEdit && !isEditing && (
                        <button onClick={() => setIsEditing(true)} className="text-[9px] text-gray-600 hover:text-blue-400 font-black uppercase tracking-widest transition-colors">{t('EDIT')}</button>
                    )}
                    {canDelete && (
                        <button onClick={() => onDelete?.(post._id, comment._id)} className="text-[9px] text-gray-600 hover:text-red-500 font-black uppercase tracking-widest transition-colors">{t('DELETE')}</button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const PostDetailModal = ({ post, user, allUsers, onClose, onLike, onDislike, onShare, onComment, onDelete, onEdit, onDeleteComment, onEditComment, loadingActions }) => {
    if (!post) return null;
    const { t, lang } = useTranslation(user);
    const isOwner = String(post.author?._id || post.author) === String(user?._id);
    const isFounder = user?.role === 'Founder';

    // Audio Comment State
    const [commentText, setCommentText] = useState('');
    const [commentAudio, setCommentAudio] = useState(null);
    const [isRecordingComment, setIsRecordingComment] = useState(false);
    const commentRecorderRef = useRef(null);
    const commentStreamRef = useRef(null);
    const discardRef = useRef(false);

    const stopRecording = (shouldDiscard = false) => {
        discardRef.current = shouldDiscard;
        if (commentRecorderRef.current && commentRecorderRef.current.state === 'recording') {
            commentRecorderRef.current.stop();
        } else if (shouldDiscard) {
            setCommentAudio(null);
            setIsRecordingComment(false);
        }
        if (commentStreamRef.current) {
            commentStreamRef.current.getTracks().forEach(track => track.stop());
            commentStreamRef.current = null;
        }
        if (!commentRecorderRef.current || commentRecorderRef.current.state !== 'recording') {
            setIsRecordingComment(false);
        }
    };

    const startCommentRecording = async () => {
        try {
            discardRef.current = false;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            commentStreamRef.current = stream;
            commentRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];
            commentRecorderRef.current.ondataavailable = e => chunks.push(e.data);
            commentRecorderRef.current.onstop = () => {
                if (discardRef.current) {
                    setCommentAudio(null);
                } else {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    setCommentAudio(blob);
                }
                setIsRecordingComment(false);
            };
            commentRecorderRef.current.start();
            setIsRecordingComment(true);
            setTimeout(() => { if (commentRecorderRef.current?.state === 'recording') { stopRecording(); } }, 60000); // 1 min max
        } catch (e) { alert("Mic denied"); }
    };

    return (

        <div className="fixed inset-0 z-[1200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-start md:justify-center p-0 md:p-4 overflow-y-auto">
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
                                <video src={resolveMediaUrl(post.videoUrl || post.image)} controls className="max-w-full max-h-full" />
                            </div>
                        ) : (
                            <img src={resolveMediaUrl(post.image || post.thumbnailUrl)} className="max-w-full max-h-full object-contain" />
                        )
                    ) : <div className="p-10 text-center font-black text-2xl text-white italic bg-gradient-to-br from-[var(--gold-primary)]/20 to-black w-full h-full flex items-center justify-center uppercase tracking-tighter">{post.desc}</div>}
                </div>

                {/* Info Section - Fixed height or scrolling */}
                <div className="w-full md:w-[450px] flex flex-col bg-[#050505] border-l border-white/5 h-fit md:h-full">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                <ProfileAvatar user={post.author} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-white leading-none">{post.author?.username}</span>
                                {post.author?.role === 'Founder' ? (
                                    <span className="text-[10px] text-red-600 mt-1 uppercase font-black tracking-widest drop-shadow-sm">{t('FOUNDER_BADGE')}</span>
                                ) : (
                                    <span className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">{t('MEMBER_BADGE')}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {isOwner && <button onClick={() => onEdit(post)} className="p-3 text-gray-500 hover:text-blue-500 transition-colors"><Icons.Settings className="w-5 h-5" /></button>}
                            {(isOwner || isFounder) && <button onClick={() => { onDelete(post._id); onClose(); }} className="p-3 text-gray-500 hover:text-red-500 transition-colors"><Icons.Trash className="w-5 h-5" /></button>}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20 md:max-h-full pb-24">
                        <div className="mb-6 text-sm text-gray-200 border-l-2 border-[var(--gold-primary)]/30 pl-3 py-1 font-medium leading-relaxed italic">{parseHashtags(post.desc)}</div>
                        <div className="space-y-4">
                            <AnimatePresence>
                                {post.comments?.map((c, i) => (
                                    <CommentItem key={c._id || i} comment={c} post={post} user={user} onEdit={onEditComment} onDelete={onDeleteComment} t={t} />
                                ))}
                                {post.comments?.length === 0 && <div className="text-center py-10 text-gray-600 text-[10px] uppercase font-bold tracking-widest">{t('NO_COMMENTS')}</div>}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/5 bg-[#080808]/90 backdrop-blur-2xl sticky bottom-0 z-[100] safe-area-bottom">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-7">
                                <button disabled={loadingActions?.[post._id]} onClick={() => onLike(post._id)} className={`flex items-center gap-2 group transition-all active:scale-150 ${loadingActions?.[post._id] ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <Icons.Heart className={`w-6.5 h-6.5 transition-all ${(Array.isArray(post.likes) && post.likes.includes(user?._id)) ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-white'}`} />
                                    <span className="text-[11px] font-black text-gray-500 uppercase">{post.likes?.length || 0}</span>
                                </button>
                                <button onClick={() => onDislike(post._id)} className="flex items-center gap-2 group transition-all active:scale-150">
                                    <Icons.ThumbsDown className={`w-6.5 h-6.5 transition-all ${(Array.isArray(post.dislikes) && post.dislikes.includes(user?._id)) ? 'text-[var(--gold-primary)]' : 'text-gray-400 group-hover:text-white'}`} />
                                    <span className="text-[11px] font-black text-gray-500 uppercase">{post.dislikes?.length || 0}</span>
                                </button>
                                <button onClick={() => onShare(post)} className="text-gray-400 hover:text-white transition-all active:rotate-[15deg] active:scale-110"><Icons.Send className="w-5.5 h-5.5" /></button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 min-h-[50px]">
                            <div className={`flex flex-1 items-center bg-white/[0.04] backdrop-blur-xl rounded-2xl px-3 py-1 border border-white/10 focus-within:border-[var(--gold-primary)]/40 hover:border-white/20 transition-all relative ${commentAudio ? 'ring-1 ring-[var(--gold-primary)]/50 bg-[var(--gold-primary)]/5' : ''}`}>
                                {!commentAudio ? (
                                    isRecordingComment ? (
                                        <div className="flex-1 min-h-[44px] bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between px-3 animate-pulse pr-1 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                                <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] whitespace-nowrap">{t('TRANSMITTING')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 ml-1">
                                                <button type="button" onClick={() => stopRecording(true)} className="p-2.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white transition-all active:scale-95 border border-white/5"><Icons.X className="w-4.5 h-4.5" /></button>
                                                <button type="button" onClick={() => stopRecording(false)} className="bg-red-500 hover:bg-red-600 p-3 rounded-lg text-white font-black shadow-xl shadow-red-900/40 active:scale-95 transition-all flex items-center justify-center">
                                                    <Icons.Send className="w-5 h-5 fill-white" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center bg-white/[0.02] rounded-xl px-3 group">
                                            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={t('ENGAGE')} className="flex-1 bg-transparent text-[14px] outline-none text-white py-3 placeholder-gray-600 font-medium" />
                                            <div className="flex items-center gap-2.5 ml-2">
                                                <button onClick={(e) => {
                                                    e.preventDefault();
                                                    if (!commentText.trim()) return;
                                                    onComment(post._id, commentText);
                                                    setCommentText('');
                                                }} disabled={!commentText.trim()} className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl text-white font-black disabled:opacity-20 active:scale-95 transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center">
                                                    <Icons.Send className="w-5 h-5 fill-white" />
                                                </button>
                                                <button type="button" onClick={startCommentRecording} className="p-2.5 rounded-full bg-white/[0.05] hover:bg-white/10 transition-all text-gray-400 hover:text-white active:scale-125 border border-white/5"><Icons.Mic className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex-1 flex items-center justify-between gap-3 min-h-[44px] px-1">
                                        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-xl">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('VOICE_NOTE_READY')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => setCommentAudio(null)} className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors active:scale-90"><Icons.Trash className="w-5 h-5" /></button>
                                            <button onClick={(e) => {
                                                e.preventDefault();
                                                if (commentAudio) {
                                                    const fd = new FormData();
                                                    if (commentText.trim()) fd.append('text', commentText);
                                                    fd.append('file', commentAudio, 'voice_comment.webm');
                                                    onComment(post._id, fd);
                                                    setCommentAudio(null);
                                                    setCommentText('');
                                                }
                                            }} className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl text-white font-black shadow-lg shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center">
                                                <Icons.Send className="w-5 h-5 fill-white" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotificationItem = ({ note, onViewProfile, onOpenPost, onOpenChat, onAcceptRequest, onRejectRequest, t }) => {
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
                <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden border-2 border-white/10 group-hover:border-[var(--gold-primary)]/50 transition-all shadow-lg">
                    <ProfileAvatar user={{ username: note.fromUsername, profilePic: note.fromProfilePic }} />
                </div>
                {note.type === 'like' && <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1 border-2 border-black"><Icons.Heart className="w-3 h-3 text-white fill-current" /></div>}
                {note.type === 'comment' && <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-black"><Icons.MessageCircle className="w-3 h-3 text-white fill-current" /></div>}
                {note.type === 'message' && <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-black"><Icons.Mail className="w-3 h-3 text-white" /></div>}
                {note.type === 'follow' && <div className="absolute -bottom-1 -right-1 bg-[var(--gold-primary)] rounded-full p-1 border-2 border-black"><Icons.UserPlus className="w-3 h-3 text-black" /></div>}
                {note.type === 'follow_request' && <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1 border-2 border-black"><Icons.Shield className="w-3 h-3 text-white" /></div>}
            </div>
            <div className="flex-1">
                <div className="text-sm">
                    <span className="font-black text-white group-hover:text-[var(--gold-primary)] transition-colors uppercase tracking-tight">{note.fromUsername}</span>
                    <span className="text-gray-500 text-[10px] sm:text-[11px] ml-1 uppercase tracking-widest font-bold">
                        {note.type === 'follow' ? t('NOTIF_FOLLOW') :
                            note.type === 'like' ? t('NOTIF_LIKE') :
                                note.type === 'comment' ? t('NOTIF_COMMENT') :
                                    note.type === 'message' ? t('NOTIF_MESSAGE') :
                                        note.type === 'mention' ? t('NOTIF_MENTION') :
                                            note.type === 'follow_request' ? t('NOTIF_REQUEST') : ''}
                    </span>
                </div>
                {note.text && <div className="text-xs text-gray-400 mt-1 line-clamp-1 italic font-medium">"{note.text}"</div>}
                <div className="flex items-center gap-3 mt-2">
                    <div className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">{formatDate(note.createdAt)}</div>
                    {!note.read && <div className="w-1.5 h-1.5 bg-[var(--gold-primary)] rounded-full shadow-glow-yellow" />}
                </div>

                {note.type === 'follow_request' && (
                    <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => onAcceptRequest(note.from)} className="flex-1 py-1.5 bg-[var(--gold-primary)] text-black text-[10px] font-black rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[var(--gold-primary)]/20 uppercase tracking-widest">{t('AUTHORIZE')}</button>
                        <button onClick={() => onRejectRequest(note.from)} className="flex-1 py-1.5 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-all uppercase tracking-widest">{t('DENY')}</button>
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

const StoriesBar = ({ stories, user, onAddStory, onViewStory }) => {
    const { t } = useTranslation(user);
    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-4 border-b border-white/5 bg-black/40">
            {/* CURRENT USER ADD STORY */}
            <div onClick={onAddStory} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                <div className={`w-16 h-16 rounded-full p-[2px] ${stories?.some(s => String(s.author?._id || s.author) === String(user?._id)) ? 'bg-gradient-to-tr from-[var(--gold-primary)] to-red-600' : 'bg-white/10 group hover:bg-[var(--gold-primary)]'} transition-colors`}>
                    <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-gray-900 relative">
                        <ProfileAvatar user={user} className="opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Icons.Plus className="w-6 h-6 text-white drop-shadow-lg" />
                        </div>
                    </div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{t('ADD_STORY')}</span>
            </div>

            {stories && stories.map((group, i) => (
                <div key={i} onClick={() => onViewStory(group.latestStory)} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[var(--gold-primary)] to-red-600 transition-transform active:scale-90">
                        <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-gray-900 shadow-xl">
                            <ProfileAvatar user={group.author} />
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide max-w-[60px] truncate">{group.author?.username}</span>
                </div>
            ))}
        </div>
    );
};

const PostCard = ({ post, user, onLike, onDislike, onComment, onDelete, onViewProfile, onOpenDetail, onShare, onEditComment, onDeleteComment, onEditPost, onHashtagClick, loadingActions }) => {
    // Comment Recording State (Local to PostCard if possible, but PostCard is complex, simplified here or need dedicated component hook)
    // Doing quick dirty way: prop drilling or wrapper. Wait, PostCard IS the component. I will add state inside PostCard via refactor or just using the one provided.
    // Actually PostCard is defined above. I need to add state TO PostCard. 
    // To avoid rewriting the entire PostCard, I will use a ref or internal state if I can't change signature easily.
    // CHECK: PostCard definition at line 337. It's a functional component, I can add hooks!

    const [commentAudio, setCommentAudio] = useState(null);
    const [isRecordingComment, setIsRecordingComment] = useState(false);
    const commentRecorderRef = useRef(null);
    const commentStreamRef = useRef(null);
    const discardRef = useRef(false);

    const stopRecording = (shouldDiscard = false) => {
        discardRef.current = shouldDiscard;
        if (commentRecorderRef.current && commentRecorderRef.current.state === 'recording') {
            commentRecorderRef.current.stop();
        } else if (shouldDiscard) {
            setCommentAudio(null);
            setIsRecordingComment(false);
        }
        if (commentStreamRef.current) {
            commentStreamRef.current.getTracks().forEach(track => track.stop());
            commentStreamRef.current = null;
        }
        if (!commentRecorderRef.current || commentRecorderRef.current.state !== 'recording') {
            setIsRecordingComment(false);
        }
    };

    const startCommentRecording = async () => {
        try {
            discardRef.current = false;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            commentStreamRef.current = stream;
            commentRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];
            commentRecorderRef.current.ondataavailable = e => chunks.push(e.data);
            commentRecorderRef.current.onstop = () => {
                if (discardRef.current) {
                    setCommentAudio(null);
                } else {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    setCommentAudio(blob);
                }
                setIsRecordingComment(false);
            };
            commentRecorderRef.current.start();
            setIsRecordingComment(true);
            setTimeout(() => { if (commentRecorderRef.current?.state === 'recording') { stopRecording(); } }, 60000);
        } catch (e) { alert("Mic denied"); }
    };



    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showHeart, setShowHeart] = useState(false);
    const { t, lang } = useTranslation(user);
    const [translatedDesc, setTranslatedDesc] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Safety check: Do not render stories as posts - MOVED AFTER HOOKS TO FIX INVARIANT 310
    if (post.isStory) return null;

    const isFounder = user?.role === 'Founder';
    const isPostAuthorFounder = post.author?.role === 'Founder';
    const isOwner = post.author?._id === user?._id || post.author === user?._id;
    const dislikeCount = post.dislikes?.length || 0;



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
                            <ProfileAvatar user={post.author} />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span onClick={(e) => { e.stopPropagation(); onViewProfile(post.author) }} className="font-bold text-base text-white hover:underline cursor-pointer leading-tight flex items-center gap-1">
                                    {post.author?.username}
                                    {isPostAuthorFounder && <span className="bg-red-600/80 text-white text-[10px] px-2 py-0.5 rounded font-black tracking-wider ml-1 border border-red-500/20">{t('FOUNDER_BADGE')}</span>}
                                </span>
                                <span className={`text-xs ${isPostAuthorFounder ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
                                    @{post.author?.username?.toLowerCase()} · {formatDate(post.createdAt)}
                                </span>
                            </div>
                            <div className="relative">
                                {(isOwner || isFounder) && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-95">
                                            <Icons.MoreVertical className="w-5 h-5" />
                                        </button>
                                        <AnimatePresence>
                                            {showMenu && (
                                                <>
                                                    <div className="fixed inset-0 z-[40]" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 top-8 bg-[#1a1a1a] border border-white/10 rounded-xl p-1 z-[50] w-36 shadow-2xl flex flex-col gap-1 overflow-hidden backdrop-blur-md">
                                                        {isOwner && (
                                                            <button onClick={(e) => { e.stopPropagation(); onEditPost(post); setShowMenu(false); }} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 text-xs font-bold text-gray-300 w-full text-left transition-colors uppercase tracking-wider">
                                                                <Icons.Edit className="w-4 h-4" /> {t('EDIT')}
                                                            </button>
                                                        )}
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(); setShowMenu(false); }} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-500/20 text-xs font-bold text-red-500 w-full text-left transition-colors uppercase tracking-wider">
                                                            <Icons.Trash className="w-4 h-4" /> {t('DELETE')}
                                                        </button>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* POST TEXT CONTENT */}
                        <div onClick={() => {
                            const isVid = (isYouTubeUrl(post.videoUrl) || post.videoUrl || (post.image && post.image.match(/\.(mp4|mov|webm)$/i)));
                            if (!isVid) onOpenDetail(post);
                        }} className={`mt-1 text-sm text-white/90 whitespace-pre-wrap break-words mb-2 font-normal ${(isYouTubeUrl(post.videoUrl) || post.videoUrl || (post.image && post.image.match(/\.(mp4|mov|webm)$/i))) ? '' : 'cursor-pointer'}`}>
                            {translatedDesc ? (
                                <div className="space-y-1">
                                    <div className="text-[var(--gold-primary)] text-[10px] font-bold uppercase tracking-widest">{t('SEE_TRANSLATION')}</div>
                                    <div>{parseHashtags(translatedDesc, onHashtagClick)}</div>
                                </div>
                            ) : parseHashtags(post.desc, onHashtagClick)}
                        </div>

                        {post.desc && post.desc.length > 5 && (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (translatedDesc) {
                                        setTranslatedDesc(null);
                                        return;
                                    }
                                    setIsTranslating(true);
                                    try {
                                        // Use lang from useTranslation (needs to be available)
                                        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(post.desc)}`);
                                        const data = await res.json();
                                        const translated = data[0].map(item => item[0]).join('');
                                        setTranslatedDesc(translated);
                                    } catch (e) { console.error(e); }
                                    finally { setIsTranslating(false); }
                                }}
                                className="text-[10px] font-bold text-gray-500 hover:text-[var(--gold-primary)] transition-colors uppercase tracking-widest mb-2"
                            >
                                {isTranslating ? '...' : (translatedDesc ? t('SHOW_ORIGINAL') : t('SEE_TRANSLATION'))}
                            </button>
                        )}

                        {/* MEDIA CONTENT */}
                        {(post.image || post.videoUrl) && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-white/10 relative shadow-sm bg-black/50" style={{ maxHeight: '500px' }}>
                                {/* DETECT VIDEO VS IMAGE - DO NOT ZOOM VIDEOS TO PREVENT GLITCHES */}
                                {isYouTubeUrl(post.videoUrl) ? (
                                    <div className="w-full aspect-video bg-black">
                                        <iframe title="youtube-feed" src={getYouTubeEmbedUrl(post.videoUrl)} className="w-full h-full" frameBorder="0" allowFullScreen />
                                    </div>
                                ) : (post.videoUrl || (post.image && post.image.match(/\.(mp4|mov|webm)$/i))) ? (
                                    <video
                                        src={resolveMediaUrl(post.videoUrl || post.image)}
                                        controls
                                        playsInline
                                        preload="metadata"
                                        className="w-full h-auto max-h-[600px] object-contain bg-gray-900"
                                        onLoadedMetadata={(e) => { e.target.currentTime = 0.1; }}
                                    />
                                ) : post.image ? (
                                    <img
                                        onDoubleClick={handleDoubleTap}
                                        onClick={() => onOpenDetail(post)}
                                        src={resolveMediaUrl(post.image)}
                                        className="w-full h-auto max-h-[600px] object-contain bg-black cursor-pointer"
                                        loading="lazy"
                                    />
                                ) : null}

                                {post.audioUrl && (
                                    <div className="p-4 bg-gray-900 border-t border-white/10">
                                        <audio controls src={resolveMediaUrl(post.audioUrl)} className="w-full h-8" />
                                    </div>
                                )}
                                <AnimatePresence>
                                    {showHeart && (
                                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                            <Icons.Heart className="w-24 h-24 text-[var(--gold-primary)] fill-[var(--gold-primary)] drop-shadow-2xl" />
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

                            <button onClick={(e) => { e.stopPropagation(); onDislike(post._id); }} className={`flex items-center gap-1.5 group transition-colors ${(Array.isArray(post.dislikes) && post.dislikes.some(id => String(id) === String(user?._id))) ? 'text-[var(--gold-primary)]' : 'text-gray-500 hover:text-[var(--gold-primary)]'}`}>
                                <div className="p-1.5 rounded-full group-hover:bg-[var(--gold-primary)]/10"><Icons.ThumbsDown className="w-5 h-5" /></div>
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
                                <CommentItem key={c._id || idx} comment={c} post={post} user={user} onEdit={onEditComment} onDelete={onDeleteComment} t={t} />
                            ))}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!commentText.trim() && !commentAudio) return;
                                    const input = commentAudio ? (() => {
                                        const fd = new FormData();
                                        fd.append('file', commentAudio, 'voice.webm');
                                        if (commentText.trim()) fd.append('text', commentText.trim());
                                        return fd;
                                    })() : commentText.trim();
                                    onComment(post._id, input);
                                    setCommentAudio(null);
                                    setCommentText('');
                                }}
                                className="flex gap-3 items-center mt-4"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden shrink-0">
                                    <ProfileAvatar user={user} />
                                </div>
                                {isRecordingComment ? (
                                    <div className="flex-1 h-11 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between px-3 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                                            <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.25em]">TRANSMITTING...</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => stopRecording(true)} className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white transition-all active:scale-95 border border-white/5"><Icons.X className="w-4.5 h-4.5" /></button>
                                            <button type="button" onClick={() => stopRecording(false)} className="bg-red-500 hover:bg-red-600 p-3 rounded-xl text-white font-black shadow-xl shadow-red-900/40 active:scale-95 transition-all flex items-center justify-center">
                                                <Icons.Send className="w-5 h-5 fill-white" />
                                            </button>
                                        </div>
                                    </div>
                                ) : commentAudio ? (
                                    <div className="flex-1 h-11 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-center justify-between px-4 ring-1 ring-blue-500/20">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('VOICE_PREPARED')}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button type="button" onClick={() => setCommentAudio(null)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors group active:scale-90"><Icons.Trash className="w-4.5 h-4.5 text-gray-500 group-hover:text-red-500" /></button>
                                            <button type="submit" className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl text-white font-black shadow-lg shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center">
                                                <Icons.Send className="w-5 h-5 fill-white" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex gap-2.5 items-center bg-white/[0.04] backdrop-blur-xl rounded-xl px-3 border border-white/10 focus-within:border-[var(--gold-primary)]/40 hover:border-white/20 transition-all shadow-inner">
                                        <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={t('ENGAGE')} className="flex-1 bg-transparent py-2.5 text-[12px] text-white outline-none placeholder-gray-500 font-medium" />
                                        <div className="flex items-center gap-2 ml-1">
                                            <button type="submit" disabled={!commentText.trim()} className="bg-blue-600 hover:bg-blue-500 p-2.5 rounded-lg text-white font-black disabled:opacity-20 active:scale-95 transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center">
                                                <Icons.Send className="w-4.5 h-4.5 fill-white" />
                                            </button>
                                            <button type="button" onClick={startCommentRecording} className="p-2 rounded-full bg-white/[0.05] hover:bg-white/10 transition-all text-gray-400 hover:text-white active:scale-110"><Icons.Mic className="w-4.5 h-4.5" /></button>
                                        </div>
                                    </div>
                                )}
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
    const { t } = useTranslation(user);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState({});
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
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
            setInputText(text);
        }
    };

    const filteredUsers = allUsers.filter(u =>
        u._id !== user?._id &&
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-5xl h-full sm:h-[85vh] bg-black sm:rounded-3xl border border-white/10 flex overflow-hidden shadow-2xl">
                <div className={`w-full sm:w-80 border-r border-white/10 flex flex-col ${activeChat ? 'hidden sm:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-white/10 space-y-4">
                        <div className="flex justify-between items-center"><h2 className="text-xl font-black italic">{t('CHAT')}</h2><button onClick={onClose} className="sm:hidden"><Icons.X className="w-6 h-6" /></button></div>
                        <div className="relative">
                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search friends..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--gold-primary)] transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredUsers.length === 0 && <div className="p-4 text-center text-gray-500 text-xs">No users found.</div>}
                        {filteredUsers.map(u => {
                            const online = isUserOnline(u, user);
                            return (
                                <div key={u._id} onClick={() => setActiveChat(u)} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${activeChat?._id === u._id ? 'bg-white/5' : ''}`}>
                                    <div className="relative"><div className={`w-12 h-12 rounded-full bg-gray-900 border border-white/10 overflow-hidden shadow-md`}><ProfileAvatar user={u} /></div><div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${online ? 'bg-green-500' : 'bg-gray-600'}`} /></div>
                                    <div><div className="font-bold text-sm text-white flex items-center gap-2">{u?.username} {u.role === 'Founder' && <span className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider shadow-glow-red">{t('FOUNDER_BADGE')}</span>}</div><div className={`text-[10px] ${online ? 'text-green-500' : 'text-gray-500'} uppercase tracking-tighter`}>{online ? 'Online' : 'Offline'}</div></div>
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
                                <div className="w-10 h-10 rounded-full border border-[var(--gold-primary)]/30 overflow-hidden"><ProfileAvatar user={activeChat} /></div>
                                <div><div className="font-bold text-sm">{activeChat?.username}</div><div className={`text-[10px] ${isUserOnline(activeChat, user) ? 'text-green-500 font-bold uppercase tracking-widest' : 'text-gray-500 uppercase tracking-tighter'}`}>{isUserOnline(activeChat, user) ? 'Online' : 'Offline'}</div></div>
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
                                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder={t('ENTER_COMMAND')} className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 text-sm outline-none focus:border-blue-500 shadow-inner" />
                                <button onClick={handleSend} className="text-blue-500 font-bold text-sm tracking-widest uppercase hover:scale-105 transition-transform">{t('POST')}</button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center"><div><Icons.MessageCircle className="w-16 h-16 text-gray-800 mx-auto mb-4" /><h3 className="font-black italic text-2xl tracking-tighter">{t('MESSAGES')}</h3><p className="text-gray-500 text-sm mt-2">{t('SECURE_COMMS')}</p></div></div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ isOpen, onClose, logout, user, onUpdateUser }) => {
    const { t, lang } = useTranslation(user);
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
            // FIX: Nested settings support for language
            let payload = { [key]: val };
            if (key === 'language') payload = { settings: { language: val } };

            const res = await axios.put('/users/settings', payload);
            onUpdateUser(res.data);

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
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-sm h-full sm:h-auto bg-[#0a0a0a] sm:border border-white/10 sm:rounded-[2rem] overflow-hidden animate-pop-in shadow-2xl flex flex-col">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                    <h2 className="font-bold uppercase tracking-widest text-xs text-gray-400">{t('SETTINGS')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Icons.X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    <div className="p-4 flex items-center justify-between bg-white/5 rounded-2xl border border-white/5 transition-all hover:border-[var(--gold-primary)]/30 group">
                        <div>
                            <div className="text-sm font-bold text-white group-hover:text-[var(--gold-primary)] transition-colors">{t('PRIVATE_TITLE')}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-tighter">{t('PRIVATE_DESC')}</div>
                        </div>
                        <div onClick={() => {
                            if (saving) return;
                            const newVal = !isPrivate;
                            setIsPrivate(newVal);
                            handleSave('isPrivate', newVal);
                        }} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${isPrivate ? 'bg-[var(--gold-primary)]' : 'bg-gray-700'} ${saving ? 'opacity-50' : ''}`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${isPrivate ? 'translate-x-5' : ''}`} />
                        </div>
                    </div>

                    <div className="p-4 flex items-center justify-between bg-white/5 rounded-2xl border border-white/5 transition-all hover:border-blue-500/30 group">
                        <div>
                            <div className="text-sm font-bold text-white group-hover:text-blue-500 transition-colors">{t('GUARD_TITLE')}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-tighter">{t('GUARD_DESC')}</div>
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
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">{t('THEME')}</div>
                        <div className="flex gap-2">
                            {['#ffd700', '#3b82f6', '#ef4444', '#10b981', '#ffffff', '#a855f7'].map(c => {
                                const isActive = (localStorage.getItem('themeColor') || '#ffd700') === c;
                                const getSecondary = (hex) => {
                                    if (hex === '#ffffff') return '#888888';
                                    if (hex === '#ffd700') return '#b8860b';
                                    return hex + 'aa';
                                };
                                const getHover = (hex) => {
                                    if (hex === '#ffffff') return '#f0f0f0';
                                    return hex + 'cc';
                                };
                                return (
                                    <button key={c} onClick={() => {
                                        const secondary = getSecondary(c);
                                        const hover = getHover(c);
                                        const glow = `${c}44`;
                                        const glowSoft = `${c}1a`;
                                        document.documentElement.style.setProperty('--gold-primary', c);
                                        document.documentElement.style.setProperty('--gold-secondary', secondary);
                                        document.documentElement.style.setProperty('--gold-hover', hover);
                                        document.documentElement.style.setProperty('--gold-glow', glow);
                                        document.documentElement.style.setProperty('--gold-glow-soft', glowSoft);
                                        localStorage.setItem('themeColor', c);
                                        localStorage.setItem('themeSecondary', secondary);
                                        localStorage.setItem('themeHover', hover);
                                        localStorage.setItem('themeGlow', glow);
                                        localStorage.setItem('themeGlowSoft', glowSoft);
                                        onUpdateUser({ ...user });
                                    }} className={`w-8 h-8 rounded-full border transition-all ${isActive ? 'scale-125 border-white ring-2 ring-white/50 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-white/10 hover:scale-110'}`} style={{ background: c }} />
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">{t('COGNITION')}</div>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'en', label: 'English', flag: '🇺🇸' },
                                { id: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
                                { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
                                { id: 'ru', label: 'Русский', flag: '🇷🇺' },
                                { id: 'cy', label: 'Kypriaka', flag: '🇨🇾' },
                                { id: 'es', label: 'Español', flag: '🇪🇸' },
                                { id: 'tr', label: 'Türkçe', flag: '🇹🇷' },
                                { id: 'fr', label: 'Français', flag: '🇫🇷' }
                            ].map(l => (
                                <button key={l.id} onClick={() => { handleSave('language', l.id); localStorage.setItem('language', l.id); }} className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center ${lang === l.id ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/10' : 'border-white/5 bg-white/5'}`}>
                                    <div className="text-xl">{l.flag}</div>
                                    <div className="text-[8px] sm:text-[9px] font-bold text-white mt-1 uppercase tracking-tight">{l.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20 space-y-3">
                        <div className="text-xs font-bold text-red-500 uppercase tracking-widest pl-1">{t('DANGER_ZONE')}</div>
                        <button onClick={async () => {
                            if (confirm(t('DELETE_ACCOUNT_CONFIRM'))) {
                                try {
                                    await axios.delete(`/users/${user._id}`);
                                    logout();
                                } catch (e) { alert("Deletion failed."); }
                            }
                        }} className="w-full py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 font-bold text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">
                            {t('DELETE_FOREVER')}
                        </button>
                    </div>

                    <button onClick={logout} className="w-full text-left p-4 hover:bg-red-500/10 flex items-center justify-between text-red-500 font-black text-sm border border-red-500/20 rounded-2xl transition-all hover:scale-[0.98]">
                        <span className="tracking-[0.2em]">{t('LOGOUT')}</span>
                        <Icons.Logout className="w-5 h-5" />
                    </button>

                    {saving && <div className="text-[10px] text-[var(--gold-primary)] text-center font-bold animate-pulse">SYNCING WITH NEURAL LINK...</div>}
                </div>
            </div>
        </div >
    );
};

const ProfileModal = ({ isOpen, onClose, profileUser, currentUser, posts, allUsers = [], onViewProfile, onOpenDetail, onFollow, followLoading = {}, onUpdateUser }) => {
    const { t, lang } = useTranslation(currentUser);
    const [userData, setUserData] = useState(null);
    const [activeList, setActiveList] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(currentUser?.bio || "");
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, POSTS, VIDEO
    const fileRef = useRef(null);

    useEffect(() => {
        if (currentUser) setBio(currentUser.bio || "");
    }, [currentUser]);

    const userStories = React.useMemo(() => (posts || []).filter(p => {
        const pId = String(p.author?._id || p.author || '');
        const uId = String(profileUser?._id || (typeof profileUser === 'string' ? profileUser : ''));
        return pId === uId && p.isStory;
    }), [posts, profileUser]);

    const userPosts = React.useMemo(() => (posts || []).filter(p => {
        const pId = String(p.author?._id || p.author || '');
        const uId = String(profileUser?._id || (typeof profileUser === 'string' ? profileUser : ''));
        const uName = profileUser?.username || '';
        const matchesUser = (pId && uId && pId === uId) || (p.username && uName && p.username === uName);

        if (!matchesUser || p.isStory) return false;

        if (activeTab === 'VIDEO') return isYouTubeUrl(p.videoUrl) || (p.videoUrl || (p.image && p.image.match(/\.(mp4|mov|webm)$/i)));
        if (activeTab === 'POSTS') return !p.videoUrl && !isYouTubeUrl(p.videoUrl) && !(p.image && p.image.match(/\.(mp4|mov|webm)$/i));
        return true;
    }), [posts, profileUser, activeTab]);

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

    const isFollowing = currentUser?.following?.includes(displayUser?._id);
    const hasRequested = displayUser?.followRequests?.includes(currentUser?._id);

    return (

        <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ y: '100dvh' }} animate={{ y: 0 }} exit={{ y: '100dvh' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative bg-[#0a0a0a] w-full max-w-lg h-[100dvh] sm:h-[85vh] sm:rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl">
                <div className="flex-none p-4 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a] z-50">
                    <button onClick={() => {
                        if (activeList) setActiveList(null);
                        else if (isEditing) setIsEditing(false);
                        else onClose();
                    }} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"><Icons.Back className="w-6 h-6 text-white" /></button>
                    <div className="font-bold text-white text-sm uppercase tracking-widest">{activeList ? (activeList === 'followers' ? t('FOLLOWERS') : t('FOLLOWING')) : (isEditing ? t('EDIT_PROFILE') : displayUser?.username)}</div>
                    <div className="w-10" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#050505] overscroll-y-contain pb-32">
                    {activeList ? (
                        <div className="p-2 space-y-2">
                            {getListUsers().length === 0 && <div className="p-4 text-center text-gray-500">No users found.</div>}
                            {getListUsers().map(u => (
                                <div key={u._id} onClick={() => { onViewProfile(u); setActiveList(null); }} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                        <ProfileAvatar user={u} />
                                    </div>
                                    <div className="font-bold text-white text-sm">{u?.username}</div>
                                </div>
                            ))}
                        </div>
                    ) : isEditing ? (
                        <div className="p-6 text-center space-y-8 animate-fade-in">
                            <div onClick={() => fileRef.current.click()} className="w-32 h-32 mx-auto rounded-full bg-gray-800 overflow-hidden border-4 border-[var(--gold-primary)] cursor-pointer relative group shadow-2xl shadow-[var(--gold-primary)]/10">
                                <ProfileAvatar user={displayUser} size="large" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Camera className="w-10 h-10 text-white" /></div>
                            </div>
                            <input type="file" ref={fileRef} hidden accept="image/*,video/*" onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    if (file.type.startsWith('video/') && file.size > 10 * 1024 * 1024) {
                                        alert("Video profile/GIF must be under 10MB to prevent lag.");
                                        return;
                                    }
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
                                <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[var(--gold-primary)] outline-none resize-none h-32" placeholder="Tell your story..." />
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
                            }} className="w-full py-4 bg-[var(--gold-primary)] rounded-2xl text-black font-black uppercase tracking-widest shadow-lg shadow-[var(--gold-primary)]/20 active:scale-95 transition-transform text-sm">Save Changes</button>
                        </div>
                    ) : (
                        <div className="p-4 sm:p-6 pb-20">
                            <div className="flex items-center gap-4 sm:gap-8 mb-6">
                                <div className={`w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gray-800 overflow-hidden border-2 cursor-pointer shadow-xl shrink-0 ${displayUser?.role === 'Founder' ? 'border-red-600 shadow-red-600/30' : 'border-[var(--gold-primary)] shadow-[var(--gold-primary)]/20'}`}>
                                    <ProfileAvatar user={displayUser} size="large" />
                                </div>
                                <div className="flex-1 flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                    <div className="flex flex-col items-center">
                                        <div className="font-black text-white text-lg sm:text-2xl leading-none">{(userPosts || []).length}</div>
                                        <div className="text-[9px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">{t('POSTS')}</div>
                                    </div>
                                    <div onClick={() => setActiveList('followers')} className="flex flex-col items-center cursor-pointer hover:bg-white/10 p-1 rounded-lg transition-all">
                                        <div className="font-black text-[var(--gold-primary)] text-lg sm:text-2xl leading-none">{displayUser?.followers?.length || 0}</div>
                                        <div className="text-[9px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">{t('FOLLOWERS')}</div>
                                    </div>
                                    <div onClick={() => setActiveList('following')} className="flex flex-col items-center cursor-pointer hover:bg-white/10 p-1 rounded-lg transition-all">
                                        <div className="font-black text-white text-lg sm:text-2xl leading-none">{displayUser?.following?.length || 0}</div>
                                        <div className="text-[9px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">{t('FOLLOWING')}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6 px-1">
                                <div className="font-black text-white text-xl mb-1 flex items-center gap-2">
                                    {displayUser?.username || "Unknown Agent"}
                                    {displayUser?.role === 'Founder' && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-black tracking-wider shadow-glow-red">{t('FOUNDER_BADGE')}</span>}
                                    {displayUser?._id !== currentUser?._id && <div className={`ml-2 w-2 h-2 rounded-full ${isUserOnline(displayUser, currentUser) ? 'bg-green-500 shadow-glow-green' : 'bg-gray-600'}`} title={isUserOnline(displayUser, currentUser) ? 'Online' : 'Offline'} />}
                                </div>
                                <div className="text-sm text-gray-300 leading-relaxed max-w-sm whitespace-pre-wrap font-medium mb-4">{displayUser?.bio || t("DEFAULT_BIO")}</div>

                                {isMe ? (
                                    <button onClick={() => setIsEditing(true)} className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black tracking-widest hover:bg-white/10 transition-all uppercase">{t('EDIT_PROFILE')}</button>
                                ) : (
                                    <div className="flex-1 flex gap-2">
                                        <button disabled={followLoading[displayUser?._id]} onClick={() => onFollow(displayUser)} className={`flex-1 py-3 ${isFollowing ? 'bg-white/5 border border-white/10 text-gray-400' : 'bg-[var(--gold-primary)] text-black shadow-lg shadow-[var(--gold-primary)]/20'} rounded-2xl text-[10px] font-black tracking-widest hover:scale-[0.98] transition-all uppercase disabled:opacity-50`}>
                                            {isFollowing ? t('UNFOLLOW') : (hasRequested ? t('REQUESTED') : t('FOLLOW'))}
                                        </button>
                                        {currentUser?.role === 'Founder' && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await axios.post(`/users/${displayUser._id}/ban`, { days: 3 });
                                                        alert("Agent suspended for 3 days.");
                                                    } catch (e) { alert("Ban failed."); }
                                                }}
                                                className="px-4 py-3 bg-red-600 rounded-2xl text-white font-black text-[10px] tracking-widest hover:bg-red-700 transition-all active:scale-95"
                                            >
                                                {t('BAN')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-4">
                                {['ALL', 'POSTS', 'VIDEO'].map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTab === tab ? 'bg-[var(--gold-primary)] text-black shadow-lg shadow-[var(--gold-primary)]/20' : 'text-gray-500 hover:text-white'}`}>{t('TAB_' + tab)}</button>
                                ))}
                            </div>

                            {userStories.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">{t('HIGHLIGHTS')}</h3>
                                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                        {userStories.map(s => (
                                            <div key={s._id} onClick={() => onOpenDetail(s)} className="shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
                                                <div className="w-16 h-16 rounded-full border-2 border-[var(--gold-primary)] p-0.5 group-hover:scale-105 transition-transform shadow-lg shadow-[var(--gold-primary)]/10 bg-black overflow-hidden relative">
                                                    {s.thumbnailUrl || (s.image && !s.image.match(/\.(mp4|mov|webm)$/i)) ? (
                                                        <img src={resolveMediaUrl(s.thumbnailUrl || s.image)} className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center">
                                                            <Icons.Play className="w-6 h-6 text-[var(--gold-primary)]" />
                                                            {/* Ensure video doesn't autoplay in thumbnail view */}
                                                            <video src={resolveMediaUrl(s.image)} className="absolute inset-0 w-full h-full object-cover opacity-50" muted playsInline />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{formatDate(s.createdAt)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {userPosts.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 text-xs uppercase tracking-widest font-bold">{t('NO_CONTENT')}</div>
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
                                                    <video
                                                        src={resolveMediaUrl(p.videoUrl || p.image)}
                                                        muted
                                                        playsInline
                                                        preload="metadata"
                                                        className="w-full h-full object-cover bg-gray-900"
                                                        onLoadedMetadata={(e) => { e.target.currentTime = 0.1; }}
                                                    />
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
            </motion.div >
        </div >
    );
};

const CreateModal = ({ isOpen, onClose, onSuccess, user }) => {
    const [preview, setPreview] = useState(null);
    const [isVideo, setIsVideo] = useState(false);
    const [isAudio, setIsAudio] = useState(false);
    const [audioName, setAudioName] = useState('');
    const [creating, setCreating] = useState(false);
    const [isStory, setIsStory] = useState(false);
    const fileRef = useRef(null);
    const { t } = useTranslation(user);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);

    // Safety check: Moved after hooks to prevent React Invariant 310
    if (!isOpen) return null;

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorderRef.current.ondataavailable = e => chunks.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (e) { alert("Microphone access denied."); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        setIsRecording(false);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Video duration check (5 minutes = 300s)
        if (file.type.startsWith('video')) {
            const url = URL.createObjectURL(file);
            const vid = document.createElement('video');
            vid.preload = 'metadata';
            vid.src = url;
            const dur = await new Promise((resolve) => {
                vid.onloadedmetadata = () => { resolve(vid.duration || 0); URL.revokeObjectURL(url); };
                vid.onerror = () => { resolve(0); URL.revokeObjectURL(url); };
            });
            if (dur && dur > 300) {
                alert('Video must be 5 minutes or shorter.');
                e.target.value = '';
                return;
            }
            setPreview(URL.createObjectURL(file));
            setIsVideo(true);
            setIsAudio(false);
        } else if (file.type.startsWith('audio')) {
            setPreview(URL.createObjectURL(file));
            setIsVideo(false);
            setIsAudio(true);
            setAudioName(file.name);
        } else {
            setPreview(URL.createObjectURL(file));
            setIsVideo(false);
            setIsAudio(false);
        }
    };
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-sm glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
                    <h2 className="text-xl font-black italic mb-4 text-white">{t('UPLOAD_TITLE')}</h2>
                    <div className="flex gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10">
                            <ProfileAvatar user={user} />
                        </div>
                        <textarea id="c-desc" placeholder={t('DECRYPT_PH')} className="flex-1 bg-transparent text-sm outline-none text-white resize-none h-20 placeholder-gray-500" />
                    </div>

                    {/* YouTube URL input */}
                    <div className="mb-3">
                        <input id="c-youtube" placeholder={t('YOUTUBE_PH')} className="w-full bg-black/20 border border-white/5 rounded-xl p-2 text-sm text-white outline-none placeholder-gray-500" onChange={(e) => {
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
                        <div className="text-[10px] text-gray-400 mt-1">{t('YOUTUBE_NOTE')}</div>
                    </div>

                    <div onClick={() => fileRef.current.click()} className="cursor-pointer mb-4">
                        {preview ? (
                            <div className="w-full h-48 rounded-2xl overflow-hidden relative bg-black border border-white/10 shadow-inner flex items-center justify-center">
                                {isVideo ? (
                                    <video src={preview} className="w-full h-full object-contain" controls />
                                ) : isAudio ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 gap-2 p-4">
                                        <Icons.Music className="w-12 h-12 text-[var(--gold-primary)] animate-pulse" />
                                        <span className="text-xs text-gray-400 font-bold truncate max-w-[200px]">{audioName}</span>
                                        <audio src={preview} controls className="w-full mt-2" />
                                    </div>
                                ) : (
                                    <img src={preview} className="w-full h-full object-cover" />
                                )}
                                <button onClick={(e) => { e.stopPropagation(); setPreview(null); setIsAudio(false); setIsVideo(false); if (fileRef.current) fileRef.current.value = ''; }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-red-500 transition-colors"><Icons.X className="w-3 h-3 text-white" /></button>
                            </div>
                        ) : (
                            <div className="w-full py-8 border border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all text-gray-500 cursor-pointer">
                                <Icons.Image className="w-8 h-8 opacity-50" />
                                <span className="text-xs font-bold uppercase tracking-widest">UPLOAD VIDEO / MEDIA / AUDIO</span>
                            </div>
                        )}
                        <input type="file" ref={fileRef} accept="image/*,video/*,audio/*" hidden onChange={handleFileChange} />
                    </div>
                    <div className="flex gap-4 items-center mb-4">
                        <div onClick={() => setIsStory(!isStory)} className={`flex items-center gap-3 cursor-pointer px-4 py-2.5 rounded-2xl transition-all border ${isStory ? 'bg-[var(--gold-primary)]/10 border-[var(--gold-primary)]/50 shadow-lg shadow-[var(--gold-primary)]/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isStory ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)] scale-110' : 'border-gray-500'}`}>
                                {isStory && <Icons.Check className="w-4 h-4 text-black font-black" />}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${isStory ? 'text-[var(--gold-primary)]' : 'text-gray-400'}`}>{t('ADD_STORY')}</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">{t('STORY_DURATION')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs hover:bg-white/10 text-white uppercase tracking-widest">{t('CANCEL')}</button>
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
                                document.getElementById('c-desc').value = '';
                                document.getElementById('c-youtube').value = '';
                                setPreview(null); fileRef.current.value = '';
                                setIsStory(false);
                            } catch (e) { console.error('Create post failed', e); alert('Post failed'); } finally { setCreating(false); }
                        }} className={`flex-1 py-3 ${creating ? 'opacity-60 cursor-wait' : 'bg-[var(--gold-primary)] hover:opacity-90'} rounded-xl text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-[var(--gold-primary)]/20 active:scale-95 transition-transform`}>{creating ? '...' : (isStory ? t('POST_STORY') : t('POST'))}</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const EditPostModal = ({ isOpen, onClose, onSuccess, post, user }) => {
    const { t } = useTranslation(user);
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
            if (dur && dur > 600) {
                alert('Video must be 10 minutes or shorter. Please trim your clip.');
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
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-sm glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl modal-content-scroller custom-scrollbar">
                <h2 className="text-xl font-black italic mb-4 text-white uppercase tracking-tighter">{t('EDIT_INTEL')}</h2>
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

                    {/* AUDIO RECORDER */}
                    {!preview && !youtubeUrl && (
                        <div className="mb-4">
                            {audioBlob ? (
                                <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                                    <audio controls src={URL.createObjectURL(audioBlob)} className="w-full h-8" />
                                    <button onClick={() => setAudioBlob(null)} className="p-1 hover:bg-red-500/20 rounded-full text-red-500"><Icons.Trash className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <button onClick={isRecording ? stopRecording : startRecording} className={`w-full py-4 rounded-xl border border-dashed flex items-center justify-center gap-2 transition-all ${isRecording ? 'border-red-500 bg-red-500/10 text-red-500 animate-pulse' : 'border-gray-600 hover:border-[var(--gold-primary)] text-gray-400 hover:text-white'}`}>
                                    <Icons.Mic className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{isRecording ? "Stop Recording..." : "Record Voice Note"}</span>
                                </button>
                            )}
                        </div>
                    )}

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
                        <input type="file" ref={fileRef} accept="image/*,video/*,audio/*" hidden onChange={handleFileChange} />
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs hover:bg-white/10 text-white uppercase tracking-widest">{t('CANCEL')}</button>
                        <button disabled={creating} onClick={() => {
                            if (creating) return;
                            setCreating(true);
                            const fd = new FormData();
                            fd.append('desc', desc);
                            fd.append('visibility', visibility);
                            fd.append('isStory', isStory);
                            if (youtubeUrl) fd.append('videoUrl', youtubeUrl);
                            if (fileRef.current?.files[0]) fd.append('image', fileRef.current.files[0]);
                            if (audioBlob) fd.append('image', audioBlob, 'voice_note.webm'); // Re-use 'image' field or 'file' depending on backend. Backend uses upload.single('image') for posts.

                            onSuccess(fd).finally(() => setCreating(false));
                        }} className={`flex-1 py-3 ${creating ? 'opacity-60 cursor-wait' : 'bg-[var(--gold-primary)] hover:opacity-90'} rounded-xl text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-[var(--gold-primary)]/20 active:scale-95 transition-transform`}>{creating ? '...' : t('share')}</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const App = () => {
    const [user, setUser] = useState(null);
    const [imgKey, setImgKey] = useState(Date.now());
    const { t, lang } = useTranslation(user);
    const [toasts, setToasts] = useState([]);
    const addToast = (text, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, text, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

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
        const savedSecondary = localStorage.getItem('themeSecondary');
        const savedHover = localStorage.getItem('themeHover');
        const savedGlow = localStorage.getItem('themeGlow');
        const savedGlowSoft = localStorage.getItem('themeGlowSoft');
        if (savedTheme) document.documentElement.style.setProperty('--gold-primary', savedTheme);
        if (savedSecondary) document.documentElement.style.setProperty('--gold-secondary', savedSecondary);
        if (savedHover) document.documentElement.style.setProperty('--gold-hover', savedHover);
        if (savedGlow) document.documentElement.style.setProperty('--gold-glow', savedGlow);
        if (savedGlowSoft) document.documentElement.style.setProperty('--gold-glow-soft', savedGlowSoft);
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

    // FIX: Optimized search filtering with useMemo
    const filteredPosts = React.useMemo(() => {
        return posts.filter(p => {
            // Robust check for stories - exclude them from feed
            if (p.isStory === true || String(p.isStory) === 'true') return false;
            const q = searchQuery.toLowerCase();
            if (!q) return true;
            const descMatch = p.desc ? p.desc.toLowerCase().includes(q) : false;
            const authorMatch = p.author?.username ? p.author.username.toLowerCase().includes(q) : (p.username ? p.username.toLowerCase().includes(q) : false);
            return descMatch || authorMatch;
        });
    }, [posts, searchQuery]);

    const stories = React.useMemo(() => {
        const groups = {};
        posts.filter(p => p.isStory === true || String(p.isStory) === 'true').forEach(p => {
            const uid = String(p.author?._id || p.author);
            // Filter only last 24h
            if ((Date.now() - new Date(p.createdAt).getTime()) > 24 * 60 * 60 * 1000) return;

            if (!groups[uid]) {
                groups[uid] = {
                    author: p.author || { username: p.username, profilePic: p.profilePic, _id: p.author },
                    latestStory: p,
                    allStories: []
                };
            }
            groups[uid].allStories.push(p);
        });
        return Object.values(groups).sort((a, b) => new Date(b.latestStory.createdAt) - new Date(a.latestStory.createdAt));
    }, [posts]);

    const fetchPosts = async () => { try { const res = await axios.get('/posts?limit=20'); setPosts(res.data); } catch (e) { } };
    const fetchUsers = async () => { try { const res = await axios.get('/users'); setUsers(res.data); } catch (e) { } };

    // Notifications
    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const res = await axios.get('/users/notifications');
            setAlerts(res.data);
            setUser(prev => {
                if (!prev) return prev;
                const updated = { ...prev, notifications: res.data };
                localStorage.setItem('user', JSON.stringify(updated));
                return updated;
            });
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
    const startNotificationPoll = () => { stopNotificationPoll(); _notifInterval = setInterval(fetchNotifications, 30000); };
    const stopNotificationPoll = () => { if (_notifInterval) { clearInterval(_notifInterval); _notifInterval = null; } };

    // Heartbeat for presence
    // Heartbeat for presence (updates lastSeen in DB)
    let _hbInterval = null;
    const startHeartbeat = () => { stopHeartbeat(); axios.put('/users/heartbeat').catch(() => { }); _hbInterval = setInterval(() => { axios.put('/users/heartbeat').catch(() => { }); }, 30000); };
    const stopHeartbeat = () => { if (_hbInterval) { clearInterval(_hbInterval); _hbInterval = null; } };

    // User Presence Polling (refresh user list to see online status)
    let _userInterval = null;
    const startUserPoll = () => { stopUserPoll(); _userInterval = setInterval(fetchUsers, 10000); };
    const stopUserPoll = () => { if (_userInterval) { clearInterval(_userInterval); _userInterval = null; } };

    // Post Polling for Real-Time feed
    let _postInterval = null;
    const startPostPoll = () => { stopPostPoll(); _postInterval = setInterval(fetchPosts, 15000); };
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

        const isLiking = posts.find(p => String(p._id) === String(postId))?.likes?.includes(userId) === false;
        if (isLiking) addToast(t('ACTION_LIKED'), 'success');

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

    const handleHashtagClick = (tag) => {
        setSearchQuery(tag);
        setActiveTab('search');
        playSound('pop');
        if (navigator.vibrate) navigator.vibrate(10);
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

        const isDisliking = posts.find(p => String(p._id) === String(postId))?.dislikes?.includes(userId) === false;
        if (isDisliking) addToast(t('ACTION_DISLIKED'), 'neutral');

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

    const handleComment = async (postId, input) => {
        try {
            let res;
            if (typeof input === 'object' && (input instanceof FormData)) {
                res = await axios.post(`/posts/${postId}/comment`, input);
            } else {
                // Legacy text-only fallback (or if just text string passed)
                const text = typeof input === 'string' ? input : input.text;
                res = await axios.post(`/posts/${postId}/comment`, { text });
            }
            const updatedComments = res.data;
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updatedComments } : p));
            if (selectedPost?._id === postId) setSelectedPost(prev => ({ ...prev, comments: updatedComments }));
            addToast(t('ACTION_COMMENTED'), 'info'); playSound('pop');
        } catch (e) { console.error(e); }
    };

    const handleFollow = async (input) => {
        const targetId = input?._id || input;
        if (!targetId || !user) return;
        setFollowLoading(prev => ({ ...prev, [targetId]: true }));

        // Optimistic UI Update Logic
        // Use robust string comparison to avoid type mismatch issues (ObjectId vs String)
        const isCurrentlyFollowing = user.following?.some(id => String(id) === String(targetId));

        // Temporarily update local state to feel instant
        if (isCurrentlyFollowing) {
            updateUserState({ following: user.following.filter(id => String(id) !== String(targetId)) });
        } else {
            updateUserState({ following: [...(user.following || []), targetId] });
        }

        try {
            const res = await axios.post(`/users/${targetId}/follow`);
            const { followers, following, message } = res.data;

            setUsers(prev => prev.map(u => String(u._id) === String(targetId) ? { ...u, followers } : u));
            if (profileUser && String(profileUser._id) === String(targetId)) {
                // Determine if we just unfollowed to correctly update the button text in ProfileModal
                // The server returns the *new* list of followers for the target user.
                // We also need to ensure the local 'user' has the updated 'following' list.
                setProfileUser(prev => ({ ...prev, followers }));
            }

            // Trust the server response for the final state
            if (following) {
                updateUserState({ following });
            } else {
                fetchUsers(); // Fallback
            }

            if (message === 'Requested') addToast("ENCRYPTION REQUESTED", "success");
            playSound('pop');
        } catch (e) {
            console.error('Follow failed', e);
            // Revert state on error if needed - technically complex, but usually not needed for simple toggle
        }
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
            addToast(t('ACTION_SHARED'), 'info');
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

    const handleDeletePost = async (postId) => { try { await axios.delete(`/posts/${postId}`); setPosts(prev => prev.filter(p => p._id !== postId)); playSound('sword'); explodeEffect(); } catch (e) { } };

    const viewProfile = (u) => { setProfileUser(u); setIsProfileOpen(true); };
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.reload();
    };
    const handleOpenChat = (u) => { setChatTarget(u); setIsChatOpen(true); };
    const deleteNotifications = async () => { try { await axios.delete('/users/notifications'); setAlerts([]); const u = { ...user, notifications: [] }; setUser(u); localStorage.setItem('user', JSON.stringify(u)); } catch (e) { } };

    return (
        <div className="app-container">
            {!user ? (
                <div className="min-h-full bg-black flex items-center justify-center p-6 relative overflow-hidden">
                    <div className="liquid-bg" />
                    <div className="w-full max-w-sm glass-panel p-8 rounded-[2rem] text-center shadow-2xl shadow-[var(--gold-primary)]/5">
                        <div className="flex flex-col items-center mb-8">
                            <img src="/image/Logo.png?v=4" className="h-44 w-auto object-contain mb-2" alt="Legacy Logo" />
                        </div>
                        <div className="space-y-4">
                            {authMode === 'login' && (
                                <>
                                    <div className="relative">
                                        <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input type="email" placeholder="Agent Email" id="l-email" value={formData.email} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--gold-primary)] shadow-inner" />
                                    </div>
                                    <div className="relative">
                                        <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input type={showPassword ? "text" : "password"} placeholder="Security Key" id="l-password" value={formData.password} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white font-bold outline-none focus:border-[var(--gold-primary)] shadow-inner" />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                            {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <button disabled={authLoading} onClick={async () => {
                                        setAuthLoading(true);
                                        try {
                                            const res = await axios.post('/auth/login', { email: formData.email, password: formData.password });
                                            localStorage.setItem('user', JSON.stringify(res.data.user));
                                            localStorage.setItem('language', res.data.user.settings?.language || 'en');
                                            localStorage.setItem('themeColor', res.data.user.settings?.theme || '#ffd700');
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
                                    <div onClick={() => registerFileRef.current.click()} className="w-24 h-24 mx-auto rounded-full bg-gray-800 overflow-hidden border-2 border-dashed border-gray-600 cursor-pointer relative group hover:border-[var(--gold-primary)] mb-4 flex items-center justify-center">
                                        {registerPreview ? <img src={registerPreview} className="w-full h-full object-cover" /> : <Icons.Camera className="w-8 h-8 text-gray-400 group-hover:text-[var(--gold-primary)]" />}
                                        <input type="file" ref={registerFileRef} hidden accept="image/*" onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) setRegisterPreview(URL.createObjectURL(file));
                                        }} />
                                    </div>
                                    <div className="relative mb-3">
                                        <Icons.User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input type="text" placeholder="Codename" id="r-username" value={formData.username} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--gold-primary)] shadow-inner text-sm" />
                                    </div>
                                    <div className="relative mb-3">
                                        <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input type="email" placeholder="Agent Email" id="r-email" value={formData.email} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--gold-primary)] shadow-inner text-sm" />
                                    </div>
                                    <div className="relative mb-3">
                                        <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input type={showPassword ? "text" : "password"} placeholder="Create Key" id="r-password" value={formData.password} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-12 text-white font-bold outline-none focus:border-[var(--gold-primary)] shadow-inner text-sm" />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                            {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="relative mb-4">
                                        <textarea placeholder="Bio (Optional)" id="r-bio" value={formData.bio || ''} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm outline-none focus:border-[var(--gold-primary)] shadow-inner resize-none h-20" />
                                    </div>

                                    <div className="flex gap-2 mb-4">
                                        <select value={formData.language || 'en'} onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))} className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-xs font-bold outline-none">
                                            <option value="en">English</option>
                                            <option value="el">Greek</option>
                                            <option value="fr">French</option>
                                            <option value="de">German</option>
                                            <option value="ru">Russian</option>
                                            <option value="es">Spanish</option>
                                            <option value="tr">Turkish</option>
                                            <option value="cy">Cypriot</option>
                                        </select>
                                        <div className="flex-1 flex gap-1 justify-center items-center bg-white/5 border border-white/10 rounded-xl px-2">
                                            {['#ffd700', '#3b82f6', '#ef4444', '#10b981'].map(c => (
                                                <div key={c} onClick={() => setFormData(prev => ({ ...prev, theme: c }))} className={`w-4 h-4 rounded-full cursor-pointer border ${formData.theme === c ? 'border-white scale-125' : 'border-transparent opacity-50'}`} style={{ background: c }} />
                                            ))}
                                        </div>
                                    </div>

                                    <button disabled={authLoading} onClick={async () => {
                                        setAuthLoading(true);
                                        try {
                                            const fd = new FormData();
                                            fd.append('username', formData.username);
                                            fd.append('email', formData.email);
                                            fd.append('password', formData.password);
                                            if (formData.bio) fd.append('bio', formData.bio);
                                            fd.append('language', formData.language || 'en');
                                            fd.append('theme', formData.theme || '#ffd700');
                                            if (registerFileRef.current.files[0]) fd.append('image', registerFileRef.current.files[0]);

                                            const res = await axios.post('/auth/register', fd);
                                            // Auto-login logic from register response
                                            localStorage.setItem('token', res.data.token);
                                            localStorage.setItem('user', JSON.stringify(res.data.user));
                                            localStorage.setItem('language', res.data.user.settings?.language || formData.language || 'en');
                                            localStorage.setItem('themeColor', res.data.user.settings?.theme || formData.theme || '#ffd700');
                                            setUser(res.data.user);
                                            setAuthMode('login'); // Actually usually we just start the app, but here we set User state so the main app renders
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
                                        <input type="email" placeholder="Agent Email" id="f-email" value={formData.email} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--gold-primary)] shadow-inner" />
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
            ) : (
                <div className="h-[100dvh] bg-black text-white relative font-sans overflow-hidden flex flex-col">
                    <div className="liquid-bg" />
                    <header className="sticky top-0 z-[500] bg-black/60 backdrop-blur-2xl border-b border-white/10 shrink-0 transform-gpu translate-z-0">
                        <div className="w-full px-4 sm:px-6 py-2 sm:py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <img src="/image/Logo.png?v=4" className="h-32 sm:h-48 w-auto object-contain transition-all" alt="Logo" />
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => { setIsCreateOpen(true); playSound('sweep'); }} className="nav-center-action active:scale-95 transition-transform">
                                    <Icons.Plus className="w-6 h-6" />
                                </button>

                                <button onClick={() => setIsChatOpen(true)} className="header-icon-btn relative">
                                    <Icons.MessageCircle className="w-5 h-5" />
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black shadow-glow-red" />
                                </button>
                                <button onClick={() => setIsSettingsOpen(true)} className="header-icon-btn">
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
                                            <button onClick={deleteNotifications} className="p-3 bg-white/10 rounded-xl hover:bg-red-500/20 text-red-500 transition-all active:scale-90 border border-red-500/20">
                                                <Icons.Trash className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    {alerts.length === 0 ? <div className="text-center text-gray-500 py-10 font-bold uppercase tracking-widest text-xs">{t('NO_NOTIFS')}</div> : alerts.map((n, i) => <NotificationItem key={i} note={n} onViewProfile={viewProfile} onOpenChat={handleOpenChat} onAcceptRequest={handleAcceptRequest} onRejectRequest={handleRejectRequest} onOpenPost={(id) => { const p = posts.find(p => p._id === id); if (p) setSelectedPost(p); }} t={t} />)}
                                </div>
                            ) : (
                                <>
                                    {activeTab !== 'search' && <StoriesBar stories={stories} user={user} onAddStory={() => setIsCreateOpen(true)} onViewStory={(s) => setSelectedPost(s)} />}
                                    <div className="p-4 sm:p-8">
                                        {activeTab === 'search' && (
                                            <div className="mb-8 space-y-4 animate-fade-in">
                                                <div className="relative"><Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search usernames or #hashtags..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:border-[var(--gold-primary)] transition-all shadow-inner" /></div>
                                                <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar">{['#legacy', '#hustle', '#crypto', '#boxing'].map(t => <span key={t} onClick={() => setSearchQuery(t)} className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-400 cursor-pointer hover:text-white hover:bg-white/10 transition-colors border border-white/5">{t}</span>)}</div>
                                            </div>
                                        )}
                                        <div className="space-y-6">
                                            {activeTab === 'search' && searchQuery && (
                                                <div className="space-y-2">
                                                    {users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()) && u._id !== user._id).slice(0, 5).map(u => (
                                                        <div key={u._id} onClick={() => viewProfile(u)} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                                            <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                                                <ProfileAvatar user={u} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-bold text-white text-sm flex items-center gap-2">
                                                                    {u.username}
                                                                    {u.role === 'Founder' && <span className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider shadow-glow-red">FOUNDER</span>}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{u.followers?.length || 0} Followers</div>
                                                            </div>
                                                            <button className="px-3 py-1.5 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-colors">View</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {filteredPosts.map(p => <PostCard key={p._id} post={p} user={user} onLike={handleLike} onDislike={handleDislike} onComment={handleComment} onDelete={handleDeletePost} onViewProfile={viewProfile} onOpenDetail={setSelectedPost} onShare={handleShare} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onEditPost={(post) => { setPostToEdit(post); setIsEditOpen(true); }} onHashtagClick={handleHashtagClick} loadingActions={loadingActions} />)}
                                            {posts.length === 0 && (
                                                <div className="h-96 flex flex-col items-center justify-center space-y-4">
                                                    <div className="w-12 h-12 border-4 border-[var(--gold-primary)] border-t-transparent rounded-full animate-spin"></div>
                                                    <div className="text-[var(--gold-primary)] font-black text-sm uppercase tracking-[0.2em] animate-pulse">Decrypting Feed...</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                            <AnimatePresence>
                                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-[2000] w-full max-w-sm px-4">
                                    {toasts.map(toast => (
                                        <motion.div key={toast.id} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }} className={`
                                        flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-white/10
                                        ${toast.type === 'success' ? 'bg-green-500/20 text-green-400' : toast.type === 'neutral' ? 'bg-red-500/20 text-red-500' : 'bg-[#1a1a1a]/90 text-white'}
                                    `}>
                                            <div className={`p-1.5 rounded-full ${toast.type === 'success' ? 'bg-green-500/20' : toast.type === 'neutral' ? 'bg-red-500/20' : 'bg-white/10'}`}>
                                                <Icons.Bell className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-widest">{toast.text}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </AnimatePresence>
                        </div >
                    </main >

                    {(!isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost) && (
                        <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 flex justify-center z-[1000] pointer-events-none">
                            <div className="liquid-glass-nav h-[65px] w-full max-w-lg rounded-[2rem] px-5 flex items-center justify-between pointer-events-auto">
                                <button onClick={() => { setActiveTab('home'); playSound('pop'); if (navigator.vibrate) navigator.vibrate(10); }} className={`nav-item-btn ${activeTab === 'home' ? 'nav-item-active' : ''}`}><Icons.Home className="w-5 h-5" /></button>
                                <button onClick={() => { setActiveTab('search'); playSound('pop'); if (navigator.vibrate) navigator.vibrate(10); }} className={`nav-item-btn ${activeTab === 'search' ? 'nav-item-active' : ''}`}><Icons.Search className="w-5 h-5" /></button>

                                <button onClick={() => { setActiveTab('alerts'); playSound('pop'); if (navigator.vibrate) navigator.vibrate(10); }} className={`nav-item-btn relative ${activeTab === 'alerts' ? 'nav-item-active' : ''}`}>
                                    <Icons.Bell className={`w-5 h-5 ${user?.notifications?.some(n => !n.read) ? 'text-[var(--gold-primary)] fill-[var(--gold-primary)] animate-pulse' : ''}`} />
                                    {user?.notifications?.some(n => !n.read) && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black shadow-glow-red" />}
                                </button>

                                <button onClick={() => { logout(); playSound('sword'); }} className="nav-logout-btn"><Icons.Logout className="w-5 h-5" /></button>

                                <button onClick={() => { viewProfile(user); playSound('pop'); }} className={`p-0.5 rounded-full border-2 transition-all ${activeTab === 'profile' ? 'border-[var(--gold-primary)]' : 'border-transparent'}`}>
                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-white/5">
                                        <ProfileAvatar user={user} key={imgKey} />
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    <ChatModal isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); setChatTarget(null); }} user={user} allUsers={users} initialChatUser={chatTarget} />
                    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} logout={logout} user={user} onUpdateUser={(u) => { setUser(u); setImgKey(Date.now()); localStorage.setItem('user', JSON.stringify(u)); fetchPosts(); fetchUsers(); }} />
                    <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profileUser={profileUser} currentUser={user} posts={posts} allUsers={users} onViewProfile={viewProfile} onOpenDetail={setSelectedPost} onFollow={handleFollow} onOpenChat={handleOpenChat} followLoading={followLoading} onUpdateUser={(u) => { setUser(u); setImgKey(Date.now()); localStorage.setItem('user', JSON.stringify(u)); fetchPosts(); fetchUsers(); }} />
                    <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={() => { setIsCreateOpen(false); fetchPosts(); }} user={user} />
                    <EditPostModal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setPostToEdit(null); }} onSuccess={() => { setIsEditOpen(false); setPostToEdit(null); fetchPosts(); }} post={postToEdit} user={user} />
                    {selectedPost && <PostDetailModal post={selectedPost} user={user} allUsers={users} onClose={() => setSelectedPost(null)} onLike={handleLike} onDislike={handleDislike} onShare={handleShare} onComment={handleComment} onDelete={handleDeletePost} onEdit={(p) => { setPostToEdit(p); setIsEditOpen(true); }} onDeleteComment={handleDeleteComment} onEditComment={handleEditComment} loadingActions={loadingActions} />}

                </div >
            )}
        </div>
    );
};

export default App;
