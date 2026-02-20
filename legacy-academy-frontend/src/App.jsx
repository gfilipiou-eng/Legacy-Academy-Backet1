import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './components/Icons';
import { useTranslation } from './translations';
import { playSound, explodeEffect, cyberDeleteEffect } from './utils/sounds';
import CommentView from './CommentView';
import socket from './socket';

// --- CONFIG ---
const API_URL = axios.defaults.baseURL;
const BASE_URL = API_URL.replace('/api', '');

const GREEK_PHONETIC = {
    'a': 'α', 'b': 'β', 'c': 'ψ', 'd': 'δ', 'e': 'ε', 'f': 'φ', 'g': 'γ', 'h': 'η', 'i': 'ι', 'j': 'ξ', 'k': 'κ', 'l': 'λ', 'm': 'μ', 'n': 'ν', 'o': 'ο', 'p': 'π', 'q': 'θ', 'r': 'ρ', 's': 'σ', 't': 'τ', 'u': 'υ', 'v': 'ω', 'w': 'ς', 'x': 'χ', 'y': 'υ', 'z': 'ζ',
    'A': 'Α', 'B': 'Β', 'C': 'Ψ', 'D': 'Δ', 'E': 'Ε', 'F': 'Φ', 'G': 'Γ', 'H': 'Η', 'I': 'Ι', 'J': 'Ξ', 'K': 'Κ', 'L': 'Λ', 'M': 'Μ', 'N': 'Ν', 'O': 'Ο', 'P': 'Π', 'Q': 'Θ', 'R': 'Ρ', 'S': 'Σ', 'T': 'Τ', 'U': 'Υ', 'V': 'Ω', 'W': 'Σ', 'X': 'Χ', 'Y': 'Υ', 'Z': 'Ζ'
};

const resolveMediaUrl = (path, width = null, isAvatar = false, isPoster = false, isCover = false) => {
    if (!path) return '';
    let url = path;
    if (!path.startsWith('http') && !path.startsWith('blob:')) {
        url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    }

    // AUTO-OPTIMIZE CLOUDINARY
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
        const parts = url.split('/upload/');
        // Only inject if not already transformed
        if (!parts[1].startsWith('c_') && !parts[1].startsWith('w_') && !parts[1].startsWith('so_')) {
            const isVideo = url.includes('/video/upload/');

            if (isCover && isVideo) {
                // Aggressively strip any cached synchronous transformations to prevent 404s on large MP4s
                return url.replace(/\/upload\/.*?(v\d+\/)/i, '/upload/$1');
            }

            let transform = '';

            if (isPoster && isVideo) {
                // GENERATE POSTER IMAGE FROM VIDEO
                transform = `so_0.5,f_jpg,q_auto:best,w_1080,c_limit`;
                parts[1] = parts[1].replace(/\.(mp4|mov|webm|m4v)$/i, '.jpg');
            } else if (isAvatar && isVideo) {
                // USE ANIMATED WEBP FOR AVATARS (HIGH QUALITY)
                transform = `w_250,h_250,c_fill,so_0,eo_3,q_auto:best,f_webp,fl_animated`;
                parts[1] = parts[1].replace(/\.(mp4|mov|webm|m4v)$/i, '.webp');
            } else if (isAvatar) {
                transform = `w_300,h_300,c_fill,g_face,q_auto:best,f_auto`;
            } else if (width) {
                transform = `w_${width},c_fill,g_face,q_auto:best,${isVideo ? 'vc_auto' : 'f_auto'}`;
            } else {
                // Remove aggressive 4k transform for generic delivery to prevent ERR_CACHE_READ_FAILURE timeouts
                transform = `q_auto:best,${isVideo ? 'vc_auto' : 'f_auto'}`;
            }

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
        .liquid-glass-nav {
            background: rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(25px) saturate(180%);
            -webkit-backdrop-filter: blur(25px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8), 0 0 40px rgba(var(--gold-primary-rgb), 0.05);
        }
        @keyframes gradient-shift {
            0%, 100% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
        }
        @keyframes gradient-shift-reverse {
            0%, 100% {
                background-position: 100% 50%;
            }
            50% {
                background-position: 0% 50%;
            }
        }
        .animate-gradient-shift {
            background-size: 200% 200%;
            animation: gradient-shift 15s ease infinite;
        }
        .animate-gradient-shift-reverse {
            background-size: 200% 200%;
            animation: gradient-shift-reverse 20s ease infinite;
        }
        @keyframes heart-beat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
        }
        .animate-heart-beat {
            animation: heart-beat 0.3s ease-in-out;
        }
        
        /* --- MOBILE LANDSCAPE SOFT LOCK --- */
        @media screen and (orientation: landscape) and (max-width: 950px) {
            #root {
                display: flex !important;
                flex-direction: column;
                align-items: center;
                max-width: 480px; 
                margin: 0 auto;
                height: 100vh;
                background: #000;
                border-left: 1px solid #222;
                border-right: 1px solid #222;
            }
            body {
                background-color: #050505; /* Dark background for empty space */
            }
        }
        @keyframes ghost-pulse {
            0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 5px var(--gold-glow)); transform: scale(1); }
            50% { opacity: 1; filter: drop-shadow(0 0 15px var(--gold-glow)); transform: scale(1.05); }
        }
        .animate-ghost-pulse {
            animation: ghost-pulse 2s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);
}

// Helpers for Youtube detection/embed
// Helpers for Youtube detection/embed
const getYouTubeId = (url) => {
    if (!url) return null;
    const m = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    return m ? m[1] : null;
};
const isYouTubeUrl = (url) => !!getYouTubeId(url);
const getYouTubeEmbedUrl = (url) => {
    const id = getYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
};

const parseHashtags = (text, onClick) => text ? text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) => part.startsWith('#') ? <span key={i} onClick={(e) => { e.stopPropagation(); if (onClick) onClick(part); }} className="text-blue-400 font-medium hover:underline cursor-pointer">{part}</span> : part) : text;
const isUserOnline = (u, currentUser) => {
    // Rule: You are always online to yourself (instant feedback)
    if (currentUser && (u._id === currentUser._id || u === currentUser._id || String(u._id) === String(currentUser._id))) return true;

    if (!u || !u.lastSeen) return false;
    try {
        // Robust Threshold: 5 minutes (300,000ms) to account for clock skew/distributed systems
        return (Date.now() - new Date(u.lastSeen).getTime()) < 300000;
    } catch (e) { return false; }
};

const formatDate = (dateString, t, lang) => {
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

        const locale = (lang === 'el') ? 'el-GR' : (lang === 'de') ? 'de-DE' : 'en-US';
        return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    } catch (e) { return ''; }
};

// --- COMPONENTS ---

const CommentComposeModal = ({ isOpen, onClose, onSubmit, value, onChange, onAudioSubmit, t, loading }) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef(null);
    const [audioBlob, setAudioBlob] = useState(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorder.current.ondataavailable = e => chunks.push(e.data);
            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setIsRecording(false);
            };
            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (e) { alert("Mic required"); }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (audioBlob) {
            onAudioSubmit(audioBlob);
            setAudioBlob(null);
        } else {
            onSubmit(value);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[6000] flex items-start justify-center pointer-events-none p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" onClick={onClose} />
            <div className="relative w-full sm:max-w-[400px] bg-black/95 backdrop-blur-3xl border-b border-white/10 sm:border sm:rounded-[2.5rem] rounded-none p-6 shadow-[0_30px_100px_rgba(0,0,0,0.9)] animate-slide-down pointer-events-auto flex flex-col pt-[calc(1.5rem+env(safe-area-inset-top,20px))] sm:mt-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black italic text-white flex items-center gap-3">
                        <Icons.Terminal className="w-5 h-5 text-[var(--gold-primary)]" />
                        {t('FOUNDER_CONSOLE')} <span className="text-[var(--gold-primary)] opacity-30 select-none">///</span>
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"><Icons.X className="w-6 h-6 text-gray-500" /></button>
                </div>

                <div className="flex flex-col gap-4">
                    {audioBlob ? (
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--gold-primary)]" />
                                <span className="text-xs font-black text-[var(--gold-primary)] uppercase tracking-widest">{t('VOICE_NOTE_READY')}</span>
                            </div>
                            <button onClick={() => setAudioBlob(null)} className="p-2 hover:bg-white/5 rounded-full"><Icons.Trash className="w-5 h-5 text-red-500" /></button>
                        </div>
                    ) : isRecording ? (
                        <div className="flex items-center justify-between p-5 bg-red-500/10 border border-red-500/30 rounded-2xl animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                                <span className="text-sm font-black text-red-500 uppercase tracking-widest">{t('RECORDING')}...</span>
                            </div>
                            <button onClick={stopRecording} className="px-5 py-2 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20">{t('STOP')}</button>
                        </div>
                    ) : (
                        <div className="relative">
                            <textarea
                                autoFocus
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                placeholder={t('WRITE_COMMENT')}
                                className="w-full h-32 bg-white/[0.04] border border-white/10 rounded-2xl p-5 text-base text-white font-medium resize-none focus:border-[var(--gold-primary)] outline-none placeholder-gray-600 shadow-inner transition-all"
                            />
                            <div className="absolute bottom-3 right-3 text-[10px] font-black text-gray-700 uppercase tracking-widest">{value.length} / 500</div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                        {!audioBlob && !isRecording && (
                            <button
                                type="button"
                                onClick={startRecording}
                                className="p-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-[var(--gold-primary)] hover:border-[var(--gold-primary)] transition-all active:scale-95 shadow-xl group"
                            >
                                <Icons.Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={(audioBlob ? false : !value.trim()) || loading}
                            className="flex-1 py-4 bg-[var(--gold-primary)] text-black font-black text-xs uppercase tracking-[0.15em] rounded-2xl shadow-glow-gold active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 hover:brightness-110"
                        >
                            {loading ? <div className="w-5 h-5 border-3 border-black/30 border-t-black rounded-full animate-spin" /> : <Icons.Send className="w-5 h-5" />}
                            {t('SEND_COMMENT')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DefaultAvatar = ({ name, size = "normal" }) => {
    const COLORS = [
        'from-red-500 to-orange-600', 'from-blue-500 to-cyan-600', 'from-emerald-500 to-green-600',
        'from-violet-500 to-purple-600', 'from-[var(--gold-primary)] to-[var(--gold-secondary)]', 'from-rose-500 to-pink-600',
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
    const [imgError, setImgError] = useState(false);

    if (!user) return <DefaultAvatar size={size} />;

    const url = user.profilePic || user.fromProfilePic;
    const name = user.username || user.fromUsername;

    // Reset error state if url changes (basic check)
    useEffect(() => { setImgError(false); }, [url]);

    const rawIsVideo = url && (url.match(/\.(mp4|mov|webm)($|\?)/i) || url.includes('/video/upload/'));
    const mediaUrl = url ? (rawIsVideo ? resolveMediaUrl(url, 250, false) : resolveMediaUrl(url, 150, true)) : null;
    const isVideo = rawIsVideo && mediaUrl;

    if (imgError) return <DefaultAvatar name={name} size={size} />;

    if (isVideo) {
        return (
            <div className={`w-full h-full bg-gray-900 ${className || ''}`} onClick={onClick}>
                <div className="w-full h-full relative overflow-hidden rounded-xl bg-black">
                    <video
                        src={mediaUrl}
                        className="w-full h-full object-cover pointer-events-none"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        disableRemotePlayback
                        onError={() => setImgError(true)}
                        onLoadedMetadata={(e) => { e.target.currentTime = 0.1; }}
                    />
                </div>
            </div>
        );
    }

    return mediaUrl ? (
        <img
            src={mediaUrl}
            className={`w-full h-full object-cover ${className || ''}`}
            onClick={onClick}
            loading="lazy"
            decoding="async"
            alt=""
            onError={() => setImgError(true)}
        />
    ) : (
        <DefaultAvatar name={name} size={size} />
    );
};

const FounderBadge = ({ className = "w-5 h-5" }) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <Icons.Crown className="w-full h-full" style={{ color: '#FFD700', stroke: '#FFD700' }} />
    </div>
);

const VerifiedBadge = ({ isFounder, className = "w-4 h-4" }) => {
    const color = isFounder ? "#FFD700" : "#1D9BF0";

    return (
        <svg viewBox="0 0 22 22" className={`${className} shrink-0`} style={{ overflow: 'visible' }}>
            <path
                fill={color}
                stroke="none"
                style={{ fill: color, stroke: 'none' }}
                d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
            />
        </svg>
    );
};

const CommentItem = memo(({ comment, post, user, allUsers, onEdit, onDelete, t = (k) => k, lang }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);

    const currentCommentAuthorId = comment.authorId || comment.user?._id || comment.userId;
    const isCommentAuthor = String(currentCommentAuthorId) === String(user?._id);
    const postAuthorId = post.author?._id || post.author;
    const isPostAuthor = String(postAuthorId) === String(user?._id);

    // Improved role detection handling string vs object IDs and denormalized data
    const foundUserInList = allUsers?.find(u => String(u._id) === String(currentCommentAuthorId));
    const isFounder = (user?.role === 'Founder' || comment.user?.role === 'Founder' || foundUserInList?.role === 'Founder');

    const canEdit = isCommentAuthor || user?.role === 'Founder';
    const canDelete = isCommentAuthor || user?.role === 'Founder'; // Only own or Founder can delete

    const handleSave = () => {
        if (typeof onEdit === 'function') onEdit(post._id, comment._id, editText);
        setIsEditing(false);
    };

    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -10 }} className={`flex gap-3 items-start relative mb-5 ${isCommentAuthor ? 'flex-row-reverse' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden shrink-0 border border-white/5 shadow-xl">
                <ProfileAvatar user={isCommentAuthor ? user : (comment.user || { username: comment.authorName, profilePic: comment.authorProfilePic })} />
            </div>

            <div className={`flex-1 min-w-0 flex flex-col ${isCommentAuthor ? 'items-end' : 'items-start'}`}>
                <div className={`relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl border backdrop-blur-3xl transition-all duration-300 ${isCommentAuthor ? 'bg-[var(--gold-primary)]/20 border-[var(--gold-primary)]/30 rounded-tr-none' : 'bg-white/[0.04] border-white/10 rounded-tl-none hover:bg-white/[0.07] hover:border-white/20'}`}>
                    <div className="flex items-center gap-3 mb-1 justify-between flex-wrap overflow-hidden min-w-[140px]">
                        <div className="flex items-center gap-1">
                            <span className={`font-black text-[9px] uppercase tracking-[0.15em] truncate ${isCommentAuthor ? 'text-[var(--gold-primary)]' : 'text-gray-400'}`}>
                                {isCommentAuthor ? (user?.username || 'User') : (comment.user?.username || comment.authorName || 'User')}
                            </span>
                            <VerifiedBadge isFounder={isFounder} className="w-3.5 h-3.5" />
                        </div>
                        {isFounder && (
                            <div className="flex items-center gap-1.5 mt-1 bg-gradient-to-r from-[var(--gold-primary)]/20 to-[var(--gold-primary)]/5 px-2.5 py-1 rounded-lg border border-[var(--gold-primary)]/40 group/badge">
                                <FounderBadge className="w-4 h-4" />
                                <span className="text-[10px] text-[var(--gold-primary)] uppercase font-black tracking-widest">{t('FOUNDER_BADGE', 'LEGACY FOUNDER')}</span>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="mt-1 min-w-[200px]">
                            <textarea autoFocus value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none mb-2 focus:border-[var(--gold-primary)]/50 min-h-[60px] resize-none" />
                            <div className="flex gap-2">
                                <button onClick={handleSave} className="bg-[var(--gold-primary)] px-3 py-1 rounded-lg text-[9px] font-black text-black hover:opacity-90 transition-colors uppercase">{t('SAVE')}</button>
                                <button onClick={() => setIsEditing(false)} className="bg-white/5 px-3 py-1 rounded-lg text-[9px] font-black text-gray-400 hover:bg-white/10 transition-colors uppercase">{t('CANCEL')}</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {comment.text && <span className="text-[14px] text-white/95 leading-relaxed font-medium whitespace-pre-wrap break-words overflow-wrap-anywhere">{comment.text}</span>}
                            {comment.audioUrl && (
                                <div className="flex flex-col gap-1.5 mt-1">
                                    <div className="flex items-center gap-1.5 text-[8px] font-black text-[var(--gold-primary)] uppercase tracking-widest bg-[var(--gold-primary)]/10 w-fit px-2 py-0.5 rounded border border-[var(--gold-primary)]/20">
                                        <div className="w-1 h-1 rounded-full bg-[var(--gold-primary)] animate-pulse" /> {t('VOICE_NOTE')}
                                    </div>
                                    <audio controls src={resolveMediaUrl(comment.audioUrl)} className="w-full h-8 opacity-90 max-w-[220px]" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mt-2 px-1 items-center">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">{formatDate(comment.createdAt, t, lang)}</span>
                    {canEdit && !isEditing && (
                        <button type="button" onClick={() => setIsEditing(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-[9px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all active:scale-95" title={t('EDIT')}>
                            <Icons.Edit className="w-3 h-3" /> <span className="hidden sm:inline">{t('EDIT')}</span>
                        </button>
                    )}
                    {canDelete && (
                        <button type="button" onClick={() => onDelete?.(post._id, comment._id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-[9px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(220,38,38,0.5)] hover:shadow-[0_0_15px_rgba(220,38,38,0.8)] transition-all active:scale-95" title={t('DELETE')}>
                            <Icons.Trash className="w-3 h-3" /> <span className="hidden sm:inline">{t('DELETE')}</span>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

const PostDetailModal = ({ post, user, allUsers, onClose, onLike, onDislike, onOpenChat, onComment, onDelete, onEdit, onDeleteComment, onEditComment, onShare, loadingActions, onClearComments }) => {
    const { t, lang } = useTranslation(user);

    // Audio Comment State
    const [commentText, setCommentText] = useState('');
    const [isWritingComment, setIsWritingComment] = useState(false);
    const audioRef = useRef(null);
    const [commentAudio, setCommentAudio] = useState(null);
    const [isRecordingComment, setIsRecordingComment] = useState(false);
    const commentRecorderRef = useRef(null);
    const commentStreamRef = useRef(null);
    const discardRef = useRef(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [imgError, setImgError] = useState(false); // Handle detail image error

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

    const toggleCommentRecording = () => {
        if (isRecordingComment) {
            stopRecording();
        } else {
            startCommentRecording();
        }
    };

    // Late return to protect hook order
    if (!post) return null;

    // Resolve author object if it's just an ID or missing details
    const author = (post.author && typeof post.author === 'object' && post.author.username)
        ? post.author
        : (allUsers?.find(u => String(u._id) === String(post.author?._id || post.author)) || { username: 'Unknown', _id: post.author });

    const isOwner = String(author?._id) === String(user?._id);
    const isFounder = user?.role === 'Founder';

    const handleClearComments = async () => {
        if (!window.confirm(t('CONFIRM_DELETE_ALL_COMMENTS') || "DELETE ALL COMMENTS?")) return;
        try {
            const url = `/posts/${post._id}/comments`;
            console.log(`📡 [DEBUG] Clearing comments: ${url}`);
            await axios.delete(url);
            // Optimistically clear
            post.comments = [];
            if (onClearComments) onClearComments(post._id);
        } catch (e) {
            console.error("Failed to clear comments", e);
            alert("Failed to clear comments.");
        }
    };

    return (

        <div className="fixed inset-0 z-[1200] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-start md:justify-center p-0 md:p-4 overflow-hidden transition-all duration-300">
            <button onClick={onClose} className="fixed top-4 right-4 p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 z-[1500] shadow-2xl active:scale-90 transition-all group">
                <Icons.X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
            </button>
            <div className="w-full max-w-6xl h-[100dvh] md:h-[90vh] bg-[#0a0a0a] rounded-none md:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row border-none md:border md:border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] shrink-0 my-auto transform-gpu relative">
                {/* Image Section - Balanced for mobile to show full videos/photos */}
                <div className="w-full md:flex-1 bg-black flex items-center justify-center relative shadow-inner overflow-hidden h-[50vh] md:h-full shrink-0">
                    {(post.image || post.videoUrl || post.thumbnailUrl) ? (
                        isYouTubeUrl(post.videoUrl || post.thumbnailUrl || post.image || '') ? (
                            <NeuralVideoPlayer
                                src={post.videoUrl || post.thumbnailUrl || post.image}
                                className="w-full h-full"
                                forcePause={isWritingComment}
                            />
                        ) : (post.videoUrl || (post.image && post.image.match(/\.(mp4|mov|webm)$/i))) ? (
                            <NeuralVideoPlayer
                                src={resolveMediaUrl(post.videoUrl || post.image)}
                                poster={resolveMediaUrl(post.thumbnailUrl || post.videoUrl || post.image, null, false, true)}
                                className="w-full h-full"
                                forcePause={isWritingComment}
                            />
                        ) : (
                            !imgError ? (
                                <img
                                    src={resolveMediaUrl(post.image || post.thumbnailUrl)}
                                    className="max-w-full max-h-full object-contain"
                                    decoding="async"
                                    onError={() => {
                                        setImgError(true);
                                        // Auto-cleanup broken link
                                        const isOwner = String(post.author?._id || post.author) === String(user?._id);
                                        const canDelete = isOwner || user?.role === 'Founder';
                                        if (canDelete && post.image) { axios.put(`/posts/${post._id}`, { image: "" }).catch(() => { }); }
                                    }}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center p-10 text-gray-500">
                                    <Icons.Image className="w-16 h-16 opacity-20 mb-4" />
                                    <span className="text-xs font-black uppercase tracking-widest opacity-50">Image unavailable</span>
                                </div>
                            )
                        )
                    ) : <div className="p-10 text-center font-black text-2xl text-white italic bg-gradient-to-br from-[var(--gold-primary)]/20 to-black w-full h-full flex items-center justify-center uppercase tracking-tighter">{post.desc}</div>}

                </div>

                {/* Info Section - Fixed height or scrolling */}
                <div className="w-full md:w-[450px] flex flex-col bg-[#050505] border-l border-white/5 flex-1 min-h-0 md:h-full overflow-hidden relative">
                    <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-xl shrink-0 relative z-50">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gray-800 overflow-hidden border-2 border-white/10 shadow-xl">
                                <ProfileAvatar user={author} />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white leading-none">{author?.username}</span>
                                    <VerifiedBadge isFounder={author?.role === 'Founder'} className="w-4 h-4" />
                                </div>
                                {author?.role === 'Founder' ? (
                                    <div className="flex items-center gap-1.5 mt-1 bg-gradient-to-r from-[var(--gold-primary)]/20 to-[var(--gold-primary)]/5 px-2.5 py-1 rounded-lg border border-[var(--gold-primary)]/40">
                                        <FounderBadge className="w-5 h-5" />
                                        <span className="text-[10px] text-[var(--gold-primary)] uppercase font-black tracking-widest">{t('FOUNDER_BADGE', 'LEGACY FOUNDER')}</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">{t('MEMBER_BADGE')}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-1 relative">
                            <div className="relative">
                                <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); playSound('cyber_click'); }} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-90 shrink-0">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                        <circle cx="12" cy="12" r="1" />
                                        <circle cx="12" cy="5" r="1" />
                                        <circle cx="12" cy="19" r="1" />
                                    </svg>
                                </button>
                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col gap-1 p-1">
                                            <button onClick={(e) => { e.stopPropagation(); onShare(post); setShowMenu(false); }} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors w-full text-left">
                                                <Icons.Share className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-bold text-gray-200">{t('SHARE')}</span>
                                            </button>
                                            {isOwner && (
                                                <button onClick={(e) => { e.stopPropagation(); onEdit(post); setShowMenu(false); }} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors w-full text-left">
                                                    <Icons.Edit className="w-4 h-4 text-blue-400" />
                                                    <span className="text-xs font-bold text-blue-400">{t('EDIT')}</span>
                                                </button>
                                            )}
                                            {(isOwner || isFounder) && (
                                                <button onClick={(e) => { e.stopPropagation(); onDelete(post._id); onClose(); setShowMenu(false); playSound('cyber_delete'); }} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors w-full text-left">
                                                    <Icons.Trash className="w-4 h-4 text-red-500" />
                                                    <span className="text-xs font-bold text-red-500">{t('DELETE')}</span>
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-black/30 overscroll-contain">
                        {/* Description Section */}
                        <div className="px-4 sm:px-6 py-6 bg-gradient-to-br from-black via-[#0a0a0a] to-black border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-10 relative">
                            <div className="text-[15px] text-white border-l-4 border-[var(--gold-primary)] pl-5 py-2 font-bold leading-relaxed w-full text-left drop-shadow-2xl">
                                {parseHashtags(post.desc && post.desc.length > 500 && !isExpanded ? post.desc.slice(0, 500) + '...' : post.desc)}
                                {post.desc && post.desc.length > 500 && (
                                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-[var(--gold-primary)] text-[10px] font-black uppercase tracking-widest ml-2 hover:underline">
                                        {isExpanded ? t('READ_LESS') : t('READ_MORE')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="p-3">
                            <div className="w-full animate-fade-in space-y-4">
                                {!post.comments?.length ? (
                                    <p className="text-gray-600 text-[10px] uppercase font-bold py-2 text-center tracking-widest">{t('NO_COMMENTS') || "NO COMMENTS YET"}</p>
                                ) : (
                                    post.comments.slice().reverse().slice(0, 50).reverse().map((c, idx) => (
                                        <CommentItem
                                            key={c._id || idx}
                                            comment={c}
                                            post={post}
                                            user={user}
                                            allUsers={allUsers}
                                            onEdit={onEditComment}
                                            onDelete={onDeleteComment}
                                            t={t}
                                            lang={lang}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>


                    <div className="px-3 py-2 border-t border-white/10 bg-black/95 backdrop-blur-xl z-[100] pb-[75px] md:pb-2 shrink-0">
                        <div className="flex items-center gap-6 sm:gap-8">
                            <button
                                type="button"
                                disabled={loadingActions?.[post._id]}
                                onClick={() => onLike(post._id)}
                                className={`flex items-center gap-2.5 group transition-all cursor-pointer active:scale-125 ${(Array.isArray(post.likes) && post.likes.includes(user?._id)) ? 'text-pink-500' : 'text-gray-500'}`}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className={`w-5 h-5 pointer-events-none ${(Array.isArray(post.likes) && post.likes.includes(user?._id)) ? 'fill-current animate-heart-beat' : ''}`}>
                                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 0 0-7.7 7.8l1.1 1 7.7 7.8 7.7-7.8 1.1-1a5.5 5.5 0 0 0 0-7.8z"></path>
                                </svg>
                                <span className="text-[12px] font-bold transition-colors">{post.likes?.length || 0}</span>
                            </button>

                            <button
                                type="button"
                                disabled={loadingActions?.[post._id]}
                                onClick={() => onDislike(post._id)}
                                className={`flex items-center gap-2.5 group transition-all cursor-pointer active:scale-125 ${(Array.isArray(post.dislikes) && post.dislikes.includes(user?._id)) ? 'text-[var(--gold-primary)]' : 'text-gray-500 hover:text-[var(--gold-primary)]'}`}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={`w-5 h-5 pointer-events-none transition-all ${(Array.isArray(post.dislikes) && post.dislikes.includes(user?._id)) ? 'fill-current scale-110' : 'group-hover:scale-110'}`}>
                                    <path d="M17 14V2"></path>
                                    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"></path>
                                </svg>
                                <span className="text-[12px] font-bold transition-colors">{post.dislikes?.length || 0}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => { document.getElementById(`comment-input-${post._id}`)?.focus(); }}
                                className="flex items-center gap-2.5 group transition-all cursor-pointer active:scale-125 p-1 rounded-xl"
                            >
                                <Icons.MessageSquare className="w-5 h-5 text-gray-500 group-hover:text-sky-400 transition-colors" />
                                <span className="text-[12px] font-bold text-gray-500 group-hover:text-sky-400 transition-colors">{post.comments?.length || 0}</span>
                            </button>

                        </div>

                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gray-800 overflow-hidden shrink-0 ring-1 ring-white/10">
                                <ProfileAvatar user={user} />
                            </div>
                            {isRecordingComment ? (
                                <div className="flex-1 min-w-0 bg-red-500/10 border border-red-500/30 rounded-2xl p-2 sm:p-3 flex items-center justify-between animate-pop-in">
                                    <div className="flex items-center gap-2 pl-1 shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t('TRANSMITTING')}</span>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); stopRecording(true); }} className="p-2 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-all"><Icons.X className="w-4 h-4" /></button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); stopRecording(false); }} className="px-4 py-2 bg-red-500 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-900/40 active:scale-95 transition-all">{t('STOP')}</button>
                                    </div>
                                </div>
                            ) : commentAudio ? (
                                <div className="flex-1 min-w-0 flex items-center justify-between gap-2 min-h-[52px] px-2 bg-black/60 border border-[var(--gold-primary)]/40 rounded-2xl p-1 animate-pulse-subtle">
                                    <div className="flex items-center gap-3 pl-2 shrink-0">
                                        <div className="w-2 h-2 rounded-full bg-[var(--gold-primary)] animate-pulse shadow-[0_0_10px_var(--gold-glow)]" />
                                        <span className="text-[10px] font-black text-[var(--gold-primary)] uppercase tracking-widest">{t('VOICE_NOTE_READY')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setCommentAudio(null); }} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-colors"><Icons.Trash className="w-4 h-4" /></button>
                                        <button type="button" onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const fd = new FormData();
                                            fd.append('file', commentAudio, 'voice.webm');
                                            if (commentText.trim()) fd.append('text', commentText.trim());
                                            onComment(post._id, fd);
                                            setCommentAudio(null);
                                            setCommentText('');
                                        }} className="w-10 h-10 flex items-center justify-center bg-[var(--gold-primary)] hover:opacity-90 rounded-xl text-black shadow-lg shadow-[var(--gold-primary)]/30 active:scale-95 transition-all">
                                            <Icons.Send className="w-4 h-4 fill-black" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 min-w-0">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (commentText.trim()) {
                                                onComment(post._id, commentText);
                                                setCommentText('');
                                            }
                                        }}
                                        className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl px-1 py-1 group focus-within:border-[var(--gold-primary)]/40 focus-within:bg-white/10 transition-all duration-300"
                                    >
                                        <input
                                            id={`comment-input-${post._id}`}
                                            placeholder={t('FOUNDER_PLACEHOLDER')}
                                            value={commentText}
                                            onChange={(e) => { e.stopPropagation(); setCommentText(e.target.value); }}
                                            className="flex-1 min-w-0 bg-transparent py-3 px-4 text-[14px] text-white outline-none placeholder-gray-600 font-bold"
                                        />
                                        <div className="flex gap-1.5 pr-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); toggleCommentRecording(); }}
                                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${isRecordingComment ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 hover:bg-white/10 text-gray-500 hover:text-[var(--gold-primary)]'}`}
                                            >
                                                <Icons.Mic className="w-5 h-5" />
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!commentText.trim() || loadingActions?.[post._id]}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--gold-primary)] text-black shadow-lg shadow-glow-gold/40 disabled:opacity-20 active:scale-95 transition-all"
                                            >
                                                {loadingActions?.[post._id] ? (
                                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                ) : (
                                                    <Icons.Send className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NeuralVideoPlayer = memo(({ src, poster, className, onExpand, forcePause }) => {
    const videoRef = useRef(null);
    const seekRef = useRef(null);
    const ytPlayerRef = useRef(null);
    const ytIdRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isActivated, setIsActivated] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);
    const playerUniqueId = useMemo(() => `yt-${Math.random().toString(36).substr(2, 9)}`, []);

    const ytId = getYouTubeId(src);

    // Initialize YouTube API once
    useEffect(() => {
        if (!ytId) return;
        if (!window._yt_api_loading) {
            window._yt_api_loading = true;
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }, [ytId]);

    const onYTReady = (event) => {
        ytPlayerRef.current = event.target;
        if (isMuted) event.target.mute();
        setDuration(event.target.getDuration());
    };

    const onYTStateChange = (event) => {
        if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            setIsActivated(true);
            // Slight delay to allow first frame to render before hiding poster
            setTimeout(() => setIsActuallyPlaying(true), 300);
        } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
        }
    };

    useEffect(() => {
        let interval;
        if (isPlaying && ytPlayerRef.current) {
            interval = setInterval(() => {
                try {
                    const cur = ytPlayerRef.current.getCurrentTime();
                    const dur = ytPlayerRef.current.getDuration();
                    if (cur && dur) {
                        setCurrentTime(cur);
                        setProgress((cur / dur) * 100);
                    }
                } catch (e) { }
            }, 500);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    useEffect(() => {
        if (forcePause) {
            if (ytPlayerRef.current && ytPlayerRef.current.pauseVideo) ytPlayerRef.current.pauseVideo();
            if (videoRef.current) videoRef.current.pause();
            setIsPlaying(false);
            setIsActuallyPlaying(false);
        }
    }, [forcePause]);

    const togglePlay = (e) => {
        if (e) e.stopPropagation();
        if (ytId) {
            if (!isActivated) setIsActivated(true);
            if (!ytPlayerRef.current) {
                // Not ready yet, just wait or re-init
                return;
            }
            if (isPlaying) {
                ytPlayerRef.current.pauseVideo();
            } else {
                ytPlayerRef.current.playVideo();
            }
            playSound('cyber_click');
            return;
        }

        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
            playSound('cyber_scroll');
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
            playSound('cyber_click');
        }
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        const nextMute = !isMuted;
        setIsMuted(nextMute);

        if (ytId && ytPlayerRef.current) {
            if (nextMute) ytPlayerRef.current.mute();
            else ytPlayerRef.current.unMute();
        } else if (videoRef.current) {
            videoRef.current.muted = nextMute;
        }
        playSound('cyber_click');
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current || isDragging) return;
        const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(p);
        setCurrentTime(videoRef.current.currentTime);
        setDuration(videoRef.current.duration);
    };

    const handleSeek = (e) => {
        if (!seekRef.current) return;
        const rect = seekRef.current.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

        if (ytId && ytPlayerRef.current && ytPlayerRef.current.seekTo) {
            const goTo = pos * ytPlayerRef.current.getDuration();
            ytPlayerRef.current.seekTo(goTo, true);
            setProgress(pos * 100);
            setCurrentTime(goTo);
        } else if (videoRef.current) {
            videoRef.current.currentTime = pos * videoRef.current.duration;
            setProgress(pos * 100);
        }
    };

    useEffect(() => {
        const handleMove = (e) => { if (isDragging) handleSeek(e); };
        const handleEnd = () => setIsDragging(false);
        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('touchend', handleEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging]);

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMouseDown = (e) => {
        e.stopPropagation();
        setIsDragging(true);
        handleSeek(e);
    };

    // Initialize YouTube Player with unique ID
    useEffect(() => {
        if (isActivated && ytId && !ytPlayerRef.current) {
            const initPlayer = () => {
                if (window.YT && window.YT.Player) {
                    new window.YT.Player(playerUniqueId, {
                        videoId: ytId,
                        playerVars: {
                            autoplay: 1,
                            controls: 0,
                            modestbranding: 1,
                            rel: 0,
                            iv_load_policy: 3,
                            disablekb: 1,
                            fs: 0,
                            playsinline: 1,
                            widget_referrer: window.location.origin
                        },
                        events: {
                            onReady: onYTReady,
                            onStateChange: onYTStateChange
                        }
                    });
                } else {
                    setTimeout(initPlayer, 100);
                }
            };
            initPlayer();
        }
    }, [isActivated, ytId, playerUniqueId]);

    const youtubeThumb = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;

    return (
        <div
            className={`relative group/video overflow-hidden bg-black flex items-center justify-center pointer-events-auto ${className || ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
                const selection = window.getSelection();
                if (selection.toString().length > 0) return;
                togglePlay(e);
            }}
        >
            {/* YOUTUBE ENGINE LAYER - DEEP STEALTH MASKING */}
            {ytId && isActivated && (
                <div className={`w-full h-full absolute inset-0 pointer-events-none transform-gpu transition-opacity duration-1000 overflow-hidden bg-black ${isActuallyPlaying ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Ghost Layer - Precision masking (115% zoom instead of 170%) to avoid cutting content */}
                    <div className="absolute top-[-7.5%] left-[-7.5%] w-[115%] h-[115%] pointer-events-none select-none transform-gpu backface-hidden">
                        <div id={playerUniqueId} className="w-full h-full pointer-events-none shadow-[0_0_100px_black_inset]" />
                    </div>
                </div>
            )}

            {/* NEUTRAL POSTER LAYER (Keeps visual consistency until confirmed play) */}
            {(!isActuallyPlaying || !ytId) && (
                <div className={`${ytId ? 'absolute inset-0' : 'relative w-full'} z-10 will-change-transform transform-gpu`}>
                    {ytId ? (
                        <div className="w-full h-full relative bg-[#050505]">
                            <img
                                src={youtubeThumb}
                                className="w-full h-full object-cover opacity-60 transform-gpu"
                                onError={(e) => e.target.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                            />
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            src={src}
                            poster={poster}
                            muted={isMuted}
                            playsInline
                            loop
                            onTimeUpdate={handleTimeUpdate}
                            onPlay={() => { setIsPlaying(true); if (videoRef.current) setDuration(videoRef.current.duration); }}
                            onPause={() => setIsPlaying(false)}
                            className="w-full h-auto object-contain cursor-pointer max-h-[75vh] md:max-h-[85vh] transition-transform duration-500 will-change-transform transform-gpu"
                        />
                    )}
                </div>
            )}

            {/* NEURAL OVERLAY - ALWAYS VISIBLE OVER EVERYTHING */}
            <AnimatePresence>
                {(isHovered || !isPlaying || isDragging) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/30 flex flex-col justify-between p-4 pointer-events-none z-20"
                    >
                        <div className="flex flex-col items-start gap-4">
                            <div className="flex justify-start items-start gap-2.5">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleMute(e); }}
                                    className="p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white pointer-events-auto hover:bg-[var(--gold-primary)]/20 hover:border-[var(--gold-primary)]/40 transition-all active:scale-90 group/btn shadow-xl"
                                >
                                    {isMuted ? <Icons.VolumeX className="w-5 h-5 group-hover/btn:scale-110 transition-transform" /> : <Icons.Volume2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />}
                                </button>
                                {onExpand && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onExpand(); playSound('cyber_click'); }}
                                        className="p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white pointer-events-auto hover:bg-[var(--gold-primary)]/20 hover:border-[var(--gold-primary)]/40 transition-all active:scale-90 group/btn shadow-xl"
                                    >
                                        <Icons.Maximize className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-16 h-16 rounded-full bg-[var(--gold-primary)]/90 flex items-center justify-center text-black shadow-2xl shadow-[var(--gold-primary)]/40 pointer-events-none"
                            >
                                {isPlaying ? <Icons.Pause className="w-8 h-8 fill-black" /> : <Icons.Play className="w-8 h-8 fill-black ml-1" />}
                            </motion.div>
                        </div>

                        <div className="space-y-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between text-[10px] font-black text-white/70 uppercase tracking-widest px-1">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                            <div
                                ref={seekRef}
                                className="w-full h-2 bg-white/10 rounded-full cursor-pointer relative group/seek"
                                onMouseDown={handleMouseDown}
                                onTouchStart={handleMouseDown}
                            >
                                <div className="absolute inset-x-0 -inset-y-2 group-hover/seek:bg-white/5 transition-colors rounded-full" />
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-[var(--gold-primary)] shadow-[0_0_15px_var(--gold-glow)] rounded-full"
                                    style={{ width: `${progress}%` }}
                                    transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                                />
                                <motion.div
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-2xl border-2 border-[var(--gold-primary)] scale-0 group-hover/seek:scale-100 transition-transform hidden sm:block"
                                    style={{ left: `${progress}%`, marginLeft: '-8px' }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
});

// Notification item component for Alerts tab
const NotificationItem = memo(({ note, onViewProfile, onOpenPost, onOpenChat, onAcceptRequest, onRejectRequest, t, lang }) => {
    const handleClick = () => {
        if (note.type === 'message') onOpenChat(note.sender);
        else if (note.type === 'follow_request') onViewProfile(note.sender);
        else if (note.post || note.postId) onOpenPost(note.post || note.postId);
        else onViewProfile(note.sender);
        playSound('pop');
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-all cursor-pointer border-b border-white/5 group"
            onClick={handleClick}
        >
            <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gray-800 overflow-hidden border-2 border-white/10 group-hover:border-[var(--gold-primary)]/50 transition-all shadow-lg">
                    <ProfileAvatar user={{ username: note.fromUsername, profilePic: note.fromProfilePic }} />
                </div>
                {note.type === 'like' && <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1 border-2 border-black"><Icons.Heart className="w-3 h-3 text-white fill-current" /></div>}
                {note.type === 'comment' && <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-black"><Icons.MessageSquare className="w-3 h-3 text-white fill-current" /></div>}
                {note.type === 'message' && <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-black"><Icons.Mail className="w-3 h-3 text-white" /></div>}
                {note.type === 'follow' && <div className="absolute -bottom-1 -right-1 bg-[var(--gold-primary)] rounded-full p-1 border-2 border-black"><Icons.UserPlus className="w-3 h-3 text-black" /></div>}
                {note.type === 'follow_request' && <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1 border-2 border-black"><Icons.Shield className="w-3 h-3 text-white" /></div>}
            </div>
            <div className="flex-1">
                <div className="text-sm flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-white group-hover:text-[var(--gold-primary)] transition-colors uppercase tracking-tight">{note.fromUsername}</span>
                    <VerifiedBadge isFounder={note.sender?.role === 'Founder'} className="w-3.5 h-3.5 ml-1" />
                    <span className="text-gray-500 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold">
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
                    <div className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">{formatDate(note.createdAt, t, lang)}</div>
                    {!note.read && <div className="w-1.5 h-1.5 bg-[var(--gold-primary)] rounded-full shadow-glow-yellow" />}
                </div>

                {note.type === 'follow_request' && (
                    <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => onAcceptRequest(note.sender?._id || note.from, note._id)} className="flex-1 py-1.5 bg-[var(--gold-primary)] text-black text-[10px] font-black rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-glow-gold/40 uppercase tracking-widest">{t('ACCEPT')}</button>
                        <button onClick={() => onRejectRequest(note.sender?._id || note.from, note._id)} className="flex-1 py-1.5 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-all uppercase tracking-widest">{t('REJECT')}</button>
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
});

const StoriesBar = ({ stories, user, onAddStory, onViewStory, imgKey }) => {
    const { t } = useTranslation(user);
    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-2 sm:px-4 border-b border-white/5 bg-black/40">
            {/* CURRENT USER ADD STORY */}
            <div onClick={onAddStory} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                <div className={`w-16 h-16 rounded-2xl p-[2px] ${stories?.some(s => String(s.author?._id || s.author) === String(user?._id)) ? 'bg-gradient-to-tr from-[var(--gold-primary)] to-red-600' : 'bg-white/10 group hover:bg-[var(--gold-primary)]'} transition-colors`}>
                    <div className="w-full h-full rounded-2xl border-2 border-black overflow-hidden bg-gray-900 relative">
                        <ProfileAvatar user={user} className="opacity-80" key={imgKey} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Icons.Plus className="w-6 h-6 text-white drop-shadow-lg" />
                        </div>
                    </div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{t('ADD_STORY')}</span>
            </div>

            {stories && stories.map((s, i) => {
                const isYT = isYouTubeUrl(s.videoUrl);
                const isNativeVideo = (!isYT) && ((s.videoUrl && s.videoUrl.match(/\.(mp4|mov|webm|avi|m4v)$/i)) || (s.image && s.image.match(/\.(mp4|mov|webm|avi|m4v)$/i)));
                const hasMedia = s.image || s.videoUrl || s.thumbnailUrl;
                let ytThumb = null;
                if (isYT) {
                    const m = /^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i.exec(s.videoUrl || '');
                    if (m) ytThumb = `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
                }

                return (
                    <div key={s._id || i} onClick={() => onViewStory(s)} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                        <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[var(--gold-primary)] to-red-600">
                            <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-gray-900 shadow-xl relative">
                                {hasMedia ? (
                                    isNativeVideo ? (
                                        <video
                                            src={resolveMediaUrl(s.videoUrl || s.image)}
                                            className="w-full h-full object-cover pointer-events-none"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            preload="auto"
                                            onLoadedMetadata={(e) => { e.target.currentTime = 0.1; }}
                                        />
                                    ) : isYT ? (
                                        <div className="w-full h-full relative">
                                            <img src={ytThumb || resolveMediaUrl(s.thumbnailUrl || s.image)} className="w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-6 h-6 rounded-full bg-red-600/90 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.8)]">
                                                    <Icons.Play className="w-3.5 h-3.5 text-white -ml-0.5" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img src={resolveMediaUrl(s.image)} className="w-full h-full object-cover" alt="" />
                                    )
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center p-1">
                                        <span className="text-[6px] text-gray-300 font-medium text-center leading-tight line-clamp-3">
                                            {s.desc}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide max-w-[60px] truncate">{s.author?.username}</span>
                    </div>
                );
            })}
        </div>
    );
};

const PostCard = memo(({ post, user, allUsers, onLike, onDislike, onComment, onDelete, onViewProfile, onOpenDetail, onOpenChat, onEditComment, onDeleteComment, onEditPost, onShare, onHashtagClick, loadingActions }) => {
    const { t, lang } = useTranslation(user);
    const [commentAudio, setCommentAudio] = useState(null);
    const [isRecordingComment, setIsRecordingComment] = useState(false);
    const commentRecorderRef = useRef(null);
    const commentStreamRef = useRef(null);
    const discardRef = useRef(false);
    const [imgError, setImgError] = useState(false); // Handle broken images

    const isFounder = post.author?.role === 'Founder';
    const isCurrentUserFounder = user?.role === 'Founder';
    const isOwner = String(post.author?._id || post.author) === String(user?._id);
    const canDelete = isOwner || isCurrentUserFounder;

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

    const toggleCommentRecording = () => {
        if (isRecordingComment) {
            stopRecording();
        } else {
            startCommentRecording();
        }
    };

    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showMenu, setShowMenu] = useState(false);

    const handleDoubleTap = (e) => {
        e.preventDefault();
        onLike(post._id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            className={`premium-post-card group relative p-4 sm:p-6 mb-6 rounded-[2.5rem] bg-black/40 backdrop-blur-xl border border-white/5 hover:border-[var(--gold-primary)]/20 transition-all duration-500 shadow-2xl overflow-hidden will-change-transform`}
        >
            {/* AMBIENT BACKGROUND GLOW */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--gold-primary)]/5 blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[var(--gold-primary)]/5 blur-[100px] pointer-events-none rounded-full" />

            {/* UPLOADING OVERLAY */}
            {post.isUploading && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-[2.5rem] animate-fade-in pointer-events-none">
                    <div className="w-16 h-16 border-4 border-[var(--gold-primary)] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_var(--gold-glow)]" />
                    <div className="text-[var(--gold-primary)] font-black uppercase tracking-[0.2em] animate-pulse text-lg drop-shadow-md">
                        {t('TRANSMITTING_PERCENT', { percent: post.uploadProgress || 0 })}
                    </div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">{t('ENCRYPTING_DATA')}</div>
                </div>
            )}

            {/* CARD CONTENT */}
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-gray-800 to-black p-[1.5px] shadow-2xl group-hover:scale-105 transition-transform duration-500 cursor-pointer overflow-hidden border border-white/10" onClick={() => onViewProfile(post.author)}>
                            <div className="w-full h-full rounded-[0.9rem] overflow-hidden">
                                <ProfileAvatar user={post.author} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-white text-sm sm:text-base uppercase tracking-tighter hover:text-[var(--gold-primary)] transition-colors cursor-pointer" onClick={() => onViewProfile(post.author)}>{post.author?.username}</span>
                                <VerifiedBadge isFounder={isFounder} className="w-4 h-4" />
                            </div>

                            {/* FOUNDER SECTION BELOW NAME */}
                            {isFounder && (
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1.5 mt-1 bg-gradient-to-r from-[var(--gold-primary)]/20 to-[var(--gold-primary)]/5 px-2.5 py-1 rounded-lg border border-[var(--gold-primary)]/40">
                                        <FounderBadge className="w-5 h-5" />
                                        <span className="text-[10px] text-[var(--gold-primary)] uppercase font-black tracking-widest">{t('FOUNDER_BADGE', 'LEGACY FOUNDER')}</span>
                                    </div>
                                </div>
                            )}

                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-0.5">{formatDate(post.createdAt, t, lang)}</span>
                        </div>
                    </div>

                    {/* MORE MENU */}
                    <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); playSound('cyber_click'); }} className="p-2 text-white hover:text-[var(--gold-primary)] transition-colors rounded-full hover:bg-white/10 active:scale-90 shrink-0">
                            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]">
                                <circle cx="12" cy="12" r="2.5" />
                                <circle cx="12" cy="5" r="2.5" />
                                <circle cx="12" cy="19" r="2.5" />
                            </svg>
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                                <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-[110] overflow-hidden flex flex-col gap-1 p-1 transform-gpu animate-fade-in">
                                    <button onClick={(e) => { e.stopPropagation(); onShare(post); setShowMenu(false); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all w-full text-left group/item">
                                        <Icons.Share className="w-4 h-4 text-gray-400 group-hover/item:text-white transition-colors" />
                                        <span className="text-[10px] font-black text-gray-200 uppercase tracking-widest">{t('SHARE')}</span>
                                    </button>
                                    {isOwner && (
                                        <button onClick={(e) => { e.stopPropagation(); onEditPost(post); setShowMenu(false); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all w-full text-left group/item">
                                            <Icons.Edit className="w-4 h-4 text-blue-400 group-hover/item:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('EDIT')}</span>
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(post._id); setShowMenu(false); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all w-full text-left group/item">
                                            <Icons.Trash className="w-4 h-4 text-red-500 group-hover/item:scale-110 transition-transform" />
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t('DELETE')}</span>
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {post.desc && (
                        <p className="text-[15px] sm:text-[17px] text-white/90 leading-[1.6] font-medium whitespace-pre-wrap break-words px-1">
                            {parseHashtags(post.desc, (tag) => onHashtagClick(tag))}
                        </p>
                    )}

                    {(post.image || post.videoUrl) && (
                        <div className="rounded-[2.5rem] overflow-hidden border border-white/5 bg-black/60 relative group-hover/media:scale-[1.01] transition-transform duration-700 shadow-2xl h-auto min-h-[100px]">
                            {isYouTubeUrl(post.videoUrl) ? (
                                <NeuralVideoPlayer src={post.videoUrl} className="w-full aspect-video" onExpand={() => onOpenDetail(post)} />
                            ) : (post.videoUrl || (post.image && post.image.match(/\.(mp4|mov|webm)$/i))) ? (
                                <NeuralVideoPlayer src={resolveMediaUrl(post.videoUrl || post.image)} poster={resolveMediaUrl(post.thumbnailUrl || post.videoUrl || post.image, null, false, true)} className="w-full h-auto" onExpand={() => onOpenDetail(post)} />
                            ) : post.image && (
                                imgError ? (
                                    <div className="w-full h-40 flex flex-col items-center justify-center bg-white/5 text-gray-600 gap-2">
                                        <Icons.Image className="w-8 h-8 opacity-20" />
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Image Expired</span>
                                    </div>
                                ) : (
                                    <img
                                        src={resolveMediaUrl(post.image)}
                                        alt="Media"
                                        className="w-full h-auto object-contain bg-[#050505]"
                                        loading="lazy"
                                        decoding="async"
                                        onClick={() => onOpenDetail(post)}
                                        onDoubleClick={handleDoubleTap}
                                        onError={() => {
                                            setImgError(true);
                                            // Auto-cleanup broken link (Only for Author/Founder)
                                            if (canDelete) { axios.put(`/posts/${post._id}`, { image: "" }).catch(() => { }); }
                                        }}
                                    />
                                )
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 xs:gap-6 sm:gap-10">
                        {/* LIKE */}
                        <button disabled={loadingActions?.[post._id]} onClick={() => !loadingActions?.[post._id] && onLike(post._id)} className={`flex items-center gap-2.5 group transition-all ${post.likes?.includes(user?._id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} ${loadingActions?.[post._id] ? 'opacity-50' : ''}`}>
                            <Icons.Heart className={`w-6 h-6 ${post.likes?.includes(user?._id) ? 'fill-current' : ''}`} />
                            <span className="text-xs font-black">{post.likes?.length || 0}</span>
                        </button>

                        {/* DISLIKE */}
                        <button disabled={loadingActions?.[post._id]} onClick={() => !loadingActions?.[post._id] && onDislike(post._id)} className={`flex items-center gap-2.5 group transition-all ${post.dislikes?.includes(user?._id) ? 'text-[var(--gold-primary)]' : 'text-gray-500 hover:text-[var(--gold-primary)]'} ${loadingActions?.[post._id] ? 'opacity-50' : ''}`}>
                            <div className="relative">
                                <Icons.ThumbsDown className={`w-6 h-6 ${post.dislikes?.includes(user?._id) ? 'fill-current' : ''} transition-transform`} />
                            </div>
                            <span className="text-xs font-black">{post.dislikes?.length || 0}</span>
                        </button>

                        {/* COMMENTS */}
                        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2.5 text-gray-500 hover:text-sky-400 transition-all">
                            <Icons.MessageSquare className="w-6 h-6" />
                            <span className="text-xs font-black">{post.comments?.length || 0}</span>
                        </button>
                    </div>
                </div>

                {showComments && (
                    <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10">
                                <ProfileAvatar user={user} />
                            </div>
                            <div className="flex-1 flex flex-col gap-3">
                                <div className="relative">
                                    <textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder={t('WRITE_COMMENT')}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[var(--gold-primary)]/40 transition-all min-h-[100px] resize-none pb-12"
                                    />
                                    <div className="absolute bottom-2 left-2 flex gap-2">
                                        <button onClick={toggleCommentRecording} className={`p-2 rounded-xl transition-all ${isRecordingComment ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-500 hover:text-red-500'}`}>
                                            <Icons.Mic className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => { if (commentText.trim()) { onComment(post._id, commentText); setCommentText(''); } }} className="p-2 bg-[var(--gold-primary)] text-black rounded-xl hover:opacity-90 active:scale-95 transition-all">
                                            <Icons.Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                {commentAudio && (
                                    <div className="p-3 bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/30 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Icons.Mic className="w-4 h-4 text-[var(--gold-primary)]" />
                                            <span className="text-[10px] font-black text-[var(--gold-primary)] uppercase">VOICE READY</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setCommentAudio(null)} className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-lg"><Icons.Trash className="w-4 h-4" /></button>
                                            <button onClick={() => { const fd = new FormData(); fd.append('file', commentAudio, 'voice.webm'); onComment(post._id, fd); setCommentAudio(null); }} className="px-4 py-1 bg-[var(--gold-primary)] text-black font-black text-[10px] rounded-lg">SEND</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-6">
                            {(post.comments || []).map(c => (
                                <CommentItem key={c._id} comment={c} post={post} user={user} allUsers={allUsers} onEdit={onEditComment} onDelete={onDeleteComment} t={t} lang={lang} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
});


const ChatModal = ({ isOpen, onClose, user, allUsers, initialChatUser, addToast, fetchSpecificUser }) => {
    const { t, lang } = useTranslation(user);
    const [activeChat, setActiveChat] = useState(null);

    // 🔥 INSTANT STATUS REFRESH: Fetch latest data for target user on mount/change
    useEffect(() => {
        if (isOpen && activeChat?._id && fetchSpecificUser) {
            fetchSpecificUser(activeChat._id);
        }
    }, [isOpen, activeChat?._id]);

    const [messages, setMessages] = useState(() => {
        try {
            const cached = localStorage.getItem('cached_messages');
            return cached ? JSON.parse(cached) : {};
        } catch { return {}; }
    });

    useEffect(() => {
        if (Object.keys(messages).length > 0) {
            try {
                // Ensure we don't blow up localStorage quota (keep only recent 10 chats)
                const trimmed = {};
                Object.keys(messages).slice(-10).forEach(k => trimmed[k] = messages[k].slice(-50));
                localStorage.setItem('cached_messages', JSON.stringify(trimmed));
            } catch (e) { }
        }
    }, [messages]);

    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPhonetic, setIsPhonetic] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const scrollRef = useRef();
    const imageInputRef = useRef(null);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Max 10MB for images in chat
        if (file.size > 10 * 1024 * 1024) {
            alert("Image must be under 10MB");
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const fetchMessages = async (otherUserId) => {
        try {
            const res = await axios.get(`/messages/conversation/${otherUserId}`);

            // Only update if data actually changed to avoid unnecessary re-renders and scroll jumps
            setMessages(prev => {
                const currentMsgs = prev[otherUserId] || [];
                // Simple comparison - for more complex objects we'd use a deep compare helper
                if (currentMsgs.length === res.data.length && JSON.stringify(currentMsgs[currentMsgs.length - 1]) === JSON.stringify(res.data[res.data.length - 1])) {
                    return prev;
                }
                return { ...prev, [otherUserId]: res.data };
            });

            // 🔥 WHISPERS: Auto-mark incoming messages as read (and trigger deletion on backend)
            const incomingUnread = res.data.filter(m => m.recipient === user._id && !m.isRead);
            if (incomingUnread.length > 0) {
                // Trigger burn protocol
                Promise.all(incomingUnread.map(m => axios.patch(`/messages/${m._id}/read`).catch(() => { })));
            }
        } catch (e) { console.error('Failed to fetch messages', e); }
    };

    useEffect(() => {
        if (isOpen && initialChatUser) {
            if (typeof initialChatUser === 'string') {
                const found = allUsers.find(u => String(u._id) === String(initialChatUser));
                if (found) setActiveChat(found);
            } else if (initialChatUser._id || initialChatUser.id) {
                setActiveChat(initialChatUser);
            }
        }
    }, [isOpen, initialChatUser, allUsers]);

    useEffect(() => {
        if (!isOpen || !activeChat?._id) return;
        const targetId = activeChat._id;
        fetchMessages(targetId);

        // 🔥 REAL-TIME MESSAGE LISTENER
        const handleMessageReceived = (msg) => {
            // Check if message belongs to THIS conversation
            const isFromCurrentTarget = String(msg.sender) === String(targetId);
            const isToCurrentTarget = String(msg.recipient) === String(targetId);

            if (isFromCurrentTarget || isToCurrentTarget) {
                console.log("📨 [SOCKET] New whisper received in current chat");
                setMessages(prev => ({
                    ...prev,
                    [targetId]: [...(prev[targetId] || []), msg]
                }));
                // Auto-read if we are looking at it
                if (isFromCurrentTarget) {
                    axios.patch(`/messages/${msg._id}/read`).catch(() => { });
                }
            }
        };

        socket.on('message.received', handleMessageReceived);

        return () => {
            socket.off('message.received', handleMessageReceived);
        };
    }, [isOpen, activeChat?._id]);

    // WHISPERS: Improved Auto-Scroll Logic
    useEffect(() => {
        if (activeChat && scrollRef.current) {
            const behavior = (messages[activeChat._id]?.length <= 1) ? 'auto' : 'smooth';
            // Use a small timeout to ensure DOM has updated with new content
            const timer = setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior, block: 'end' });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages[activeChat?._id]?.length, activeChat?._id]);

    const handleClearChat = async () => {
        if (!activeChat) return;
        if (!window.confirm(t('CONFIRM_CLEAR_CHAT') || 'Clear this entire conversation?')) return;
        const targetId = activeChat._id || activeChat.id;
        if (!targetId) return;

        try {
            console.log('📡 [DEBUG] Attempting to clear conversation:', targetId);
            await axios.post(`/messages/conversation/clear/${targetId}`);
            setMessages(prev => ({ ...prev, [targetId]: [] }));
            playSound('sword');
        } catch (e) {
            console.error('Clear failed', e);
            setMessages(prev => ({ ...prev, [targetId]: [] }));
            playSound('sword');
        }
    };

    const handleSend = async (audioBlob = null) => {
        if (!activeChat) return;

        // CLIENT-SIDE VALIDATION: Ensure we have a valid recipient
        const targetId = activeChat._id || activeChat.id;
        if (!targetId) {
            console.error("Attempted to send message to user with no ID:", activeChat);
            return;
        }

        if (!inputText.trim() && !audioBlob && !imageFile) return;

        const fd = new FormData();
        fd.append('recipient', targetId);
        if (inputText.trim()) fd.append('text', inputText.trim());
        if (audioBlob) fd.append('file', audioBlob, 'voice.webm');
        if (imageFile) fd.append('file', imageFile, imageFile.name);

        const tempText = inputText;
        setInputText('');
        clearImage();

        try {
            const res = await axios.post('/messages', fd);
            setMessages(prev => ({
                ...prev,
                [targetId]: [...(prev[targetId] || []), res.data]
            }));
            playSound('cyber_scroll');
        } catch (e) {
            const detail = e.response?.data?.detail || e.response?.data?.message || e.response?.data?.error || e.message;
            const fullOutput = e.response?.data ? JSON.stringify(e.response.data) : 'No response body';
            console.error('Send failed:', detail, fullOutput);
            setInputText(tempText);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];
            mediaRecorder.current.ondataavailable = e => audioChunks.current.push(e.data);
            mediaRecorder.current.onstop = () => {
                if (audioChunks.current.length === 0) {
                    setIsRecording(false);
                    return;
                }
                const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
                // Safety: Avoid sending empty or corrupt tiny blobs ( < 500 bytes is usually just silence/header error)
                if (blob.size < 500) {
                    setIsRecording(false);
                    console.warn('[WHISPER] Recording too short/invalid, skipping send');
                    return;
                }
                handleSend(blob);
            };
            mediaRecorder.current.start();
            setIsRecording(true);
            playSound('sweep');
        } catch (e) { alert("Mic required for walkie-talkie mode"); }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
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
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black italic flex items-center gap-2">
                                    <Icons.Ghost className="w-8 h-8 text-[var(--gold-primary)]" />
                                    {t('CHAT')}
                                </h2>
                                <button onClick={onClose} className="sm:hidden"><Icons.X className="w-6 h-6" /></button>
                            </div>
                        </div>
                        <div className="relative">
                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                id="chat-search"
                                name="chat-search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('SEARCH_USERS_PH')}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--gold-primary)] transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredUsers.length === 0 && <div className="p-4 text-center text-gray-500 text-xs">{t('ZERO_AGENTS')}</div>}
                        {filteredUsers.map(u => {
                            const online = isUserOnline(u, user);
                            return (
                                <div key={u._id} onClick={() => setActiveChat(u)} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${activeChat?._id === u._id ? 'bg-white/5' : ''}`}>
                                    <div className="relative"><div className={`w-12 h-12 rounded-2xl bg-gray-900 border border-white/10 overflow-hidden shadow-md`}><ProfileAvatar user={u} /></div><div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${online ? 'bg-green-500' : 'bg-gray-600'}`} /></div>
                                    <div><div className="font-bold text-sm text-white flex items-center gap-2">{u?.username} <VerifiedBadge isFounder={u.role === 'Founder'} className="w-4 h-4" /></div><div className={`text-[10px] ${online ? 'text-green-500' : 'text-gray-500'} uppercase tracking-tighter`}>{online ? t('ONLINE') : t('OFFLINE')}</div></div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className={`flex-1 flex flex-col bg-[#050505] ${!activeChat ? 'hidden sm:flex' : 'flex'}`}>
                    {activeChat ? (
                        <>
                            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/50 backdrop-blur-xl shrink-0">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setActiveChat(null)} className="sm:hidden"><Icons.Back className="w-6 h-6" /></button>
                                    <div className="w-10 h-10 rounded-xl border border-[var(--gold-primary)]/30 overflow-hidden"><ProfileAvatar user={activeChat} /></div>
                                    <div>
                                        <div className="font-bold text-sm flex items-center gap-2">
                                            {activeChat?.username}
                                            <VerifiedBadge isFounder={activeChat?.role === 'Founder'} className="w-4 h-4" />
                                        </div>
                                        <div className={`text-[10px] ${isUserOnline(allUsers.find(au => String(au._id) === String(activeChat._id)) || activeChat, user) ? 'text-green-500 font-bold uppercase tracking-widest' : 'text-gray-500 uppercase tracking-tighter'}`}>
                                            {(isUserOnline(allUsers.find(au => String(au._id) === String(activeChat._id)) || activeChat, user)) ? t('ONLINE') : t('OFFLINE')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {(messages[activeChat._id] || []).map((m, i) => {
                                    // SMART DETECTION: check if 'audio' field actually holds an image (old bug fallback)
                                    const audioVal = m.audio || m.audioUrl || "";
                                    const isAudioActuallyImage = audioVal && /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|avif)/i.test(audioVal.split('?')[0]);
                                    const imageUrl = m.image || (isAudioActuallyImage ? audioVal : "");
                                    const realAudio = isAudioActuallyImage ? "" : audioVal;

                                    return (
                                        <div key={i} className={`flex ${String(m.sender) === String(user?._id) ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-md relative ${String(m.sender) === String(user?._id) ? 'bg-blue-600 text-white rounded-br-none' : 'bg-[#1a1a1a] text-white rounded-bl-none'}`}>
                                                {/* IMAGE ATTACHMENT */}
                                                {imageUrl && (
                                                    <div className="mb-2">
                                                        <img
                                                            src={resolveMediaUrl(imageUrl)}
                                                            alt=""
                                                            className="max-w-full max-h-[300px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/10"
                                                            onClick={() => window.open(resolveMediaUrl(imageUrl), '_blank')}
                                                            loading="lazy"
                                                            onError={(e) => e.target.style.display = 'none'} // Hide if broken
                                                        />
                                                    </div>
                                                )}
                                                {/* AUDIO ATTACHMENT */}
                                                {realAudio ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-[var(--gold-primary)] animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gold-primary)]">{t('VOICE_NOTE')}</span>
                                                        </div>
                                                        <audio src={resolveMediaUrl(realAudio)} controls className="h-8 max-w-full custom-audio-mini" />
                                                        {m.text && <p className="text-white/80 italic mt-1">{m.text}</p>}
                                                    </div>
                                                ) : (
                                                    m.text && !imageUrl ? m.text : (m.text && imageUrl ? <p className="mt-1">{m.text}</p> : null)
                                                )}
                                                <div className="text-[9px] opacity-50 text-right mt-1">{formatDate(m.createdAt, t, lang)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                            {/* Hidden image input */}
                            <input type="file" ref={imageInputRef} hidden accept="image/*" onChange={handleImageSelect} />

                            {/* IMAGE PREVIEW STRIP */}
                            {imagePreview && (
                                <div className="absolute bottom-full left-0 right-0 p-3 bg-black/90 backdrop-blur-xl border-t border-white/10">
                                    <div className="relative inline-block">
                                        <img src={imagePreview} alt="" className="h-24 max-w-[200px] rounded-xl object-cover border border-white/10 shadow-xl" />
                                        <button onClick={clearImage} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-400 active:scale-90 transition-all">
                                            <Icons.X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="p-2 bg-[#050505] border-t border-white/10 flex items-center gap-2 z-[100] relative shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                                <div className="flex-1 relative flex items-center bg-[#111] border border-white/20 rounded-[1.3rem] px-4 py-1 focus-within:border-[var(--gold-primary)] transition-all group overflow-hidden">
                                    <input
                                        id="chat-input"
                                        name="chat-message"
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (isPhonetic) {
                                                const pos = e.target.selectionStart;
                                                const char = val.slice(pos - 1, pos);
                                                if (GREEK_PHONETIC[char]) {
                                                    val = val.slice(0, pos - 1) + GREEK_PHONETIC[char] + val.slice(pos);
                                                }
                                            }
                                            setInputText(val);
                                        }}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder={isRecording ? t('RECORDING') : t('ENTER_COMMAND')}
                                        className={`w-full bg-transparent py-3 text-[14px] text-white outline-none placeholder-gray-500 font-bold ${isRecording ? 'animate-pulse text-red-500' : ''}`}
                                    />
                                    <div className="flex items-center gap-2 shrink-0">
                                        {isPhonetic && <span className="text-[10px] font-black text-[var(--gold-primary)] animate-pulse border border-[var(--gold-primary)]/30 px-1.5 py-0.5 rounded-md bg-[var(--gold-primary)]/10">GREEK PH</span>}
                                        <Icons.CommandLine className="w-5 h-5 text-gray-500 group-focus-within:text-[var(--gold-primary)] transition-colors" />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setIsPhonetic(!isPhonetic); playSound('pop'); }}
                                    className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all shrink-0 ${isPhonetic ? 'bg-[var(--gold-primary)]/20 border-[var(--gold-primary)] text-[var(--gold-primary)] shadow-[0_0_15px_rgba(var(--gold-primary-rgb),0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                    title="Phonetic Greek Keyboard"
                                >
                                    <Icons.Translate className="w-5 h-5" />
                                </button>
                                {/* IMAGE UPLOAD BUTTON */}
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shrink-0 ${imageFile ? 'bg-[var(--gold-primary)]/20 text-[var(--gold-primary)] border border-[var(--gold-primary)]/40' : 'bg-white/5 hover:bg-white/10 text-gray-500 hover:text-[var(--gold-primary)] active:scale-90'}`}
                                    title="Send Image"
                                >
                                    <Icons.Image className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); toggleRecording(); }}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shrink-0 ${isRecording ? 'bg-red-500 text-white shadow-glow-red animate-pulse' : 'bg-white/5 hover:bg-white/10 text-gray-500 hover:text-[var(--gold-primary)] active:scale-90'}`}
                                >
                                    <Icons.Mic className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!inputText.trim() && !imageFile}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--gold-primary)] text-black shadow-lg shadow-glow-gold/40 active:scale-90 disabled:opacity-20 disabled:scale-100 transition-all shrink-0 font-black hover:opacity-90"
                                >
                                    <Icons.Send className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center px-4">
                            <div className="flex flex-col items-center">
                                <button className="mb-6 bg-transparent border-none p-0 transition-all active:scale-95 group">
                                    <Icons.Ghost className="w-24 h-24 text-[var(--gold-primary)] group-hover:scale-105 transition-all duration-500 drop-shadow-[0_0_15px_rgba(var(--gold-primary-rgb),0.3)]" />
                                </button>
                                <h3 className="font-black italic text-2xl tracking-tighter text-white/90">{t('MESSAGES')}</h3>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-3">{t('SECURE_COMMS')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ isOpen, onClose, logout, user, onUpdateUser }) => {
    const { t, i18n, lang } = useTranslation(user);
    const [saving, setSaving] = useState(false);
    const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
    const [isFollowersOnly, setIsFollowersOnly] = useState(user?.isFollowersOnly || false);
    const [showDanger, setShowDanger] = useState(false);

    useEffect(() => {
        if (user && !saving) {
            setIsPrivate(user.isPrivate || false);
            setIsFollowersOnly(user.isFollowersOnly || false);
        }
    }, [user, saving]);

    const handleSave = async (key, val) => {
        setSaving(true);
        try {
            // FIX: Use direct ID update for privacy flags to avoid /settings 403 conflict (Deployment Lag Workaround)
            if (key === 'isPrivate' || key === 'isFollowersOnly') {
                const res = await axios.put(`/users/${user._id || user.userId}`, { [key]: val });
                onUpdateUser(res.data);
                if (key === 'isPrivate') setIsPrivate(val);
                if (key === 'isFollowersOnly') setIsFollowersOnly(val);
                playSound('cyber_scroll');
                setSaving(false);
                return;
            }

            let payload = { [key]: val };
            if (key === 'language') payload = { settings: { language: val } }; // Language nested exception
            if (key === 'theme') payload = { settings: { theme: val } }; // Theme nested exception

            const res = await axios.put('/users/settings', payload);
            onUpdateUser(res.data);
            if (key === 'isPrivate') setIsPrivate(val);
            if (key === 'isFollowersOnly') setIsFollowersOnly(val);
            playSound('cyber_scroll');
        } catch (e) {
            console.error("Settings update failed", e);
            // Revert state on failure
            if (key === 'isPrivate') setIsPrivate(!val);
            if (key === 'isFollowersOnly') setIsFollowersOnly(!val);
        } finally { setSaving(false); }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 overflow-hidden">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="relative w-[95%] sm:w-full max-w-[400px] sm:max-w-[700px] max-h-[85vh] sm:max-h-[90vh] bg-[#0d0d0d] border border-white/20 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col backdrop-blur-3xl will-change-transform"
            >
                {/* CYBER BACKGROUND ELEMENTS - REFINED */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--gold-primary)] to-transparent opacity-20" />
                <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-[var(--gold-primary)]/[0.03] rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-[100px] -left-[100px] w-[300px] h-[300px] bg-blue-500/[0.03] rounded-full blur-[80px] pointer-events-none" />

                {/* HEADER */}
                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01] relative shrink-0 z-10">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--gold-primary)]/10 rounded-xl">
                                <Icons.Settings className="w-5 h-5 text-[var(--gold-primary)]" />
                            </div>
                            <div>
                                <h2 className="font-black uppercase tracking-[0.2em] text-sm text-white leading-none">{t('SETTINGS')}</h2>
                                <div className="text-[10px] font-medium text-gray-500 mt-1 tracking-wide">Customize your experience</div>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all active:scale-90 group border border-white/30 shadow-2xl">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
                            <path d="M18 6 6 18M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-8 relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
                        {/* LEFT COLUMN: MODES & IDENTITY */}
                        <div className="space-y-8">
                            {/* PRIVACY SECTION */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1 h-4 bg-[var(--gold-primary)] rounded-full shadow-[0_0_10px_var(--gold-primary)]" />
                                    <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">{t('PRIVACY') || "PRIVACY"}</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 bg-white/[0.03] rounded-3xl border border-white/5 hover:border-[var(--gold-primary)]/30 transition-all group hover:bg-white/[0.05]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-white group-hover:text-[var(--gold-primary)] transition-colors">{t('PRIVATE_TITLE')}</div>
                                                <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">{t('PRIVATE_DESC_SHORT')}</div>
                                            </div>
                                            <div onClick={() => { if (!saving) { const v = !isPrivate; setIsPrivate(v); handleSave('isPrivate', v); } }}
                                                className={`relative w-12 h-7 rounded-full transition-all duration-300 cursor-pointer border ${isPrivate ? 'bg-[var(--gold-primary)] border-[var(--gold-primary)]' : 'bg-black/40 border-white/20'}`}>
                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${isPrivate ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-white/[0.03] rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all group hover:bg-white/[0.05]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{t('GUARD_TITLE')}</div>
                                                <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">{t('GUARD_DESC_SHORT')}</div>
                                            </div>
                                            <div onClick={() => { if (!saving) { const v = !isFollowersOnly; setIsFollowersOnly(v); handleSave('isFollowersOnly', v); } }}
                                                className={`relative w-12 h-7 rounded-full transition-all duration-300 cursor-pointer border ${isFollowersOnly ? 'bg-blue-600 border-blue-500' : 'bg-black/40 border-white/20'}`}>
                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${isFollowersOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* LANGUAGE SECTION */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                    <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">{t('COGNITION')}</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {[
                                        { id: 'en', flag: '🇺🇸', label: 'EN' }, { id: 'el', flag: '🇬🇷', label: 'EL' },
                                        { id: 'de', flag: '🇩🇪', label: 'DE' }, { id: 'ru', flag: '🇷🇺', label: 'RU' },
                                        { id: 'cy', flag: '🇨🇾', label: 'CY' }, { id: 'es', flag: '🇪🇸', label: 'ES' },
                                        { id: 'tr', flag: '🇹🇷', label: 'TR' }, { id: 'fr', flag: '🇫🇷', label: 'FR' }
                                    ].map(l => (
                                        <button key={l.id} onClick={() => { i18n.changeLanguage(l.id); handleSave('language', l.id); localStorage.setItem('language', l.id); }}
                                            className={`aspect-square rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 group relative overflow-hidden ${lang === l.id ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/10 shadow-[0_0_20px_rgba(255,215,0,0.15)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20'}`}>
                                            <div className="text-2xl group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">{l.flag}</div>
                                            <div className={`text-[9px] font-black ${lang === l.id ? 'text-[var(--gold-primary)]' : 'text-gray-500 group-hover:text-gray-300'}`}>{l.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* RIGHT COLUMN: AESTHETICS & ACTIONS */}
                        <div className="space-y-8">
                            {/* THEME SECTION */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                    <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">AESTHETICS</h3>
                                </div>
                                <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 shadow-inner">
                                    <div className="grid grid-cols-4 gap-5 place-items-center">
                                        {['#ffd700', '#3b82f6', '#ef4444', '#10b981', '#ffffff', '#a855f7', '#ff8c00', '#ff69b4', '#00ffff', '#7cfc00', '#ff00ff', '#ffa500'].map(c => {
                                            const currentTheme = user?.settings?.theme || localStorage.getItem('themeColor') || '#ffd700';
                                            const isActive = currentTheme === c;
                                            return (
                                                <button key={c} onClick={() => { applyTheme(c); handleSave('theme', c); }}
                                                    className={`w-10 h-10 rounded-full transition-all duration-300 relative flex items-center justify-center ${isActive ? 'scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'opacity-40 hover:opacity-100 hover:scale-110'}`}
                                                >
                                                    <div className="w-full h-full rounded-full" style={{ backgroundColor: c, boxShadow: isActive ? `0 0 15px ${c}` : 'none' }} />
                                                    {isActive && <div className="absolute inset-0 ring-2 ring-white ring-offset-2 ring-offset-black rounded-full" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>

                            {/* OPERATIONS SECTION */}
                            <section className="pt-4 border-t border-white/5 space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1 h-4 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                                    <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">OPERATIONS</h3>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {showDanger ? (
                                        <div className="p-5 bg-red-950/20 rounded-3xl border border-red-500/20 text-center shadow-2xl animate-pop-in">
                                            <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                                                <Icons.AlertTriangle className="w-3 h-3" />
                                                {t('DANGER_ZONE')}
                                            </div>
                                            <button onClick={async () => { if (confirm(t('DELETE_ACCOUNT_CONFIRM'))) { try { await axios.delete(`/users/${user._id}`); logout(); } catch (e) { } } }}
                                                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-2xl font-black text-[10px] tracking-widest hover:from-red-500 hover:to-red-700 transition-all shadow-lg active:scale-95 uppercase">
                                                {t('DELETE_FOREVER')}
                                            </button>
                                            <button onClick={() => setShowDanger(false)} className="mt-4 text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">{t('CANCEL')}</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setShowDanger(true)} className="w-full py-5 bg-white/[0.02] hover:bg-red-500/10 rounded-3xl border border-white/5 text-gray-500 hover:text-red-400 transition-all text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-3 group">
                                            {t('UNCOVER_RESTRICTED_OPS')}
                                        </button>
                                    )}

                                    <button onClick={logout} className="w-full flex items-center justify-between p-5 bg-white/[0.04] hover:bg-red-500/20 rounded-3xl border border-white/5 hover:border-red-500/30 transition-all group active:scale-95 shadow-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                                <Icons.Logout className="w-5 h-5 text-red-500" />
                                            </div>
                                            <span className="text-xs font-black text-white/80 group-hover:text-red-400 transition-colors uppercase tracking-[0.2em]">{t('LOGOUT')}</span>
                                        </div>
                                        <Icons.ArrowRight className="w-4 h-4 text-white/10 group-hover:text-red-500 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>

                    {saving && (
                        <div className="absolute top-6 right-8 pointer-events-none">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 backdrop-blur-md">
                                <div className="w-1.5 h-1.5 bg-[var(--gold-primary)] rounded-full animate-ping" />
                                <span className="text-[9px] font-bold text-[var(--gold-primary)] uppercase tracking-wider">{t('SYNCING')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const ProfileModal = ({ isOpen, onClose, profileUser, currentUser, allUsers, preloadedPosts, posts, onFollow, onUpdateUser, onViewProfile, onOpenChat, onOpenDetail, imgKey, fetchSpecificUser, lastDeletedPostId, followLoading, addToast, onDeletePost }) => {
    const { t, lang } = useTranslation(currentUser);
    // 🔥 INSTANT STATUS REFRESH: Fetch latest data for profile user on mount
    useEffect(() => {
        if (isOpen && profileUser?._id && fetchSpecificUser) {
            fetchSpecificUser(profileUser._id);
        }
    }, [isOpen, profileUser?._id, fetchSpecificUser]);

    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState(profileUser);
    const [activeList, setActiveList] = useState(null);
    const [clickLock, setClickLock] = useState(false);
    const lastOpenedAt = useRef(Date.now());
    const [bio, setBio] = useState(profileUser?.bio || "");
    const [editUsername, setEditUsername] = useState(profileUser?.username || "");
    const [activeTab, setActiveTab] = useState('ALL');
    const [userSpecificPosts, setUserSpecificPosts] = useState(preloadedPosts || []);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [expandedDates, setExpandedDates] = useState({});
    const fileRef = useRef(null);
    const coverFileRef = useRef(null);
    const [coverUploading, setCoverUploading] = useState(false);

    const displayUser = React.useMemo(() => {
        if (!profileUser) return null;
        const profileUserId = String(profileUser?._id || profileUser);
        const currentUserId = String(currentUser?._id || '');
        const isMe = profileUserId === currentUserId;

        // Prioritize userData (fetched specifically for this profile)
        // If it's 'me', currentUser is the most up-to-date source
        const base = isMe ? currentUser : (userData || profileUser);
        const live = allUsers.find(u => String(u._id) === String(base?._id));

        // CRITICAL SYNC: Merge live data (online status) with base data (bio, username)
        // If it's ME, prioritize currentUser object which is the most fresh
        if (isMe) {
            return {
                ...base,
                ...live,
                ...currentUser,
                bio: currentUser?.bio ?? base?.bio ?? live?.bio
            };
        }
        // FOR OTHERS: Merge detailed base (from /find/:id) with fresh live status (from App users list)
        return live ? { ...base, ...live, bio: base?.bio || live?.bio } : base;
    }, [profileUser, currentUser, userData, allUsers]);

    const isMe = String(displayUser?._id || '') === String(currentUser?._id || '');

    const toggleDate = (dateKey) => {
        // Disabled clicking - folders are always open
    };

    useEffect(() => {
        if (displayUser && !isEditing) {
            setBio(displayUser.bio || "");
            setEditUsername(displayUser.username || "");
        }
    }, [displayUser, isEditing]);

    const userStories = React.useMemo(() => (posts || []).filter(p => {
        const pId = String(p.author?._id || p.author);
        const uId = String(profileUser?._id || (typeof profileUser === 'string' ? profileUser : ''));
        return pId === uId && p.isStory;
    }), [posts, profileUser]);

    const fetchUserPosts = async () => {
        if (!profileUser?._id) return;
        setLoadingPosts(true);
        try {
            const res = await axios.get(`/posts/user/${profileUser._id}`);
            setUserSpecificPosts(res.data);
        } catch (e) {
            console.error("Profile posts fetch error:", e);
        } finally {
            setLoadingPosts(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            // INSTANT HYDRATION: prefill posts from global index before server responds
            if (preloadedPosts && preloadedPosts.length > 0) {
                setUserSpecificPosts(preloadedPosts);
            }
            fetchUserPosts();
        }
    }, [isOpen, profileUser?._id]);

    // LIVE SYNC: React to global deletions if the profile is open
    useEffect(() => {
        if (lastDeletedPostId) {
            setUserSpecificPosts(prev => prev.filter(p => p._id !== lastDeletedPostId));
        }
    }, [lastDeletedPostId]);

    const userPosts = React.useMemo(() => (userSpecificPosts || []).filter(p => {
        // Strict exclusion of stories from the main grid
        if (p.isStory === true || String(p.isStory) === 'true') return false;

        const isVideo = isYouTubeUrl(p.videoUrl) || (p.videoUrl && p.videoUrl.match(/\.(mp4|mov|webm|avi|m4v)$/i)) || (p.image && p.image.match(/\.(mp4|mov|webm)$/i));
        if (activeTab === 'VIDEO') return isVideo;
        if (activeTab === 'POSTS') return !isVideo;
        return true;
    }), [userSpecificPosts, activeTab]);

    // AUTO-EXPAND ALL FOLDERS IN PROFILE BY DEFAULT
    useEffect(() => {
        if (isOpen && userPosts.length > 0) {
            const groups = {};
            userPosts.forEach(p => {
                const date = new Date(p.createdAt);
                const locale = lang === 'el' ? 'el-GR' : lang === 'de' ? 'de-DE' : 'en-US';
                const key = date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
                groups[key] = true;
            });
            setExpandedDates(groups);
        }
    }, [isOpen, userPosts.length, lang]);

    const groupedUserPosts = React.useMemo(() => {
        const groups = {};
        userPosts.forEach(p => {
            const date = new Date(p.createdAt);
            const locale = lang === 'el' ? 'el-GR' : lang === 'de' ? 'de-DE' : 'en-US';
            const key = date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });
        return groups;
    }, [userPosts, currentUser, lang]);

    // Prevent immediate clicks on list items to avoid ghost-touch from the count button
    useEffect(() => {
        if (activeList) {
            setClickLock(true);
            const timer = setTimeout(() => setClickLock(false), 300); // reduced to 300ms for better UX
            return () => clearTimeout(timer);
        }
    }, [activeList]);

    const getListUsers = () => {
        if (!activeList || !displayUser) return [];
        const ids = activeList === 'followers' ? displayUser.followers : displayUser.following;
        return (allUsers || []).filter(u => ids?.some(id => String(id) === String(u._id)));
    };

    if (!isOpen || !profileUser) return null;

    const isFollowing = currentUser?.following?.some(id => String(id) === String(displayUser?._id));
    const hasRequested = displayUser?.followRequests?.some(id => String(id) === String(currentUser?._id));

    return (

        <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ y: '100dvh' }} animate={{ y: 0 }} exit={{ y: '100dvh' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`relative w-full max-w-lg h-[100dvh] sm:h-[85vh] sm:rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl ${displayUser?.coverPic ? 'bg-black' : 'bg-[#0a0a0a]'}`} style={{ touchAction: 'manipulation' }}>

                {displayUser?.coverPic && (
                    <div className="absolute inset-0 z-0 pointer-events-none animate-fade-in">
                        {displayUser.coverPic.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
                            <video src={resolveMediaUrl(displayUser.coverPic, null, false, false, true)} autoPlay loop muted playsInline webkit-playsinline="true" disablePictureInPicture disableRemotePlayback preload="auto" className="w-full h-full object-cover opacity-[0.85]" />
                        ) : (
                            <img src={resolveMediaUrl(displayUser.coverPic, null, false, false, true)} className="w-full h-full object-cover opacity-[0.85] blur-[1px]" alt="" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
                    </div>
                )}

                <div className={`flex-none p-4 flex items-center justify-between border-b border-white/10 z-10 relative ${displayUser?.coverPic ? 'bg-transparent backdrop-blur-md' : 'bg-[#0a0a0a]'}`}>
                    <button onClick={() => {
                        if (activeList) setActiveList(null);
                        else if (isEditing) setIsEditing(false);
                        else onClose();
                    }} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"><Icons.Back className="w-6 h-6 text-white" /></button>
                    <div className="font-bold text-white text-sm uppercase tracking-widest">{activeList ? (activeList === 'followers' ? t('FOLLOWERS') : t('FOLLOWING')) : (isEditing ? t('EDIT_PROFILE') : displayUser?.username)}</div>
                    <div className="w-10" />
                </div>

                <div className={`flex-1 overflow-y-auto custom-scrollbar relative overscroll-y-contain pb-32 z-10 ${displayUser?.coverPic ? 'bg-transparent' : 'bg-[#050505]'}`}>
                    {activeList ? (
                        <div className="relative flex-1 flex flex-col min-h-0">
                            {/* SACRIFICIAL OVERLAY: Swallows all ghost touches for 1.2s */}
                            {clickLock && <div className="absolute inset-0 z-[100] bg-transparent pointer-events-auto" />}

                            <div
                                className={`p-2 space-y-2 ${clickLock ? 'pointer-events-none' : 'pointer-events-auto'}`}
                                onPointerDownCapture={e => clickLock && e.stopPropagation()}
                            >
                                {/* THE SAFE BUFFER: Takes the hit of any ghost clicks */}
                                <div className="h-20 sm:h-24 w-full flex items-center justify-center border-b border-white/5 mb-2 opacity-50">
                                    <Icons.Users className="w-5 h-5 text-gray-500 mr-2" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                                        {activeList === 'followers' ? t('FOLLOWERS_LIST') : t('FOLLOWING_LIST')}
                                    </span>
                                </div>

                                {getListUsers().length === 0 && !clickLock && <div className="p-4 text-center text-gray-500">{t('NO_AGENTS_FOUND')}</div>}
                                {getListUsers().map(u => (
                                    <div key={u._id} onClick={(e) => {
                                        if (Date.now() - lastOpenedAt.current < 300) return; // Reduced block time
                                        e.stopPropagation();
                                        onViewProfile(u);
                                        setActiveList(null);
                                    }} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all active:scale-95">
                                        <div className="w-10 h-10 rounded-xl bg-gray-800 overflow-hidden border border-white/10">
                                            <ProfileAvatar user={u} />
                                        </div>
                                        <div className="font-bold text-white text-sm">{u?.username}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : isEditing ? (
                        <div className="p-6 text-center space-y-8 animate-fade-in">
                            <div onClick={() => fileRef.current.click()} className="w-32 h-32 mx-auto rounded-[2.5rem] bg-gray-800 overflow-hidden border-4 border-[var(--gold-primary)] cursor-pointer relative group shadow-2xl shadow-[var(--gold-primary)]/10">
                                <ProfileAvatar user={displayUser} size="large" key={imgKey} />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Camera className="w-10 h-10 text-white" /></div>
                            </div>
                            <input type="file" ref={fileRef} hidden accept="image/*" onChange={async (e) => {
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

                            <div className="flex gap-2 w-full mt-6">
                                <button onClick={e => { e.preventDefault(); coverFileRef.current.click(); }} disabled={coverUploading}
                                    className="flex-1 py-4 bg-[#121212] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/30 rounded-2xl text-[11px] text-gray-300 hover:text-white font-black uppercase tracking-[0.2em] cursor-pointer transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] group">
                                    {coverUploading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Icons.Image className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />}
                                    {coverUploading ? (t('UPLOADING') || 'UPLOADING...') : (t('CHANGE_COVER') || 'CHANGE BACKGROUND')}
                                </button>
                                {displayUser?.coverPic && (
                                    <button onClick={async (e) => {
                                        e.preventDefault();
                                        if (window.confirm("Remove background?")) {
                                            setCoverUploading(true);
                                            try {
                                                const res = await axios.delete('/users/cover-pic');
                                                const updatedUser = res.data;
                                                localStorage.setItem('user', JSON.stringify(updatedUser));
                                                if (onUpdateUser) onUpdateUser(updatedUser);
                                                if (addToast) addToast('Background removed', 'success');
                                            } catch (err) { alert("Failed to remove background."); }
                                            finally { setCoverUploading(false); }
                                        }
                                    }} disabled={coverUploading}
                                        className="w-[52px] h-[52px] shrink-0 bg-[#121212] hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 rounded-full text-gray-400 hover:text-red-500 flex items-center justify-center transition-all duration-300 disabled:opacity-50 active:scale-[0.98]">
                                        <Icons.X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <input type="file" ref={coverFileRef} hidden accept="image/*,video/*" onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    if (file.size > 90 * 1024 * 1024) { alert("File too large. Max 90MB"); return e.target.value = ''; }
                                    setCoverUploading(true);
                                    const fd = new FormData(); fd.append('image', file);
                                    try {
                                        const res = await axios.post('/users/cover-pic', fd);
                                        const updatedUser = res.data;
                                        if (updatedUser.coverPic) {
                                            const sep = updatedUser.coverPic.includes('?') ? '&' : '?';
                                            updatedUser.coverPic += `${sep}t=${Date.now()}`;
                                        }
                                        localStorage.setItem('user', JSON.stringify(updatedUser));
                                        if (onUpdateUser) onUpdateUser(updatedUser);
                                        if (addToast) addToast(t('PROFILE_UPDATED') || 'Luxury background updated!', 'success');
                                    } catch (err) { alert("Failed to update luxury background."); }
                                    finally { setCoverUploading(false); e.target.value = ''; }
                                }
                            }} />

                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">{t('USERNAME')}</label>
                                <input type="text" value={editUsername} maxLength={19} onChange={e => setEditUsername(e.target.value.substring(0, 19))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold focus:border-[var(--gold-primary)] outline-none" placeholder={t('USERNAME_PH')} />
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">{t('DESCRIPTION')}</label>
                                <div className="relative">
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        maxLength={500}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[var(--gold-primary)] outline-none resize-none h-32 transition-all"
                                        placeholder={t('BIO_PH')}
                                    />
                                    <div className="absolute bottom-3 right-3 text-[10px] font-black text-white/20 uppercase tracking-widest">{bio?.length || 0} / 500</div>
                                </div>
                            </div>

                            <button onClick={async () => {
                                try {
                                    const trimmedBio = bio?.trim() || "";
                                    const trimmedUsername = editUsername?.trim() || "";
                                    const res = await axios.put(`/users/${displayUser?._id}`, { bio: trimmedBio, username: trimmedUsername });
                                    if (res.data) {
                                        localStorage.setItem('user', JSON.stringify(res.data));
                                        if (onUpdateUser) onUpdateUser(res.data);
                                        if (addToast) addToast(t('PROFILE_UPDATED') || "Profile updated!", 'success');
                                    }
                                    setIsEditing(false);
                                } catch (e) {
                                    console.error(e);
                                    if (addToast) addToast(e.response?.data?.message || e.response?.data || "Update failed.", 'error');
                                    else alert("Update failed.");
                                }
                            }} className="w-full py-4 bg-[var(--gold-primary)] rounded-2xl text-black font-black uppercase tracking-widest shadow-lg shadow-[var(--gold-primary)]/20 active:scale-95 transition-transform text-sm">{t('SAVE_CHANGES')}</button>
                        </div>
                    ) : (
                        <div className="p-4 sm:p-6 pb-20">
                            <div className="flex items-center gap-4 sm:gap-8 mb-6">
                                <div className="relative">
                                    <div className={`w-20 h-20 sm:w-32 sm:h-32 rounded-2xl bg-gray-800 overflow-hidden border-2 cursor-pointer shadow-xl shrink-0 ${displayUser?.role === 'Founder' ? 'border-[var(--gold-primary)]' : 'border-[var(--gold-primary)] shadow-[var(--gold-primary)]/20'}`}>
                                        <ProfileAvatar user={displayUser} size="large" key={imgKey} />
                                    </div>
                                </div>
                                <div className="flex-1 flex justify-around items-center bg-white/5 p-2 sm:p-4 rounded-2xl border border-white/5">
                                    <div className="flex flex-col items-center">
                                        <div className="font-black text-white text-base sm:text-2xl leading-none">{(userPosts || []).length}</div>
                                        <div className="text-[9px] sm:text-xs text-gray-500 uppercase tracking-widest font-bold mt-1 text-center">{t('POSTS') || 'POSTS'}</div>
                                    </div>
                                    <div onPointerDown={(e) => {
                                        e.preventDefault(); // STOP GHOST CLICK GENERATION
                                        e.stopPropagation();
                                        setClickLock(true);
                                        lastOpenedAt.current = Date.now();
                                        playSound('cyber_click');
                                        setActiveList('followers');
                                    }} className="flex flex-col items-center cursor-pointer group px-1 sm:px-2">
                                        <span className="text-base sm:text-2xl font-black text-[var(--gold-primary)] group-hover:text-white transition-colors leading-none">
                                            {displayUser?.role === 'Founder' ? '236M' : (displayUser?.followers?.length || 0)}
                                        </span>
                                        <span className="text-[9px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 text-center">{t('FOLLOWERS') || 'FOLLOWERS'}</span>
                                    </div>
                                    <div onPointerDown={(e) => {
                                        e.preventDefault(); // STOP GHOST CLICK GENERATION
                                        e.stopPropagation();
                                        setClickLock(true);
                                        lastOpenedAt.current = Date.now();
                                        playSound('cyber_click');
                                        setActiveList('following');
                                    }} className="flex flex-col items-center cursor-pointer group px-1 sm:px-2">
                                        <span className="text-base sm:text-2xl font-black text-white group-hover:text-[var(--gold-primary)] transition-colors leading-none">
                                            {displayUser?.following?.length || 0}
                                        </span>
                                        <span className="text-[9px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 text-center">{t('FOLLOWING') || 'FOLLOWING'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6 px-1">
                                <div className="flex flex-col gap-1">
                                    <div className="font-black text-white text-xl flex items-center gap-2">
                                        {displayUser?.username || "Unknown Agent"}
                                        <VerifiedBadge isFounder={displayUser?.role === 'Founder'} className="w-5 h-5" />
                                        <div className={`ml-2 w-3 h-3 rounded-full border-2 border-black ${isUserOnline(displayUser, currentUser) ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-gray-600'}`} title={isUserOnline(displayUser, currentUser) ? t('ONLINE') : t('OFFLINE')} />
                                    </div>
                                    {displayUser?.role === 'Founder' && (
                                        <div className="flex items-center gap-1.5 mt-1 bg-gradient-to-r from-[var(--gold-primary)]/20 to-[var(--gold-primary)]/5 px-2.5 py-1 rounded-lg border border-[var(--gold-primary)]/40 w-fit">
                                            <FounderBadge className="w-5 h-5" />
                                            <span className="text-[10px] text-[var(--gold-primary)] uppercase font-black tracking-widest">{t('FOUNDER_BADGE', 'LEGACY FOUNDER')}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{t('DESCRIPTION')}</div>
                                    <div className="text-sm text-gray-300 leading-relaxed max-w-sm whitespace-pre-wrap font-medium">
                                        {parseHashtags(displayUser?.bio && displayUser.bio.trim() !== "" ? displayUser.bio : t("DEFAULT_BIO"))}
                                    </div>
                                </div>

                                {isMe ? (
                                    <button onClick={() => setIsEditing(true)} className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black tracking-wider hover:bg-white/10 transition-all uppercase px-2 truncate min-h-[48px]">{t('EDIT_PROFILE')}</button>
                                ) : (
                                    <div className="flex-1 flex gap-2">
                                        <button disabled={followLoading[displayUser?._id]} onClick={() => onFollow(displayUser)} className={`flex-1 py-3 ${isFollowing ? 'bg-white/5 border border-white/10 text-gray-400' : 'bg-[var(--gold-primary)] text-black shadow-lg shadow-[var(--gold-primary)]/20'} rounded-2xl text-[10px] font-black tracking-widest hover:scale-[0.98] transition-all uppercase disabled:opacity-50`}>
                                            {isFollowing ? t('UNFOLLOW') : (hasRequested ? t('REQUESTED') : t('FOLLOW'))}
                                        </button>

                                        {/* COMMS BUTTON (Protected by Guard Chat) */}
                                        <button
                                            onPointerDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (displayUser?.isFollowersOnly && !isFollowing && !isMe) {
                                                    return;
                                                }
                                                onOpenChat(displayUser);
                                            }}
                                            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all active:scale-95 group touch-manipulation"
                                        >
                                            <Icons.Ghost className={`w-5 h-5 ${displayUser?.isFollowersOnly && !isFollowing && !isMe ? 'text-gray-600' : ''}`} />
                                        </button>

                                        {currentUser?.role === 'Founder' && (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const targetId = displayUser?._id || displayUser?.id || (typeof displayUser === 'string' ? displayUser : null);
                                                    if (!targetId) return;
                                                    if (!window.confirm(t('CONFIRM_BAN'))) return;
                                                    try {
                                                        await axios.post(`/users/${targetId}/ban`, { days: 3 });
                                                    } catch (e) { }
                                                }}
                                                className="px-3 py-3 bg-red-600/20 border border-red-500/40 rounded-2xl text-red-500 font-black text-[9px] tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 leading-none flex items-center justify-center min-w-[70px]"
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

                            {/* PRIVACY LOCK SCREEN */}
                            {displayUser?.isPrivate && !isMe && !isFollowing ? (
                                <div className="p-12 text-center space-y-6 bg-white/[0.02] border border-white/5 rounded-3xl mt-4 animate-fade-in group mx-2">
                                    <div className="w-24 h-24 mx-auto bg-black/40 rounded-full flex items-center justify-center border border-white/5 group-hover:border-[var(--gold-primary)]/40 transition-all relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--gold-primary)]/10 to-transparent animate-pulse" />
                                        <Icons.Shield className="w-12 h-12 text-gray-500 group-hover:text-[var(--gold-primary)] transition-all relative z-10" />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="font-black text-white text-xl uppercase tracking-[0.2em]">{t('PRIVATE_TITLE')}</h3>
                                        <div className="h-0.5 w-12 bg-[var(--gold-primary)] mx-auto opacity-50" />
                                        <p className="text-gray-500 text-[11px] uppercase tracking-widest leading-relaxed mx-auto max-w-[240px] font-bold">{t('PRIVATE_DESC')}</p>
                                    </div>
                                    <button onClick={() => onFollow(displayUser)} className="px-8 py-3 bg-[var(--gold-primary)] text-black rounded-xl text-[10px] font-black tracking-[0.2em] hover:scale-105 active:scale-95 transition-all uppercase shadow-lg shadow-[var(--gold-primary)]/20">
                                        {hasRequested ? t('REQUESTED') : t('FOLLOW_TO_VIEW')}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {userStories.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">{t('HIGHLIGHTS')}</h3>
                                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                                {userStories.map(s => {
                                                    const isYT = isYouTubeUrl(s.videoUrl);
                                                    const isNativeVideo = (!isYT) && ((s.videoUrl && s.videoUrl.match(/\.(mp4|mov|webm|avi|m4v)$/i)) || (s.image && s.image.match(/\.(mp4|mov|webm|avi|m4v)$/i)));
                                                    const hasMedia = s.image || s.videoUrl || s.thumbnailUrl;
                                                    let ytThumb = null;
                                                    if (isYT) {
                                                        const m = /^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i.exec(s.videoUrl || '');
                                                        if (m) ytThumb = `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
                                                    }
                                                    return (
                                                        <div key={s._id} onClick={() => onOpenDetail(s)} className="shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
                                                            <div className="w-16 h-16 rounded-full border-2 border-[var(--gold-primary)] p-0.5 shadow-lg shadow-[var(--gold-primary)]/10 bg-black overflow-hidden relative">
                                                                {hasMedia ? (
                                                                    isNativeVideo ? (
                                                                        <video
                                                                            src={resolveMediaUrl(s.videoUrl || s.image)}
                                                                            className="w-full h-full object-cover rounded-full pointer-events-none"
                                                                            autoPlay
                                                                            muted
                                                                            loop
                                                                            playsInline
                                                                            preload="auto"
                                                                            onLoadedMetadata={(e) => { e.target.currentTime = 0.1; }}
                                                                        />
                                                                    ) : isYT ? (
                                                                        <div className="w-full h-full relative">
                                                                            <img src={ytThumb || resolveMediaUrl(s.thumbnailUrl || s.image)} className="w-full h-full object-cover rounded-full" alt="" />
                                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                                <div className="w-6 h-6 rounded-full bg-red-600/90 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.8)]">
                                                                                    <Icons.Play className="w-3.5 h-3.5 text-white -ml-0.5" />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <img src={resolveMediaUrl(s.thumbnailUrl || s.image)} className="w-full h-full object-cover rounded-full" />
                                                                    )
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center p-1 rounded-full">
                                                                        <span className="text-[6px] text-gray-300 font-medium text-center leading-tight line-clamp-3">
                                                                            {s.desc}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{formatDate(s.createdAt, t, lang)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6 pb-20">
                                        {loadingPosts ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                                <div className="w-8 h-8 border-2 border-[var(--gold-primary)] border-t-transparent rounded-full animate-spin" />
                                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest animate-pulse">{t('SCANNING')}</div>
                                            </div>
                                        ) : userPosts.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2">
                                                    <Icons.Folder className="w-6 h-6 text-gray-600" />
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{t('NO_INTEL') || 'SECURED AREA. NO INTEL FOUND.'}</div>
                                            </div>
                                        ) : (
                                            Object.keys(groupedUserPosts).map(dateKey => {
                                                return (
                                                    <div key={dateKey} className="group animate-fade-in">
                                                        <div className="flex items-center gap-3 mb-6 px-1 opacity-80 mt-4">
                                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-1 h-3 bg-[var(--gold-primary)] rounded-full shadow-glow-gold" />
                                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 font-mono">{dateKey}</span>
                                                            </div>
                                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                        </div>
                                                        <AnimatePresence>
                                                            <div className="overflow-hidden">
                                                                <div className="grid grid-cols-3 gap-1 sm:gap-1.5 pt-2 mb-8">
                                                                    {groupedUserPosts[dateKey].map(p => (
                                                                        <div
                                                                            key={p._id}
                                                                            onClick={() => onOpenDetail(p)}
                                                                            className="aspect-square bg-gray-900 border border-white/5 rounded-xl overflow-hidden relative cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center group/card shadow-2xl"
                                                                        >
                                                                            {(isYouTubeUrl(p.videoUrl) || p.thumbnailUrl) ? (
                                                                                <img src={p.thumbnailUrl ? resolveMediaUrl(p.thumbnailUrl) : `https://img.youtube.com/vi/${(p.videoUrl || '').match(/^\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i)?.[1]}/hqdefault.jpg`} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500" />
                                                                            ) : (p.videoUrl || (p.image && p.image.match(/\.(mp4|mov|webm)$/i))) ? (
                                                                                <div className="relative w-full h-full">
                                                                                    <video
                                                                                        src={resolveMediaUrl(p.videoUrl || p.image)}
                                                                                        muted
                                                                                        playsInline
                                                                                        preload="metadata"
                                                                                        poster={resolveMediaUrl(p.thumbnailUrl || p.videoUrl || p.image, null, false, true)}
                                                                                        className="w-full h-full object-cover bg-gray-900 group-hover/card:scale-110 transition-transform duration-500"
                                                                                    />
                                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                                                                        <Icons.Play className="w-6 h-6 text-white/80" />
                                                                                    </div>
                                                                                </div>
                                                                            ) : p.image ? (
                                                                                <img src={resolveMediaUrl(p.image)} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500" />
                                                                            ) : (
                                                                                <div className="p-2 text-center break-words w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black group-hover/card:scale-110 transition-transform duration-500">
                                                                                    <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold leading-tight">{p.desc?.substring(0, 25)}...</span>
                                                                                </div>
                                                                            )}

                                                                            {/* STATS OVERLAY on hover */}
                                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-white"><Icons.Heart className="w-3 h-3 text-[var(--gold-primary)]" /> {p.likes?.length || 0}</div>
                                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-white"><Icons.MessageSquare className="w-3 h-3 text-[var(--gold-primary)]" /> {p.comments?.length || 0}</div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const CreateModal = ({ isOpen, onClose, onCreatePost, user, forceStory = false }) => {
    const [preview, setPreview] = useState(null);
    const [isVideo, setIsVideo] = useState(false);
    const [isAudio, setIsAudio] = useState(false);
    const [audioName, setAudioName] = useState('');
    const [isStory, setIsStory] = useState(forceStory);

    useEffect(() => {
        if (isOpen) {
            setIsStory(forceStory);
        }
    }, [isOpen, forceStory]);
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
            if (dur && dur > 1200) {
                alert(t('VIDEO_ERROR'));
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-sm glass-panel bg-black/30 backdrop-blur-3xl p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
                <div className="overflow-y-auto custom-scrollbar pr-1 flex-1 pb-4">
                    <h2 className="text-xl font-black italic mb-4 text-white uppercase tracking-tighter">{t('UPLOAD_TITLE')}</h2>
                    <div className="flex gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10">
                            <ProfileAvatar user={user} />
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            <textarea id="c-desc" name="description" placeholder={t('DECRYPT_PH')} className="w-full bg-transparent text-base outline-none text-white resize-none h-24 placeholder-gray-500 font-bold" />
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.1)] group/note">
                                <Icons.Info className="w-4 h-4 text-red-500 shrink-0 group-hover/note:animate-pulse" />
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none">
                                    {t('VIDEO_LIMIT_NOTE') || 'ONLY VIDEOS UP TO 20 MINUTES ALLOWED'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* YouTube URL input */}
                    <div className="mb-3">
                        <input id="c-youtube" name="youtube-url" placeholder={t('YOUTUBE_PH')} className="w-full bg-black/20 border border-white/5 rounded-xl p-2 text-sm text-white outline-none placeholder-gray-500" onChange={(e) => {
                            const v = e.target.value?.trim() || '';
                            const id = getYouTubeId(v);
                            if (id) {
                                setPreview(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
                                setIsVideo(false); // Youtube is a thumbnail preview (image)
                                setIsAudio(false);
                            } else if (!v) {
                                setPreview(null);
                                setIsVideo(false);
                            }
                        }} />
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
                                <span className="text-xs font-bold uppercase tracking-widest">{t('UPLOAD_MEDIA')}</span>
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
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider mt-0.5">{t('STORY_DURATION')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs hover:bg-white/10 text-white uppercase tracking-widest">{t('CANCEL')}</button>
                        <button onClick={() => {
                            const desc = document.getElementById('c-desc').value;
                            const youtube = document.getElementById('c-youtube').value;
                            const file = fileRef.current.files[0];
                            if (!desc && !file && !youtube) return;
                            const fd = new FormData();
                            fd.append('desc', desc);
                            if (youtube) fd.append('videoUrl', youtube.trim());
                            else if (file) fd.append('image', file);
                            fd.append('isStory', isStory);

                            // Trigger optimistic upload
                            onCreatePost(fd, preview, isStory);

                            // Reset logic
                            document.getElementById('c-desc').value = '';
                            document.getElementById('c-youtube').value = '';
                            setPreview(null);
                            if (fileRef.current) fileRef.current.value = '';
                            setIsStory(false);
                        }} className={`flex-1 py-3 bg-[var(--gold-primary)] hover:opacity-90 rounded-xl text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-[var(--gold-primary)]/20 active:scale-95 transition-transform`}>
                            {isStory ? t('POST_STORY') : t('POST')}
                        </button>
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
    const [youtubeUrl, setYoutubeUrl] = useState(''); // Tracking state to fix ReferenceError
    const [saving, setSaving] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        if (post) {
            setDesc(post.desc || '');
            setPreview(post.image ? resolveMediaUrl(post.image) : (post.thumbnailUrl ? resolveMediaUrl(post.thumbnailUrl) : null));
            const isYT = isYouTubeUrl(post.videoUrl);
            setIsVideo(isYT ? false : (post.videoUrl ? true : (post.image?.match(/\.(mp4|mov|webm)$/i) ? true : false)));
            // initialize youtube state
            setYoutubeUrl(isYT ? post.videoUrl : '');
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
            if (dur && dur > 1200) {
                alert(t('VIDEO_ERROR'));
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

        // Use state instead of direct DOM access for consistency
        if (typeof youtubeUrl === 'string') {
            fd.append('videoUrl', youtubeUrl.trim());
        }

        if (file) {
            fd.append('image', file);
        } else if (!preview && !youtubeUrl) {
            // If user cleared everything, we might want to tell backend to remove media
            // Depending on backend, a specific flag or empty videoUrl might do it.
        }

        try {
            setSaving(true);
            await axios.put(`/posts/${post._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            onSuccess();
            playSound('cyber_scroll');
        } catch (e) {
            console.error("Edit failed", e);
            const detail = e.response?.data?.detail || e.response?.data?.message || e.message;
            alert(`Neural link failure: ${detail}`);
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-md glass-panel bg-black/40 backdrop-blur-3xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
                <div className="overflow-y-auto custom-scrollbar pr-1 flex-1 pb-6">
                    <h2 className="text-xl font-black italic mb-4 text-white uppercase tracking-tighter">{t('EDIT_INTEL')}</h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" /> {t('DESCRIPTION') || 'DESCRIPTION'}
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-tr from-[var(--gold-primary)]/20 to-transparent rounded-[1.5rem] blur opacity-30 group-focus-within:opacity-100 transition-opacity" />
                                <textarea
                                    value={desc}
                                    onChange={e => setDesc(e.target.value)}
                                    placeholder={t('DECRYPT_PH') || "Decrypt your thoughts..."}
                                    className="relative w-full bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] px-5 py-4 text-[15px] text-white outline-none min-h-[150px] max-h-[50vh] resize-y placeholder-gray-600 focus:border-[var(--gold-primary)]/40 hover:border-white/20 transition-all custom-scrollbar shadow-inner"
                                />
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.1)] group/note w-full">
                                    <Icons.Info className="w-5 h-5 text-red-500 shrink-0 group-hover/note:animate-pulse" />
                                    <span className="text-[11px] font-black text-red-500 uppercase tracking-widest leading-none">
                                        {t('VIDEO_LIMIT_NOTE') || 'ONLY VIDEOS UP TO 20 MINUTES ALLOWED'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">
                                YouTube URL
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-white/5 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <input
                                    id="edit-youtube"
                                    value={youtubeUrl}
                                    placeholder="https://youtube.com/..."
                                    className="relative w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder-gray-700 focus:border-[var(--gold-primary)]/40 hover:border-white/20 transition-all shadow-inner"
                                    onChange={(e) => {
                                        const v = e.target.value || '';
                                        setYoutubeUrl(v);
                                        const id = getYouTubeId(v);
                                        if (id) {
                                            const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
                                            setPreview(thumb);
                                            setIsVideo(false);
                                        } else if (!v) {
                                            if (!fileRef.current?.files[0]) {
                                                setPreview(null);
                                                setIsVideo(false);
                                            }
                                        }
                                    }} />
                            </div>
                        </div>


                        <div onClick={() => fileRef.current?.click()} className="cursor-pointer mb-4">
                            {preview ? (
                                <div className="w-full min-h-[200px] aspect-video rounded-2xl overflow-hidden relative bg-black/60 border border-white/10 shadow-2xl flex items-center justify-center group/preview">
                                    {isVideo ? (
                                        <video src={preview} className="w-full h-full object-contain" controls />
                                    ) : (
                                        <img src={preview} className="w-full h-full object-contain" alt="Neural Preview" />
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreview(null);
                                            setIsVideo(false);
                                            setYoutubeUrl('');
                                            if (fileRef.current) fileRef.current.value = '';
                                        }}
                                        className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-xl hover:bg-red-500 text-white transition-all shadow-xl border border-white/10 opacity-0 group-hover/preview:opacity-100"
                                    >
                                        <Icons.X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full py-10 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/5 hover:border-[var(--gold-primary)]/40 transition-all text-gray-500 cursor-pointer group">
                                    <Icons.Image className="w-8 h-8 opacity-30 group-hover:scale-110 group-hover:text-[var(--gold-primary)] transition-all" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-gray-300">{t('UPDATE_MEDIA')}</span>
                                </div>
                            )}
                            <input type="file" ref={fileRef} accept="image/*,video/*,audio/*" hidden onChange={handleFileChange} />
                        </div>

                        <div className="flex gap-4">
                            <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs hover:bg-white/10 text-white uppercase tracking-widest">{t('CANCEL')}</button>
                            <button disabled={saving} onClick={handleSave} className={`flex-1 py-3 ${saving ? 'opacity-60 cursor-wait' : 'bg-[var(--gold-primary)] hover:opacity-90'} rounded-xl text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-glow-gold/40 active:scale-95 transition-transform`}>{saving ? '...' : t('PUBLISH')}</button>
                        </div>
                    </div>
                </div>
            </motion.div >
        </div>
    );
};

const applyTheme = (color) => {
    const getSecondary = (hex) => {
        if (hex === '#ffffff') return '#888888';
        if (hex === '#ffd700') return '#b8860b';
        return hex + 'aa';
    };
    const getHover = (hex) => {
        if (hex === '#ffffff') return '#f0f0f0';
        return hex + 'cc';
    };
    const secondary = getSecondary(color);
    const hover = getHover(color);
    const glow = `${color}44`;
    const glowSoft = `${color}1a`;

    document.documentElement.style.setProperty('--gold-primary', color);
    document.documentElement.style.setProperty('--gold-secondary', secondary);
    document.documentElement.style.setProperty('--gold-hover', hover);
    document.documentElement.style.setProperty('--gold-glow', glow);
    document.documentElement.style.setProperty('--gold-glow-soft', glowSoft);

    localStorage.setItem('themeColor', color);
    localStorage.setItem('themeSecondary', secondary);
    localStorage.setItem('themeHover', hover);
    localStorage.setItem('themeGlow', glow);
    localStorage.setItem('themeGlowSoft', glowSoft);
};

const App = () => {
    const searchParams = new URLSearchParams(window.location.search);
    // Profile Sync Logic
    const viewPostId = searchParams.get('postId');
    const [user, setUser] = useState(null);
    const [imgKey, setImgKey] = useState(Date.now());
    const { t, i18n, lang } = useTranslation();
    const [uploadProgress, setUploadProgress] = useState(0);
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
    const [posts, setPosts] = useState(() => {
        // FAST HYDRATION: Return cached posts instantly while fetching new ones
        const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('cached_posts') : null;
        try { return cached ? JSON.parse(cached) : []; } catch (e) { return []; }
    });
    const [lastDeletedPostId, setLastDeletedPostId] = useState(null);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('home');
    const [searchQuery, setSearchQuery] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [createModeStory, setCreateModeStory] = useState(false);
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
    const [expandedDates, setExpandedDates] = useState({});
    const [showScrollTop, setShowScrollTop] = useState(false);
    const mainScrollRef = useRef(null);
    const selectedPostRef = useRef(selectedPost);
    const postsRef = useRef(posts);

    const lastScrollTime = useRef(0);
    const handleScroll = (e) => {
        const now = Date.now();
        if (now - lastScrollTime.current < 100) return; // Throttle to 10fps
        lastScrollTime.current = now;

        if (e.target.scrollTop > 500) {
            setShowScrollTop(true);
        } else {
            setShowScrollTop(false);
        }
    };

    const scrollToTop = () => {
        if (mainScrollRef.current) {
            mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            playSound('cyber_scroll');
        }
    };

    // Keep refs correctly updated
    useEffect(() => { selectedPostRef.current = selectedPost; }, [selectedPost]);
    useEffect(() => { postsRef.current = posts; }, [posts]);
    const isProcessingRequest = useRef(false);

    // SCROLL TO TOP ON LOGIN / TAB CHANGE
    useEffect(() => {
        if (mainScrollRef.current) {
            mainScrollRef.current.scrollTo(0, 0);
        }
    }, [user?._id, activeTab]);

    const toggleDate = (dateKey) => {
        setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
        playSound('pop');
    };

    const updateUserState = (newData) => {
        if (!newData) {
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            return;
        }
        setUser(prev => {
            const current = prev || JSON.parse(localStorage.getItem('user') || '{ }');
            // Cache-break the new image if it's identical base path
            let nextPic = newData.profilePic;
            if (current.profilePic && nextPic && current.profilePic.split('?')[0] === nextPic.split('?')[0]) {
                const sep = nextPic.includes('?') ? '&' : '?';
                nextPic = `${nextPic.split('?')[0]}${sep}t=${Date.now()}`;
            }
            const merged = { ...current, ...newData, profilePic: nextPic || current.profilePic };
            localStorage.setItem('user', JSON.stringify(merged));
            return merged;
        });
    };

    const handleUpdateUser = (updatedUser) => {
        // Force cache-breaker on profilePic for immediate refresh
        if (updatedUser.profilePic && !updatedUser.profilePic.includes('t=')) {
            const sep = updatedUser.profilePic.includes('?') ? '&' : '?';
            updatedUser.profilePic += `${sep}t=${Date.now()}`;
        }
        if (updatedUser.coverPic && !updatedUser.coverPic.includes('t=')) {
            const sep = updatedUser.coverPic.includes('?') ? '&' : '?';
            updatedUser.coverPic += `${sep}t=${Date.now()}`;
        }

        // 1. Update primary user state
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setImgKey(Date.now());
        // Sync with global users list so others/searches see it immediately too
        setUsers(prev => prev.map(u => String(u._id) === String(updatedUser._id) ? updatedUser : u));

        // 2. Synchronize across all local state arrays for immediate UI update
        const userId = String(updatedUser._id || updatedUser.id);

        // Update 'users' array
        setUsers(prev => prev.map(u => String(u._id) === userId ? { ...u, ...updatedUser } : u));

        // Update 'posts' array (authors, direct profilePic, and comments authors)
        setPosts(prev => prev.map(p => {
            let updatedPost = p;
            if (String(p.author?._id || p.author) === userId) {
                const updatedAuthor = typeof p.author === 'object' ? { ...p.author, ...updatedUser } : p.author;
                updatedPost = { ...updatedPost, author: updatedAuthor, profilePic: updatedUser.profilePic };
            }

            // Deep sync comments
            if (p.comments?.some(c => String(c.authorId) === userId)) {
                updatedPost = {
                    ...updatedPost,
                    comments: p.comments.map(c => String(c.authorId) === userId ? { ...c, authorProfilePic: updatedUser.profilePic } : c)
                };
            }
            return updatedPost;
        }));

        // stories will update automatically via useMemo since it depends on 'posts'

        // Update selectedPost if open
        if (selectedPost && String(selectedPost.author?._id || selectedPost.author) === userId) {
            setSelectedPost(prev => {
                const updatedAuthor = typeof prev.author === 'object' ? { ...prev.author, ...updatedUser } : prev.author;
                return { ...prev, author: updatedAuthor, profilePic: updatedUser.profilePic };
            });
        }

        // 3. Background background sync
        fetchPosts();
        fetchUsers();
    };


    useEffect(() => {
        const saved = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (saved && !token) {
            localStorage.removeItem('user');
            setUser(null);
        } else if (saved) {
            setUser(JSON.parse(saved));
        }

        const savedTheme = JSON.parse(localStorage.getItem('user'))?.settings?.theme || localStorage.getItem('themeColor');
        if (savedTheme) applyTheme(savedTheme);

        // SYNC USER DATA & THEME LIVE ACROSS TABS
        const handleStorageChange = (e) => {
            if (e.key === 'themeColor' && e.newValue) {
                applyTheme(e.newValue);
            }
            if (e.key === 'user' && e.newValue) {
                console.log("🔄 [SYNC] User data changed in another tab, updating...");
                const updatedUser = JSON.parse(e.newValue);
                setUser(updatedUser);
                setImgKey(Date.now()); // Force refresh all avatars
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Sync theme when user object updates (e.g. from backend)
    useEffect(() => {
        if (user?.settings?.theme) {
            applyTheme(user.settings.theme);
        }
    }, [user?.settings?.theme]);

    // Use a ref to track the last user ID we initialized for, to avoid loops
    const lastInitializedId = useRef(null);

    useEffect(() => {
        if (user && user._id !== lastInitializedId.current) {
            lastInitializedId.current = user._id;

            // 🔥 INITIAL FETCH
            fetchPosts();
            fetchUsers();
            fetchNotifications();

            // 🔥 SOCKET JOIN ROOM
            socket.emit('join', user._id);
            console.log(`📡 [SOCKET] Joining personal room: ${user._id}`);

            // 🔥 START PERSISTENT PINGS
            startHeartbeat();

            // Polling fallback (reduced frequency since we have real-time now)
            startUserPoll();     // Every 10s (for online status)
            startPostPoll();     // Every 30s as fallback
            startNotificationPoll(); // Every 60s as fallback
        } else if (!user) {
            lastInitializedId.current = null;
            stopHeartbeat();
            stopUserPoll();
            stopPostPoll();
            stopNotificationPoll();
        }
    }, [user]);

    // 🔥 GLOBAL REAL-TIME LISTENERS
    useEffect(() => {
        if (!user) return;

        const onNotificationRecv = (data) => {
            console.log("📡 [SOCKET] Real-time notification received", data);
            playSound('cyber_notification');
            fetchNotifications(); // Refresh list
        };

        const onPostDeleted = (data) => {
            console.log("📡 [SOCKET] Post deleted real-time:", data.postId);
            setPosts(prev => prev.filter(p => p._id !== data.postId));
            if (selectedPost && selectedPost._id === data.postId) {
                setSelectedPost(null);
                addToast(t('POST_DELETED_REALTIME') || 'Post was deleted.', 'info');
            }
        };

        const onPostLiked = (data) => {
            console.log("📡 [SOCKET] Post like updated real-time:", data.postId);
            const updateFn = (p) => {
                if (String(p._id) !== String(data.postId)) return p;
                return { ...p, likes: data.likes, dislikes: data.dislikes };
            };
            setPosts(prev => prev.map(updateFn));
            setSelectedPost(prev => {
                if (prev && String(prev._id) === String(data.postId)) {
                    return updateFn(prev);
                }
                return prev;
            });
        };

        const onCommentSync = (data) => {
            console.log("📡 [SOCKET] Comments updated real-time:", data.postId);
            const updateFn = (p) => {
                if (String(p._id) !== String(data.postId)) return p;
                return { ...p, comments: data.comments };
            };
            setPosts(prev => prev.map(updateFn));
            setSelectedPost(prev => {
                if (prev && String(prev._id) === String(data.postId)) {
                    return updateFn(prev);
                }
                return prev;
            });
        };

        const onUserStatus = (data) => {
            console.log("📡 [SOCKET] User status change:", data);
            setUsers(prev => prev.map(u => String(u._id) === String(data.userId) ? { ...u, lastSeen: data.lastSeen } : u));
            setProfileUser(prev => {
                if (prev && String(prev._id) === String(data.userId)) {
                    return { ...prev, lastSeen: data.lastSeen };
                }
                return prev;
            });
        };

        const onUserUpdated = (data) => {
            console.log("📡 [SOCKET] User updated real-time:", data._id);

            setUsers(prev => prev.map(u => String(u._id) === String(data._id) ? { ...u, ...data } : u));

            setProfileUser(prev => {
                if (prev && String(prev._id) === String(data._id)) {
                    return { ...prev, ...data };
                }
                return prev;
            });

            if (user && String(user._id) === String(data._id)) {
                setUser(prev => {
                    const nextData = { ...data };
                    // Force cache-break for other devices
                    const timestamp = Date.now();
                    if (nextData.profilePic) {
                        const sep = nextData.profilePic.includes('?') ? '&' : '?';
                        nextData.profilePic += `${sep}t=${timestamp}`;
                    }
                    if (nextData.coverPic) {
                        const sep = nextData.coverPic.includes('?') ? '&' : '?';
                        nextData.coverPic += `${sep}t=${timestamp}`;
                    }
                    const updated = { ...prev, ...nextData };
                    localStorage.setItem('user', JSON.stringify(updated));
                    return updated;
                });
            }
        };

        socket.on('notification.received', onNotificationRecv);
        socket.on('post.deleted', onPostDeleted);
        socket.on('post.liked', onPostLiked);
        socket.on('comment.added', onCommentSync);
        socket.on('comment.deleted', onCommentSync);
        socket.on('comment.updated', onCommentSync);
        socket.on('user.status', onUserStatus);
        socket.on('user.updated', onUserUpdated);

        return () => {
            socket.off('notification.received', onNotificationRecv);
            socket.off('post.deleted', onPostDeleted);
            socket.off('post.liked', onPostLiked);
            socket.off('comment.added', onCommentSync);
            socket.off('comment.deleted', onCommentSync);
            socket.off('comment.updated', onCommentSync);
            socket.off('user.status', onUserStatus);
            socket.off('user.updated', onUserUpdated);
        };
    }, [user, selectedPost?._id]);


    // FIX: Optimized search filtering with useMemo
    const filteredPosts = React.useMemo(() => {
        return (posts || []).filter(p => {
            // Robust check for stories - exclude them from feed
            const storyFlag = p.isStory === true || String(p.isStory) === 'true';
            if (storyFlag) return false;
            const q = searchQuery.toLowerCase();
            if (!q) return true;
            const descMatch = p.desc ? p.desc.toLowerCase().includes(q) : false;
            const authorMatch = p.author?.username ? p.author.username.toLowerCase().includes(q) : (p.username ? p.username.toLowerCase().includes(q) : false);
            return descMatch || authorMatch;
        });
    }, [posts, searchQuery]);

    const groupedPosts = React.useMemo(() => {
        const groups = {};
        const lang = user?.settings?.language || 'en';
        const locale = lang === 'el' ? 'el-GR' : lang === 'de' ? 'de-DE' : 'en-US';
        filteredPosts.forEach(p => {
            const date = new Date(p.createdAt);
            const key = date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = { key, posts: [], dateVal: date.setHours(0, 0, 0, 0) };
            groups[key].posts.push(p);
        });
        // Convert to array and sort DESCENDING (Newest first)
        return Object.values(groups).sort((a, b) => b.dateVal - a.dateVal);
    }, [filteredPosts, user]);

    // AUTO-EXPAND FEED FOLDERS (Open Latest Folder)
    useEffect(() => {
        if (groupedPosts.length > 0) {
            // Always open the most recent folder (first in list)
            const latestKey = groupedPosts[0].key;
            setExpandedDates(prev => ({ ...prev, [latestKey]: true }));
        }
    }, [groupedPosts.length, groupedPosts[0]?.key]);

    const stories = React.useMemo(() => {
        return posts.filter(p => {
            const isStory = p.isStory === true || String(p.isStory) === 'true';
            if (!isStory) return false;
            // Filter only last 24h
            if ((Date.now() - new Date(p.createdAt).getTime()) > 24 * 60 * 60 * 1000) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [posts]);

    const trendingHashtags = React.useMemo(() => {
        const counts = {};
        posts.forEach(p => {
            if (!p.desc) return;
            const tags = p.desc.match(/#[\p{L}\p{N}_]+/gu);
            if (tags) {
                tags.forEach(tag => {
                    const normalized = tag.toLowerCase();
                    counts[normalized] = (counts[normalized] || 0) + 1;
                });
            }
        });
        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([tag]) => tag);
    }, [posts]);

    const fetchPosts = async () => {
        if (selectedPostRef.current) return;
        try {
            const res = await axios.get(`/posts?limit=30&t=${Date.now()}`);
            setPosts(res.data);
            // Cache posts for instant load next time
            localStorage.setItem('cached_posts', JSON.stringify(res.data.slice(0, 20)));
        } catch (e) { }
    };
    const fetchUsers = async (specificId = null) => {
        try {
            if (specificId) {
                // Targeted refresh for instant online status
                const res = await axios.get(`/users/find/${specificId}?t=${Date.now()}`);
                if (res.data) {
                    setUsers(prev => {
                        const exists = prev.find(u => String(u._id) === String(specificId));
                        if (exists) return prev.map(u => String(u._id) === String(specificId) ? res.data : u);
                        return [...prev, res.data];
                    });
                    // Also update profileUser if the profile modal is open for this user
                    setProfileUser(prev => {
                        if (prev && String(prev._id) === String(specificId)) {
                            return { ...prev, ...res.data };
                        }
                        return prev;
                    });
                }
                return;
            }
            const res = await axios.get(`/users?t=${Date.now()}`);
            // Sync self (fix for "Follow" button state not updating without reload)
            if (user) {
                const me = res.data.find(u => String(u._id) === String(user._id));
                if (me) {
                    setUser(prev => {
                        if (!prev) return prev;
                        // CLEAN URL COMPARISON (Ignore local timestamps)
                        const clean = (url) => url ? url.split('?')[0] : '';
                        const isDiff =
                            JSON.stringify(prev.following) !== JSON.stringify(me.following) ||
                            JSON.stringify(prev.followers) !== JSON.stringify(me.followers) ||
                            JSON.stringify(prev.followRequests) !== JSON.stringify(me.followRequests) ||
                            clean(prev.profilePic) !== clean(me.profilePic) ||
                            prev.username !== me.username ||
                            prev.bio !== me.bio;

                        if (isDiff) {
                            console.log("🔄 [SYNC] Self-profile updated from network poll");

                            // If picture changed, force new timestamp
                            let nextPic = me.profilePic;
                            if (clean(prev.profilePic) !== clean(me.profilePic)) {
                                const sep = nextPic.includes('?') ? '&' : '?';
                                nextPic = `${clean(nextPic)}${sep}t=${Date.now()}`;
                                setImgKey(Date.now());
                            } else {
                                // Keep existing timestamp if pic is same (prevent flickering)
                                nextPic = prev.profilePic;
                            }

                            const updated = { ...prev, ...me, profilePic: nextPic };
                            localStorage.setItem('user', JSON.stringify(updated));
                            return updated;
                        }
                        return prev;
                    });
                }
            }
            setUsers(res.data);
        } catch (e) { }
    };

    // Notifications
    const fetchNotifications = async () => {
        if (!user || isProcessingRequest.current) return;
        try {
            // CACHE BUSTER + Strict Processing Lock
            const res = await axios.get(`/users/notifications?t=${Date.now()}`);
            if (isProcessingRequest.current) return; // Post-await safety check

            // CYBER NOTIFICATION SOUND CHECK
            if (res.data.length > (user.notifications?.length || 0)) {
                const latest = res.data[0];
                if (latest && !latest.read) playSound('cyber_notification');
            }

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
            setAlerts(prev => prev.map(a => ({ ...a, read: true })));
            setUser(prev => {
                if (!prev) return prev;
                const updated = { ...prev, notifications: prev.notifications.map(n => ({ ...n, read: true })) };
                localStorage.setItem('user', JSON.stringify(updated));
                return updated;
            });
        } catch (e) { console.error('Mark read failed', e); }
    };

    // Polling Intervals - Optimized to reduce lag
    let _notifInterval = null;
    const startNotificationPoll = () => { stopNotificationPoll(); _notifInterval = setInterval(fetchNotifications, 60000); }; // Reduced to 60s fallback
    const stopNotificationPoll = () => { if (_notifInterval) { clearInterval(_notifInterval); _notifInterval = null; } };

    let _hbInterval = null;
    const startHeartbeat = () => {
        stopHeartbeat();
        const doHb = () => {
            if (!user) return;
            axios.put('/users/heartbeat').catch(() => { });
        };
        doHb(); // Immediate
        _hbInterval = setInterval(doHb, 20000);
    };
    const stopHeartbeat = () => { if (_hbInterval) { clearInterval(_hbInterval); _hbInterval = null; } };

    let _userInterval = null;
    const startUserPoll = () => { stopUserPoll(); _userInterval = setInterval(fetchUsers, 4000); };
    const stopUserPoll = () => { if (_userInterval) { clearInterval(_userInterval); _userInterval = null; } };

    let _postInterval = null;
    const startPostPoll = () => { stopPostPoll(); _postInterval = setInterval(fetchPosts, 30000); }; // Reduced to 30s fallback
    const stopPostPoll = () => { if (_postInterval) { clearInterval(_postInterval); _postInterval = null; } };


    // Scroll behavior removed as requested (keep position)




    // Unified Scroll Lock for Modals
    useEffect(() => {
        const anyModalOpen = selectedPost || isChatOpen || isProfileOpen || isSettingsOpen || isCreateOpen || isEditOpen;
        if (anyModalOpen) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.overflow = 'hidden';
        } else {
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
            if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
        };
    }, [selectedPost, isChatOpen, isProfileOpen, isSettingsOpen, isCreateOpen, isEditOpen]);

    const handleLike = async (postId) => {
        const userId = user?._id;
        if (!userId) return;

        // 1. OPTIMISTIC UPDATE (Instant Feedback)
        const updateFn = (p) => {
            if (String(p._id) !== String(postId)) return p;
            const likes = Array.isArray(p.likes) ? [...p.likes] : [];
            const dislikes = Array.isArray(p.dislikes) ? p.dislikes.filter(id => String(id) !== String(userId)) : [];
            const hasLiked = likes.some(id => String(id) === String(userId));
            const newLikes = hasLiked ? likes.filter(id => String(id) !== String(userId)) : [...likes, userId];
            return { ...p, likes: newLikes, dislikes };
        };
        setPosts(prev => prev.map(updateFn));
        if (selectedPost && String(selectedPost._id) === String(postId)) {
            setSelectedPost(prev => updateFn(prev));
        }

        const isLiking = posts.find(p => String(p._id) === String(postId))?.likes?.includes(userId) === false;

        setLoadingActions(prev => ({ ...prev, [postId]: true }));
        if (navigator.vibrate) navigator.vibrate(50);

        try {
            const res = await axios.put(`/posts/${postId}/like`);
            // 2. SERVER SYNC (Only if valid arrays returned)
            const { likes, dislikes } = res.data;
            if (Array.isArray(likes) && Array.isArray(dislikes)) {
                setPosts(prev => {
                    const next = prev.map(p => String(p._id) === String(postId) ? { ...p, likes, dislikes } : p);
                    // Update cache immediately so it persists on reload
                    localStorage.setItem('cached_posts', JSON.stringify(next.slice(0, 20)));
                    return next;
                });
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
        const updateFn = (p) => {
            if (String(p._id) !== String(postId)) return p;
            const dislikes = Array.isArray(p.dislikes) ? [...p.dislikes] : [];
            const likes = Array.isArray(p.likes) ? p.likes.filter(id => String(id) !== String(userId)) : [];
            const hasDisliked = dislikes.some(id => String(id) === String(userId));
            const newDislikes = hasDisliked ? dislikes.filter(id => String(id) !== String(userId)) : [...dislikes, userId];
            return { ...p, likes, dislikes: newDislikes };
        };
        setPosts(prev => prev.map(updateFn));
        if (selectedPost && String(selectedPost._id) === String(postId)) {
            setSelectedPost(prev => updateFn(prev));
        }

        const isDisliking = posts.find(p => String(p._id) === String(postId))?.dislikes?.includes(userId) === false;

        setLoadingActions(prev => ({ ...prev, [postId]: true }));
        if (navigator.vibrate) navigator.vibrate(50);


        try {
            const res = await axios.put(`/posts/${postId}/dislike`);
            // 2. SERVER SYNC (Validate Data First)
            const { likes, dislikes } = res.data;
            if (Array.isArray(likes) && Array.isArray(dislikes)) {
                setPosts(prev => {
                    const next = prev.map(p => String(p._id) === String(postId) ? { ...p, likes, dislikes } : p);
                    localStorage.setItem('cached_posts', JSON.stringify(next.slice(0, 20)));
                    return next;
                });
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
        setLoadingActions(prev => ({ ...prev, [postId]: true }));
        playSound('cyber_comment');
        const textValue = (input instanceof FormData) ? null : (typeof input === 'string' ? input : (input?.text || ""));
        let tempId = 'temp-' + Date.now();

        // 1. OPTIMISTIC UI UPDATE
        if (textValue) {
            const tempComment = {
                _id: tempId,
                text: textValue,
                authorId: user?._id || user?.id,
                authorName: user?.username,
                authorProfilePic: user?.profilePic,
                user: user, // Keep for backward/forward compatibility in CommentItem
                createdAt: new Date().toISOString(),
                isOptimistic: true
            };
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: [...(p.comments || []), tempComment] } : p));
            if (selectedPost?._id === postId) setSelectedPost(prev => ({ ...prev, comments: [...(prev.comments || []), tempComment] }));
        }

        try {
            // ALWAYS use FormData to satisfy backend 'upload.single' middleware
            let formData;
            let res;
            if (input instanceof FormData) {
                formData = input;
            } else {
                formData = new FormData();
                formData.append('text', textValue);
            }
            // Append explicit user ID for redundancy if needed, though token is primary
            // Remove 'user' object to prevent JSON parsing issues, rely on token

            console.log(`📡 [DEBUG] Sending comment to /posts/${postId}/comment with FormData`);
            res = await axios.post(`/posts/${postId}/comment`, formData);
            const updatedComments = res.data;
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updatedComments } : p));
            if (selectedPost?._id === postId) setSelectedPost(prev => ({ ...prev, comments: updatedComments }));
        } catch (e) {
            // ROLLBACK OPTIMISTIC UPDATE ON ERROR
            if (textValue) {
                setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: p.comments.filter(c => c._id !== tempId) } : p));
                if (selectedPost?._id === postId) setSelectedPost(prev => ({ ...prev, comments: prev.comments.filter(c => c._id !== tempId) }));
            }
            console.error("Add comment error:", e);
            const errorMsg = e.response?.data?.message || e.response?.data?.error || "Transmission failed";
        } finally {
            setLoadingActions(prev => { const copy = { ...prev }; delete copy[postId]; return copy; });
        }
    };

    const handleCreatePost = async (formData, previewUrl, isStory) => {
        setIsCreateOpen(false); // Close immediately for zero-latency feel
        playSound('cyber_click');

        // 1. OPTIMISTIC UPDATE: Create a temporary "Uploading..." post/story
        const tempId = 'temp-' + Date.now();
        const tempPost = {
            _id: tempId,
            desc: formData.get('desc'),
            image: previewUrl, // Use local blob
            user: user,
            author: user,
            createdAt: new Date().toISOString(),
            likes: [],
            comments: [],
            isOptimistic: true,
            isUploading: true,
            uploadProgress: 0,
            isStory: isStory
        };

        // Add to feed immediately
        setPosts(prev => [tempPost, ...prev]);
        if (isStory) {
            // Stories are derived from posts, so this works, but we might want to force a refresh of the stories list
        }

        try {
            const res = await axios.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (base) => {
                    const percent = Math.round((base.loaded * 100) / base.total);
                    // Update progress on the temp post
                    setPosts(prev => prev.map(p => p._id === tempId ? { ...p, uploadProgress: percent } : p));
                }
            });
            const createdPost = res.data;
            playSound('success');
            // Replace temp post with real one
            setPosts(prev => prev.map(p => p._id === tempId ? { ...createdPost, author: user } : p));
        } catch (e) {
            console.error("Upload failed", e);
            playSound('error');
            // Remove temp post or show error
            setPosts(prev => prev.filter(p => p._id !== tempId));
            alert(t('POST_FAILED') || "Transmission Failed");
        }
    };

    const handleFollow = async (input) => {
        const targetId = input?._id || input;
        if (!targetId || !user) return;
        setFollowLoading(prev => ({ ...prev, [targetId]: true }));

        // CRITICAL: Determine privacy status before optimistic update
        const inputIsPrivate = typeof input === 'object' && input?.isPrivate;
        const listUserIsPrivate = users.find(u => String(u._id) === String(targetId))?.isPrivate;
        const isPrivate = inputIsPrivate || listUserIsPrivate;

        const isCurrentlyFollowing = user.following?.some(id => String(id) === String(targetId));

        // Optimistic UI Update Logic
        if (isCurrentlyFollowing) {
            updateUserState({ following: user.following.filter(id => String(id) !== String(targetId)) });
        } else if (!isPrivate) {
            updateUserState({ following: [...(user.following || []), targetId] });
        } else {
            // Private Account - Do NOT optimistically follow. Set requested state locally if possible, or wait for backend.
            // We can optimistic update 'followRequests' if we track outgoing requests, but simplest is to wait or assume success 'Requested' toast
        }

        try {
            const res = await axios.post(`/users/${targetId}/follow`);
            const { followers, following, message, isRequested } = res.data;

            // Update user list and profile view
            setUsers(prev => prev.map(u => String(u._id) === String(targetId) ? { ...u, followers, followRequests: res.data.followRequests || u.followRequests, isPrivate: res.data.isPrivate ?? u.isPrivate } : u));
            if (profileUser && String(profileUser._id) === String(targetId)) {
                setProfileUser(prev => ({ ...prev, followers, followRequests: res.data.followRequests || prev.followRequests, isPrivate: res.data.isPrivate ?? prev.isPrivate }));
            }

            // Sync following state - IF PRIVATE, backend won't return 'following' list updated
            if (following) {
                updateUserState({ following });
            } else {
                // If it was private/requested, ENSURE we are NOT following in local state (revert optimistic if it happened)
                if (message === 'Requested' || message === 'Request Cancelled') {
                    updateUserState({ following: user.following.filter(id => String(id) !== String(targetId)) });
                }
                fetchUsers();
            }

            playSound('cyber_scroll');
        } catch (e) {
            console.error('Follow failed', e);
            fetchUsers();
        }
        finally { setFollowLoading(prev => { const copy = { ...prev }; delete copy[targetId]; return copy; }); }
    };

    const handleAcceptRequest = async (requesterId, notificationId) => {
        if (!requesterId) {
            console.error('[HANDSHAKE] Accept skipped: Target ID is null/undefined');
            return;
        }
        isProcessingRequest.current = true;

        // OPTIMISTIC UPDATE: Clear immediately from UI
        const removeLocally = (list) => (list || []).filter(n => {
            const nFromId = String(n.from?._id || n.from || '');
            const isMatchId = notificationId && String(n._id) === String(notificationId);
            const isMatchFrom = nFromId === String(requesterId) && n.type === 'follow_request';
            return !(isMatchId || isMatchFrom);
        });

        setAlerts(prev => removeLocally(prev));
        setUser(prev => {
            if (!prev) return prev;
            return { ...prev, notifications: removeLocally(prev.notifications) };
        });

        try {
            console.log(`[HANDSHAKE] Authorizing request: ${requesterId}`);
            const res = await axios.post(`/users/requests/${requesterId}/accept`, { notificationId });

            const { notifications: updatedNotifs, followers, followRequests, following } = res.data;
            if (updatedNotifs) setAlerts(updatedNotifs);
            setUser(prev => {
                if (!prev) return prev;
                const updated = { ...prev, notifications: updatedNotifs || [], followers: followers || prev.followers, following: following || prev.following, followRequests: followRequests || prev.followRequests };
                localStorage.setItem('user', JSON.stringify(updated));
                return updated;
            });
            playSound('cyber_scroll');
        } catch (e) {
            console.error(`[HANDSHAKE] Accept Error:`, e);
            fetchNotifications(); // Revert by fetching fresh
        } finally {
            setTimeout(() => {
                isProcessingRequest.current = false;
                fetchUsers();
            }, 1000);
        }
    };

    const handleRejectRequest = async (requesterId, notificationId) => {
        if (!requesterId) return;
        isProcessingRequest.current = true;

        // OPTIMISTIC UPDATE
        const removeLocally = (list) => (list || []).filter(n => {
            const nFromId = String(n.from?._id || n.from || '');
            const isMatchId = notificationId && String(n._id) === String(notificationId);
            const isMatchFrom = nFromId === String(requesterId) && n.type === 'follow_request';
            return !(isMatchId || isMatchFrom);
        });

        setAlerts(prev => removeLocally(prev));
        setUser(prev => {
            if (!prev) return prev;
            return { ...prev, notifications: removeLocally(prev.notifications) };
        });

        try {
            console.log(`[HANDSHAKE] Denying request: ${requesterId}`);
            const res = await axios.post(`/users/requests/${requesterId}/reject`, { notificationId });

            const { notifications: updatedNotifs, followRequests } = res.data;
            if (updatedNotifs) setAlerts(updatedNotifs);
            setUser(prev => {
                if (!prev) return prev;
                const updated = { ...prev, notifications: updatedNotifs || [], followRequests: followRequests || prev.followRequests };
                localStorage.setItem('user', JSON.stringify(updated));
                return updated;
            });
            playSound('cyber_scroll');
        } catch (e) {
            console.error("[HANDSHAKE] Reject Error:", e);
            fetchNotifications();
        } finally {
            setTimeout(() => {
                isProcessingRequest.current = false;
                fetchUsers();
            }, 1000);
        }
    };

    const handleOpenChat = (targetUser) => {
        setChatTarget(targetUser);
        setIsChatOpen(true);
        playSound('cyber_open');
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
        }
    };

    // COMMENT MANAGEMENT
    const handleDeleteComment = async (postId, commentId) => {
        // OPTIMISTIC PURGE
        setPosts(prev => prev.map(p => {
            if (p._id === postId) {
                const filtered = p.comments.filter(c => c._id !== commentId);
                return { ...p, comments: filtered };
            }
            return p;
        }));

        // CRITICAL SYNC: Update the open Zoom view immediately
        if (selectedPost?._id === postId) {
            setSelectedPost(prev => ({
                ...prev,
                comments: prev.comments.filter(c => c._id !== commentId)
            }));
        }

        try {
            await axios.delete(`/posts/${postId}/comment/${commentId}`);
            playSound('cyber_delete');
            cyberDeleteEffect();
        } catch (err) {
            console.error("Failed to delete comment", err);
            fetchPosts(); // Rollback on error
        }
    };

    const handleEditComment = async (postId, commentId, text) => {
        // OPTIMISTIC SYNC
        const syncUpdate = (postsArray) => postsArray.map(p => {
            if (p._id === postId) {
                const updatedComments = p.comments.map(c => c._id === commentId ? { ...c, text } : c);
                return { ...p, comments: updatedComments };
            }
            return p;
        });

        setPosts(prev => syncUpdate(prev));
        if (selectedPost?._id === postId) {
            setSelectedPost(prev => ({
                ...prev,
                comments: prev.comments.map(c => c._id === commentId ? { ...c, text } : c)
            }));
        }

        try {
            const res = await axios.put(`/posts/${postId}/comment/${commentId}`, { text });
            const finalComments = res.data;

            // Final sync with backend data
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: finalComments } : p));
            if (selectedPost?._id === postId) setSelectedPost(prev => ({ ...prev, comments: finalComments }));
        } catch (e) {
            console.error("Failed to edit comment", e);
            fetchPosts(); // Rollback to server state
        }
    };

    const handleDeletePost = async (postId) => {
        // OPTIMISTIC SHATTER
        setPosts(prev => prev.filter(p => p._id !== postId));
        setLastDeletedPostId(postId); // Propagate to modals
        try {
            await axios.delete(`/posts/${postId}`);
            playSound('cyber_delete');
            cyberDeleteEffect();
        } catch (e) {
            fetchPosts(); // Re-sync on failure
        }
    };

    const viewProfile = (u) => { setProfileUser(u); setIsProfileOpen(true); playSound('cyber_nav'); };
    // AUTO-LANGUAGE DETECTION
    useEffect(() => {
        if (user?.settings?.language) {
            if (i18n.language !== user.settings.language) {
                console.log(`Setting language to user preference: ${user.settings.language}`);
                i18n.changeLanguage(user.settings.language);
            }
        } else {
            // Detect browser language if no user setting
            const browserLang = navigator.language.split('-')[0];
            const supported = ['en', 'el', 'de', 'fr', 'ru', 'es', 'tr'];
            if (supported.includes(browserLang) && i18n.language !== browserLang) {
                i18n.changeLanguage(browserLang);
            }
        }
    }, [user?.settings?.language]);

    const logout = () => {
        if (user) {
            socket.emit('logout', user._id);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        playSound('cyber_click');
        window.location.reload();
    };

    const deleteNotifications = async () => { try { await axios.delete('/users/notifications'); setAlerts([]); const u = { ...user, notifications: [] }; setUser(u); localStorage.setItem('user', JSON.stringify(u)); playSound('cyber_delete'); cyberDeleteEffect(); } catch (e) { } };

    // IF DIRECT LINK TO COMMENT VIEW - Moved here to prevent hook order violations
    if (viewPostId) {
        return <CommentView postId={viewPostId} user={user} onClose={() => window.close()} />;
    }

    return (
        <div className="app-container">
            {!user ? (
                <div className="min-h-full bg-black flex items-center justify-center p-6 relative overflow-hidden">
                    <div className="w-full max-w-sm glass-panel p-8 rounded-[2rem] text-center shadow-2xl">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-3 mb-8 px-2">
                                <div className="flex flex-col items-center mb-8">
                                    <img src="/logo.png" alt="Legacy Academy" className="h-64 w-auto object-contain mb-4" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {authMode === 'login' && (
                                    <>
                                        <div className="relative">
                                            <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="email" placeholder="Email" id="l-email" value={formData.email} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--gold-primary)] focus:bg-white/10 transition-all shadow-inner" />
                                        </div>
                                        <div className="relative">
                                            <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type={showPassword ? "text" : "password"} placeholder="Password" id="l-password" value={formData.password} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white font-bold outline-none focus:border-[var(--gold-primary)] focus:bg-white/10 transition-all shadow-inner" />
                                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                                {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <button disabled={authLoading} onClick={async () => {
                                            setAuthLoading(true);
                                            try {
                                                const res = await axios.post('/auth/login', { email: formData.email, password: formData.password });
                                                localStorage.setItem('token', res.data.token); // CRITICAL FIX: Save token
                                                localStorage.setItem('user', JSON.stringify(res.data.user));
                                                localStorage.setItem('language', res.data.user.settings?.language || 'en');
                                                localStorage.setItem('themeColor', res.data.user.settings?.theme || '#ffd700');
                                                setUser(res.data.user);
                                            } catch (e) {
                                                alert(e.response?.data?.message || "Invalid Credentials.");
                                            } finally {
                                                setAuthLoading(false);
                                            }
                                        }} className="w-full liquid-btn py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                            {authLoading ? "AUTHENTICATING..." : "LOGIN"}
                                        </button>
                                        <div className="flex justify-between text-xs text-gray-500 px-2 mt-4 font-bold tracking-wide">
                                            <span onClick={() => { setAuthMode('register'); setFormData({ email: '', password: '', username: '' }); }} className="cursor-pointer hover:text-white transition-colors">Create Account</span>
                                            <span onClick={() => { setAuthMode('forgot'); setFormData({ email: '', password: '', username: '' }); }} className="cursor-pointer hover:text-white transition-colors">Forgot Password?</span>
                                        </div>
                                    </>
                                )}
                                {authMode === 'register' && (
                                    <>
                                        <div onClick={() => registerFileRef.current.click()} className="w-24 h-24 mx-auto rounded-full bg-gray-800 overflow-hidden border-2 border-dashed border-gray-600 cursor-pointer relative group hover:border-[var(--gold-primary)] mb-6 flex items-center justify-center transition-all">
                                            {registerPreview ? <img src={registerPreview} className="w-full h-full object-cover" /> : <Icons.Camera className="w-8 h-8 text-gray-400 group-hover:text-[var(--gold-primary)]" />}
                                            <input type="file" ref={registerFileRef} hidden accept="image/*" onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) setRegisterPreview(URL.createObjectURL(file));
                                            }} />
                                        </div>
                                        <div className="relative mb-3">
                                            <Icons.User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="text" placeholder={t('USERNAME')} id="r-username" value={formData.username} maxLength={19} onChange={(e) => { if (e.target.value.length <= 19) handleAuthInputChange(e); }} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--gold-primary)] focus:bg-white/10 transition-all shadow-inner text-sm" />
                                        </div>
                                        <div className="relative mb-3">
                                            <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="email" placeholder={t('EMAIL')} id="r-email" value={formData.email} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--gold-primary)] focus:bg-white/10 transition-all shadow-inner text-sm" />
                                        </div>
                                        <div className="relative mb-3">
                                            <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type={showPassword ? "text" : "password"} placeholder={t('PASSWORD')} id="r-password" value={formData.password} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-12 text-white font-bold outline-none focus:border-[var(--gold-primary)] focus:bg-white/10 transition-all shadow-inner text-sm" />
                                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                                                {showPassword ? <Icons.EyeOff className="w-5 h-5" /> : <Icons.Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <div className="space-y-2 text-left mb-4">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">{t('DESCRIPTION')}</label>
                                            <div className="relative">
                                                <textarea
                                                    placeholder={t('BIO_PH')}
                                                    id="r-bio"
                                                    value={formData.bio || ''}
                                                    onChange={handleAuthInputChange}
                                                    maxLength={500}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm outline-none focus:border-[var(--gold-primary)] focus:bg-white/10 transition-all shadow-inner resize-none h-24"
                                                />
                                                <div className="absolute bottom-2 right-3 text-[9px] font-black text-white/20 uppercase tracking-widest">{(formData.bio || '').length} / 500</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mb-6">
                                            <select value={formData.language || 'en'} onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))} className="w-1/3 bg-black border border-white/20 rounded-xl py-3 px-3 text-white text-xs font-bold outline-none cursor-pointer hover:border-[var(--gold-primary)] transition-colors appearance-none text-center h-[52px]">
                                                <option value="en" className="bg-black text-white">English</option>
                                                <option value="el" className="bg-black text-white">Ελληνικά</option>
                                                <option value="fr" className="bg-black text-white">Français</option>
                                                <option value="de" className="bg-black text-white">Deutsch</option>
                                                <option value="ru" className="bg-black text-white">Русский</option>
                                                <option value="es" className="bg-black text-white">Español</option>
                                                <option value="tr" className="bg-black text-white">Türkçe</option>
                                                <option value="cy" className="bg-black text-white">Cypriot</option>
                                            </select>

                                            <div className="flex-1 p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">THEME</div>
                                                <div className="flex gap-2 flex-wrap justify-center">
                                                    {['#ffd700', '#3b82f6', '#ef4444', '#10b981', '#ffffff', '#a855f7', '#ff8c00', '#ff69b4', '#00ffff', '#7cfc00', '#ff00ff', '#ffa500'].map(c => (
                                                        <button
                                                            key={c}
                                                            onClick={() => { playSound('cyber_click'); setFormData(prev => ({ ...prev, theme: c })); }}
                                                            className={`w-7 h-7 rounded-lg border-2 transition-all relative ${formData.theme === c ? 'scale-110 border-white z-10 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-white/5 opacity-40 hover:opacity-100 hover:scale-105 hover:border-white/20'}`}
                                                            style={{ backgroundColor: c }}
                                                        >
                                                            {formData.theme === c && (
                                                                <Icons.Check className={`w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${c === '#ffffff' ? 'text-black' : 'text-white'} drop-shadow-md`} />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <button disabled={authLoading} onClick={async () => {
                                            setAuthLoading(true);
                                            try {
                                                const fd = new FormData();
                                                fd.append('username', formData.username?.trim());
                                                fd.append('email', formData.email?.trim());
                                                fd.append('password', formData.password);
                                                if (formData.bio !== undefined) fd.append('bio', formData.bio.trim());
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
                                                alert(e.response?.data?.message || e.response?.data || t('REQUEST_FAILED'));
                                            } finally {
                                                setAuthLoading(false);
                                            }
                                        }} className="w-full liquid-btn py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                            {authLoading ? t('CREATING_ACCOUNT') : t('REGISTER')}
                                        </button>
                                        <div className="text-xs text-gray-500 cursor-pointer hover:text-white text-center mt-4 font-bold" onClick={() => setAuthMode('login')}>{t('BACK_TO_LOGIN')}</div>
                                    </>
                                )}
                                {authMode === 'forgot' && (
                                    <>
                                        <p className="text-sm text-gray-400 mb-4 px-2 text-center">{t('RESET_LINK_DESC')}</p>
                                        <div className="relative mb-6">
                                            <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="email" placeholder="Email" id="f-email" value={formData.email} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--gold-primary)] focus:bg-white/10 transition-all shadow-inner" />
                                        </div>
                                        <button disabled={authLoading} onClick={async () => {
                                            setAuthLoading(true);
                                            try {
                                                await axios.post('/auth/forgot-password', { email: formData.email });
                                                alert(t('RESET_LINK_SENT'));
                                                setAuthMode('login');
                                            } catch (e) {
                                                alert(t('REQUEST_FAILED'));
                                            } finally {
                                                setAuthLoading(false);
                                            }
                                        }} className="w-full liquid-btn py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">
                                            {authLoading ? t('SENDING') : t('SEND_RESET_LINK')}
                                        </button>
                                        <div className="text-xs text-gray-500 cursor-pointer hover:text-white text-center mt-4 font-bold" onClick={() => setAuthMode('login')}>{t('BACK_TO_LOGIN')}</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-[100dvh] bg-black text-white relative font-sans overflow-hidden flex flex-col">
                    <div className="fixed inset-0 z-0 bg-black"></div>
                    <main ref={mainScrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar p-0 pb-60 scroll-smooth relative z-10">
                        <header className="relative w-full z-[40] bg-transparent backdrop-blur-md border-b border-white/5 shrink-0 transition-all duration-500">
                            <div className="w-full px-2 sm:px-6 py-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {/* Logo removed from header as requested */}
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setIsChatOpen(true)}
                                        title={t('MESSAGES_SUBTITLE')}
                                        className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 hover:border-[var(--gold-primary)]/30 transition-all active:scale-95 group shadow-xl shadow-black/40 backdrop-blur-xl"
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <Icons.Ghost className="w-5 h-5 text-gray-400 group-hover:text-[var(--gold-primary)] transition-all duration-300 group-hover:scale-110" />
                                            {user?.notifications?.some(n => n.type === 'message' && !n.read) && (
                                                <div className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse" />
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase tracking-[0.25em] transition-colors">{t('CHAT')}</span>
                                    </button>
                                    <button onClick={() => setIsSettingsOpen(true)} className="header-icon-btn rounded-full">
                                        <Icons.Settings className="w-8 h-8" />
                                    </button>
                                </div>
                            </div>
                        </header>
                        <div className="pt-0 sm:pt-4 max-w-4xl mx-auto">
                            {activeTab === 'alerts' ? (
                                <div className="animate-fade-in p-4 sm:p-8">
                                    <div className="flex items-center justify-between mb-6 px-2">
                                        <h2 className="text-xl font-bold text-white/90">{t('NOTIFICATIONS_TITLE')}</h2>
                                        {alerts.length > 0 && (
                                            <button onClick={deleteNotifications} className="p-3 bg-white/10 rounded-xl hover:bg-red-500/20 text-red-500 transition-all active:scale-90 border border-red-500/20">
                                                <Icons.Trash className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    {alerts.length === 0 ? (
                                        <div className="text-center text-gray-500 py-10 font-bold uppercase tracking-widest text-xs">{t('NO_NOTIFS')}</div>
                                    ) : (
                                        alerts.map((n, i) => (
                                            <NotificationItem
                                                key={n._id || i}
                                                note={n}
                                                onViewProfile={viewProfile}
                                                onOpenChat={handleOpenChat}
                                                onAcceptRequest={handleAcceptRequest}
                                                onRejectRequest={handleRejectRequest}
                                                onOpenPost={(id) => { const p = posts.find(p => p._id === id); if (p) setSelectedPost(p); }}
                                                t={t}
                                                lang={lang}
                                            />
                                        ))
                                    )}
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'home' && (
                                        <div className="px-4 mb-2 flex flex-col items-center animate-fade-in relative z-10 scale-90 sm:scale-100">
                                            {/* SEARCH BAR - TOP */}
                                            <div className="w-full max-w-2xl relative group mb-4">
                                                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--gold-primary)]/20 to-transparent rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                                <div className="relative">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 transition-colors z-20 pointer-events-none">
                                                        <circle cx="11" cy="11" r="8"></circle>
                                                        <path d="m21 21-4.3-4.3"></path>
                                                    </svg>
                                                    <input
                                                        value={searchQuery}
                                                        onChange={(e) => {
                                                            setSearchQuery(e.target.value);
                                                            if (e.target.value) setActiveTab('search');
                                                        }}
                                                        placeholder={t('SEARCH_PH') || "Search..."}
                                                        className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white outline-none focus:border-[var(--gold-primary)]/40 focus:bg-white/[0.1] transition-all shadow-2xl backdrop-blur-xl placeholder:text-white/30 placeholder:text-xs sm:placeholder:text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* LOGO - MIDDLE */}
                                            <div className="flex justify-center -my-10 relative pointer-events-none select-none">
                                                <img src="/logo.png" alt="Legacy Academy" className="h-48 w-auto object-contain drop-shadow-[0_0_30px_rgba(var(--gold-primary-rgb),0.15)]" />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab !== 'search' && <StoriesBar stories={stories} user={user} imgKey={imgKey} key={imgKey || 'stories'} onAddStory={() => { setCreateModeStory(true); setIsCreateOpen(true); }} onViewStory={(s) => setSelectedPost(s)} />}
                                    <div className="px-2 py-4 sm:p-8">
                                        {activeTab === 'search' && (
                                            <div className="mb-8 space-y-4 animate-fade-in">
                                                <div className="relative"><Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input id="main-search" name="search" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('SEARCH_PH')} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:border-[var(--gold-primary)] transition-all shadow-inner" /></div>
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center justify-between px-1">
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gold-primary)] flex items-center gap-2">
                                                            <div className="w-1 h-3 bg-[var(--gold-primary)] rounded-full shadow-[0_0_8px_var(--gold-glow)]" />
                                                            {t('TRENDING_NOW') || 'TRENDING INTELLIGENCE'}
                                                        </h3>
                                                    </div>
                                                    <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar pb-2">
                                                        {(trendingHashtags.length > 0 ? trendingHashtags : ['#legacy', '#hustle', '#crypto', '#boxing', '#mindset', '#freedom']).map(tag => (
                                                            <span
                                                                key={tag}
                                                                onClick={() => setSearchQuery(tag)}
                                                                className="px-4 py-2 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl text-xs font-black text-gray-400 cursor-pointer hover:text-[var(--gold-primary)] hover:border-[var(--gold-primary)]/40 hover:bg-white/10 transition-all border border-white/5 whitespace-nowrap active:scale-95 shadow-lg flex items-center gap-2 group"
                                                            >
                                                                <span className="text-[var(--gold-primary)] opacity-40 group-hover:opacity-100 transition-opacity">#</span>
                                                                {tag.replace('#', '').toUpperCase()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
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
                                                                <div className="font-bold text-white text-sm">
                                                                    {u.username}
                                                                </div>
                                                                {u.role === 'Founder' && (
                                                                    <div className="flex items-center gap-1 animate-fade-in group/badge">
                                                                        <FounderBadge className="w-3 h-3" />
                                                                        <div className="text-[var(--gold-primary)] text-[9px] font-black tracking-wider uppercase">{t('FOUNDER_BADGE', 'LEGACY FOUNDER')}</div>
                                                                    </div>
                                                                )}
                                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{u.followers?.length || 0} {t('FOLLOWERS_COUNT')}</div>
                                                            </div>
                                                            <button className="px-3 py-1.5 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-colors">{t('VIEW')}</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="space-y-4">

                                                {groupedPosts.map(group => {
                                                    const dateKey = group.key;
                                                    return (
                                                        <div key={dateKey} className="animate-fade-in group mb-12">
                                                            <div className="flex items-center gap-3 mb-8 px-1 opacity-80">
                                                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-1 h-3 bg-[var(--gold-primary)] rounded-full shadow-glow-gold" />
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 font-mono">{dateKey}</span>
                                                                </div>
                                                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                            </div>

                                                            <div className="space-y-8">
                                                                <AnimatePresence mode="popLayout">
                                                                    {group.posts.map(p => (
                                                                        <motion.div
                                                                            key={p._id}
                                                                            initial={{ opacity: 0, y: 30 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            viewport={{ once: true, margin: "-50px" }}
                                                                            exit={{
                                                                                opacity: 0,
                                                                                scale: 1.1,
                                                                                filter: 'blur(20px) contrast(2)',
                                                                                x: -20,
                                                                                transition: { duration: 0.4 }
                                                                            }}
                                                                            className="relative"
                                                                        >
                                                                            <PostCard post={p} user={user} allUsers={users} onLike={handleLike} onDislike={handleDislike} onComment={handleComment} onDelete={handleDeletePost} onViewProfile={viewProfile} onOpenDetail={setSelectedPost} onOpenChat={handleOpenChat} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onEditPost={(post) => { setPostToEdit(post); setIsEditOpen(true); }} onShare={handleShare} onHashtagClick={handleHashtagClick} loadingActions={loadingActions} />
                                                                        </motion.div>
                                                                    ))}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {posts.length === 0 && (
                                                <div className="h-96 flex flex-col items-center justify-center space-y-4">
                                                    <div className="w-12 h-12 border-4 border-[var(--gold-primary)] border-t-transparent rounded-full animate-spin"></div>
                                                    <div className="text-[var(--gold-primary)] font-black text-sm uppercase tracking-[0.2em] animate-pulse">{t('DECRYPTING_FEED')}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </main>

                    <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 flex justify-center z-[1000] pointer-events-none">
                        <div className="absolute -top-20 right-4 flex items-center gap-3 pointer-events-auto">
                            <AnimatePresence>
                                {showScrollTop && (
                                    <motion.button
                                        initial={{ opacity: 0, x: 80, scale: 0.5 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 80, scale: 0.5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        onClick={() => { scrollToTop(); playSound('cyber_scroll'); }}
                                        className="w-12 h-12 bg-white/10 backdrop-blur-2xl text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] border border-white/20 active:scale-90 hover:bg-white/20"
                                    >
                                        <Icons.ArrowUp className="w-5 h-5" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={() => { setCreateModeStory(false); setIsCreateOpen(true); playSound('sweep'); }}
                                className="w-12 h-12 bg-white/10 backdrop-blur-2xl text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] border border-white/20 active:scale-90 transition-all hover:bg-white/20 group"
                            >
                                <Icons.Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>
                        {(!isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost) && (
                            <div className="liquid-glass-nav h-[75px] sm:h-[80px] w-full max-w-lg rounded-[2.2rem] sm:rounded-[2.5rem] px-5 sm:px-6 flex items-center justify-between pointer-events-auto border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.8)] bg-black/90 backdrop-blur-3xl relative mx-auto mb-6 sm:mb-0">
                                <button onClick={() => { setActiveTab('home'); playSound('cyber_nav'); if (navigator.vibrate) navigator.vibrate(10); }} className={`nav-item-btn relative transition-all duration-300 z-10 ${activeTab === 'home' ? 'text-[var(--gold-primary)] scale-110 drop-shadow-[0_0_8px_var(--gold-glow)]' : 'text-white hover:text-[var(--gold-primary)]'}`}>
                                    <Icons.Home className="w-6 h-6 relative z-10" />
                                </button>

                                <button onClick={() => { setActiveTab('search'); playSound('cyber_nav'); if (navigator.vibrate) navigator.vibrate(10); }} className={`nav-item-btn relative transition-all duration-300 z-10 ${activeTab === 'search' ? 'text-[var(--gold-primary)] scale-110 drop-shadow-[0_0_8px_var(--gold-glow)]' : 'text-white hover:text-[var(--gold-primary)]'}`}>
                                    <Icons.Search className="w-6 h-6 relative z-10" />
                                </button>

                                <button onClick={() => { setActiveTab('alerts'); playSound('cyber_nav'); if (navigator.vibrate) navigator.vibrate(10); }} className={`nav-item-btn relative transition-all duration-500 z-10 ${activeTab === 'alerts' ? 'text-[var(--gold-primary)] scale-110 drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]' : 'text-white hover:text-[var(--gold-primary)]'}`}>
                                    <div className="relative z-10">
                                        <Icons.Bell className={`w-6 h-6 ${user?.notifications?.some(n => !n.read) ? 'text-[var(--gold-primary)] fill-[var(--gold-primary)] animate-pulse drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]' : ''}`} />
                                        {user?.notifications?.some(n => !n.read) && <div className="absolute top-1 right-1.5 w-2 h-2 bg-red-600 rounded-full border border-black shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-ping-slow" />}
                                    </div>
                                </button>

                                <button onClick={() => { logout(); playSound('sword'); }} className="nav-logout-btn text-white hover:text-red-500 transition-all z-10 hover:scale-110 active:scale-95"><Icons.Logout className="w-6 h-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" /></button>

                                <button onClick={() => { viewProfile(user); }} className={`p-0.5 rounded-xl border-2 transition-all duration-300 z-10 ${activeTab === 'profile' ? 'border-[var(--gold-primary)] scale-110 shadow-[0_0_15px_rgba(var(--gold-primary-rgb),0.3)]' : 'border-transparent'}`}>
                                    <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-xl overflow-hidden bg-white/10 relative">
                                        <ProfileAvatar user={user} key={imgKey} />
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>

                    <ProfileModal
                        isOpen={isProfileOpen}
                        onClose={() => { setIsProfileOpen(false); playSound('cyber_back'); }}
                        profileUser={profileUser}
                        currentUser={user}
                        allUsers={users}
                        preloadedPosts={posts.filter(p => String(p.author?._id || p.author) === String(profileUser?._id || profileUser?.userId || profileUser))}
                        posts={posts}
                        onFollow={handleFollow}
                        onUpdateUser={handleUpdateUser}
                        onViewProfile={viewProfile}
                        onOpenChat={handleOpenChat}
                        onOpenDetail={setSelectedPost}
                        imgKey={imgKey}
                        fetchSpecificUser={fetchUsers}
                        lastDeletedPostId={lastDeletedPostId}
                        followLoading={followLoading}
                        addToast={addToast}
                        onDeletePost={handleDeletePost}
                    />
                    <ChatModal isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); setChatTarget(null); playSound('cyber_back'); }} user={user} allUsers={users} initialChatUser={chatTarget} addToast={addToast} fetchSpecificUser={fetchUsers} />
                    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} logout={logout} user={user} onUpdateUser={handleUpdateUser} />
                    <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreatePost={handleCreatePost} user={user} forceStory={createModeStory} />
                    <EditPostModal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setPostToEdit(null); }} onSuccess={() => { setIsEditOpen(false); setPostToEdit(null); fetchPosts(); }} post={postToEdit} user={user} />
                    {
                        selectedPost && <PostDetailModal post={selectedPost} user={user} allUsers={users} onClose={() => setSelectedPost(null)} onLike={handleLike} onDislike={handleDislike} onOpenChat={handleOpenChat} onComment={handleComment} onDelete={(pid) => {
                            handleDeletePost(pid);
                            // Also trigger manual refresh for profile if open
                            if (isProfileOpen) {
                                // fetchUserPosts is inside ProfileModal, so we should actually pass the delete handler in
                                // for now the useEffect dependency might catch it or manual re-fetch
                            }
                        }} onEdit={(post) => { setPostToEdit(post); setIsEditOpen(true); }} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onShare={handleShare} loadingActions={loadingActions} onClearComments={(postId) => {
                            setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: [] } : p));
                            setSelectedPost(prev => prev ? { ...prev, comments: [] } : null);
                        }} />
                    }

                </div>
            )
            }
        </div>
    );
};

export default App;
