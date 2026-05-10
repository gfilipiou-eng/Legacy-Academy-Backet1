import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import EnhancedButton from './components/EnhancedButton';
// DEPLOYMENT_VERSION: V12_PORTAL_FIX

import axios from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './components/Icons';
import { VoiceNotePlayer } from './components/VoiceNotePlayer';
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
    // CLEANUP: If URL is just 'undefined' or 'null' as string (backend artifacts), treat as null
    const cleanUrl = String(url || '').trim();
    if (!cleanUrl || cleanUrl === 'undefined' || cleanUrl === 'null' || cleanUrl === '[object Object]') return null;

    // 🔥 SECURITY/UI CLEANUP: Hide media from the old, deactivated Cloudinary account (dfggkqhdb)
    if (cleanUrl.includes('res.cloudinary.com/dfggkqhdb/')) {
        return null; // Force hide to avoid 401 errors and keep UI clean
    }

    // AUTO-OPTIMIZE CLOUDINARY
    if (cleanUrl.includes('cloudinary.com') && cleanUrl.includes('/upload/')) {
        const parts = cleanUrl.split('/upload/');
        if (parts.length < 2) return cleanUrl; // Ensure there's a path after /upload/
        // Only inject if not already transformed
        if (!parts[1].startsWith('c_') && !parts[1].startsWith('w_') && !parts[1].startsWith('so_') && !parts[1].startsWith('q_')) {
            const isVideo = cleanUrl.includes('/video/upload/');

            if (isCover && isVideo) {
                // Strip cached transformations mapped to covers
                return cleanUrl.replace(/\/upload\/.*?(v\d+\/)/i, '/upload/$1');
            }
            let transform = '';
            // SAVE CREDITS: Use 'q_auto' (Balanced) for high visual fidelity with storage savings
            // Increased widths to avoid pixelation on high-PPI displays
            if (isPoster && isVideo) {
                transform = `so_0.0,f_auto,q_auto,w_800,c_limit`;
                parts[1] = parts[1].replace(/\.(mp4|mov|webm|m4v)$/i, '.jpg');
            } else if (isAvatar && isVideo) {
                // Animated avatars: WebP (animated) + 350px
                transform = `w_350,h_350,c_fill,so_0,eo_2,q_auto,f_webp,fl_animated`;
                parts[1] = parts[1].replace(/\.(mp4|mov|webm|m4v)$/i, '.webp');
            } else if (isAvatar) {
                // 600px + q_auto:best for maximum quality as requested
                transform = `w_600,h_600,c_fill,g_face,q_auto:best,f_auto`;
            } else if (width) {
                transform = `w_${Math.min(width, 1200)},c_limit,q_auto,${isVideo ? 'vc_auto' : 'f_auto'}`;
            } else {
                transform = `q_auto,f_auto`;
            }

            return parts[0] + '/upload/' + transform + '/' + parts[1];
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
        * {
            -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
            outline: none !important;
        }
        html, body {
            -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
        }
        .liquid-glass-nav {
            background: rgba(0, 0, 0, 0.15) !important;
            backdrop-filter: blur(40px) saturate(200%) !important;
            -webkit-backdrop-filter: blur(40px) saturate(200%) !important;
            border-right: 1px solid rgba(255, 255, 255, 0.15) !important;
            box-shadow: 15px 0 60px rgba(0,0,0,0.95), inset -1px 0 0 rgba(255,255,255,0.05) !important;
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
    const m = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:shorts\/|[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
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
    if (currentUser && isSameId(u, currentUser)) return true;

    const lastSeen = u?.lastSeen;
    if (!lastSeen) return false;
    try {
        // Robust Threshold: 5 minutes (300,000ms) to account for clock skew/distributed systems
        return (Date.now() - new Date(u.lastSeen).getTime()) < 300000;
    } catch (e) { return false; }
};

const getLocaleForLang = (lang) => {
    const map = { 'el': 'el-GR', 'cy': 'el-CY', 'de': 'de-DE', 'ru': 'ru-RU', 'es': 'es-ES', 'tr': 'tr-TR', 'fr': 'fr-FR' };
    return map[lang] || 'en-US';
};

const formatDate = (dateString, t, lang) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return t('JUST_NOW') || 'Just now';

        const diffInMinutes = Math.round(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} ${t('UNIT_M')}`;
        }

        const diffInHours = Math.round(diffInSeconds / 3600);
        if (diffInHours < 24) {
            return `${diffInHours} ${t('UNIT_H')}`;
        }

        const diffInDays = Math.round(diffInSeconds / 86400);
        if (diffInDays < 7) {
            return `${diffInDays} ${t('UNIT_D')}`;
        }

        const locale = getLocaleForLang(lang);
        return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    } catch (e) { return ''; }
};

/**
 * Robustly converts any ID (string, number, or object) to a clean hex string.
 * Prevents the "[object Object]" bug that causes state corruption.
 */
const safeId = (id) => {
    if (id === null || id === undefined) return null;
    if (typeof id === 'string') return id;
    if (typeof id === 'number') return String(id);
    if (typeof id === 'object') {
        if (id._id) return safeId(id._id);
        if (id.id) return safeId(id.id);
        if (id.userId) return safeId(id.userId);
        if (id.toString && id.toString() !== '[object Object]') return id.toString();
    }
    return String(id);
};

const isSameId = (id1, id2) => {
    const s1 = safeId(id1);
    const s2 = safeId(id2);
    return !!(s1 && s2 && s1 === s2);
};

/**
 * INTELLIGENCE RESOLVER:
 * Ensures we always have a full user object by merging partial data with the local database.
 * SAFE: Will NEVER return a user with _id: 'unknown' or overwrite others.
 */
const resolveFullUser = (partial, database) => {
    const uid = safeId(partial);
    if (!uid) return null;

    const dbUser = (database || []).find(u => isSameId(u._id, uid));
    const base = dbUser || partial;
    
    if (!base) return null;

    const result = { ...base };
    
    if (typeof partial === 'object' && partial !== null) {
        Object.keys(partial).forEach(key => {
            const val = partial[key];
            if (val !== null && val !== undefined) {
                result[key] = val;
            }
        });
    }
    
    result._id = uid;
    return result;
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
                    <button onClick={onClose} className="p-2  rounded-full  "><Icons.X className="w-6 h-6 text-gray-500" /></button>
                </div>

                <div className="flex flex-col gap-4">
                    {audioBlob ? (
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[var(--gold-primary)]" />
                                <span className="text-xs font-black text-[var(--gold-primary)] uppercase tracking-widest">{t('VOICE_NOTE_READY')}</span>
                            </div>
                            <button onClick={() => setAudioBlob(null)} className="p-2  rounded-full"><Icons.Trash className="w-5 h-5 text-red-500" /></button>
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
                                className="w-full h-32 bg-white/[0.04] border border-white/10 rounded-2xl p-5 text-base text-white font-medium resize-none focus:border-[var(--gold-primary)] outline-none placeholder-gray-600 shadow-inner "
                            />
                            <div className="absolute bottom-3 right-3 text-[10px] font-black text-gray-700 uppercase tracking-widest">{value.length} / 500</div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                        {!audioBlob && !isRecording && (
                            <button
                                type="button"
                                onClick={startRecording}
                                className="p-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400     shadow-xl group"
                            >
                                <Icons.Mic className="w-6 h-6 group-hover:scale-110 " />
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={(audioBlob ? false : !value.trim()) || loading}
                            className="flex-1 py-4 bg-[var(--gold-primary)] text-black font-black text-xs uppercase tracking-[0.15em] rounded-2xl shadow-glow-gold  disabled:opacity-50  flex items-center justify-center gap-3 hover:brightness-110"
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

    if (!user || typeof user !== 'object') return <DefaultAvatar size={size} />;

    const rawUrl = user.profilePic || user.fromProfilePic;
    const name = user.username || user.fromUsername;

    // Reset error state if url changes
    useEffect(() => { setImgError(false); }, [String(rawUrl || '')]);

    const mediaUrl = resolveMediaUrl(rawUrl, size === 'large' ? 350 : 150, !String(rawUrl || '').includes('/video/upload/'));
    const isVideo = rawUrl && (rawUrl.match(/\.(mp4|mov|webm)($|\?)/i) || rawUrl.includes('/video/upload/')) && mediaUrl;

    if (imgError || !mediaUrl) return <DefaultAvatar name={name} size={size} />;

    if (isVideo) {
        return (
            <div className={`w-full h-full bg-gray-900 ${className || ''}`} onClick={onClick}>
                <div className="w-full h-full relative overflow-hidden rounded-full bg-black">
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
            className={`w-full h-full object-cover rounded-full ${className || ''}`}
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


const DropdownMenu = ({ post, user, onShare, onEdit, onDelete, t }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const isOwner = isSameId(post.author?._id || post.author, user?._id);
    const canDelete = isOwner || user?.role === 'Founder';

    const toggle = (e) => {
        e.stopPropagation();
        if (!showMenu) {
            const rect = btnRef.current.getBoundingClientRect();
            // Position exactly below the button (bottom + 8px gap) and align the right edge
            setCoords({ top: rect.bottom + 8, left: rect.right - 192 });
        }
        setShowMenu(!showMenu);

    };

    return (
        <div className="relative shrink-0">
            <button ref={btnRef} onClick={toggle} className="p-2 text-gray-400   rounded-full  ">
                <Icons.MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && createPortal(
                <>
                    <div className="fixed inset-0 z-[10000]" onClick={() => setShowMenu(false)} />
                    <div
                        style={{
                            position: 'fixed',
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                            zIndex: 10001
                        }}
                        className="w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col gap-1 p-1 animate-fade-in"
                    >
                        {isOwner && (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(post); setShowMenu(false); }} className="flex items-center gap-3 p-3 rounded-xl   w-full text-left group/item">
                                <Icons.Edit className="w-4 h-4 text-blue-400 group-hover/item:scale-110 " />
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('EDIT')}</span>
                            </button>
                        )}
                        {canDelete && (
                            <button onClick={(e) => { e.stopPropagation(); onDelete(post._id); setShowMenu(false); }} className="flex items-center gap-3 p-3 rounded-xl   w-full text-left group/item">
                                <Icons.Trash className="w-4 h-4 text-red-500 group-hover/item:scale-110 " />
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t('DELETE')}</span>
                            </button>
                        )}
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

const AlertTriangle = p => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;

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
    const [translatedText, setTranslatedText] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const currentCommentAuthorId = comment.authorId || comment.user?._id || comment.userId;
    const isCommentAuthor = isSameId(currentCommentAuthorId, user?._id);
    const postAuthorId = post.author?._id || post.author;

    const foundUserInList = allUsers?.find(u => isSameId(u._id, currentCommentAuthorId));
    const isFounder = (user?.role === 'Founder' || comment.user?.role === 'Founder' || foundUserInList?.role === 'Founder');

    const canEdit = isCommentAuthor || user?.role === 'Founder';
    const canDelete = isCommentAuthor || user?.role === 'Founder';

    const handleSave = () => {
        if (typeof onEdit === 'function') onEdit(post._id, comment._id, editText);
        setIsEditing(false);
    };

    const handleTranslate = async () => {
        if (isTranslating) return;
        if (translatedText) { setTranslatedText(null); return; }
        setIsTranslating(true);
        try {
            const res = await axios.post('/posts/translate', { text: comment.text, lang });
            setTranslatedText(res.data.translatedText);

        } catch (e) {
            console.error("Comment decryption failed");
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`flex gap-3 items-start relative py-3 border-b border-white/5 ${isCommentAuthor ? 'flex-row-reverse' : ''}`}
        >
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10 bg-black">
                <ProfileAvatar
                    user={isCommentAuthor ? user : (comment.user || { username: comment.authorName, profilePic: comment.authorProfilePic })}
                    className="rounded-full"
                />
            </div>

            <div className={`flex-1 min-w-0 flex flex-col ${isCommentAuthor ? 'items-end text-right' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 max-w-full">
                    <span className={`font-black text-[10px] uppercase tracking-[0.15em] truncate ${isCommentAuthor ? 'text-[var(--gold-primary)]' : 'text-white'}`}>
                        {isCommentAuthor ? (user?.username || 'User') : (comment.user?.username || comment.authorName || 'User')}
                    </span>
                    <VerifiedBadge isFounder={isFounder} className="w-3.5 h-3.5" />
                </div>

                {isEditing ? (
                    <div className="w-full mt-1">
                        <textarea
                            autoFocus
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            className="w-full bg-transparent border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none mb-2 focus:border-[var(--gold-primary)]/60 min-h-[60px] resize-none"
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                            <button
                                onClick={handleSave}
                                className="px-3 py-1.5 rounded-full bg-[var(--gold-primary)] text-[10px] font-black text-black hover:brightness-110  uppercase tracking-wider"
                            >
                                {t('SAVE')}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1.5 rounded-full bg-white/5 text-[10px] font-black text-gray-400   uppercase tracking-wider"
                            >
                                {t('CANCEL')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 w-full">
                        {comment.text && (
                            <div className="group/cmt relative">
                                <span className={`inline-block pb-1 text-[13px] text-white/90 leading-relaxed whitespace-pre-wrap break-words ${translatedText ? 'italic text-[var(--gold-primary)]/80' : ''}`}>
                                    {translatedText || comment.text}
                                </span>
                                {comment.text.length > 3 && (
                                    <button
                                        onClick={handleTranslate}
                                        disabled={isTranslating}
                                        className="ml-2 inline-flex items-center gap-1 text-[9px] font-black text-[var(--gold-primary)]/40   uppercase tracking-tighter"
                                    >
                                        <Icons.Globe className={`w-2.5 h-2.5 ${isTranslating ? 'animate-spin' : ''}`} />
                                        {isTranslating ? '...' : (translatedText ? t('SHOW_ORIGINAL') : t('SEE_TRANSLATION'))}
                                    </button>
                                )}
                            </div>
                        )}
                        {comment.audioUrl && (
                            <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center gap-1 text-[9px] font-black text-[var(--gold-primary)] uppercase tracking-[0.18em]">
                                    <div className="w-1 h-1 rounded-full bg-[var(--gold-primary)]" /> {t('VOICE_NOTE')}
                                </div>
                                <VoiceNotePlayer src={resolveMediaUrl(comment.audioUrl)} t={t} />
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap gap-3 mt-2 items-center text-[10px] text-gray-500">
                    <span className="font-bold uppercase tracking-tight">
                        {formatDate(comment.createdAt, t, lang)}
                    </span>
                    {canEdit && !isEditing && (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-gray-400   "
                            title={t('EDIT')}
                        >
                            <Icons.Edit className="w-3 h-3" /> <span className="hidden sm:inline">{t('EDIT')}</span>
                        </button>
                    )}
                    {canDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete?.(post._id, comment._id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-red-400   "
                            title={t('DELETE')}
                        >
                            <Icons.Trash className="w-3 h-3" /> <span className="hidden sm:inline">{t('DELETE')}</span>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

const PostDetailModal = ({ post, user, allUsers, onClose, onLike, onDislike, onRepost, onOpenChat, onComment, onDelete, onEdit, onDeleteComment, onEditComment, onShare, loadingActions, onClearComments }) => {
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

    const [translatedText, setTranslatedText] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const handleTranslate = async (e) => {
        if (e) e.stopPropagation();
        if (isTranslating) return;
        if (translatedText) { setTranslatedText(null); return; }
        setIsTranslating(true);
        try {
            const res = await axios.get(`/posts/${post._id}/translate?lang=${lang}`);
            setTranslatedText(res.data.translatedText);

        } catch (e) {
            console.error(e);
        } finally {
            setIsTranslating(false);
        }
    };


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
    const authorId = post.author?._id || post.author;
    const author = (post.author && typeof post.author === 'object' && post.author.username)
        ? post.author
        : (allUsers?.find(u => isSameId(u._id, authorId)) || post.authorObject || { username: 'Unknown', _id: authorId });

    // Robust reposter resolution
    let reposter = null;
    if (post.isRepost && post.repostedBy) {
        const rId = post.repostedBy?._id || post.repostedBy;
        reposter = allUsers?.find(u => isSameId(u._id, rId));
        if (!reposter && typeof post.repostedBy === 'object' && post.repostedBy.username) {
            reposter = post.repostedBy;
        }
        if (!reposter) reposter = { username: 'Agent', _id: rId };
    }

    const isOwner = isSameId(author?._id, user?._id);
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
        <div className="fixed inset-0 z-[1200] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-start md:justify-center p-0 md:p-4 overflow-hidden  duration-300">
            <button onClick={onClose} className="fixed top-4 right-4 p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl  z-[1500] shadow-2xl   group">
                <Icons.X className="w-6 h-6 text-white group-hover:rotate-90 " />
            </button>
            <div className="w-full max-w-6xl h-[100dvh] md:h-[90vh] bg-[#0a0a0a] rounded-none md:rounded-[2.5rem] flex flex-col md:flex-row border-none md:border md:border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] shrink-0 my-auto transform-gpu relative">
                {/* Image Section */}
                <div className="w-full md:flex-1 bg-black flex items-center justify-center relative shadow-inner overflow-hidden h-[50vh] md:h-full shrink-0">
                    {(post.image || post.videoUrl || post.thumbnailUrl) ? (
                        isYouTubeUrl(post.videoUrl || post.thumbnailUrl || post.image || '') ? (
                            <NeuralVideoPlayer src={post.videoUrl || post.thumbnailUrl || post.image} className="w-full h-full" forcePause={isWritingComment} />
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

                {/* Info Section */}
                <div className="w-full md:w-[450px] flex flex-col bg-[#050505] border-l border-white/5 flex-1 min-h-0 md:h-full relative font-sans">
                    <div className="p-3 sm:p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-xl shrink-0 relative z-50">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gray-800 overflow-hidden border border-white/10 shadow-md">
                                <ProfileAvatar user={author} className="rounded-full" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-white leading-none whitespace-nowrap">{author?.username}</span>
                                    <VerifiedBadge isFounder={author?.role === 'Founder'} className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <DropdownMenu post={post} user={user} onShare={onShare} onEdit={onEdit} onDelete={onDelete} t={t} />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-black/30 overscroll-contain">
                        {/* ── STICKY COMMENT/ACTIONS BAR ── */}
                        <div className="sticky top-0 px-2 py-2 border-b border-white/10 bg-black/90 backdrop-blur-xl z-[200]">
                            <div className="flex flex-wrap items-center justify-between gap-2 w-full py-1">
                                <button
                                    onPointerDown={(e) => { e.stopPropagation(); document.getElementById(`comment-input-${post._id}`)?.focus(); }}
                                    className="flex flex-col items-center gap-1 min-w-[44px] py-1.5 rounded-2xl text-gray-500   ">
                                    <Icons.MessageSquare className="w-5 h-5" />
                                    <span className="text-[10px] font-black tabular-nums">{post.comments?.length || 0}</span>
                                </button>
                                <button
                                    onPointerDown={(e) => { e.stopPropagation(); onRepost?.(post._id); }}
                                    className={`flex flex-col items-center gap-1 min-w-[44px] py-1.5 rounded-2xl  ${post.reposts?.some(id => isSameId(id, user?._id)) ? 'text-green-400' : 'text-gray-500'}`}>
                                    <Icons.RefreshCcw className="w-5 h-5" />
                                    <span className="text-[10px] font-black tabular-nums">{post.reposts?.length || 0}</span>
                                </button>
                                <button
                                    onPointerDown={(e) => { e.stopPropagation(); onLike(post._id); }}
                                    className={`flex flex-col items-center gap-1 min-w-[44px] py-1.5 rounded-2xl  ${post.likes?.some(id => isSameId(id, user?._id)) ? 'text-red-400' : 'text-gray-500'}`}>
                                    <Icons.Heart className={`w-5 h-5  ${post.likes?.some(id => isSameId(id, user?._id)) ? 'fill-current' : ''}`} />
                                    <span className="text-[10px] font-black tabular-nums">{post.likes?.length || 0}</span>
                                </button>
                                <button
                                    onPointerDown={(e) => { e.stopPropagation(); onDislike(post._id); }}
                                    className={`flex flex-col items-center gap-1 min-w-[44px] py-1.5 rounded-2xl  ${post.dislikes?.some(id => isSameId(id, user?._id)) ? 'text-[var(--gold-primary)]' : 'text-gray-500'}`}>
                                    <Icons.ThumbsDown className={`w-5 h-5  ${post.dislikes?.some(id => isSameId(id, user?._id)) ? 'fill-current' : ''}`} />
                                    <span className="text-[10px] font-black tabular-nums">{post.dislikes?.length || 0}</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2 w-full">
                                <div className="w-9 h-9 rounded-full bg-gray-800 overflow-hidden shrink-0 ring-1 ring-white/10">
                                    <ProfileAvatar user={user} className="rounded-full" />
                                </div>
                                {isRecordingComment ? (
                                    <div className="flex-1 min-w-0 bg-red-500/10 border border-red-500/30 rounded-2xl p-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2 pl-1 shrink-0">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t('TRANSMITTING')}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => stopRecording(true)} className="p-2 bg-white/5 rounded-xl text-white"><Icons.X className="w-4 h-4" /></button>
                                            <button onClick={() => stopRecording(false)} className="px-3 py-2 bg-red-500 rounded-xl text-white font-black text-[10px] uppercase tracking-widest">{t('STOP')}</button>
                                        </div>
                                    </div>
                                ) : commentAudio ? (
                                    <div className="flex-1 min-w-0 flex items-center justify-between px-2 bg-black/60 border border-[var(--gold-primary)]/40 rounded-2xl p-1">
                                        <div className="flex items-center gap-2 pl-2 min-w-0">
                                            <div className="w-2 h-2 rounded-full bg-[var(--gold-primary)] animate-pulse shrink-0" />
                                            <span className="text-[10px] font-black text-[var(--gold-primary)] uppercase tracking-widest truncate">{t('VOICE_NOTE_READY')}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => setCommentAudio(null)} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500">
                                                <Icons.X className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => {
                                                const fd = new FormData(); fd.append('file', commentAudio, 'voice.webm');
                                                if (commentText.trim()) fd.append('text', commentText.trim());
                                                onComment(post._id, fd); setCommentAudio(null); setCommentText('');
                                            }} className="w-9 h-9 flex items-center justify-center bg-[var(--gold-primary)] rounded-xl text-black">
                                                <Icons.Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={(e) => { e.preventDefault(); if (commentText.trim()) { onComment(post._id, commentText); setCommentText(''); } }} className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden min-h-[46px]">
                                        <input
                                            id={`comment-input-${post._id}`}
                                            placeholder={t('FOUNDER_PLACEHOLDER')}
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            className="flex-1 min-w-0 bg-transparent py-3 px-3 text-sm text-white outline-none placeholder-gray-600 font-bold"
                                        />
                                        <div className="flex gap-1 pr-1 shrink-0">
                                            <button type="button" onClick={toggleCommentRecording} className={`w-9 h-9 flex items-center justify-center rounded-full ${isRecordingComment ? 'bg-red-500 text-white' : 'text-gray-500'}`}>
                                                <Icons.Mic className="w-4 h-4" />
                                            </button>
                                            <button type="submit" disabled={!commentText.trim()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--gold-primary)] text-black disabled:opacity-25   shrink-0">
                                                <Icons.Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                        {/* Description Section */}
                        <div className="px-4 sm:px-6 py-6 bg-gradient-to-br from-black via-[#0a0a0a] to-black border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-10 relative">
                            <div className="space-y-4">
                                <div className="text-[15px] text-white border-l-4 border-[var(--gold-primary)] pl-5 py-2 pb-3 font-bold leading-relaxed w-full text-left drop-shadow-2xl">
                                    {parseHashtags((translatedText || post.desc) && (translatedText || post.desc).length > 500 && !isExpanded ? (translatedText || post.desc).slice(0, 500) + '...' : (translatedText || post.desc))}
                                    {(translatedText || post.desc) && (translatedText || post.desc).length > 500 && (
                                        <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-[var(--gold-primary)] text-[10px] font-black uppercase tracking-widest ml-2 hover:underline">
                                            {isExpanded ? t('READ_LESS') : t('READ_MORE')}
                                        </button>
                                    )}
                                </div>
                                <div className="pl-5">
                                    <button
                                        onClick={handleTranslate}
                                        disabled={isTranslating}
                                        className="text-[10px] font-black text-[var(--gold-primary)] uppercase tracking-widest hover:underline flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
                                    >
                                        <Icons.Globe className={`w-3 h-3 ${isTranslating ? 'animate-spin' : ''}`} />
                                        {isTranslating ? t('DECRYPTING', 'DECRYPTING...') : (translatedText ? t('SHOW_ORIGINAL', 'SHOW ORIGINAL') : t('SEE_TRANSLATION', 'SEE TRANSLATION'))}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="p-3">
                            <div className="w-full animate-fade-in space-y-4">
                                {!post.comments?.length ? (
                                    <p className="text-gray-600 text-[10px] uppercase font-bold py-2 text-center tracking-widest">{t('NO_COMMENTS') || "NO COMMENTS YET"}</p>
                                ) : (
                                    (Array.isArray(post.comments) ? post.comments.slice() : []).reverse().slice(0, 50).reverse().map((c, idx) => (
                                        <CommentItem key={c._id || idx} comment={c} post={post} user={user} allUsers={allUsers} onEdit={onEditComment} onDelete={onDeleteComment} t={t} lang={lang} />
                                    ))
                                )}
                            </div>
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
        } else if (event.data === window.YT.PlayerState.ENDED) {
            // Force loop seamlessly, bypassing suggested videos
            if (ytPlayerRef.current && ytPlayerRef.current.seekTo) {
                ytPlayerRef.current.seekTo(0);
                ytPlayerRef.current.playVideo();
            }
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

            return;
        }

        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);

        } else {
            videoRef.current.pause();
            setIsPlaying(false);

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
                            widget_referrer: window.location.origin,
                            loop: 1,
                            playlist: ytId
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
                    {/* Ghost Layer - Precision masking (120% zoom instead of 115%) to avoid cutting content */}
                    <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] pointer-events-none select-none transform-gpu backface-hidden">
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
                            className="w-full h-auto object-contain cursor-pointer max-h-[75vh] md:max-h-[85vh]  duration-500 will-change-transform transform-gpu"
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
                                    className="p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white pointer-events-auto     group/btn shadow-xl"
                                >
                                    {isMuted ? <Icons.VolumeX className="w-5 h-5 group-hover/btn:scale-110 " /> : <Icons.Volume2 className="w-5 h-5 group-hover/btn:scale-110 " />}
                                </button>
                                {onExpand && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isPlaying) {
                                                if (ytId && ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
                                                else if (videoRef.current) videoRef.current.pause();
                                                setIsPlaying(false);
                                            }
                                            onExpand();

                                        }}
                                        className="p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white pointer-events-auto     group/btn shadow-xl"
                                    >
                                        <Icons.Maximize className="w-5 h-5 group-hover/btn:scale-110 " />
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
                                <div className="absolute inset-x-0 -inset-y-2 group-hover/seek:bg-white/5  rounded-full" />
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-[var(--gold-primary)] shadow-[0_0_15px_var(--gold-glow)] rounded-full"
                                    style={{ width: `${progress}%` }}
                                    transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                                />
                                <motion.div
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-2xl border-2 border-[var(--gold-primary)] scale-0 group-hover/seek:scale-100  hidden sm:block"
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
        else if (note.type === 'security_alert') onOpenPost(note.post || note.postId);
        else if (note.post || note.postId) onOpenPost(note.post || note.postId);
        else onViewProfile(note.sender);

    };

    const isFounderSender = note?.sender?.role === 'Founder';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-3  rounded-2xl  cursor-pointer border-b border-white/5 group"
            onClick={handleClick}
        >
            <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden border border-white/10  shadow-md">
                    <ProfileAvatar user={{ username: note.fromUsername, profilePic: note.fromProfilePic }} className="rounded-full" />
                </div>
                {note.type === 'like' && <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1 border-2 border-black"><Icons.Heart className="w-3 h-3 text-white fill-current" /></div>}
                {note.type === 'comment' && <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-black"><Icons.MessageSquare className="w-3 h-3 text-white fill-current" /></div>}
                {note.type === 'message' && <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-black"><Icons.Mail className="w-3 h-3 text-white" /></div>}
                {note.type === 'follow' && <div className="absolute -bottom-1 -right-1 bg-[var(--gold-primary)] rounded-full p-1 border-2 border-black"><Icons.UserPlus className="w-3 h-3 text-black" /></div>}
                {note.type === 'follow_request' && <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1 border-2 border-black"><Icons.Shield className="w-3 h-3 text-white" /></div>}
                {note.type === 'security_alert' && <div className="absolute -bottom-1 -right-1 bg-orange-600 rounded-full p-1 border-2 border-black animate-pulse shadow-[0_0_10px_rgba(234,88,12,0.6)]"><Icons.ShieldCheck className="w-3 h-3 text-white" /></div>}
            </div>
            <div className="flex-1">
                <div className="text-sm flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-white group-hover:text-white uppercase tracking-tight">{(note.fromUsername && note.fromUsername !== 'Unknown' && note.fromUsername !== 'Someone') ? note.fromUsername : 'Agent'}</span>
                    <VerifiedBadge isFounder={isFounderSender} className="w-3.5 h-3.5 ml-1" />
                    <span className="text-gray-500 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold">
                        {note.type === 'follow' ? t('NOTIF_FOLLOW') :
                            note.type === 'like' ? t('NOTIF_LIKE') :
                                note.type === 'comment' ? t('NOTIF_COMMENT') :
                                    note.type === 'message' ? t('NOTIF_MESSAGE') :
                                        note.type === 'mention' ? t('NOTIF_MENTION') :
                                            note.type === 'security_alert' ? (lang === 'el' ? 'ΑΝΕΥΡΕΣΗ ΑΝΩΜΑΛΙΑΣ' : 'SECURITY ANOMALY DETECTED') :
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
                        <button onClick={() => onAcceptRequest(note.sender?._id || note.from, note._id)} className="flex-1 py-1.5 bg-[var(--gold-primary)] text-black text-[10px] font-black rounded-lg hover:scale-105   shadow-lg shadow-glow-gold/40 uppercase tracking-widest">{t('ACCEPT')}</button>
                        <button onClick={() => onRejectRequest(note.sender?._id || note.from, note._id)} className="flex-1 py-1.5 bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black rounded-lg    uppercase tracking-widest">{t('REJECT')}</button>
                    </div>
                )}
            </div>
            {note.postImage && (
                <div className="w-12 h-12 rounded-xl bg-gray-800 border border-white/10 overflow-hidden shrink-0 group-hover:scale-105 ">
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
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-900 border border-white/10 shadow-md relative group">
                    <ProfileAvatar user={user} className="opacity-80 rounded-full" key={imgKey} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white drop-shadow-lg group-hover:scale-125 ">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
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
                    const yid = getYouTubeId(s.videoUrl);
                    if (yid) ytThumb = `https://img.youtube.com/vi/${yid}/hqdefault.jpg`;
                }

                return (
                    <div key={s._id || i} onClick={() => onViewStory(s)} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-black shadow-md border border-white/10 relative cursor-pointer hover:opacity-90 transition-opacity">
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
                                    <img src={resolveMediaUrl(s.image)} className="w-full h-full object-cover rounded-full" alt="" />
                                )
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center p-1 rounded-full">
                                    <span className="text-[6px] text-gray-300 font-medium text-center leading-tight line-clamp-3">
                                        {s.desc}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide max-w-[60px] truncate">{s.author?.username}</span>
                    </div>
                );
            })}
        </div>
    );
};

const PostCard = memo(({ post, user, allUsers, onLike, onDislike, onRepost = null, onComment, onDelete, onViewProfile, onOpenDetail, onOpenChat, onEditComment, onDeleteComment, onEditPost, onShare, onHashtagClick, loadingActions, reposter = null, forcePause = false }) => {
    const { t, lang } = useTranslation(user);
    const [commentAudio, setCommentAudio] = useState(null);
    const [isRecordingComment, setIsRecordingComment] = useState(false);
    const commentRecorderRef = useRef(null);
    const commentStreamRef = useRef(null);
    const discardRef = useRef(false);
    const [imgError, setImgError] = useState(false); // Handle broken images

    const isCurrentUserFounder = user?.role === 'Founder';

    const authorId = post.author?._id || post.author;
    const author = (post.author && typeof post.author === 'object' && post.author.username)
        ? post.author
        : (allUsers?.find(u => isSameId(u._id, authorId)) || { username: 'Unknown', _id: authorId });

    // 🔥 ROBUST REPOSTER RESOLUTION
    let resolvedReposter = reposter;
    if (!resolvedReposter && post.isRepost && post.repostedBy) {
        const rId = post.repostedBy?._id || post.repostedBy;
        resolvedReposter = allUsers?.find(u => isSameId(u._id, rId));
        if (!resolvedReposter && typeof post.repostedBy === 'object' && post.repostedBy.username) {
            resolvedReposter = post.repostedBy;
        }
        if (!resolvedReposter) resolvedReposter = { username: 'Agent', _id: rId };
    }

    const isFounder = author?.role === 'Founder';
    const isOwner = isSameId(author?._id || author, user?._id);
    const canDelete = isOwner || isCurrentUserFounder;

    const [translatedText, setTranslatedText] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const handleTranslate = async (e) => {
        e.stopPropagation();
        if (isTranslating) return;
        if (translatedText) { setTranslatedText(null); return; }
        setIsTranslating(true);
        try {
            const res = await axios.get(`/posts/${post._id}/translate?lang=${lang}`);
            setTranslatedText(res.data.translatedText);

        } catch (e) { console.error("Neural link error:", e); }
        finally { setIsTranslating(false); }
    };

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
            className={`premium-post-card group relative p-4 sm:p-6 mb-6 rounded-[2.5rem] bg-black/40 backdrop-blur-xl border border-white/5   duration-500 shadow-2xl will-change-transform`}
        >
            {/* AMBIENT BACKGROUND GLOW */}
            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--gold-primary)]/5 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[var(--gold-primary)]/5 blur-[100px] rounded-full" />
            </div>

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
            <div className="relative z-10 flex flex-col">
                {resolvedReposter && (
                    <div className="flex items-center gap-2 mb-3 px-1 text-green-500/80">
                        <Icons.RefreshCcw className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            {(resolvedReposter?.username || 'Agent') === user?.username ? t('YOU_REPOSTED', 'YOU REPOSTED') : `${resolvedReposter?.username || 'Agent'} ${t('REPOSTED', 'REPOSTED')}`}
                        </span>
                    </div>
                )}
                <div className="flex gap-3 sm:gap-4">
                    {/* LEFT COL: AVATAR */}
                    <div className="shrink-0 flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-800 shadow-xl group-hover:scale-105  duration-500 cursor-pointer overflow-hidden border border-white/10" onClick={() => onViewProfile(author)}>
                            <ProfileAvatar user={author} className="rounded-full" />
                        </div>
                    </div>

                    {/* RIGHT COL: CONTENT */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-1 sm:mb-2 -mt-1 sm:-mt-0.5">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 flex-wrap leading-tight sm:leading-none">
                                    <span className="font-bold text-white text-[13px] sm:text-[15px] hover:underline cursor-pointer" onClick={() => onViewProfile(author)}>{author?.username}</span>
                                    <VerifiedBadge isFounder={isFounder} className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
                                    <span className="text-gray-500 text-[13px] ml-1 truncate max-w-[100px] sm:max-w-none">@{author?.username?.toLowerCase().replace(/\s+/g, '') || 'agent'}</span>
                                    <span className="text-gray-600 text-[13px] mx-1">·</span>
                                    <span className="text-gray-500 text-[12px] sm:text-[13px] font-medium whitespace-nowrap">{formatDate(post.createdAt, t, lang)}</span>
                                </div>
                            </div>

                            <DropdownMenu post={post} user={user} onShare={onShare} onEdit={onEditPost} onDelete={onDelete} t={t} />
                        </div>

                        <div className="space-y-3 mt-1">
                            {post.desc && (
                                <div className="space-y-2">
                                    <p className="text-[15px] sm:text-[16px] text-white/95 leading-relaxed font-medium whitespace-pre-wrap break-words pr-2 pb-1">
                                        {parseHashtags(translatedText || post.desc, (tag) => onHashtagClick(tag))}
                                    </p>
                                    <button
                                        onClick={handleTranslate}
                                        disabled={isTranslating}
                                        className="text-[10px] sm:text-[11px] font-black text-[var(--gold-primary)] uppercase tracking-widest hover:underline flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
                                    >
                                        <Icons.Globe className={`w-3 h-3 ${isTranslating ? 'animate-spin' : ''}`} />
                                        {isTranslating ? t('DECRYPTING', 'DECRYPTING...') : (translatedText ? t('SHOW_ORIGINAL', 'SHOW ORIGINAL') : t('SEE_TRANSLATION', 'SEE TRANSLATION'))}
                                    </button>
                                </div>
                            )}

                            {(post.image || post.videoUrl) && (
                                <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-[#050505] relative group-hover/media:scale-[1.01]  duration-700 shadow-md h-auto min-h-[100px] mt-2">
                                    {isYouTubeUrl(post.videoUrl) ? (
                                        <NeuralVideoPlayer src={post.videoUrl} className="w-full aspect-video" onExpand={() => onOpenDetail(post)} forcePause={forcePause} />
                                    ) : (post.videoUrl || (post.image && post.image.match(/\.(mp4|mov|webm)$/i))) ? (
                                        <NeuralVideoPlayer src={resolveMediaUrl(post.videoUrl || post.image)} poster={resolveMediaUrl(post.thumbnailUrl || post.videoUrl || post.image, null, false, true)} className="w-full h-auto" onExpand={() => onOpenDetail(post)} forcePause={forcePause} />
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

                        {/* ── POST ACTIONS BAR ── */}
                        <div className="flex items-center justify-around mt-3 w-full border-t border-white/5 pt-3">

                            {/* COMMENTS */}
                            <button
                                onPointerDown={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
                                className={`flex flex-col items-center gap-0.5 min-w-[44px] rounded-xl  ${showComments ? 'text-sky-400' : 'text-gray-600'}`}
                            >
                                <Icons.MessageSquare className="w-5 h-5" />
                                <span className="text-[10px] font-black tabular-nums">{post.comments?.length || 0}</span>
                            </button>

                            {/* REPOSTS */}
                            <button
                                onPointerDown={(e) => {
                                    e.stopPropagation();

                                    onRepost && onRepost(post._id);
                                }}
                                className={`flex flex-col items-center gap-0.5 min-w-[44px] rounded-xl  ${post.reposts?.some(id => isSameId(id, user?._id)) ? 'text-green-400 scale-110' : 'text-gray-600  '}`}
                            >
                                <Icons.RefreshCcw className="w-5 h-5" />
                                <span className="text-[10px] font-black tabular-nums">{post.reposts?.length || 0}</span>
                            </button>

                            {/* LIKE */}
                            <button
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    const isLiked = post.likes?.some(id => isSameId(id, user?._id));
                                    playSound(isLiked ? 'cyber_unlike' : 'cyber_like');
                                    onLike(post._id);

                                }}
                                className={`flex flex-col items-center gap-0.5 min-w-[44px] rounded-xl  ${post.likes?.some(id => isSameId(id, user?._id)) ? 'text-red-400 scale-110' : 'text-gray-600  '}`}
                            >
                                <Icons.Heart className={`w-5 h-5  ${post.likes?.some(id => isSameId(id, user?._id)) ? 'fill-current' : ''}`} />
                                <span className="text-[10px] font-black tabular-nums">{post.likes?.length || 0}</span>
                            </button>

                            {/* DISLIKE */}
                            <button
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    const isDisliked = post.dislikes?.some(id => isSameId(id, user?._id));
                                    playSound(isDisliked ? 'cyber_unlike' : 'cyber_like');
                                    onDislike(post._id);

                                }}
                                className={`flex flex-col items-center gap-0.5 min-w-[44px] rounded-xl  ${post.dislikes?.some(id => isSameId(id, user?._id)) ? 'text-[var(--gold-primary)] scale-110' : 'text-gray-600  '}`}
                            >
                                <Icons.ThumbsDown className={`w-5 h-5  ${post.dislikes?.some(id => isSameId(id, user?._id)) ? 'fill-current' : ''}`} />
                                <span className="text-[10px] font-black tabular-nums">{post.dislikes?.length || 0}</span>
                            </button>

                            {/* SHARE */}

                        </div>

                        {showComments && (
                            <div className="mt-4 pt-4 border-t border-white/5 space-y-6 animate-fade-in relative z-20">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                                        <ProfileAvatar user={user} className="rounded-full" />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-3">
                                        <div className="relative">
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder={t('WRITE_COMMENT')}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[var(--gold-primary)]/40  min-h-[100px] resize-none pb-12"
                                            />
                                            <div className="absolute bottom-2 left-2 flex gap-2">
                                                <button onClick={toggleCommentRecording} className={`p-2 rounded-xl  ${isRecordingComment ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-500'}`}>
                                                    <Icons.Mic className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => { if (commentText.trim()) { onComment(post._id, commentText); setCommentText(''); } }} className="p-2 bg-[var(--gold-primary)] text-black rounded-xl hover:opacity-90  ">
                                                    <Icons.Send className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        {commentAudio && (
                                            <div className="p-3 bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/30 rounded-2xl flex items-center justify-between mt-3">
                                                <div className="flex items-center gap-3">
                                                    <Icons.Mic className="w-4 h-4 text-[var(--gold-primary)]" />
                                                    <span className="text-[10px] font-black text-[var(--gold-primary)] uppercase">VOICE READY</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setCommentAudio(null)} className="p-1.5  text-red-500 rounded-lg"><Icons.Trash className="w-4 h-4" /></button>
                                                    <button onClick={() => { const fd = new FormData(); fd.append('file', commentAudio, 'voice.webm'); onComment(post._id, fd); setCommentAudio(null); }} className="px-4 py-1 bg-[var(--gold-primary)] text-black font-black text-[10px] rounded-lg">SEND</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-6 pt-4">
                                    {(post.comments || []).slice().reverse().map(c => (
                                        <CommentItem key={c._id} comment={c} post={post} user={user} allUsers={allUsers} onEdit={onEditComment} onDelete={onDeleteComment} t={t} lang={lang} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div >
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
                const found = allUsers.find(u => isSameId(u._id, initialChatUser));
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
            const isFromCurrentTarget = isSameId(msg.sender, targetId);
            const isToCurrentTarget = isSameId(msg.recipient, targetId);

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

        socket.on('chat.cleared', ({ withUser }) => {
            if (activeChat?._id === withUser) {
                setMessages(prev => ({ ...prev, [withUser]: [] }));
                onClose(); // Close the chat window automatically
                // Play a delete sound effect
            }
        });

        return () => {
            socket.off('message.received', handleMessageReceived);
            socket.off('chat.cleared');
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

        } catch (e) {
            console.error('Clear failed', e);
            setMessages(prev => ({ ...prev, [targetId]: [] }));

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

    const filteredUsers = allUsers.filter(u => {
        if (u._id === user?._id) return false;
        const isSearchEmpty = searchQuery.trim() === '';
        const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
        const isFollowing = user?.following?.some(id => String(id) === String(u._id));

        if (isSearchEmpty) {
            return isFollowing;
        }
        return matchesSearch;
    });

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-5xl h-full sm:h-[85vh] bg-black sm:rounded-3xl border border-white/10 flex overflow-hidden shadow-2xl">
                <div className={`w-full sm:w-80 border-r border-white/10 flex flex-col bg-black/50 backdrop-blur-xl absolute inset-0 sm:relative sm:inset-auto z-10 sm:z-0  duration-300 ${activeChat ? '-translate-x-full sm:translate-x-0' : 'translate-x-0'}`}>
                    <div className="p-4 border-b border-white/10 space-y-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black italic flex items-center gap-2 text-white">
                                    <Icons.Ghost className="w-8 h-8 text-[var(--gold-primary)]" />
                                    {t('CHAT')}
                                </h2>
                                <button onClick={() => { onClose(); }} className="sm:hidden p-2 text-gray-400"><Icons.X className="w-6 h-6" /></button>
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
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--gold-primary)]  placeholder:text-gray-600"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredUsers.length === 0 && <div className="p-4 text-center text-gray-500 text-xs">{t('ZERO_AGENTS')}</div>}
                        {filteredUsers.map(u => {
                            const online = isUserOnline(u, user);
                            return (
                                <button key={u._id} onClick={() => { setActiveChat(u); }} className={`w-full p-4 flex items-center gap-3 cursor-pointer   text-left touch-manipulation  ${isSameId(activeChat?._id, u._id) ? 'bg-white/5 border-l-2 border-[var(--gold-primary)]' : 'border-l-2 border-transparent'}`}>
                                    <div className="relative shrink-0"><div className={`w-12 h-12 rounded-full bg-gray-900 overflow-hidden shadow-sm border border-white/10`}><ProfileAvatar user={u} className="rounded-full" /></div><div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'}`} /></div>
                                    <div className="min-w-0 flex-1"><div className="font-bold text-sm text-white flex items-center gap-2 truncate">{u?.username} <VerifiedBadge isFounder={u.role === 'Founder'} className="w-4 h-4 shrink-0" /></div><div className={`text-[10px] font-medium ${online ? 'text-green-500' : 'text-gray-500'} uppercase tracking-wider`}>{online ? t('ONLINE') : t('OFFLINE')}</div></div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* CHAT WINDOW */}
                <div className={`flex-1 flex flex-col bg-[#050505] chat-shell absolute inset-0 sm:relative sm:inset-auto z-20 sm:z-0  duration-300 ${activeChat ? 'translate-x-0' : 'translate-x-full sm:translate-x-0'}`}>
                    {activeChat ? (
                        <>
                            <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-black/80 backdrop-blur-xl shrink-0 z-10">
                                <button
                                    onClick={() => { setActiveChat(null); }}
                                    className="sm:hidden p-2 -ml-2 text-gray-400"
                                >
                                    <Icons.Back className="w-6 h-6" />
                                </button>
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10"><ProfileAvatar user={activeChat} className="rounded-full" /></div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-sm text-white flex items-center gap-2 truncate">
                                        {activeChat?.username}
                                        <VerifiedBadge isFounder={activeChat?.role === 'Founder'} className="w-4 h-4 shrink-0" />
                                    </div>
                                    <div className={`text-[10px] ${isUserOnline(allUsers.find(au => isSameId(au._id, activeChat._id)) || activeChat, user) ? 'text-green-400 font-bold uppercase tracking-widest shadow-green-500/20' : 'text-gray-500 uppercase tracking-tighter'}`}>
                                        {(isUserOnline(allUsers.find(au => isSameId(au._id, activeChat._id)) || activeChat, user)) ? t('ONLINE') : t('OFFLINE')}
                                    </div>
                                </div>
                                <button onClick={() => { onClose(); }} className="hidden sm:block p-2 text-gray-400"><Icons.X className="w-6 h-6" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {(messages[activeChat._id] || []).map((m, i) => {
                                    const audioVal = m.audio || m.audioUrl || "";
                                    const isAudioActuallyImage = audioVal && /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|avif)/i.test(audioVal.split('?')[0]);
                                    const imageUrl = m.image || (isAudioActuallyImage ? audioVal : "");
                                    const realAudio = isAudioActuallyImage ? "" : audioVal;
                                    const isOwn = isSameId(m.sender, user?._id);

                                    const toggleLockMessage = async () => {
                                        if (!m._id) return;
                                        try {
                                            await axios.patch(`/messages/${m._id}/lock`, { locked: !m.isLocked });
                                            const targetId = activeChat._id;
                                            setMessages(prev => ({
                                                ...prev,
                                                [targetId]: (prev[targetId] || []).map(msg =>
                                                    msg._id === m._id ? { ...msg, isLocked: !m.isLocked } : msg
                                                )
                                            }));
                                        } catch (e) {
                                            console.error('Failed to toggle lock state', e);
                                        }
                                    };

                                    return (
                                        <div key={i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-md relative border ${isOwn ? 'bg-blue-600 text-white rounded-br-none border-blue-400/40' : 'bg-[#1a1a1a] text-white rounded-bl-none border-white/5'} ${m.isLocked ? 'ring-1 ring-[var(--gold-primary)]/70' : ''}`}>
                                                {isOwn && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleLockMessage(); }}
                                                        className={`absolute -top-2 right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] border shadow-md ${m.isLocked ? 'bg-[var(--gold-primary)] text-black border-[var(--gold-primary)]' : 'bg-black/70 text-gray-400 border-white/20'}`}
                                                        title={m.isLocked ? t('UNLOCK_MESSAGE', 'Ξεκλείδωμα μηνύματος για αυτόματη διαγραφή') : t('LOCK_MESSAGE', 'Κλείδωμα μηνύματος για μόνιμη αποθήκευση')}
                                                    >
                                                        <Icons.Lock className="w-3 h-3" />
                                                    </button>
                                                )}
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
                                        <button onClick={clearImage} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg   ">
                                            <Icons.X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="p-3 pb-14 sm:pb-2 bg-[#050505] border-t border-white/10 flex flex-col gap-2 z-[100] relative shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                                <div className="flex-1 relative flex items-center bg-[#111] border border-white/20 rounded-[1.3rem] px-4 py-1 focus-within:border-[var(--gold-primary)]  group overflow-hidden">
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
                                        <Icons.CommandLine className="w-5 h-5 text-gray-500 group-focus-within:text-[var(--gold-primary)] " />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setIsPhonetic(!isPhonetic); }}
                                        className={`w-12 h-12 flex items-center justify-center rounded-2xl border  shrink-0 ${isPhonetic ? 'bg-[var(--gold-primary)]/20 border-[var(--gold-primary)] text-[var(--gold-primary)] shadow-[0_0_15px_rgba(var(--gold-primary-rgb),0.3)]' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                        title="Phonetic Greek Keyboard"
                                    >
                                        <Icons.Translate className="w-5 h-5" />
                                    </button>
                                    {/* IMAGE UPLOAD BUTTON */}
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl  shrink-0 ${imageFile ? 'bg-[var(--gold-primary)]/20 text-[var(--gold-primary)] border border-[var(--gold-primary)]/40' : 'bg-white/5  text-gray-500  '}`}
                                        title="Send Image"
                                    >
                                        <Icons.Image className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); toggleRecording(); }}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl  shrink-0 ${isRecording ? 'bg-red-500 text-white shadow-glow-red animate-pulse' : 'bg-white/5  text-gray-500  '}`}
                                    >
                                        <Icons.Mic className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!inputText.trim() && !imageFile}
                                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--gold-primary)] text-black shadow-lg shadow-glow-gold/40  disabled:opacity-20 disabled:scale-100  shrink-0 font-black hover:opacity-90"
                                    >
                                        <Icons.Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center px-4">
                            <div className="flex flex-col items-center">
                                <button className="mb-6 bg-transparent border-none p-0   group">
                                    <Icons.Ghost className="w-24 h-24 text-[var(--gold-primary)] group-hover:scale-105  duration-500 drop-shadow-[0_0_15px_rgba(var(--gold-primary-rgb),0.3)]" />
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

const Toggle = ({ active, onToggle, saving, color = 'gold' }) => {
    const colors = {
        gold: { on: 'bg-[var(--gold-primary)] border-[var(--gold-primary)]', dot: '' },
        blue: { on: 'bg-blue-600 border-blue-500', dot: '' },
    };
    const c = colors[color] || colors.gold;
    return (
        <div
            onClick={() => !saving && onToggle()}
            className={`relative w-12 h-7 rounded-full  duration-300 cursor-pointer border shrink-0 ${active ? c.on : 'bg-black/40 border-white/20'}`}
        >
            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md  duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
    );
};

const SectionHeader = ({ color, label }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className={`w-1 h-4 rounded-full shadow-[0_0_10px_currentColor] ${color}`} />
        <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.25em]">{label}</h3>
    </div>
);

const SettingRow = ({ label, desc, children, hoverColor = '' }) => (
    <div className={`flex items-center justify-between gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5 ${hoverColor} group`}>
        <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">{label}</div>
            {desc && <div className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{desc}</div>}
        </div>
        {children}
    </div>
);

const SettingsModal = ({ isOpen, onClose, logout, user, onUpdateUser }) => {
    const { t, i18n, lang } = useTranslation(user);
    const [saving, setSaving] = useState(false);
    const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
    const [isFollowersOnly, setIsFollowersOnly] = useState(user?.isFollowersOnly || false);
    const [showDanger, setShowDanger] = useState(false);
    const [themeCategory, setThemeCategory] = useState('primary');
    const [zoomLevel, setZoomLevel] = useState(
        Math.min(
            1,
            Math.max(
                0.95,
                user?.settings?.zoom || parseFloat(localStorage.getItem('uiZoom') || '1') || 1
            )
        )
    );

    useEffect(() => {
        if (user && !saving) {
            setIsPrivate(user.isPrivate || false);
            setIsFollowersOnly(user.isFollowersOnly || false);
            setZoomLevel(
                Math.min(
                    1,
                    Math.max(
                        0.95,
                        user.settings?.zoom || parseFloat(localStorage.getItem('uiZoom') || '1') || 1
                    )
                )
            );
        }
    }, [user, saving]);

    const handleSave = async (key, val) => {
        setSaving(true);
        try {
            if (key === 'isPrivate' || key === 'isFollowersOnly') {
                const res = await axios.put(`/users/${user._id || user.userId}`, { [key]: val });
                onUpdateUser(res.data);
                if (key === 'isPrivate') setIsPrivate(val);
                if (key === 'isFollowersOnly') setIsFollowersOnly(val);

                setSaving(false);
                return;
            }
            let payload = { [key]: val };
            if (key === 'language') payload = { settings: { language: val } };
            if (key === 'theme') payload = { settings: { theme: val } };
            if (key === 'displayMode') payload = { settings: { displayMode: val } };
            if (key === 'zoom') payload = { settings: { zoom: val } };
            const res = await axios.put('/users/settings', payload);
            onUpdateUser(res.data);
            if (key === 'isPrivate') setIsPrivate(val);
            if (key === 'isFollowersOnly') setIsFollowersOnly(val);

        } catch (e) {
            console.error("Settings update failed", e);
            if (key === 'isPrivate') setIsPrivate(!val);
            if (key === 'isFollowersOnly') setIsFollowersOnly(!val);
        } finally { setSaving(false); }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 overflow-hidden">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="relative w-[95%] sm:w-full max-w-[420px] max-h-[90vh] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col backdrop-blur-3xl will-change-transform"
                style={{ backgroundColor: 'var(--glass-bg)' }}
            >
                {/* Ambient glows */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--gold-primary)] to-transparent opacity-20" />
                <div className="absolute -top-[100px] -right-[100px] w-[250px] h-[250px] bg-[var(--gold-primary)]/[0.04] rounded-full blur-[80px] pointer-events-none" />

                {/* HEADER */}
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--gold-primary)]/10 rounded-xl">
                            <Icons.Settings className="w-5 h-5 text-[var(--gold-primary)]" />
                        </div>
                        <div>
                            <h2 className="font-black uppercase tracking-[0.2em] text-[13px] text-white leading-none">{t('SETTINGS')}</h2>
                            <div className="text-[10px] font-medium text-gray-500 mt-0.5 tracking-wide">{t('SETTINGS_SUBTITLE')}</div>
                        </div>
                    </div>
                    <button onClick={() => { onClose(); }} className="p-0   touch-manipulation">
                        <Icons.X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-7 relative z-10">

                    {/* ── ΙΔΙΩΤΙΚΟΤΗΤΑ ── */}
                    <section>
                        <SectionHeader color="bg-[var(--gold-primary)]" label={t('PRIVACY')} />
                        <div className="space-y-2">
                            <SettingRow label={t('PRIVATE_TITLE')} desc={t('PRIVATE_DESC_SHORT')}>
                                <Toggle active={isPrivate} onToggle={() => { const v = !isPrivate; setIsPrivate(v); handleSave('isPrivate', v); }} saving={saving} color="gold" />
                            </SettingRow>
                            <SettingRow label={t('GUARD_TITLE')} desc={t('GUARD_DESC_SHORT')} hoverColor="">
                                <Toggle active={isFollowersOnly} onToggle={() => { const v = !isFollowersOnly; setIsFollowersOnly(v); handleSave('isFollowersOnly', v); }} saving={saving} color="blue" />
                            </SettingRow>
                        </div>
                    </section>

                    {/* ── ΑΙΣΘΗΤΙΚΗ ── */}
                    <section>
                        <SectionHeader color="bg-purple-500" label={t('AESTHETICS')} />
                        <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                            <div className="space-y-4">
                                <div className="space-y-2 mt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] flex flex-col leading-tight">
                                            <span>{t('UI_ZOOM')}</span>
                                        </span>
                                        <span className="text-[10px] font-black text-gray-400">
                                            {Math.round(zoomLevel * 100)}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.95"
                                        max="1"
                                        step="0.01"
                                        value={zoomLevel}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setZoomLevel(val);
                                            applyZoom(val);
                                            handleSave('zoom', val);
                                        }}
                                        className="w-full accent-[var(--gold-primary)]"
                                    />
                                </div>
                                <div className="hidden sm:flex items-center justify-center gap-2">
                                    {[
                                        { id: 'primary', label: t('CATEGORY_PRIMARY') },
                                        { id: 'neons', label: t('CATEGORY_NEONS') }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setThemeCategory(opt.id)}
                                            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border  ${themeCategory === opt.id
                                                ? 'bg-[var(--gold-primary)]/10 border-[var(--gold-primary)] text-[var(--gold-primary)]'
                                                : 'bg-white/[0.03] border-white/10 text-gray-500'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="sm:hidden space-y-2">
                                    <div className="text-[11px] font-black text-gray-300 uppercase tracking-widest pl-1">
                                        THEME
                                    </div>
                                    <select
                                        value={user?.settings?.theme || localStorage.getItem('themeColor') || '#cc0000'}
                                        onChange={(e) => {
                                            const color = e.target.value;
                                            applyTheme(color);
                                            handleSave('theme', color);
                                        }}
                                        className="w-full bg-[var(--app-bg)] border border-white/40 rounded-2xl py-3.5 px-4 text-[15px] font-black text-[var(--app-text)] outline-none cursor-pointer   appearance-none h-[56px]"
                                    >
                                        <option value="#cc0000" className="bg-black text-white">{t('COLOR_RED')}</option>
                                        <option value="#ffd700" className="bg-black text-white">{t('COLOR_GOLD')}</option>
                                        <option value="#3b82f6" className="bg-black text-white">{t('COLOR_BLUE')}</option>
                                        <option value="#10b981" className="bg-black text-white">{t('COLOR_GREEN')}</option>
                                        <option value="#ffffff" className="bg-black text-white">{t('COLOR_WHITE')}</option>
                                        <option value="#a855f7" className="bg-black text-white">{t('COLOR_PURPLE')}</option>
                                    </select>
                                </div>
                                {themeCategory === 'primary' && (
                                    <div className="hidden sm:grid grid-cols-6 gap-3 place-items-center">
                                        {[
                                            { hex: '#ffd700', glow: '#ffd700', label: t('COLOR_GOLD') },
                                            { hex: '#3b82f6', glow: '#3b82f6', label: t('COLOR_BLUE') },
                                            { hex: '#cc0000', glow: '#ff0000', label: t('COLOR_RED') },
                                            { hex: '#10b981', glow: '#10b981', label: t('COLOR_GREEN') },
                                            { hex: '#ffffff', glow: '#ffffff', label: t('COLOR_WHITE') },
                                            { hex: '#a855f7', glow: '#a855f7', label: t('COLOR_PURPLE') },
                                        ].map(({ hex: c, glow, label }) => {
                                            const currentTheme = user?.settings?.theme || localStorage.getItem('themeColor') || '#ffd700';
                                            const isActive = currentTheme === c || (c === '#cc0000' && currentTheme === '#ef4444');
                                            return (
                                                <div key={c} className="flex flex-col items-center justify-center">
                                                    <button onClick={() => { applyTheme(c); handleSave('theme', c); }}
                                                        className={`w-9 h-9 rounded-full  duration-300 relative flex items-center justify-center ${isActive ? 'scale-125' : 'opacity-50 hover:opacity-100 hover:scale-110'}`}
                                                    >
                                                        <div className="w-full h-full rounded-full" style={{
                                                            backgroundColor: c,
                                                            boxShadow: 'none'
                                                        }} />
                                                        {isActive && <div className="absolute inset-0 ring-2 ring-white/70 ring-offset-2 ring-offset-black rounded-full" />}
                                                    </button>
                                                    <span className={`text-[9px] font-black mt-1 ${isActive ? 'text-white' : 'text-gray-500'}`}>{t('COLOR_' + c.id)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {themeCategory === 'neons' && (
                                    <div className="hidden sm:grid grid-cols-6 gap-3 place-items-center">
                                        {[
                                            { hex: '#ff8c00', glow: '#ff8c00', label: t('COLOR_ORANGE') },
                                            { hex: '#ff69b4', glow: '#ff69b4', label: t('COLOR_PINK') },
                                            { hex: '#00ffff', glow: '#00ffff', label: t('COLOR_CYAN') },
                                            { hex: '#7cfc00', glow: '#7cfc00', label: t('COLOR_LIME') },
                                            { hex: '#ff00ff', glow: '#ff00ff', label: t('COLOR_MAGENTA') },
                                            { hex: '#ffa500', glow: '#ffa500', label: t('COLOR_TANGERINE') },
                                        ].map(({ hex: c, glow, label }) => {
                                            const currentTheme = user?.settings?.theme || localStorage.getItem('themeColor') || '#ffd700';
                                            const isActive = currentTheme === c || (c === '#cc0000' && currentTheme === '#ef4444');
                                            return (
                                                <div key={c} className="flex flex-col items-center justify-center">
                                                    <button onClick={() => { applyTheme(c); handleSave('theme', c); }}
                                                        className={`w-9 h-9 rounded-full  duration-300 relative flex items-center justify-center ${isActive ? 'scale-125' : 'opacity-50 hover:opacity-100 hover:scale-110'}`}
                                                    >
                                                        <div className="w-full h-full rounded-full" style={{
                                                            backgroundColor: c,
                                                            boxShadow: 'none'
                                                        }} />
                                                        {isActive && <div className="absolute inset-0 ring-2 ring-white/70 ring-offset-2 ring-offset-black rounded-full" />}
                                                    </button>
                                                    <span className={`text-[9px] font-black mt-1 ${isActive ? 'text-white' : 'text-gray-500'}`}>{t('COLOR_' + c.id)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ── ΓΝΩΣΗ (Language) ── */}
                    <section>
                        <SectionHeader color="bg-blue-500" label={t('COGNITION')} />
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'en', flag: '🇺🇸', label: 'EN' }, { id: 'el', flag: '🇬🇷', label: 'EL' },
                                { id: 'de', flag: '🇩🇪', label: 'DE' }, { id: 'ru', flag: '🇷🇺', label: 'RU' },
                                { id: 'cy', flag: '🇨🇾', label: 'CY' }, { id: 'es', flag: '🇪🇸', label: 'ES' },
                                { id: 'tr', flag: '🇹🇷', label: 'TR' }, { id: 'fr', flag: '🇫🇷', label: 'FR' }
                            ].map(l => (
                                <button key={l.id} onClick={() => { i18n.changeLanguage(l.id); handleSave('language', l.id); localStorage.setItem('language', l.id); }}
                                    className={`py-3 rounded-2xl border  flex flex-col items-center justify-center gap-1.5 group relative overflow-hidden ${lang === l.id ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/10 shadow-[0_0_14px_rgba(255,215,0,0.15)]' : 'border-white/5 bg-white/[0.02]'}`}
                                >
                                    <div className="text-xl drop-shadow">{l.flag}</div>
                                    <div className={`text-[9px] font-black ${lang === l.id ? 'text-[var(--gold-primary)]' : 'text-gray-500'}`}>{l.name}</div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* ── ΛΕΙΤΟΥΡΓΙΕΣ ── */}
                    <section className="pt-2 border-t border-white/5">
                        <SectionHeader color="bg-red-600" label={t('OPERATIONS')} />
                        <div className="space-y-2">
                            {showDanger ? (
                                <div className="p-5 bg-red-950/20 rounded-2xl border border-red-500/20 text-center animate-pop-in">
                                    <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                                        <Icons.AlertTriangle className="w-3 h-3" />
                                        {t('DANGER_ZONE')}
                                    </div>
                                    <button onClick={async () => { if (confirm(t('DELETE_ACCOUNT_CONFIRM'))) { try { await axios.delete(`/users/${user._id}`); logout(); } catch (e) { } } }}
                                        className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl font-black text-[10px] tracking-widest hover:from-red-500 hover:to-red-700  shadow-lg  uppercase">
                                        {t('DELETE_FOREVER')}
                                    </button>
                                    <button onClick={() => setShowDanger(false)} className="mt-3 text-[9px] font-black text-gray-500 uppercase tracking-widest  ">{t('CANCEL')}</button>
                                </div>
                            ) : (
                                <button onClick={() => setShowDanger(true)} className="w-full py-4 bg-white/[0.02]  rounded-2xl border border-white/5 text-gray-500   text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-3">
                                    {t('UNCOVER_RESTRICTED_OPS')}
                                </button>
                            )}

                            <button onClick={logout} className="w-full flex items-center justify-between p-4 bg-white/[0.03]  rounded-2xl border border-white/5   group ">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:text-white">
                                        <Icons.Logout className="w-4 h-4 text-red-500" />
                                    </div>
                                    <span className="text-xs font-black text-white/80 group-hover:text-white uppercase tracking-[0.2em]">{t('LOGOUT')}</span>
                                </div>
                                <Icons.ArrowRight className="w-4 h-4 text-white/10 group-hover:text-white group-hover:translate-x-1" />
                            </button>
                        </div>
                    </section>

                </div>

                {saving && (
                    <div className="absolute top-5 right-16 pointer-events-none">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 backdrop-blur-md">
                            <div className="w-1.5 h-1.5 bg-[var(--gold-primary)] rounded-full animate-ping" />
                            <span className="text-[9px] font-bold text-[var(--gold-primary)] uppercase tracking-wider">{t('SYNCING')}</span>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const NavigationDrawer = ({ isOpen, onClose, user, allUsers, alerts, onNavigate, onViewProfile, onOpenSettings, onOpenTerms, onOpenPrivacy, onLogout, onOpenChat, t }) => {
    const [isClosing, setIsClosing] = useState(false);

    if (!isOpen && !isClosing) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 200);
    };

    const handleLink = (tab) => {
        onNavigate(tab);
        handleClose();

    };

    return (
        <div className="fixed inset-0 z-[2000] flex pointer-events-none">
            {/* BACKDROP */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-auto z-[100] ${isClosing ? 'drawer-backdrop closing' : 'drawer-backdrop'}`}
                onClick={handleClose}
            />

            {/* DRAWER CONTAINER - PREMIUM iOS GLASS */}
            <div className={`
                fixed top-0 left-0 bottom-0 w-[65%] sm:w-[280px]
                liquid-glass-nav backdrop-blur-[25px] border-r border-white/10 flex flex-col pointer-events-auto
                shadow-[15px_0_60px_rgba(0,0,0,0.9)] z-[101] overflow-hidden
                ${isClosing ? 'drawer-panel closing' : 'drawer-panel'}
            `}>
                <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
                    {/* TOP ACCENT VERY SUBTLE HIGHLIGHT */}
                    <div className="absolute top-0 left-0 w-full h-[150px] bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                    {/* PROFILE SECTION - TWITTER STYLE CLEAN */}
                    <div
                        className="p-4 pt-8 flex flex-col cursor-pointer relative z-10 transition-colors duration-300 hover:bg-white/[0.02]"
                        onClick={() => { onViewProfile(user); handleClose(); }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="w-[48px] h-[48px] rounded-full overflow-hidden shrink-0 border border-white/10">
                                <ProfileAvatar user={user} className="w-full h-full object-cover" />
                            </div>
                        </div>

                        <div className="flex flex-col mt-1">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-[17px] text-white leading-tight break-words">{user?.username}</span>
                                <VerifiedBadge isFounder={user?.role === 'Founder'} className="w-4 h-4 shrink-0" />
                            </div>
                            <span className="text-[15px] text-gray-500 leading-tight mt-0.5 break-words">@{user?.username?.toLowerCase().split(' ').join('')}</span>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); onViewProfile(user); }}>
                                <span className="font-bold text-white text-[13px] tabular-nums">
                                    {[...new Set((user?.followers || []).filter(id => allUsers.some(u => isSameId(u._id, id))))].length}
                                </span>
                                <span className="text-[13px] text-gray-500 font-normal">
                                    {t('FOLLOWERS') || 'Followers'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); onViewProfile(user); }}>
                                <span className="font-bold text-white text-[13px] tabular-nums">
                                    {[...new Set((user?.following || []).filter(id => allUsers.some(u => isSameId(u._id, id))))].length}
                                </span>
                                <span className="text-[13px] text-gray-500 font-normal">{t('FOLLOWING')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 mx-6 mb-4" />

                    {/* NAV ITEMS */}
                    <div className="flex flex-col py-2 relative z-10">
                        {[
                            { id: 'home', icon: Icons.Home, label: t('HOME') },
                            { id: 'search', icon: Icons.Search, label: t('EXPLORE') },
                            { id: 'chat', icon: Icons.Ghost, label: t('WHISPERS') },
                            { id: 'alerts', icon: Icons.Bell, label: t('NOTIFICATIONS_TITLE'), badge: alerts?.filter(n => !n.read).length },
                            { id: 'settings', icon: Icons.Settings, label: t('SETTINGS'), action: onOpenSettings }
                        ].map((item, index) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    if (item.action) { item.action(); handleClose(); }
                                    else handleLink(item.id);
                                }}
                                className="w-full px-4 py-4 flex items-center gap-5 hover:bg-white/5 transition-colors menu-item-slide group"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <item.icon className="w-[26px] h-[26px] text-white shrink-0 group-hover:scale-105 transition-transform" strokeWidth={2} />
                                <span className="text-xl font-bold text-white tracking-wide">{item.label}</span>

                                {item.badge > 0 && (
                                    <div className="ml-auto min-w-[20px] h-[20px] px-1.5 bg-[var(--gold-primary)] rounded-full flex items-center justify-center">
                                        <span className="text-[11px] font-bold text-black leading-none">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}

                        <div className="h-px bg-white/5 mx-2 my-2" />

                        {/* LOGOUT ITEM - MATCHES NAV */}
                        <button
                            onClick={() => { onLogout(); handleClose(); }}
                            className="w-full px-4 py-4 flex items-center gap-5 hover:bg-white/5 transition-colors menu-item-slide group"
                            style={{ animationDelay: `0.25s` }}
                        >
                            <Icons.Logout className="w-[26px] h-[26px] text-white shrink-0 group-hover:text-red-500 transition-colors" strokeWidth={2} />
                            <span className="text-xl font-bold text-white tracking-wide group-hover:text-red-500 transition-colors">{t('LOGOUT')}</span>
                        </button>
                    </div>

                    {/* DISCREET BOTTOM LEGAL LINKS */}
                    <div className="flex flex-col gap-3 px-6 pt-4 pb-10 mt-auto">
                        <button onClick={() => { onOpenTerms(); handleClose(); }} className="text-left text-gray-500 hover:text-white transition-colors font-medium text-[13px] whitespace-normal break-words leading-tight">{t('TERMS_OF_SERVICE')}</button>
                        <button onClick={() => { onOpenPrivacy(); handleClose(); }} className="text-left text-gray-500 hover:text-white transition-colors font-medium text-[13px] whitespace-normal break-words leading-tight">{t('PRIVACY_POLICY')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LegalModal = ({ isOpen, onClose, title, content, t }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[80vh] bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl animate-zoom-in">
                <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between gap-3">
                    <h2 className="text-base sm:text-xl font-black text-white uppercase tracking-widest truncate min-w-0">{title}</h2>
                    <button onClick={() => { onClose(); }} className="p-2  rounded-full  text-gray-400  shrink-0  touch-manipulation">
                        <Icons.X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 text-gray-400 space-y-4 font-medium text-sm leading-relaxed no-scrollbar select-text">
                    {content}
                </div>
                <div className="p-6 border-t border-white/10 flex justify-end">
                    <button onClick={() => { onClose(); }} className="px-8 py-3 bg-white text-black font-black rounded-xl hover:scale-105   uppercase tracking-widest text-xs touch-manipulation">
                        {t('GOT_IT')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProfileModal = ({
    isOpen, onClose, profileUser, currentUser, allUsers, preloadedPosts, posts, onFollow, onUpdateUser, onViewProfile, onOpenChat, onOpenDetail, onOpenCreate, imgKey, fetchSpecificUser, lastDeletedPostId, followLoading, addToast, onDeletePost, onLike, onDislike, onRepost, onComment, onEditComment, onDeleteComment, onEditPost, onShare, onHashtagClick, loadingActions, selectedPost }) => {
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
    const [profileUploading, setProfileUploading] = useState(false);

    const displayUser = React.useMemo(() => {
        if (!profileUser) return null;
        const profileUserId = safeId(profileUser);
        const currentUserId = safeId(currentUser);
        const isMe = isSameId(profileUserId, currentUserId);

        // 1. Determine the "base" data source (detailed info like bio)
        // For ME: currentUser is always the most fresh
        // For OTHERS: userData (from specific fetch) or profileUser (from global list)
        const base = isMe ? currentUser : (userData || profileUser);

        // 2. Get "live" status (online status, latest follower counts) from global users list
        const live = allUsers.find(u => isSameId(u._id, base?._id)) || {};

        // 3. Merge: Prioritize 'base' for identity/bio, but use 'live' for real-time status
        // We merge live first, then base, so base fields (like bio/username) always win
        const merged = {
            ...live,
            ...base,
            // Ensure some live fields from the global sync win if they are present
            lastSeen: live.lastSeen || base.lastSeen,
            followers: live.followers || base.followers || [],
            following: live.following || base.following || [],
            followRequests: live.followRequests || base.followRequests || []
        };

        return merged;
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

    // LIVE SYNC: React to repost changes - remove un-reposted posts from profile immediately
    useEffect(() => {
        if (!isOpen || !profileUser?._id) return;
        const profileUserId = String(profileUser._id);

        const handleReposted = ({ postId, reposts }) => {
            setUserSpecificPosts(prev => prev.map(p => {
                if (String(p._id) !== String(postId)) return p;
                return { ...p, reposts };
            }).filter(p => {
                const isOwn = String(p.author?._id || p.author) === profileUserId;
                if (isOwn) return true;
                const newReposts = (p._id === String(postId) ? reposts : p.reposts) || [];
                return newReposts.some(id => String(id) === profileUserId);
            }));
        };

        socket.on('post.reposted', handleReposted);
        return () => socket.off('post.reposted', handleReposted);
    }, [isOpen, profileUser?._id]);

    // 🔥 PERFORMANCE FIX: Efficiently sync and update local profile posts with any global changes
    useEffect(() => {
        if (!isOpen || !posts?.length || !userSpecificPosts?.length) return;

        // Use a Map for O(1) lookups during sync
        const globalPostMap = new Map(posts.map(p => [String(p._id), p]));

        let hasChanges = false;
        const synced = userSpecificPosts.map(localPost => {
            const globalPost = globalPostMap.get(String(localPost._id));
            if (!globalPost) return localPost;

            // Shallow comparison check before updating to prevent infinite React cycles if needed
            if (localPost.likes?.length !== globalPost.likes?.length ||
                localPost.comments?.length !== globalPost.comments?.length ||
                localPost.reposts?.length !== globalPost.reposts?.length) {
                hasChanges = true;
                return {
                    ...localPost,
                    likes: globalPost.likes,
                    dislikes: globalPost.dislikes,
                    reposts: globalPost.reposts,
                    comments: globalPost.comments,
                };
            }
            return localPost;
        });

        if (hasChanges) setUserSpecificPosts(synced);
    }, [posts, isOpen]);

    const userPosts = React.useMemo(() => (userSpecificPosts || []).filter(p => {
        // Strict exclusion of stories from the main grid, UNLESS it's a repost from someone else
        if (p.isStory === true || String(p.isStory) === 'true') {
            const isOriginalAuthor = String(p.author?._id || p.author) === String(profileUser?._id);
            if (isOriginalAuthor) return false;
        }

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
        return (allUsers || []).filter(u => ids?.some(id => isSameId(id, u._id)));
    };

    if (!isOpen || !profileUser) return null;

    const isFollowing = currentUser?.following?.some(id => isSameId(id, displayUser?._id));
    const hasRequested = displayUser?.followRequests?.some(id => isSameId(id, currentUser?._id));

    return (

        <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ y: '100dvh' }} animate={{ y: 0 }} exit={{ y: '100dvh' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`relative w-full max-w-lg h-[100dvh] sm:h-[85vh] sm:rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl ${displayUser?.coverPic ? 'bg-black' : 'bg-[#0a0a0a]'}`}>

                {displayUser?.coverPic && (
                    <div className="absolute inset-0 z-0 pointer-events-none animate-fade-in">
                        {displayUser.coverPic.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
                            <video src={resolveMediaUrl(displayUser.coverPic, null, false, false, true)} autoPlay loop muted playsInline disablePictureInPicture disableRemotePlayback className="w-full h-full object-cover opacity-[0.85]" />
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
                    }} className="p-2 -ml-2 rounded-full   "><Icons.Back className="w-6 h-6 text-white" /></button>
                    <div className="font-bold text-white text-sm uppercase tracking-widest leading-none">{activeList ? (activeList === 'followers' ? t('FOLLOWERS') : t('FOLLOWING')) : (isEditing ? t('EDIT_PROFILE') : displayUser?.username)}</div>
                    <div className="w-10" />
                </div>

                <div className={`flex-1 overflow-y-auto custom-scrollbar relative overscroll-y-contain pb-32 z-10 ${displayUser?.coverPic ? 'bg-transparent' : 'bg-[#050505]'}`}>
                    {activeList ? (
                        <div className="p-4 space-y-4">
                            {getListUsers().length === 0 && !clickLock && <div className="p-10 text-center text-gray-500 font-bold uppercase tracking-widest text-xs opacity-50">{t('NO_AGENTS_FOUND')}</div>}
                            {getListUsers().map(u => (
                                <div key={u._id} onClick={() => {
                                    onViewProfile(u);
                                    setActiveList(null);
                                }} className="flex items-center gap-3 p-3  rounded-2xl cursor-pointer   border border-transparent">
                                    <div className="w-11 h-11 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                        <ProfileAvatar user={u} className="rounded-full" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="font-bold text-white text-sm">{u?.username}</div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">@{u?.username?.toLowerCase()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : isEditing ? (
                        <div className="p-6 space-y-8 animate-fade-in">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-full bg-gray-800 overflow-hidden border-4 border-[#0a0a0a] relative shadow-xl shadow-black/50">
                                {profileUploading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <ProfileAvatar user={displayUser} size="large" key={imgKey} className="rounded-full" />
                                )}
                            </div>
                            <input type="file" ref={fileRef} hidden accept="image/*" onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    if (file.size > 90 * 1024 * 1024) { alert("File too large. Max 90MB"); return e.target.value = ''; }
                                    setProfileUploading(true);
                                    const fd = new FormData(); fd.append('image', file);
                                    try {
                                        const res = await axios.post('/users/profile-pic', fd);
                                        const updatedUser = res.data;
                                        if (updatedUser.profilePic && !updatedUser.profilePic.startsWith('blob:')) {
                                            const sep = updatedUser.profilePic.includes('?') ? '&' : '?';
                                            updatedUser.profilePic += `${sep}t=${Date.now()}`;
                                        }
                                        localStorage.setItem('user', JSON.stringify(updatedUser));
                                        if (onUpdateUser) onUpdateUser(updatedUser);
                                        if (addToast) addToast(t('PROFILE_UPDATED') || 'Profile picture updated!', 'success');
                                    } catch (e) { alert("Failed to update profile picture."); }
                                    finally { setProfileUploading(false); e.target.value = ''; }
                                }
                            }} />

                            <div className="flex gap-2 w-full">
                                <button onClick={e => { e.preventDefault(); !profileUploading && fileRef.current.click(); }} disabled={profileUploading}
                                    className="flex-1 py-4 bg-[#121212]  border border-white/10  rounded-2xl text-[11px] text-gray-300  font-black uppercase tracking-[0.2em] cursor-pointer  duration-300 flex items-center justify-center gap-3 disabled:opacity-50  group">
                                    {profileUploading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" class="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:scale-110">
                                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                                            <circle cx="12" cy="13" r="3"></circle>
                                        </svg>
                                    )}
                                    {profileUploading ? (t('UPLOADING') || 'UPLOADING...') : (t('CHANGE_PROFILE_PIC') || 'CHANGE PROFILE PICTURE')}
                                </button>
                            </div>

                            <div className="flex gap-2 w-full mt-4">
                                <button onClick={e => { e.preventDefault(); !coverUploading && coverFileRef.current.click(); }} disabled={coverUploading}
                                    className="flex-1 py-4 bg-[#121212]  border border-white/10  rounded-2xl text-[11px] text-gray-300  font-black uppercase tracking-[0.2em] cursor-pointer  duration-300 flex items-center justify-center gap-3 disabled:opacity-50  group">
                                    {coverUploading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Icons.Image className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:scale-110 " />}
                                    {coverUploading ? (t('UPLOADING') || 'UPLOADING...') : (t('CHANGE_COVER') || 'CHANGE BACKGROUND')}
                                </button>
                                {displayUser?.coverPic && (
                                    <button onClick={async (e) => {
                                        e.preventDefault();
                                        setCoverUploading(true);
                                        
                                        if (currentUser && displayUser && isSameId(currentUser._id, displayUser._id)) {
                                            const tempUser = { ...currentUser, coverPic: null };
                                            setUserData(prev => ({ ...prev, coverPic: null }));
                                            onUpdateUser(tempUser);
                                        }
                                        
                                        try {
                                            const res = await axios.delete('/users/cover-pic');
                                            const updatedUser = res.data;
                                            localStorage.setItem('user', JSON.stringify(updatedUser));
                                            if (onUpdateUser) onUpdateUser(updatedUser);
                                            if (addToast) addToast('Background removed', 'success');
                                        } catch (err) { 
                                            console.error(err);
                                            alert("Failed to remove background."); 
                                        }
                                        finally { setCoverUploading(false); }
                                    }} disabled={coverUploading}
                                        className="w-[52px] h-[52px] shrink-0 bg-[#121212]  border border-white/10  rounded-full text-gray-400  flex items-center justify-center  duration-300 disabled:opacity-50 hover:bg-red-500/20 hover:text-red-400">
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
                                        if (updatedUser.coverPic && !updatedUser.coverPic.startsWith('blob:')) {
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
                                <input type="text" value={editUsername} maxLength={19} onChange={e => setEditUsername(e.target.value.substring(0, 19))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold focus:border-[var(--gold-primary)] outline-none " placeholder={t('USERNAME_PH')} />
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">{t('DESCRIPTION')}</label>
                                <div className="relative">
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        maxLength={500}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[var(--gold-primary)] outline-none resize-none h-32 "
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
                            }} className="w-full py-4 bg-[var(--gold-primary)] rounded-2xl text-black font-black uppercase tracking-widest shadow-lg shadow-[var(--gold-primary)]/20   text-sm">{t('SAVE_CHANGES')}</button>
                        </div>
                    ) : (
                        <div className={`p-4 sm:p-6 pb-20 ${displayUser?.coverPic ? 'pt-14 sm:pt-20 mt-0' : 'mt-2 sm:mt-4'}`}>
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <div className={`relative z-20 ${displayUser?.coverPic ? '-mt-14 sm:-mt-20' : ''}`}>
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#0a0a0a] border-[4px] border-[#0a0a0a] overflow-hidden shadow-xl shrink-0">
                                        <ProfileAvatar user={displayUser} size="large" key={imgKey} className="rounded-full" />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6 px-2">
                                <div className="flex flex-col mb-4">
                                    <div className="font-black text-white text-lg sm:text-xl flex items-center gap-2 leading-none uppercase tracking-tighter">
                                        <span className="truncate">{displayUser?.username || "Unknown Agent"}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {displayUser?.role === 'Founder' && (
                                                <svg
                                                    aria-label="Verified Founder"
                                                    viewBox="0 0 22 22"
                                                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                                                    style={{ overflow: 'visible' }}
                                                >
                                                    <path
                                                        fill="#FFD700"
                                                        stroke="none"
                                                        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-gray-400 text-sm font-bold mt-1 flex items-center gap-2">
                                        @{displayUser?.username?.toLowerCase().replace(/\s+/g, '')}
                                        <div className={`w-2 h-2 rounded-full border border-black ${isUserOnline(displayUser, currentUser) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'}`} title={isUserOnline(displayUser, currentUser) ? t('ONLINE') : t('OFFLINE')} />
                                    </div>
                                </div>

                                <div className="text-[14px] sm:text-[15px] text-white/90 leading-relaxed max-w-[90%] whitespace-pre-wrap font-medium mb-5 break-words">
                                    {parseHashtags(displayUser?.bio && displayUser.bio.trim() !== "" ? displayUser.bio : t("DEFAULT_BIO"))}
                                </div>

                                {/* STATS GRID — 4 equal columns, no scroll */}
                                <div className="grid grid-cols-4 gap-1.5 w-full">

                                    {/* POSTS */}
                                    <div className="flex flex-col items-center justify-center gap-1 py-2.5 bg-black border border-white/10 rounded-2xl  ">
                                        <span className="font-black text-white text-base leading-none tabular-nums">{(userPosts || []).length}</span>
                                        <Icons.Grid className="w-3.5 h-3.5 text-white" />
                                    </div>

                                    {/* REPOSTS */}
                                    <div className="flex flex-col items-center justify-center gap-1 py-2.5 bg-black border border-white/10 rounded-2xl  ">
                                        <span className="font-black text-white text-base leading-none tabular-nums">
                                            {(() => {
                                                const uid = safeId(displayUser);
                                                return (userSpecificPosts || []).filter(p =>
                                                    Array.isArray(p.reposts) && p.reposts.some(id => isSameId(id, uid)) &&
                                                    !isSameId(p.author, uid)
                                                ).length;
                                            })()}
                                        </span>
                                        <Icons.RefreshCcw className="w-3.5 h-3.5 text-white" />
                                    </div>

                                    {/* FOLLOWERS */}
                                    <div onClick={(e) => {
                                        e.preventDefault(); e.stopPropagation(); setClickLock(true); lastOpenedAt.current = Date.now(); setActiveList('followers');
                                    }} className="flex flex-col items-center justify-center gap-0.5 py-3 bg-black border border-white/10 rounded-2xl cursor-pointer     group touch-manipulation select-none relative z-10">
                                        <span className="font-black text-white text-base leading-none tabular-nums ">
                                            {[...new Set((displayUser?.followers || []).filter(id => (allUsers || []).some(u => isSameId(u._id, id))))].length}
                                        </span>
                                        <span className="text-white text-[7px] font-black uppercase tracking-wider mt-0.5 truncate w-full text-center px-1">
                                            {[...new Set((displayUser?.followers || []).filter(id => (allUsers || []).some(u => isSameId(u._id, id))))].length === 1 ? (t('FOLLOWER') || 'FOLLOWER') : t('FOLLOWERS')}
                                        </span>
                                    </div>

                                    {/* FOLLOWING */}
                                    <div onClick={(e) => {
                                        e.preventDefault(); e.stopPropagation(); setClickLock(true); lastOpenedAt.current = Date.now(); setActiveList('following');
                                    }} className="flex flex-col items-center justify-center gap-0.5 py-3 bg-black border border-white/10 rounded-2xl cursor-pointer     group touch-manipulation select-none relative z-10">
                                        <span className="font-black text-white text-base leading-none tabular-nums ">
                                            {[...new Set((displayUser?.following || []).filter(id => (allUsers || []).some(u => isSameId(u._id, id))))].length}
                                        </span>
                                        <span className="text-white text-[7px] font-black uppercase tracking-wider mt-0.5 truncate w-full text-center px-1">{t('FOLLOWING')}</span>
                                    </div>

                                </div>
                            </div>

                            {/* ACTION BUTTONS: Enhanced layout */}
                            <div className="px-2 mb-4 space-y-2">
                                <div className="flex items-center gap-3">
                                    {isMe ? (
                                        <button onClick={() => setIsEditing(true)} className="flex-1 py-3 bg-black border border-white/10 rounded-full text-white text-[11px] font-black uppercase tracking-widest ">
                                            {t('EDIT_PROFILE')}
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                disabled={followLoading[displayUser?._id]}
                                                onClick={() => onFollow(displayUser)}
                                                className="flex-1 py-3 rounded-full text-[11px] font-black uppercase tracking-widest   bg-black border border-white/10 text-white"
                                            >
                                                {isFollowing ? t('UNFOLLOW') : (hasRequested ? t('REQUESTED') : t('FOLLOW'))}
                                            </button>
                                            <button
                                                onClick={() => onOpenChat(displayUser)}
                                                title={t('DM_SAFE_DESC', 'ΑΣΦΑΛΗΣ ΕΠΙΚΟΙΝΩΝΙΑ: Κρυπτογραφημένη & Ιδιωτική.')}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-black border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em]   shrink-0"
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    <Icons.Ghost className="w-5 h-5 whispers-icon text-white  duration-300" />
                                                </div>
                                                <span className="whispers-label">{t('WHISPERS')}</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                                {!isMe && currentUser?.role === 'Founder' && (
                                    <button onClick={() => window.confirm(t('CONFIRM_BAN') || 'Confirm ban?') && axios.post(`/users/${displayUser?._id}/ban`, { days: 3 })} className="w-full px-6 py-3 bg-red-600/10 border border-red-500/30 rounded-full text-red-500 font-black text-[10px] uppercase tracking-widest    ">
                                        {t('BAN_3_DAYS') || 'BAN 3 ΗΜΕΡΕΣ'}
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-4 border border-white/10 backdrop-blur-xl">
                                {['ALL', 'POSTS', 'VIDEO'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl  ${activeTab === tab
                                            ? 'bg-white/15 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.25)]'
                                            : 'text-white/60  '
                                            }`}
                                    >
                                        {t('TAB_' + tab)}
                                    </button>
                                ))}
                            </div>

                            {/* PRIVACY LOCK SCREEN */}
                            {displayUser?.isPrivate && !isMe && !isFollowing ? (
                                <div className="p-12 text-center space-y-6 bg-white/[0.02] border border-white/5 rounded-3xl mt-4 animate-fade-in group mx-2">
                                    <div className="w-24 h-24 mx-auto bg-black/40 rounded-full flex items-center justify-center border border-white/5 group-hover:text-white relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--gold-primary)]/10 to-transparent animate-pulse" />
                                        <Icons.Shield className="w-12 h-12 text-gray-500 group-hover:text-white relative z-10" />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="font-black text-white text-xl uppercase tracking-[0.2em]">{t('PRIVATE_TITLE')}</h3>
                                        <div className="h-0.5 w-12 bg-[var(--gold-primary)] mx-auto opacity-50" />
                                        <p className="text-gray-500 text-[11px] uppercase tracking-widest leading-relaxed mx-auto max-w-[240px] font-bold">{t('PRIVATE_DESC')}</p>
                                    </div>
                                    <button onClick={() => onFollow(displayUser)} className="px-8 py-3 bg-[var(--gold-primary)] text-black rounded-xl text-[10px] font-black tracking-[0.2em] hover:scale-105   uppercase shadow-lg shadow-[var(--gold-primary)]/20">
                                        {hasRequested ? t('REQUESTED') : t('FOLLOW_TO_VIEW')}
                                    </button>
                                    <button onClick={onClose} className="mt-2 px-6 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400    ">
                                        {t('CLOSE', 'ΚΛΕΙΣΙΜΟ')}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {(isMe || userStories.length > 0) && (
                                        <div className="mb-6">
                                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">{t('HIGHLIGHTS')}</h3>
                                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                                {isMe && (
                                                    <div onClick={() => onOpenCreate?.()} className="shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
                                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-900 border border-white/10 shadow-md relative group">
                                                            <ProfileAvatar user={currentUser} className="opacity-80 rounded-full" />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white drop-shadow-lg group-hover:scale-125 ">
                                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{t('ADD_STORY')}</span>
                                                    </div>
                                                )}
                                                {userStories.map(s => {
                                                    const isYT = isYouTubeUrl(s.videoUrl);
                                                    const isNativeVideo = (!isYT) && ((s.videoUrl && s.videoUrl.match(/\.(mp4|mov|webm|avi|m4v)$/i)) || (s.image && s.image.match(/\.(mp4|mov|webm|avi|m4v)$/i)));
                                                    const hasMedia = s.image || s.videoUrl || s.thumbnailUrl;
                                                    let ytThumb = null;
                                                    if (isYT) {
                                                        const yid = getYouTubeId(s.videoUrl);
                                                        if (yid) ytThumb = `https://img.youtube.com/vi/${yid}/hqdefault.jpg`;
                                                    }
                                                    return (
                                                        <div key={s._id} onClick={() => onOpenDetail(s)} className="shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
                                                            <div className="w-16 h-16 rounded-full overflow-hidden bg-black shadow-md border border-white/10 relative cursor-pointer hover:opacity-90 transition-opacity">
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
                                                                <div className="flex flex-col mb-8">
                                                                    {groupedUserPosts[dateKey].map(p => (
                                                                        <div key={p._id} className="relative">
                                                                            <PostCard
                                                                                post={p}
                                                                                user={currentUser}
                                                                                allUsers={allUsers}
                                                                                onLike={onLike}
                                                                                onDislike={onDislike}
                                                                                onRepost={onRepost}
                                                                                onComment={onComment}
                                                                                onDelete={onDeletePost}
                                                                                onViewProfile={onViewProfile}
                                                                                onOpenDetail={onOpenDetail}
                                                                                onOpenChat={onOpenChat}
                                                                                onEditComment={onEditComment}
                                                                                onDeleteComment={onDeleteComment}
                                                                                onEditPost={onEditPost}
                                                                                onShare={onShare}
                                                                                onHashtagClick={onHashtagClick}
                                                                                loadingActions={loadingActions}
                                                                                reposter={String(p.author?._id || p.author) !== String(displayUser?._id) ? displayUser : null}
                                                                                forcePause={!!selectedPost}
                                                                            />
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
            </motion.div >
        </div >
    );
};



const CreateModal = ({ isOpen, onClose, onCreatePost, user, forceStory = false }) => {
    const [desc, setDesc] = useState('');
    const [preview, setPreview] = useState(null);
    const [isVideo, setIsVideo] = useState(false);
    const [isAudio, setIsAudio] = useState(false);
    const [audioName, setAudioName] = useState('');
    const [isStory, setIsStory] = useState(forceStory);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDesc('');
            setIsStory(forceStory);
            setIsSubmitting(false);
            setPreview(null);
            setIsVideo(false);
            setIsAudio(false);
            setAudioName('');
            setAudioBlob(null);
            if (fileRef.current) fileRef.current.value = '';
        }
    }, [isOpen, forceStory]);
    const fileRef = useRef(null);
    const { t } = useTranslation(user);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);

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
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10">
                                <ProfileAvatar user={user} className="rounded-full" />
                            </div>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{user?.username}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" /> {t('DESCRIPTION') || 'DESCRIPTION'}
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-tr from-[var(--gold-primary)]/20 to-transparent rounded-[1.5rem] blur opacity-30 group-focus-within:opacity-100 transition-opacity" />
                                <textarea
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    maxLength={300}
                                    placeholder={t('DECRYPT_PH') || "Decrypt your thoughts..."}
                                    className="relative w-full bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] px-5 py-4 text-[15px] text-white outline-none min-h-[150px] max-h-[50vh] resize-y placeholder-gray-600 focus:border-[var(--gold-primary)]/40   custom-scrollbar shadow-inner font-bold"
                                />
                                <div className="absolute bottom-3 right-4 text-[10px] font-black text-gray-500 uppercase tracking-widest pointer-events-none">
                                    {desc.length} / 300
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-4 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.1)] group/note">
                            <Icons.Info className="w-5 h-5 text-red-500 shrink-0 group-hover/note:animate-pulse" />
                            <span className="text-[11px] font-black text-red-500 uppercase tracking-wider leading-snug">
                                {t('VIDEO_LIMIT_NOTE') || 'ONLY VIDEOS UP TO 20 MINUTES ALLOWED'}
                            </span>
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
                                <button onClick={(e) => { e.stopPropagation(); setPreview(null); setIsAudio(false); setIsVideo(false); if (fileRef.current) fileRef.current.value = ''; }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full  "><Icons.X className="w-3 h-3 text-white" /></button>
                            </div>
                        ) : (
                            <div className="w-full py-8 border border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center gap-2   text-gray-500 cursor-pointer">
                                <Icons.Image className="w-8 h-8 opacity-50" />
                                <span className="text-xs font-bold uppercase tracking-widest">{t('UPLOAD_MEDIA')}</span>
                            </div>
                        )}
                        <input type="file" ref={fileRef} accept="image/*,video/*,audio/*" hidden onChange={handleFileChange} />
                    </div>
                    <div className="flex gap-4 items-center mb-4">
                        <div onClick={() => setIsStory(!isStory)} className={`flex items-center gap-3 cursor-pointer px-4 py-2.5 rounded-2xl  border ${isStory ? 'bg-[var(--gold-primary)]/10 border-[var(--gold-primary)]/50 shadow-lg shadow-[var(--gold-primary)]/10' : 'bg-white/5 border-white/10 '}`}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center  ${isStory ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)] scale-110' : 'border-gray-500'}`}>
                                {isStory && <Icons.Check className="w-4 h-4 text-black font-black" />}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-[11px] font-black uppercase tracking-widest ${isStory ? 'text-[var(--gold-primary)]' : 'text-gray-400'}`}>{t('ADD_STORY')}</span>
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider mt-0.5">{t('STORY_DURATION')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs  text-white uppercase tracking-widest">{t('CANCEL')}</button>
                        <button disabled={isSubmitting} onClick={async () => {
                            if (isSubmitting) return;
                            const rawYoutube = document.getElementById('c-youtube').value;
                            const file = fileRef.current?.files?.[0];

                            // Auto-extract from description if they pasted it there instead of the dedicated box
                            const ytMatch = getYouTubeId(desc);
                            const youtube = rawYoutube ? rawYoutube.trim() : (ytMatch ? `https://youtube.com/watch?v=${ytMatch}` : '');

                            if (!desc && !file && !youtube) return;

                            setIsSubmitting(true);
                            const fd = new FormData();
                            fd.append('desc', desc);
                            if (youtube) fd.append('videoUrl', youtube);
                            else if (file) fd.append('image', file);
                            fd.append('isStory', isStory);

                            // Trigger optimistic upload
                            await onCreatePost(fd, preview, isStory);

                            // Reset logic safely
                            const ytEl = document.getElementById('c-youtube');
                            if (ytEl) ytEl.value = '';

                            setPreview(null);
                            if (fileRef.current) fileRef.current.value = '';
                            setIsStory(false);
                            setIsSubmitting(false);
                        }} className={`flex-1 py-3 bg-[var(--gold-primary)] hover:opacity-90 rounded-xl text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-[var(--gold-primary)]/20   disabled:opacity-50`}>
                            {isSubmitting ? (isStory ? t('UPLOADING') || '...' : '...') : (isStory ? t('POST_STORY') : t('POST'))}
                        </button>
                    </div>
                </div>
            </motion.div >
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

        // Auto-extract from description if they pasted it there
        let finalYtUrl = youtubeUrl;
        const ytMatch = getYouTubeId(desc);
        if (!finalYtUrl && ytMatch) finalYtUrl = `https://youtube.com/watch?v=${ytMatch}`;

        // Use state/extracted instead of direct DOM access for consistency
        if (typeof finalYtUrl === 'string' && finalYtUrl.trim()) {
            fd.append('videoUrl', finalYtUrl.trim());
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
                                    maxLength={300}
                                    placeholder={t('DECRYPT_PH') || "Decrypt your thoughts..."}
                                    className="relative w-full bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] px-5 py-4 text-[15px] text-white outline-none min-h-[150px] max-h-[50vh] resize-y placeholder-gray-600 focus:border-[var(--gold-primary)]/40   custom-scrollbar shadow-inner"
                                />
                                <div className="absolute bottom-3 right-4 text-[10px] font-black text-gray-500 uppercase tracking-widest pointer-events-none">
                                    {desc.length} / 300
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-4 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.1)] group/note w-full">
                                    <Icons.Info className="w-5 h-5 text-red-500 shrink-0 group-hover/note:animate-pulse" />
                                    <span className="text-[11px] font-black text-red-500 uppercase tracking-wider leading-snug">
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
                                    className="relative w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder-gray-700 focus:border-[var(--gold-primary)]/40   shadow-inner"
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
                                        className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-xl  text-white  shadow-xl border border-white/10 opacity-0 group-hover/preview:opacity-100"
                                    >
                                        <Icons.X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full py-10 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3    text-gray-500 cursor-pointer group">
                                    <Icons.Image className="w-8 h-8 opacity-30 group-hover:scale-110 group-hover:text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('UPLOAD_MEDIA')}</span>
                                </div>
                            )}
                            <input type="file" ref={fileRef} accept="image/*,video/*,audio/*" hidden onChange={handleFileChange} />
                        </div>

                        <div className="flex gap-4">
                            <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs  text-white uppercase tracking-widest">{t('CANCEL')}</button>
                            <button disabled={saving} onClick={handleSave} className={`flex-1 py-3 ${saving ? 'opacity-60 cursor-wait' : 'bg-[var(--gold-primary)]'} rounded-xl text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-glow-gold/40  `}>{saving ? '...' : t('PUBLISH')}</button>
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

const applyDisplayMode = (mode) => {
    if (mode === 'light') {
        mode = 'dark';
    }
    const isBlueDark = mode === 'blue-dark';

    const bg = isBlueDark ? '#15202b' : '#000000';
    const text = '#e7e9ea';
    const glassBg = isBlueDark ? 'rgba(21,32,43,0.96)' : 'rgba(0,0,0,0.9)';
    const glassBorder = isBlueDark ? '#38444d' : '#2f3336';

    document.documentElement.style.setProperty('--app-bg', bg);
    document.documentElement.style.setProperty('--app-text', text);
    document.documentElement.style.setProperty('--glass-bg', glassBg);
    document.documentElement.style.setProperty('--glass-border', glassBorder);
    document.documentElement.style.setProperty(
        '--f1-primary',
        isBlueDark ? 'var(--twitter-blue)' : 'var(--gold-primary)'
    );

    document.body.classList.remove('light-mode', 'dark-mode', 'blue-dark-mode');
    if (isBlueDark) document.body.classList.add('blue-dark-mode');
    else document.body.classList.add('dark-mode');

    localStorage.setItem('displayMode', mode);
};

const applyZoom = (zoom) => {
    const root = document.getElementById('root') || document.body;
    const z = Math.max(0.95, Math.min(1, Number(zoom) || 1));
    if (root) {
        root.style.transformOrigin = '';
        root.style.transform = '';
        root.style.zoom = z === 1 ? '' : String(z);
    }
    localStorage.setItem('uiZoom', String(z));
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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
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
    const usersRef = useRef(users);

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

        }
    };

    // Keep refs correctly updated
    useEffect(() => { selectedPostRef.current = selectedPost; }, [selectedPost]);
    useEffect(() => { postsRef.current = posts; }, [posts]);
    useEffect(() => { usersRef.current = users; }, [users]);
    const isProcessingRequest = useRef(false);

    // SCROLL TO TOP ON LOGIN / TAB CHANGE
    useEffect(() => {
        if (mainScrollRef.current) {
            mainScrollRef.current.scrollTo(0, 0);
        }
    }, [user?._id, activeTab]);

    const toggleDate = (dateKey) => {
        setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));

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
            if (current.profilePic && nextPic && !nextPic.startsWith('blob:') && current.profilePic.split('?')[0] === nextPic.split('?')[0]) {
                const sep = nextPic.includes('?') ? '&' : '?';
                nextPic = `${nextPic.split('?')[0]}${sep}t=${Date.now()}`;
            }
            const merged = { ...current, ...newData, profilePic: nextPic || current.profilePic };
            localStorage.setItem('user', JSON.stringify(merged));
            return merged;
        });
    };

    const handleUpdateUser = (updatedUser) => {
        if (!updatedUser) return;
        
        const uid = safeId(updatedUser);
        if (!uid) return;

        // Cache-break
        if (updatedUser.profilePic && !updatedUser.profilePic.startsWith('blob:') && !updatedUser.profilePic.includes('t=')) {
            const sep = updatedUser.profilePic.includes('?') ? '&' : '?';
            updatedUser.profilePic += `${sep}t=${Date.now()}`;
        }
        if (updatedUser.coverPic && !updatedUser.coverPic.startsWith('blob:') && !updatedUser.coverPic.includes('t=')) {
            const sep = updatedUser.coverPic.includes('?') ? '&' : '?';
            updatedUser.coverPic += `${sep}t=${Date.now()}`;
        }

        // Update users list
        setUsers(prev => {
            const list = prev || [];
            const exists = list.some(u => safeId(u) === uid);
            return exists 
                ? list.map(u => safeId(u) === uid ? { ...u, ...updatedUser } : u)
                : [...list, updatedUser];
        });

        // Update current user
        if (user && safeId(user) === uid) {
            const merged = { ...user, ...updatedUser };
            setUser(merged);
            localStorage.setItem('user', JSON.stringify(merged));
            setImgKey(Date.now());
        }

        // Update profile view
        setProfileUser(prev => {
            if (prev && safeId(prev) === uid) {
                return { ...prev, ...updatedUser };
            }
            return prev;
        });

        // Update posts
        setPosts(prevPosts => (prevPosts || []).map(p => {
            const authorId = safeId(p.author);
            if (authorId === uid) {
                const currentAuthor = typeof p.author === 'object' ? p.author : { _id: uid };
                return { ...p, author: { ...currentAuthor, ...updatedUser }, profilePic: updatedUser.profilePic || p.profilePic };
            }
            if (p.comments?.some(c => safeId(c.authorId) === uid)) {
                return {
                    ...p,
                    comments: p.comments.map(c => {
                        if (safeId(c.authorId) === uid) {
                            return { ...c, authorProfilePic: updatedUser.profilePic || c.authorProfilePic, authorName: updatedUser.username || c.authorName };
                        }
                        return c;
                    })
                };
            }
            return p;
        }));
    };


    useEffect(() => {
        const saved = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        // 🔥 SAFETY: Validate user data
        let userData = null;
        let isValidUser = false;
        
        if (saved) {
            try {
                userData = JSON.parse(saved);
                // Validate that user data is good
                const parsedUserId = safeId(userData);
                if (!parsedUserId || parsedUserId === 'unknown' || parsedUserId === '[object Object]') {
                    // Corrupted user data in localStorage - CLEAR IT!
                    console.warn("⚠️ [SAFETY] Corrupted user data detected in localStorage, clearing...");
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    userData = null;
                }
            } catch (e) {
                console.warn("⚠️ [SAFETY] Could not parse user from localStorage, clearing...");
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                userData = null;
            }
        }

        if (userData && token) {
            setUser(userData);
        } else if (saved && !token) {
            localStorage.removeItem('user');
            setUser(null);
        }

        const userSettings = userData;
        const savedTheme = userSettings?.settings?.theme || localStorage.getItem('themeColor');
        if (savedTheme) applyTheme(savedTheme);
        applyDisplayMode('dark');
        const savedZoom = userSettings?.settings?.zoom || parseFloat(localStorage.getItem('uiZoom') || '1') || 1;
        applyZoom(savedZoom);

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

    useEffect(() => {
        applyDisplayMode('dark');
    }, [user?.settings?.displayMode]);

    useEffect(() => {
        if (user?.settings?.zoom) {
            applyZoom(user.settings.zoom);
        }
    }, [user?.settings?.zoom]);

    // Use a ref to track the last user ID we initialized for, to avoid loops
    const lastInitializedId = useRef(null);

    useEffect(() => {
        if (user && user._id !== lastInitializedId.current) {
            lastInitializedId.current = user._id;

            // 🔥 INITIAL FETCH
            fetchPosts().then(() => fetchUsers());
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

            fetchNotifications(true); // silent = true to avoid double sound
        };

        const onMessageRecv = (msg) => {
            // Only play sound if the message is for US and from someone else
            if (user && String(msg.recipient) === String(user._id) && String(msg.sender) !== String(user._id)) {
                console.log("📨 [SOCKET] Live message sound trigger");

            }
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
                if (!isSameId(p._id, data.postId)) return p;
                return { ...p, comments: data.comments };
            };
            setPosts(prev => prev.map(updateFn));
            setSelectedPost(prev => {
                if (prev && isSameId(prev._id, data.postId)) {
                    return updateFn(prev);
                }
                return prev;
            });
        };

        const onUserStatus = (data) => {
            console.log("📡 [SOCKET] User status change:", data);
            setUsers(prev => prev.map(u => isSameId(u._id, data.userId) ? { ...u, lastSeen: data.lastSeen } : u));
            setProfileUser(prev => {
                if (prev && isSameId(prev._id, data.userId)) {
                    return { ...prev, lastSeen: data.lastSeen };
                }
                return prev;
            });
        };

        const onPostCreated = (data) => {
            console.log("📡 [SOCKET] Post created real-time:", data._id);
            if (!data || !data.author) return;
            setPosts(prev => {
                if (!prev) return [data];

                // 1. UNIVERSAL DUPLICATE PREVENTION: Exact ID check for ALL users
                if (prev.some(p => isSameId(p._id, data._id))) {
                    console.log("📡 [SOCKET] Post ID already exists, ignoring duplicate.");
                    return prev;
                }

                const authorId = data.author?._id || data.author;
                const currentUserId = safeId(user);
                const isOwner = isSameId(authorId, currentUserId);

                // 2. OPTIMISTIC REPLACEMENT: If we are the owner, replace the optimistic placeholder
                if (isOwner) {
                    const hasPendingOptimistic = prev.some(p =>
                        p.isOptimistic &&
                        (p.desc || "") === (data.desc || "") &&
                        (
                            (p.image || "").includes('blob:') ||
                            (p.videoUrl && p.videoUrl === data.videoUrl) ||
                            (p.isUploading)
                        )
                    );
                    if (hasPendingOptimistic) {
                        console.log("📡 [SOCKET] Replacing own optimistic post.");
                        return prev.map(p => (p.isOptimistic && p.desc === data.desc) ? data : p);
                    }
                }

                // 3. Resolve Full Author Intelligence immediately
                const fullAuthor = resolveFullUser(data.author, usersRef.current);
                const enrichedPost = { ...data, author: fullAuthor };

                const isFollower = Array.isArray(fullAuthor.followers) && fullAuthor.followers.some(id => isSameId(id, currentUserId));
                const isFounder = user?.role === 'Founder';
                const isPrivate = !!(fullAuthor.isPrivate || fullAuthor.isFollowersOnly);
                const allowed = !isPrivate || isOwner || isFollower || isFounder;
                if (!allowed) return prev;

                return [enrichedPost, ...prev];
            });
        };

        const onUserUpdated = (data) => {
            if (!data) return;
            const uid = safeId(data);
            console.log("📡 [SOCKET] User updated real-time:", uid);
            syncUserIntelligence(data);

            // Targeted re-sync immediately to ensure DB is perfect
            fetchUsers(uid);
        };

        socket.on('notification.received', onNotificationRecv);
        socket.on('message.received', onMessageRecv);
        socket.on('post.deleted', onPostDeleted);
        socket.on('post.liked', onPostLiked);
        socket.on('post.created', onPostCreated);
        socket.on('comment.added', onCommentSync);
        socket.on('comment.deleted', onCommentSync);
        socket.on('comment.updated', onCommentSync);
        socket.on('user.status', onUserStatus);
        socket.on('user.updated', onUserUpdated);

        return () => {
            socket.off('notification.received', onNotificationRecv);
            socket.off('message.received', onMessageRecv);
            socket.off('post.deleted', onPostDeleted);
            socket.off('post.liked', onPostLiked);
            socket.off('post.created', onPostCreated);
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
        const locale = getLocaleForLang(lang);
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

    /**
     * SELF-HEALING RECONCILIATION:
     * Scans all posts and heals "Unknown Agent" metadata using the latest intelligence.
     */
    const reconcileIntelligence = useCallback((latestUsers) => {
        if (!latestUsers || latestUsers.length === 0) return;

        setPosts(prev => {
            if (!prev) return prev;
            let changed = false;
            const next = prev.map(p => {
                const currentAuthorId = p.author?._id || p.author;
                const resolved = resolveFullUser(p.author, latestUsers);

                // If the resolved username is better than what we had, update it
                if (resolved.username !== 'Agent' && (p.author?.username === 'Unknown' || p.author?.username === 'Agent' || !p.author?.username)) {
                    changed = true;
                    return { ...p, author: resolved };
                }
                return p;
            });
            return changed ? next : prev;
        });

        if (selectedPost) {
            setSelectedPost(prev => {
                if (!prev) return prev;
                const resolved = resolveFullUser(prev.author, latestUsers);
                if (resolved.username !== 'Agent' && (prev.author?.username === 'Unknown' || prev.author?.username === 'Agent' || !prev.author?.username)) {
                    return { ...prev, author: resolved };
                }
                return prev;
            });
        }
    }, [selectedPost]);

    // Auto-heal when database updates
    useEffect(() => {
        if (users.length > 0) {
            reconcileIntelligence(users);
        }
    }, [users, reconcileIntelligence]);
    const fetchPosts = async () => {
        if (selectedPostRef.current) return;
        try {
            const res = await axios.get(`/posts?limit=30`);
            setPosts(res.data);
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
                        const exists = prev.find(u => isSameId(u._id, specificId));
                        if (exists) return prev.map(u => isSameId(u._id, specificId) ? res.data : u);
                        return [...prev, res.data];
                    });
                    // Also update profileUser if the profile modal is open for this user
                    setProfileUser(prev => {
                        if (prev && isSameId(prev._id, specificId)) {
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
                const me = res.data.find(u => isSameId(u._id, user._id));
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
                                if (nextPic && !nextPic.startsWith('blob:')) {
                                    const sep = nextPic.includes('?') ? '&' : '?';
                                    nextPic = `${clean(nextPic)}${sep}t=${Date.now()}`;
                                }
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
            // Sync users list while preserving our local optimistic updates for ourselves
            setUsers(prev => {
                const incoming = res.data || [];
                const currentUserId = safeId(user);
                return incoming.map(u => {
                    if (isSameId(u._id, currentUserId) && user) {
                        // Merge server data with our potentially fresher local state (e.g. optimistic profilePic)
                        return { ...u, ...user };
                    }
                    return u;
                });
            });
        } catch (e) { }
    };

    // Notifications
    const fetchNotifications = async (silent = false) => {
        if (!user) return;
        try {
            const res = await axios.get(`/users/notifications`);
            if (!silent && res.data.length > (user.notifications?.length || 0)) {
                const latest = res.data[0];
            }
            setAlerts(res.data);
            setUser(prev => {
                if (!prev) return prev;
                const updated = { ...prev, notifications: res.data };
                localStorage.setItem('user', JSON.stringify(updated));
                return updated;
            });
        } catch (e) { }
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

    // Polling intervals stored in refs to avoid re-creation on renders
    const _notifInterval = useRef(null);
    const _hbInterval = useRef(null);
    const _userInterval = useRef(null);
    const _postInterval = useRef(null);

    const startNotificationPoll = () => {
        if (_notifInterval.current) clearInterval(_notifInterval.current);
        _notifInterval.current = setInterval(fetchNotifications, 90000); // 90s fallback
    };
    const stopNotificationPoll = () => { if (_notifInterval.current) { clearInterval(_notifInterval.current); _notifInterval.current = null; } };

    const startHeartbeat = () => {
        stopHeartbeat();
        const doHb = () => { if (!user) return; axios.put('/users/heartbeat').catch(() => { }); };
        doHb();
        _hbInterval.current = setInterval(doHb, 25000); // 25s heartbeat
    };
    const stopHeartbeat = () => { if (_hbInterval.current) { clearInterval(_hbInterval.current); _hbInterval.current = null; } };

    const startUserPoll = () => {
        if (_userInterval.current) clearInterval(_userInterval.current);
        _userInterval.current = setInterval(fetchUsers, 30000); // 30s — was 4s (too aggressive!)
    };
    const stopUserPoll = () => { if (_userInterval.current) { clearInterval(_userInterval.current); _userInterval.current = null; } };

    const startPostPoll = () => {
        if (_postInterval.current) clearInterval(_postInterval.current);
        _postInterval.current = setInterval(fetchPosts, 60000); // 60s fallback
    };
    const stopPostPoll = () => { if (_postInterval.current) { clearInterval(_postInterval.current); _postInterval.current = null; } };


    // Scroll behavior removed as requested (keep position)




    // Unified Scroll Lock for Modals
    const isAnyModalOpen = isChatOpen || isProfileOpen || isSettingsOpen || isCreateOpen || isEditOpen || !!selectedPost;

    useEffect(() => {
        if (isAnyModalOpen) {
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
    }, [isAnyModalOpen]);

    const isValidObjectId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
    const sanitizeObjectId = (id) => {
        const s = String(id || '').trim().replace(/\u2026/g, '');
        return /^[a-fA-F0-9]{24}$/.test(s) ? s : '';
    };

    const handleRepost = async (postId) => {
        if (!postId || !user?._id) return;
        const userId = String(user._id).trim();
        const safeId = sanitizeObjectId(postId);
        if (!isValidObjectId(safeId)) return;

        // 1. OPTIMISTIC UPDATE
        const updateFn = (p) => {
            if (String(p._id) !== safeId) return p;
            const reposts = Array.isArray(p.reposts) ? [...p.reposts] : [];
            const hasReposted = reposts.some(id => String(id) === userId);
            const newReposts = hasReposted ? reposts.filter(id => String(id) !== userId) : [...reposts, userId];
            playSound(hasReposted ? 'cyber_unlike' : 'cyber_repost');
            return { ...p, reposts: newReposts };
        };

        setPosts(prev => prev.map(updateFn));
        if (selectedPost && String(selectedPost._id) === safeId) {
            setSelectedPost(prev => updateFn(prev));
        }

        setLoadingActions(prev => ({ ...prev, [safeId]: true }));


        try {
            const res = await axios.put(`/posts/${safeId}/repost`);
            const { reposts } = res.data;
            if (Array.isArray(reposts)) {
                setPosts(prev => prev.map(p => String(p._id) === safeId ? { ...p, reposts } : p));
                if (selectedPost && String(selectedPost._id) === safeId) {
                    setSelectedPost(prev => ({ ...prev, reposts }));
                }
            }
        } catch (e) {
            console.error('[REPOST] Failure:', e);
            // Rollback optimistic update on error
            // (Optional: depending on UX preference, usually better to show error toast)
        } finally {
            setLoadingActions(prev => {
                const next = { ...prev };
                delete next[safeId];
                return next;
            });
        }
    };

    const handleLike = async (postId) => {
        const userId = user?._id;
        if (!userId) return;
        const safeId = sanitizeObjectId(postId);
        if (!isValidObjectId(safeId)) return;

        // 1. OPTIMISTIC UPDATE (Instant Feedback)
        const updateFn = (p) => {
            if (String(p._id) !== String(safeId)) return p;
            const likes = Array.isArray(p.likes) ? [...p.likes] : [];
            const dislikes = Array.isArray(p.dislikes) ? p.dislikes.filter(id => String(id) !== String(userId)) : [];
            const hasLiked = likes.some(id => String(id) === String(userId));
            const newLikes = hasLiked ? likes.filter(id => String(id) !== String(userId)) : [...likes, userId];
            playSound(hasLiked ? 'cyber_unlike' : 'cyber_like');
            return { ...p, likes: newLikes, dislikes };
        };
        setPosts(prev => prev.map(updateFn));
        if (selectedPost && String(selectedPost._id) === String(safeId)) {
            setSelectedPost(prev => updateFn(prev));
        }

        const isLiking = posts.find(p => String(p._id) === String(safeId))?.likes?.includes(userId) === false;

        setLoadingActions(prev => ({ ...prev, [safeId]: true }));


        try {
            const res = await axios.put(`/posts/${safeId}/like`);
            // 2. SERVER SYNC (Only if valid arrays returned)
            const { likes, dislikes } = res.data;
            if (Array.isArray(likes) && Array.isArray(dislikes)) {
                setPosts(prev => {
                    const next = prev.map(p => String(p._id) === String(safeId) ? { ...p, likes, dislikes } : p);
                    // Update cache immediately so it persists on reload
                    localStorage.setItem('cached_posts', JSON.stringify(next.slice(0, 20)));
                    return next;
                });
                if (selectedPost && String(selectedPost._id) === String(safeId)) {
                    setSelectedPost(prev => ({ ...prev, likes, dislikes }));
                }
            }
        } catch (e) {
            console.error('Like failed', e);
        } finally {
            setLoadingActions(prev => { const copy = { ...prev }; delete copy[safeId]; return copy; });
        }
    };

    const handleHashtagClick = (tag) => {
        setSearchQuery(tag);
        setActiveTab('search');


    };

    const handleDislike = async (postId) => {
        const userId = user?._id;
        if (!userId) return;
        const safeId = sanitizeObjectId(postId);
        if (!isValidObjectId(safeId)) return;

        // 1. OPTIMISTIC UPDATE
        const updateFn = (p) => {
            if (String(p._id) !== String(safeId)) return p;
            const dislikes = Array.isArray(p.dislikes) ? [...p.dislikes] : [];
            const likes = Array.isArray(p.likes) ? p.likes.filter(id => String(id) !== String(userId)) : [];
            const hasDisliked = dislikes.some(id => String(id) === String(userId));
            const newDislikes = hasDisliked ? dislikes.filter(id => String(id) !== String(userId)) : [...dislikes, userId];
            playSound(hasDisliked ? 'cyber_unlike' : 'cyber_like');
            return { ...p, likes, dislikes: newDislikes };
        };
        setPosts(prev => prev.map(updateFn));
        if (selectedPost && String(selectedPost._id) === String(safeId)) {
            setSelectedPost(prev => updateFn(prev));
        }

        const isDisliking = posts.find(p => String(p._id) === String(safeId))?.dislikes?.includes(userId) === false;

        setLoadingActions(prev => ({ ...prev, [safeId]: true }));


        try {
            const res = await axios.put(`/posts/${safeId}/dislike`);
            // 2. SERVER SYNC (Validate Data First)
            const { likes, dislikes } = res.data;
            if (Array.isArray(likes) && Array.isArray(dislikes)) {
                setPosts(prev => {
                    const next = prev.map(p => String(p._id) === String(safeId) ? { ...p, likes, dislikes } : p);
                    localStorage.setItem('cached_posts', JSON.stringify(next.slice(0, 20)));
                    return next;
                });
                if (selectedPost && String(selectedPost._id) === String(safeId)) {
                    setSelectedPost(prev => ({ ...prev, likes, dislikes }));
                }
            }
        } catch (e) {
            console.error('Dislike failed', e);
        } finally {
            setLoadingActions(prev => { const copy = { ...prev }; delete copy[safeId]; return copy; });
        }
    };

    const handleComment = async (postId, input) => {
        const safeId = sanitizeObjectId(postId);
        if (!isValidObjectId(safeId)) return;
        setLoadingActions(prev => ({ ...prev, [safeId]: true }));

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
            setPosts(prev => prev.map(p => String(p._id) === String(safeId) ? { ...p, comments: [...(p.comments || []), tempComment] } : p));
            if (selectedPost?._id === safeId) setSelectedPost(prev => ({ ...prev, comments: [...(prev.comments || []), tempComment] }));
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

            console.log(`📡 [DEBUG] Sending comment to /posts/${safeId}/comment with FormData`);
            res = await axios.post(`/posts/${safeId}/comment`, formData);
            const updatedComments = res.data;
            setPosts(prev => prev.map(p => String(p._id) === String(safeId) ? { ...p, comments: updatedComments } : p));
            if (selectedPost?._id === safeId) setSelectedPost(prev => ({ ...prev, comments: updatedComments }));
        } catch (e) {
            // ROLLBACK OPTIMISTIC UPDATE ON ERROR
            if (textValue) {
                setPosts(prev => prev.map(p => String(p._id) === String(safeId) ? { ...p, comments: (p.comments || []).filter(c => c._id !== tempId) } : p));
                if (selectedPost?._id === safeId) setSelectedPost(prev => ({ ...prev, comments: (prev.comments || []).filter(c => c._id !== tempId) }));
            }
            console.error("Add comment error:", e);
            const errorMsg = e.response?.data?.message || e.response?.data?.error || "Transmission failed";
        } finally {
            setLoadingActions(prev => { const copy = { ...prev }; delete copy[safeId]; return copy; });
        }
    };

    const handleCreatePost = async (formData, previewUrl, isStory) => {
        setIsCreateOpen(false); // Close immediately for zero-latency feel


        // 1. OPTIMISTIC UPDATE: Create a temporary "Uploading..." post/story
        const tempId = 'temp-' + Date.now();
        const tempPost = {
            _id: tempId,
            desc: formData.get('desc'),
            image: previewUrl, // Use local blob
            videoUrl: formData.get('videoUrl') || "", // Explicitly add youtube URL tracking
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

        // FORCE RENDER: Scroll to top if needed or trigger layout
        if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;

        try {
            const res = await axios.post('/posts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setPosts(currentPosts => currentPosts.map(p =>
                        p._id === tempId ? { ...p, uploadProgress: percentCompleted } : p
                    ));
                }
            });
            const createdPost = res.data;

            // Safely resolve the temporary post with the real one
            setPosts(prev => prev.map(p => p._id === tempId ? { ...createdPost, author: user } : p));
        } catch (e) {
            console.error("Upload failed", e);

            // Remove temp post
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

            cyberDeleteEffect();
        } catch (e) {
            fetchPosts(); // Re-sync on failure
        }
    };

    const viewProfile = (u) => {
        const fullUser = resolveFullUser(u, users);
        setProfileUser(fullUser);
        setIsProfileOpen(true);
    };
    // AUTO-LANGUAGE DETECTION
    useEffect(() => {
        const savedLang = localStorage.getItem('language');
        
        if (user?.settings?.language) {
            if (i18n.language !== user.settings.language) {
                console.log(`Setting language to user preference: ${user.settings.language}`);
                i18n.changeLanguage(user.settings.language);
            }
        } else if (savedLang) {
            // Use saved language from localStorage if user setting is missing
            if (i18n.language !== savedLang) {
                console.log(`Setting language to saved preference: ${savedLang}`);
                i18n.changeLanguage(savedLang);
            }
        } else {
            // Detect browser language if no user setting or saved preference
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

        window.location.reload();
    };

    const deleteNotifications = async () => { try { await axios.delete('/users/notifications'); setAlerts([]); const u = { ...user, notifications: [] }; setUser(u); localStorage.setItem('user', JSON.stringify(u)); cyberDeleteEffect(); } catch (e) { } };

    // IF DIRECT LINK TO COMMENT VIEW - Moved here to prevent hook order violations
    if (viewPostId) {
        return <CommentView postId={viewPostId} user={user} onClose={() => window.close()} />;
    }

    // Optimization: memoize feed calculation to avoid flickering & re-running heavy filters
    const preloadedProfilePosts = useMemo(() => {
        if (!profileUser?._id && !profileUser) return [];
        const targetId = String(profileUser?._id || profileUser?.userId || profileUser);
        return posts.filter(p =>
            String(p.author?._id || p.author) === targetId ||
            (Array.isArray(p.reposts) && p.reposts.some(id => String(id) === targetId))
        );
    }, [posts, profileUser]);

    return (
        <div className="app-container">
            {!user ? (
                <div className="min-h-full bg-[var(--app-bg)] flex items-center justify-center p-6 relative overflow-hidden">
                    <div className="w-full max-w-sm glass-panel p-8 rounded-[2rem] text-center shadow-2xl">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-3 mb-8 px-2">
                                <div className="flex flex-col items-center mb-8">
                                    <img src="/logo.png" alt="Legacy Academy" className="h-48 w-auto object-contain drop-shadow-[0_0_30px_rgba(var(--gold-primary-rgb),0.15)]" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {authMode === 'login' && (
                                    <>
                                        <div className="relative">
                                            <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="email" placeholder="Email" id="l-email" value={formData.email} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--gold-primary)] focus:bg-white/10  shadow-inner" />
                                        </div>
                                        <div className="relative">
                                            <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type={showPassword ? "text" : "password"} placeholder="Password" id="l-password" value={formData.password} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white font-bold outline-none focus:border-[var(--gold-primary)] focus:bg-white/10  shadow-inner" />
                                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500  ">
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
                                        }} className="w-full liquid-btn py-4 rounded-2xl font-black hover:scale-105   disabled:opacity-50">
                                            {authLoading ? "AUTHENTICATING..." : "LOGIN"}
                                        </button>
                                        <div className="flex justify-between text-xs text-gray-500 px-2 mt-4 font-bold tracking-wide">
                                            <span onClick={() => { setAuthMode('register'); setFormData({ email: '', password: '', username: '' }); }} className="cursor-pointer  ">Create Account</span>
                                            <span onClick={() => { setAuthMode('forgot'); setFormData({ email: '', password: '', username: '' }); }} className="cursor-pointer  ">Forgot Password?</span>
                                        </div>
                                    </>
                                )}
                                {authMode === 'register' && (
                                    <>
                                        <div onClick={() => registerFileRef.current.click()} className="w-24 h-24 mx-auto rounded-full bg-gray-800 overflow-hidden border-2 border-dashed border-gray-600 cursor-pointer relative group  mb-6 flex items-center justify-center ">
                                            {registerPreview ? <img src={registerPreview} className="w-full h-full object-cover" /> : <Icons.Camera className="w-8 h-8 text-gray-400" />}
                                            <input type="file" ref={registerFileRef} hidden accept="image/*" onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) setRegisterPreview(URL.createObjectURL(file));
                                            }} />
                                        </div>
                                        <div className="relative mb-3">
                                            <Icons.User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="text" placeholder={t('USERNAME')} id="r-username" value={formData.username} maxLength={19} onChange={(e) => { if (e.target.value.length <= 19) handleAuthInputChange(e); }} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--gold-primary)] focus:bg-white/10  shadow-inner text-sm" />
                                        </div>
                                        <div className="relative mb-3">
                                            <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="email" placeholder={t('EMAIL')} id="r-email" value={formData.email} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--gold-primary)] focus:bg-white/10  shadow-inner text-sm" />
                                        </div>
                                        <div className="relative mb-3">
                                            <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type={showPassword ? "text" : "password"} placeholder={t('PASSWORD')} id="r-password" value={formData.password} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-12 text-white font-bold outline-none focus:border-[var(--gold-primary)] focus:bg-white/10  shadow-inner text-sm" />
                                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500  ">
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
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm outline-none focus:border-[var(--gold-primary)] focus:bg-white/10  shadow-inner resize-none h-24"
                                                />
                                                <div className="absolute bottom-2 right-3 text-[9px] font-black text-white/20 uppercase tracking-widest">{(formData.bio || '').length} / 500</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mb-6">
                                            <select value={formData.language || 'en'} onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))} className="w-1/3 bg-black border border-white/20 rounded-xl py-3 px-3 text-white text-xs font-bold outline-none cursor-pointer   appearance-none text-center h-[52px]">
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
                                                            onClick={() => { setFormData(prev => ({ ...prev, theme: c })); }}
                                                            className={`w-7 h-7 rounded-lg border-2 relative ${formData.theme === c ? 'scale-110 border-white z-10 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-white/5 opacity-40'}`}
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
                                        }} className="w-full liquid-btn py-4 rounded-2xl font-black hover:scale-105   disabled:opacity-50">
                                            {authLoading ? t('CREATING_ACCOUNT') : t('REGISTER')}
                                        </button>
                                        <div className="text-xs text-gray-500 cursor-pointer  text-center mt-4 font-bold" onClick={() => setAuthMode('login')}>{t('BACK_TO_LOGIN')}</div>
                                    </>
                                )}
                                {authMode === 'forgot' && (
                                    <>
                                        <p className="text-sm text-gray-400 mb-4 px-2 text-center">{t('RESET_LINK_DESC')}</p>
                                        <div className="relative mb-6">
                                            <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="email" placeholder="Email" id="f-email" value={formData.email} onChange={handleAuthInputChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-[var(--gold-primary)] focus:bg-white/10  shadow-inner" />
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
                                        }} className="w-full liquid-btn py-4 rounded-2xl font-black hover:scale-105   disabled:opacity-50">
                                            {authLoading ? t('SENDING') : t('SEND_RESET_LINK')}
                                        </button>
                                        <div className="text-xs text-gray-500 cursor-pointer  text-center mt-4 font-bold" onClick={() => setAuthMode('login')}>{t('BACK_TO_LOGIN')}</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-[100dvh] bg-[var(--app-bg)] text-[var(--app-text)] relative font-sans overflow-hidden flex flex-col">
                    <div className="fixed inset-0 z-0" style={{ backgroundColor: 'var(--app-bg)' }}></div>
                    <main ref={mainScrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar p-0 pb-72 sm:pb-60 scroll-smooth relative z-10">
                        <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[var(--gold-primary)]/5 to-transparent pointer-events-none z-0" />
                        <header className="relative w-full z-[20] bg-black/40 backdrop-blur-xl border-b border-white/5 ai-glass shrink-0">
                            <div className="w-full px-3 sm:px-6 py-6 sm:py-4 flex items-center justify-between">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <EnhancedButton
                                        onClick={() => { setIsDrawerOpen(true); }}
                                        className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl bg-black/40 border border-white/10 transition-all duration-300 z-50 p-2.5 -ml-2 group"
                                        aria-label="Open menu"
                                        sound={null}
                                        scaleDown={1}
                                        duration={0}
                                    >
                                        <svg fill="none" width="28" viewBox="0 0 24 24" height="28" className="text-gray-300 group-hover:text-[var(--gold-primary)] transition-colors duration-300 pointer-events-none drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] group-hover:drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">
                                            <path fill="currentColor" stroke="none" strokeWidth="0" strokeLinecap="butt" strokeLinejoin="miter" fillRule="evenodd" clipRule="evenodd" d="M2 6a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm0 6a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm0 6a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Z"></path>
                                        </svg>

                                        {/* 🔥 NOTIFICATION BADGE (UNREAD COUNT) */}
                                        {alerts.filter(n => !n.read).length > 0 && (
                                            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 rounded-full border-2 border-black flex items-center justify-center animate-pulse z-10 shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                                                <span className="text-[10px] font-black text-white leading-none">
                                                    {alerts.filter(n => !n.read).length > 9 ? '9+' : alerts.filter(n => !n.read).length}
                                                </span>
                                            </div>
                                        )}
                                    </EnhancedButton>
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <img src="/logo.png" alt="Legacy Academy" className="h-48 w-auto object-contain drop-shadow-[0_0_30px_rgba(var(--gold-primary-rgb),0.3)]" />
                                </div>
                                <div className="w-10"></div> {/* Spacer for symmetry */}
                            </div>
                        </header>
                        <div className="pt-0 sm:pt-4 max-w-2xl sm:max-w-xl md:max-w-2xl mx-auto">
                            {activeTab === 'alerts' ? (
                                <div className="animate-fade-in p-4 sm:p-8">
                                    <div className="flex items-center justify-between mb-6 px-2">
                                        <div className="flex flex-col">
                                            <h2 className="text-xl font-black text-white uppercase tracking-widest">{t('NOTIFICATIONS_TITLE')}</h2>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Intelligence Alerts</div>
                                        </div>
                                        <div className="flex gap-2">
                                            {alerts.length > 0 && (
                                                <button
                                                    onClick={deleteNotifications}
                                                    title={t('CLEAR_ALL')}
                                                    className="w-9 h-9 sm:w-auto sm:px-4 bg-red-500/10 rounded-full  text-red-500  text-[10px] font-black uppercase tracking-widest border border-red-500/20 flex items-center justify-center gap-0 group shadow-lg "
                                                >
                                                    <Icons.Trash className="w-4 h-4 group-hover:scale-110 " />
                                                </button>
                                            )}
                                        </div>
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

                                    {activeTab !== 'search' && <StoriesBar stories={stories} user={user} imgKey={imgKey} key={imgKey || 'stories'} onAddStory={() => { setCreateModeStory(true); setIsCreateOpen(true); }} onViewStory={(s) => setSelectedPost(s)} />}
                                    <div className="px-2 py-4 sm:p-8">
                                        {activeTab === 'search' && (
                                            <div className="mb-8 space-y-4 animate-fade-in">
                                                <div className="relative"><Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input id="main-search" name="search" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('SEARCH_PH')} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:border-[var(--gold-primary)] ai-glass shadow-inner" /></div>
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
                                                                className="px-4 py-2 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl text-xs font-black text-gray-400 cursor-pointer     border border-white/5 whitespace-nowrap  shadow-lg flex items-center gap-2 group"
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
                                                        <div key={u._id} onClick={() => viewProfile(u)} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer  ">
                                                            <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                                                <ProfileAvatar user={u} className="rounded-full" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="font-bold text-white text-xs sm:text-sm">
                                                                        {u.username}
                                                                    </div>
                                                                    {u.role === 'Founder' && (
                                                                        <div className="flex items-center">
                                                                            <svg
                                                                                aria-label="Verified Founder"
                                                                                viewBox="0 0 22 22"
                                                                                className="w-3.5 h-3.5 shrink-0"
                                                                                style={{ overflow: 'visible' }}
                                                                            >
                                                                                <path
                                                                                    fill="#FFD700"
                                                                                    stroke="none"
                                                                                    d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                                                                                />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{u.followers?.length || 0} {t('FOLLOWERS_COUNT')}</div>
                                                            </div>
                                                            <button className="px-3 py-1.5 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest  ">{t('VIEW')}</button>
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
                                                                            <PostCard post={p} user={user} allUsers={users} onLike={handleLike} onDislike={handleDislike} onRepost={handleRepost} onComment={handleComment} onDelete={handleDeletePost} onViewProfile={viewProfile} onOpenDetail={setSelectedPost} onOpenChat={handleOpenChat} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onEditPost={(post) => { setPostToEdit(post); setIsEditOpen(true); }} onShare={handleShare} onHashtagClick={handleHashtagClick} loadingActions={loadingActions} forcePause={isAnyModalOpen} />
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

                    {showScrollTop && !isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost && (
                        <button
                            onClick={scrollToTop}
                            className="fixed bottom-24 right-20 sm:bottom-28 sm:right-32 z-[950] w-16 h-16 sm:w-11 sm:h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[var(--gold-primary)]   shadow-2xl backdrop-blur-xl  "
                        >
                            <Icons.ArrowUp className="w-8 h-8 sm:w-5 sm:h-5" />
                        </button>
                    )}

                    {/* BOTTOM NAV REMOVED IN FAVOR OF DRAWER */}

                    {/* CREATE FAB (Bluesky Style) */}
                    {(!isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost) && (
                        <button
                            onClick={() => { setIsCreateOpen(true); }}
                            className="fixed bottom-24 right-4 sm:bottom-28 sm:right-10 z-[1000] w-16 h-16 sm:w-11 sm:h-11 rounded-full bg-[#0f73ff] flex items-center justify-center text-white shadow-2xl  "
                        >
                            <Icons.Compose className="w-9 h-9 sm:w-5 sm:h-5" />
                        </button>
                    )}

                    <ProfileModal
                        isOpen={isProfileOpen}
                        onClose={() => { setIsProfileOpen(false); }}
                        profileUser={profileUser}
                        currentUser={user}
                        allUsers={users}
                        preloadedPosts={preloadedProfilePosts}
                        posts={posts}
                        onFollow={handleFollow}
                        onUpdateUser={handleUpdateUser}
                        onViewProfile={viewProfile}
                        onOpenChat={handleOpenChat}
                        onOpenDetail={setSelectedPost}
                        selectedPost={selectedPost}
                        imgKey={imgKey}
                        fetchSpecificUser={fetchUsers}
                        lastDeletedPostId={lastDeletedPostId}
                        followLoading={followLoading}
                        addToast={addToast}
                        onDeletePost={handleDeletePost}
                        onLike={handleLike}
                        onDislike={handleDislike}
                        onRepost={handleRepost}
                        onComment={handleComment}
                        onEditComment={handleEditComment}
                        onDeleteComment={handleDeleteComment}
                        onEditPost={(post) => { setPostToEdit(post); setIsEditOpen(true); }}
                        onShare={handleShare}
                        onHashtagClick={handleHashtagClick}
                        onOpenCreate={() => { setCreateModeStory(true); setIsCreateOpen(true); }}
                        loadingActions={loadingActions}
                    />
                    <ChatModal isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); setChatTarget(null); }} user={user} allUsers={users} initialChatUser={chatTarget} addToast={addToast} fetchSpecificUser={fetchUsers} />
                    <NavigationDrawer
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        user={user}
                        allUsers={users}
                        alerts={alerts}
                        onNavigate={(tab) => {
                            if (tab === 'chat') {
                                setTimeout(() => setIsChatOpen(true), 150);
                            } else {
                                setActiveTab(tab);
                            }
                        }}
                        onViewProfile={viewProfile}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onOpenTerms={() => setIsTermsOpen(true)}
                        onOpenPrivacy={() => setIsPrivacyOpen(true)}
                        onLogout={logout}
                        onOpenChat={handleOpenChat}
                        t={t}
                    />
                    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} logout={logout} user={user} onUpdateUser={handleUpdateUser} />

                    <LegalModal
                        isOpen={isTermsOpen}
                        onClose={() => setIsTermsOpen(false)}
                        title={t('TERMS_OF_SERVICE')}
                        content={
                            <div className="space-y-8">
                                <p className="text-lg text-white font-medium leading-relaxed border-l-2 border-[var(--gold-primary)] pl-4">
                                    {t('TERMS_WELCOME')}
                                </p>

                                <section className="space-y-3 relative group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--gold-primary)]">
                                            <Icons.ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-[var(--gold-primary)] font-black uppercase text-sm tracking-widest">{t('TERMS_S1_TITLE')}</h3>
                                    </div>
                                    <div className="pl-[52px] text-gray-400 group-hover:text-white">{t('TERMS_S1_DESC')}</div>
                                </section>

                                <section className="space-y-3 relative group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--gold-primary)]">
                                            <Icons.Activity className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-[var(--gold-primary)] font-black uppercase text-sm tracking-widest">{t('TERMS_S2_TITLE')}</h3>
                                    </div>
                                    <div className="pl-[52px] text-gray-400 group-hover:text-white">{t('TERMS_S2_DESC')}</div>
                                </section>

                                <section className="space-y-3 relative group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--gold-primary)]">
                                            <Icons.Zap className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-[var(--gold-primary)] font-black uppercase text-sm tracking-widest">{t('TERMS_S3_TITLE')}</h3>
                                    </div>
                                    <div className="pl-[52px] text-gray-400 group-hover:text-white">{t('TERMS_S3_DESC')}</div>
                                </section>

                                <div className="pt-6 border-t border-white/5 flex items-center gap-3">
                                    <Icons.Info className="w-4 h-4 text-red-500" />
                                    <p className="text-[11px] text-red-500/80 font-black uppercase tracking-[0.2em]">{t('TERMS_FOOTER')}</p>
                                </div>
                            </div>
                        }
                        t={t}
                    />

                    <LegalModal
                        isOpen={isPrivacyOpen}
                        onClose={() => setIsPrivacyOpen(false)}
                        title={t('PRIVACY_POLICY')}
                        content={
                            <div className="space-y-8">
                                <div className="p-3 sm:p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 sm:gap-5">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--gold-primary)]/10 rounded-full flex items-center justify-center text-[var(--gold-primary)] shrink-0">
                                        <Icons.Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <p className="text-white font-medium leading-tight text-sm sm:text-base min-w-0 break-words">{t('PRIVACY_WELCOME')}</p>
                                </div>

                                <section className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[var(--gold-primary)]">
                                            <Icons.HardDrive className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-white font-black uppercase text-sm tracking-tighter">{t('PRIVACY_S1_TITLE')}</h3>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed pl-11">{t('PRIVACY_S1_DESC')}</p>
                                </section>

                                <section className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[var(--gold-primary)]">
                                            <Icons.Fingerprint className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-white font-black uppercase text-sm tracking-tighter">{t('PRIVACY_S2_TITLE')}</h3>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed pl-11">{t('PRIVACY_S2_DESC')}</p>
                                </section>

                                <section className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[var(--gold-primary)]">
                                            <Icons.User className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-white font-black uppercase text-sm tracking-tighter">{t('PRIVACY_S3_TITLE')}</h3>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed pl-11">{t('PRIVACY_S3_DESC')}</p>
                                </section>
                            </div>
                        }
                        t={t}
                    />

                    <CreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreatePost={handleCreatePost} user={user} forceStory={createModeStory} />
                    <EditPostModal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setPostToEdit(null); }} onSuccess={() => { setIsEditOpen(false); setPostToEdit(null); fetchPosts(); }} post={postToEdit} user={user} />
                    {selectedPost && (
                        <PostDetailModal
                            post={selectedPost}
                            user={user}
                            allUsers={users}
                            onClose={() => setSelectedPost(null)}
                            onLike={handleLike}
                            onDislike={handleDislike}
                            onRepost={handleRepost}
                            onOpenChat={handleOpenChat}
                            onComment={handleComment}
                            onDelete={(pid) => {
                                handleDeletePost(pid);
                            }}
                            onEdit={(post) => { setPostToEdit(post); setIsEditOpen(true); }}
                            onEditComment={handleEditComment}
                            onDeleteComment={handleDeleteComment}
                            onShare={handleShare}
                            loadingActions={loadingActions}
                            onClearComments={(postId) => {
                                setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: [] } : p));
                                setSelectedPost(prev => prev ? { ...prev, comments: [] } : null);
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default App;
