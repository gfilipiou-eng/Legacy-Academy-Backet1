import React, { useState, useEffect, useRef, memo, useMemo, useCallback, startTransition } from 'react';
import { createPortal } from 'react-dom';
import EnhancedButton from './components/EnhancedButton';
// DEPLOYMENT_VERSION: V12_PORTAL_FIX

import axios from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { Icons } from './components/Icons';
import { VoiceNotePlayer } from './components/VoiceNotePlayer';
import { useTranslation } from './translations';
import { playSound, explodeEffect, cyberDeleteEffect } from './utils/sounds';
import CommentView from './CommentView';
import socket from './socket';
import BottomNavbar from './components/BottomNavbar';

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

            // 4K Background Support: Keep high quality for cover images
            if (isCover) {
                return cleanUrl.replace(/\/upload\/.*?(v\d+\/)/i, '/upload/w_2000,c_limit,q_auto:best/$1');
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
            } else if (width === 2000 || isCover) {
                // Founder 4K Background / High-Res Cover
                transform = `w_2000,c_limit,q_auto:best,${isVideo ? 'vc_auto' : 'f_auto'}`;
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
            -webkit-tap-highlight-color: transparent !important;
            outline: none !important;
        }
        button, a, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], summary, label {
            touch-action: manipulation;
            -webkit-touch-callout: none;
        }
        html, body {
            -webkit-tap-highlight-color: transparent !important;
            overscroll-behavior-y: none;
            overscroll-behavior-x: none;
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

const parseText = (text, onHashtagClick) => {
    if (!text) return [];
    
    // First, split by URLs to protect them from hashtag splitting
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            // It's a URL, render it directly
            return <a key={`url-${i}`} href={part} target="_blank" rel="noopener noreferrer" className="text-[#1D9BF0] hover:underline font-normal" onClick={(e) => e.stopPropagation()}>{part}</a>;
        }
        
        // It's normal text, now we can safely parse hashtags
        const hashtagRegex = /(#[\p{L}\p{N}_]+)/gu;
        const subParts = part.split(hashtagRegex);
        
        return subParts.map((subPart, j) => {
            if (subPart.startsWith('#')) {
                return (
                    <span 
                        key={`hash-${i}-${j}`} 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (onHashtagClick) onHashtagClick(subPart); 
                        }} 
                        className="text-[#1D9BF0] font-medium hover:underline cursor-pointer"
                    >
                        {subPart}
                    </span>
                );
            }
            return subPart;
        });
    });
};

const formatUserHandle = (username) =>
    '@' + String(username || 'agent').toLowerCase().replace(/\s+/g, '');

const THEME_PALETTE = [
    { value: '#cc0000', labelKey: 'COLOR_RED' },
    { value: '#ffd700', labelKey: 'COLOR_GOLD' },
    { value: '#3b82f6', labelKey: 'COLOR_BLUE' },
    { value: '#10b981', labelKey: 'COLOR_GREEN' },
    { value: '#ff5500', labelKey: 'COLOR_ORANGE' },
    { value: '#a855f7', labelKey: 'COLOR_PURPLE' },
];
const PROFILE_DESCRIPTOR_OPTIONS = [
    {
        value: 'entrepreneur',
        label: 'Entrepreneur',
        description: 'Building something big',
        Icon: Icons.Briefcase,
        accentClass: 'bg-orange-500/10 text-orange-200 border-orange-400/20'
    },
    {
        value: 'creator',
        label: 'Creator',
        description: 'Making content and ideas',
        Icon: Icons.Camera,
        accentClass: 'bg-sky-500/10 text-sky-200 border-sky-400/20'
    },
    {
        value: 'popular',
        label: 'Popular',
        description: 'Always in demand',
        Icon: Icons.Sparkles,
        accentClass: 'bg-fuchsia-500/10 text-fuchsia-200 border-fuchsia-400/20'
    },
    {
        value: 'pet-lover',
        label: 'Dog Lover',
        description: 'Pets are family',
        Icon: Icons.PawPrint,
        accentClass: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/20'
    },
    {
        value: 'community',
        label: 'Community',
        description: 'People first energy',
        Icon: Icons.Users,
        accentClass: 'bg-violet-500/10 text-violet-200 border-violet-400/20'
    },
    {
        value: 'visionary',
        label: 'Visionary',
        description: 'Future focused mindset',
        Icon: Icons.Zap,
        accentClass: 'bg-amber-500/10 text-amber-200 border-amber-400/20'
    }
];
const PROFILE_DESCRIPTOR_MAP = Object.fromEntries(PROFILE_DESCRIPTOR_OPTIONS.map(option => [option.value, option]));

const sanitizeAffiliation = (value) => String(value || '').trim().replace(/^@+/, '');
const normalizeProfileDescriptor = (value) => {
    const raw = String(value || '').trim();
    return raw.startsWith('custom:') ? '' : raw;
};
const getFounderAffiliation = (userLike) => {
    const explicit = sanitizeAffiliation(userLike?.founderAffiliation);
    if (explicit) return explicit;
    const legacyDescriptor = String(userLike?.profileDescriptor || '').trim();
    if (legacyDescriptor.startsWith('custom:')) {
        return sanitizeAffiliation(legacyDescriptor.slice('custom:'.length));
    }
    return '';
};
const founderAffiliationHref = (username) => {
    const params = new URLSearchParams(window.location.search);
    params.set('profile', sanitizeAffiliation(username));
    const savedLang = params.get('lang') || localStorage.getItem('language') || 'en';
    const savedTheme = params.get('theme') || localStorage.getItem('themeColor') || '#ffd700';
    params.set('lang', savedLang);
    params.set('theme', savedTheme);
    return `/?${params.toString()}`;
};
const buildPublicUrl = (type, value, extraParams = {}) => {
    const params = new URLSearchParams(window.location.search);
    const savedLang = params.get('lang') || localStorage.getItem('language') || 'en';
    const savedTheme = params.get('theme') || localStorage.getItem('themeColor') || '#ffd700';
    params.set(type, value);
    params.set('lang', savedLang);
    params.set('theme', savedTheme);
    Object.entries(extraParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') params.set(key, val);
    });
    return `/?${params.toString()}`;
};
const founderAffiliationUserCache = new Map();
const founderAffiliationPendingRequests = new Map();

const fetchFounderAffiliationUser = async (username) => {
    const normalizedUsername = sanitizeAffiliation(username);
    if (!normalizedUsername) return null;
    if (founderAffiliationUserCache.has(normalizedUsername)) {
        return founderAffiliationUserCache.get(normalizedUsername);
    }
    if (founderAffiliationPendingRequests.has(normalizedUsername)) {
        return founderAffiliationPendingRequests.get(normalizedUsername);
    }

    const request = axios
        .get(`/users/username/${encodeURIComponent(normalizedUsername)}`, { timeout: 8000 })
        .then((res) => {
            const user = res.data || null;
            founderAffiliationUserCache.set(normalizedUsername, user);
            return user;
        })
        .catch(() => null)
        .finally(() => {
            founderAffiliationPendingRequests.delete(normalizedUsername);
        });

    founderAffiliationPendingRequests.set(normalizedUsername, request);
    return request;
};

const FounderAffiliationBadge = ({ username, linkedUser, size = 'md', className = '' }) => {
    const normalizedUsername = sanitizeAffiliation(username);
    if (!normalizedUsername) return null;

    const [resolvedLinkedUser, setResolvedLinkedUser] = useState(() => linkedUser || founderAffiliationUserCache.get(normalizedUsername) || null);
    useEffect(() => {
        let cancelled = false;
        if (linkedUser?._id || linkedUser?.profilePic || linkedUser?.username) {
            founderAffiliationUserCache.set(normalizedUsername, linkedUser);
            setResolvedLinkedUser(linkedUser);
            return () => { };
        }

        const cachedUser = founderAffiliationUserCache.get(normalizedUsername);
        if (cachedUser) {
            setResolvedLinkedUser(cachedUser);
            return () => { };
        }

        fetchFounderAffiliationUser(normalizedUsername)
            .then((user) => {
                if (!cancelled) setResolvedLinkedUser(user || null);
            })
            .catch(() => {
                if (!cancelled) setResolvedLinkedUser(null);
            });

        return () => {
            cancelled = true;
        };
    }, [normalizedUsername, linkedUser]);

    const avatarSizeClass = size === 'sm' ? 'w-5 h-5 rounded-none' : 'w-6 h-6 rounded-none';
    const iconSizeClass = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
    const textSizeClass = size === 'sm' ? 'text-[9px]' : 'text-[10px]';
    const resolvedProfilePic = resolveMediaUrl(resolvedLinkedUser?.profilePic, size === 'large' ? 600 : 80, true);

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                window.location.href = founderAffiliationHref(normalizedUsername);
            }}
            className={`inline-flex items-center gap-1.5 text-white font-bold tracking-widest uppercase hover:underline cursor-pointer ${textSizeClass} ${className}`}
        >
            <div className={`${avatarSizeClass} overflow-hidden bg-black  shrink-0 flex items-center justify-center`}>
                {resolvedProfilePic ? (
                    <img src={resolvedProfilePic} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                    <span className="text-[8px] font-black text-white/80">
                        {(resolvedLinkedUser?.username || normalizedUsername)[0]?.toUpperCase() || '@'}
                    </span>
                )}
            </div>
            <Icons.Link className={`${iconSizeClass} shrink-0 opacity-70 text-white`} />
            <span className="truncate max-w-[180px] text-white">@{normalizedUsername}</span>
        </button>
    );
};

const isUserOnline = (u, currentUser) => {
    // Rule: You are always online to yourself (instant feedback)
    if (currentUser && isSameId(u, currentUser)) return true;

    const lastSeen = u?.lastSeen;
    if (!lastSeen) return false;
    try {
        // Tight Threshold: 60 seconds (60,000ms) for real-time Snapchat-like accuracy
        return (Date.now() - new Date(u.lastSeen).getTime()) < 60000;
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

        const isEl = lang === 'el';
        const isDe = lang === 'de';

        const diffInMinutes = Math.round(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return isEl ? (diffInMinutes === 1 ? '1 λεπτό' : `${diffInMinutes} λεπτά`) : 
                   isDe ? (diffInMinutes === 1 ? '1 Minute' : `${diffInMinutes} Minuten`) : 
                   (diffInMinutes === 1 ? '1 minute' : `${diffInMinutes} minutes`);
        }

        const diffInHours = Math.round(diffInSeconds / 3600);
        if (diffInHours < 24) {
            return diffInHours === 1 
                ? (isEl ? '1 ώρα' : isDe ? '1 Stunde' : '1 hour')
                : (isEl ? `${diffInHours} ώρες` : isDe ? `${diffInHours} Stunden` : `${diffInHours} hours`);
        }

        const diffInDays = Math.round(diffInSeconds / 86400);
        if (diffInDays < 7) {
            return diffInDays === 1 
                ? (isEl ? '1 μέρα' : isDe ? '1 Tag' : '1 day')
                : (isEl ? `${diffInDays} μέρες` : isDe ? `${diffInDays} Tage` : `${diffInDays} days`);
        }

        const currentYear = new Date().getFullYear();
        const yearSuffix = date.getFullYear() !== currentYear ? ` ${date.getFullYear()}` : '';
        const day = date.getDate();
        
        if (isEl) {
            const greekMonths = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
            return `${day} ${greekMonths[date.getMonth()]}${yearSuffix}`;
        }

        const locale = getLocaleForLang(lang);
        const options = { month: 'long', day: 'numeric' };
        if (date.getFullYear() !== currentYear) {
            options.year = 'numeric';
        }
        return date.toLocaleDateString(locale, options);
    } catch (e) { return ''; }
};

/**
 * Robustly converts any ID (string, number, or object) to a clean hex string.
 * Prevents the "[object Object]" bug that causes state corruption.
 */
const CyberDate = ({ date, t, lang }) => {
    if (!date) return null;
    const formatted = formatDate(date, t, lang);
    
    return (
        <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">
            {formatted}
        </span>
    );
};

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
            <div className="relative w-full sm:max-w-[400px] bg-black border-b border-white/20 sm:border sm:rounded-none rounded-none p-6 animate-slide-down pointer-events-auto flex flex-col pt-[calc(1.5rem+env(safe-area-inset-top,20px))] sm:mt-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black italic text-white flex items-center gap-3">
                        <Icons.Terminal className="w-5 h-5 text-white" />
                        {t('FOUNDER_CONSOLE')} <span className="text-white opacity-30 select-none">///</span>
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-none"><Icons.X className="w-6 h-6 text-gray-500" /></button>
                </div>

                <div className="flex flex-col gap-4">
                    {audioBlob ? (
                        <div className="flex items-center justify-between p-4 bg-white/5  rounded-none animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-none bg-white" />
                                <span className="text-xs font-black text-white uppercase tracking-widest">{t('VOICE_NOTE_READY')}</span>
                            </div>
                            <button onClick={() => setAudioBlob(null)} className="p-2 rounded-none"><Icons.Trash className="w-5 h-5 text-red-500" /></button>
                        </div>
                    ) : isRecording ? (
                        <div className="flex items-center justify-between p-5 bg-red-600 border border-red-500 rounded-none animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-none bg-white animate-ping" />
                                <span className="text-sm font-black text-white uppercase tracking-widest">{t('RECORDING')}...</span>
                            </div>
                            <button onClick={stopRecording} className="px-5 py-2 bg-white text-red-600 font-black text-xs uppercase tracking-widest rounded-none shadow-none">{t('STOP')}</button>
                        </div>
                    ) : (
                        <div className="relative">
                            <textarea
                                autoFocus
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                placeholder={t('WRITE_COMMENT')}
                                className="w-full h-32 bg-black  rounded-none p-5 text-base text-white font-medium resize-none focus:border-white outline-none placeholder-gray-600 shadow-none"
                            />
                            <div className="absolute bottom-3 right-3 text-[10px] font-black text-gray-700 uppercase tracking-widest">{value.length} / 500</div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                        {!audioBlob && !isRecording && (
                            <button
                                type="button"
                                onClick={startRecording}
                                className="p-4 bg-black  rounded-none text-gray-400 shadow-none group"
                            >
                                <Icons.Mic className="w-6 h-6 group-hover:scale-110 " />
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={(audioBlob ? false : !value.trim()) || loading}
                            className="flex-1 py-4 bg-white text-black font-black text-xs uppercase tracking-[0.15em] rounded-none disabled:opacity-50 flex items-center justify-center gap-3 hover:bg-gray-200"
                        >
                            {loading ? (
                                <div className="w-5 h-5 text-black/50">
                                    <Icons.Loader />
                                </div>
                            ) : <Icons.Send className="w-5 h-5" />}
                            {t('SEND_COMMENT')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DefaultAvatar = ({ name, size = "normal" }) => {
    return (
        <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center text-white relative overflow-hidden">
            {name ? <span className={`${size === "large" ? "text-3xl" : "text-sm"} font-black uppercase select-none text-white/50`}>{name.substring(0, 1)}</span> : <Icons.User className={`${size === "large" ? "w-10 h-10" : "w-1/2 h-1/2"} opacity-40 text-white`} />}
        </div>
    );
};

const ProfileAvatar = ({ user, size = "normal", className, onClick, priority = false }) => {
    const [imgError, setImgError] = useState(false);

    if (!user || typeof user !== 'object') return <DefaultAvatar size={size} />;

    const rawUrl = user.profilePic || user.fromProfilePic;
    const name = user.username || user.fromUsername;

    // Reset error state if url changes
    useEffect(() => { setImgError(false); }, [String(rawUrl || '')]);

    const mediaUrl = resolveMediaUrl(rawUrl, size === 'large' ? 350 : 150, !String(rawUrl || '').includes('/video/upload/'));
    const isVideo = rawUrl && (rawUrl.match(/\.(mp4|mov|webm)($|\?)/i) || rawUrl.includes('/video/upload/')) && mediaUrl;

    const isFounder = user?.role === 'Founder';
    // Strip rounded-full from className to prevent anti-aliasing gaps. Parent container's overflow-hidden handles the clipping.
    const finalClassName = `w-full h-full object-cover ${className || ''}`.replace(/rounded-full/g, '');

    if (imgError || !mediaUrl) return <DefaultAvatar name={name} size={size} />;

    if (isVideo) {
        return (
            <div className={`w-full h-full bg-gray-900 ${finalClassName}`} onClick={onClick}>
                <div className="w-full h-full relative overflow-hidden bg-black">
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
            className={finalClassName}
            onClick={onClick}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
            alt=""
            onError={() => setImgError(true)}
        />
    ) : (
        <div className="w-full h-full overflow-hidden">
            <DefaultAvatar name={name} size={size} />
        </div>
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
            <button ref={btnRef} onClick={toggle} className="p-1.5 sm:p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95">
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
                        className="w-48 bg-[#1a1a1a]  rounded-2xl shadow-2xl overflow-hidden flex flex-col gap-1 p-1 animate-fade-in"
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

const VerifiedBadge = ({ isFounder, className = "w-4 h-4", forceGold = false, isUser = false }) => {
    // If it's explicitly a normal user, use Blue. Otherwise, check if Founder or forced Gold.
    const isGold = (isFounder || forceGold) && !isUser;

    return (
        <svg viewBox="0 0 22 22" className={`${className} shrink-0`} style={{ overflow: 'visible' }}>
            <path
                fill={isGold ? "#FFD700" : "#1D9BF0"}
                stroke="none"
                style={{ fill: isGold ? "#FFD700" : "#1D9BF0", stroke: 'none' }}
                d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
            />
        </svg>
    );
};

const CommentItem = memo(({ comment, post, user, allUsers, onEdit, onDelete, t = (k) => k, lang, onViewProfile }) => {
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
                <div 
                    className="w-9 h-9 rounded-none overflow-hidden shrink-0  bg-black cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onViewProfile && onViewProfile(isCommentAuthor ? user : (comment.user || { username: comment.authorName, profilePic: comment.authorProfilePic }))}
                >
                    <ProfileAvatar
                    user={isCommentAuthor ? user : (comment.user || { username: comment.authorName, profilePic: comment.authorProfilePic })}
                />
            </div>

            <div className={`flex-1 min-w-0 flex flex-col ${isCommentAuthor ? 'items-end text-right' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 max-w-full">
                    <span 
                        className={`font-black text-[10px] uppercase tracking-[0.15em] truncate cursor-pointer hover:underline ${isCommentAuthor ? 'text-[var(--gold-primary)]' : 'text-white'}`}
                        onClick={() => onViewProfile && onViewProfile(isCommentAuthor ? user : (comment.user || { username: comment.authorName, profilePic: comment.authorProfilePic }))}
                    >
                        {isCommentAuthor ? (user?.username || 'User') : (comment.user?.username || comment.authorName || 'User')}
                    </span>
                    <VerifiedBadge isFounder={isFounder} isUser={!isFounder} className="w-3.5 h-3.5" />
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
                    <div className="flex items-center gap-1.5 shrink-0">
                        <CyberDate date={comment.createdAt} t={t} lang={lang} />
                    </div>
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

const PostDetailModal = ({ post, user, allUsers, onClose, onLike, onDislike, onRepost, onOpenChat, onComment, onDelete, onEdit, onDeleteComment, onEditComment, onShare, loadingActions, onClearComments, onViewProfile }) => {
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
        <div className="fixed inset-0 z-[2500] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-start md:justify-center p-0 md:p-4 overflow-hidden  duration-300">
            <button onClick={onClose} className="fixed top-4 right-4 p-3 bg-black  rounded-none z-[2600] shadow-none group">
                <Icons.X className="w-6 h-6 text-white group-hover:rotate-90 " />
            </button>
            <div className="w-full max-w-6xl h-[100dvh] md:h-[90vh] bg-[#050505]/95 backdrop-blur-3xl rounded-none flex flex-col md:flex-row border-none md:border md:border-white/10 shrink-0 my-auto transform-gpu relative shadow-[0_15px_50px_rgba(0,0,0,0.8)]">
                {/* Image Section */}
                <div className="w-full md:flex-1 bg-transparent flex items-center justify-center relative shadow-inner overflow-hidden h-[50vh] md:h-full shrink-0">
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
                                    className="max-w-full max-h-full object-contain cursor-pointer"
                                    onClick={onClose}
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
                    ) : <div className="p-10 text-center font-black text-2xl text-white italic bg-black  w-full h-full flex items-center justify-center uppercase tracking-tighter">{post.desc}</div>}
                </div>

                {/* Info Section */}
                <div className="w-full md:w-[450px] flex flex-col bg-black/40 backdrop-blur-3xl border-l border-white/5 flex-1 min-h-0 md:h-full relative font-sans">
                    <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between bg-transparent shrink-0 relative z-50 gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-none bg-black overflow-hidden shadow-none shrink-0 cursor-pointer relative group" onClick={(e) => { e.stopPropagation(); onViewProfile(author); }}>
                                
                                <ProfileAvatar user={author} />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1 pr-2">
                                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                                    <span className="font-bold text-white text-[14px] leading-tight break-words">{author?.username}</span>
                                    <VerifiedBadge isFounder={author?.role === 'Founder'} isUser={author?.role !== 'Founder'} className="w-4 h-4 shrink-0" />
                                    <span className="text-gray-500 text-[12px] break-all">{formatUserHandle(author?.username)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative shrink-0">
                            <DropdownMenu post={post} user={user} onShare={onShare} onEdit={onEdit} onDelete={onDelete} t={t} />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-black/30 overscroll-contain">
                        {/* ── STICKY COMMENT/ACTIONS BAR ── */}
                        <div className="sticky top-0 px-2 py-2 border-b border-white/10 bg-black/90 backdrop-blur-xl z-[200]">
                            <div className="flex items-center justify-between mt-1 mb-3 w-full px-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); document.getElementById(`comment-input-${post._id}`)?.focus(); }}
                                    className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-none transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/10 text-gray-400 hover:text-white">
                                    <Icons.MessageSquare className="w-5 h-5" />
                                    <span className="text-[11px] font-black tabular-nums">{post.comments?.length || 0}</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRepost?.(post._id); }}
                                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-none transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/10 ${post.reposts?.some(id => isSameId(id, user?._id)) ? 'text-green-500 bg-green-500/10 border-green-500/20 scale-105 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'text-gray-400 hover:text-green-400'}`}>
                                    <Icons.RefreshCcw className={`w-5 h-5 transition-transform ${post.reposts?.some(id => isSameId(id, user?._id)) ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : ''}`} />
                                    <span className="text-[11px] font-black tabular-nums">{post.reposts?.length || 0}</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onLike(post._id); }}
                                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-none transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/10 ${post.likes?.some(id => isSameId(id, user?._id)) ? 'text-red-500 bg-red-500/10 border-red-500/20 scale-105 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-red-400'}`}>
                                    <Icons.Heart className={`w-5 h-5 transition-transform ${post.likes?.some(id => isSameId(id, user?._id)) ? 'fill-current scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`} />
                                    <span className="text-[11px] font-black tabular-nums">{post.likes?.length || 0}</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDislike(post._id); }}
                                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-none transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/10 ${post.dislikes?.some(id => isSameId(id, user?._id)) ? 'text-blue-500 bg-blue-500/10 border-blue-500/20 scale-105 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-gray-400 hover:text-blue-400'}`}>
                                    <Icons.ThumbsDown className={`w-5 h-5 transition-transform ${post.dislikes?.some(id => isSameId(id, user?._id)) ? 'fill-current scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
                                    <span className="text-[11px] font-black tabular-nums">{post.dislikes?.length || 0}</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-2 w-full">
                                <div className="w-9 h-9 rounded-none bg-black overflow-hidden shrink-0 ">
                                    <ProfileAvatar user={user} />
                                </div>
                                {isRecordingComment ? (
                                    <div className="flex-1 min-w-0 bg-white text-black border border-white rounded-none p-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2 pl-1 shrink-0">
                                            <div className="w-2.5 h-2.5 rounded-none bg-red-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-black uppercase tracking-widest">{t('TRANSMITTING')}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => stopRecording(true)} className="p-2 bg-black  rounded-none text-white hover:bg-white/10"><Icons.X className="w-4 h-4" /></button>
                                            <button onClick={() => stopRecording(false)} className="px-3 py-2 bg-black rounded-none text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10">{t('STOP')}</button>
                                        </div>
                                    </div>
                                ) : commentAudio ? (
                                    <div className="flex-1 min-w-0 flex items-center justify-between px-2 bg-black border border-white/40 rounded-none p-1">
                                        <div className="flex items-center gap-2 pl-2 min-w-0">
                                            <div className="w-2 h-2 rounded-none bg-white animate-pulse shrink-0" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">{t('VOICE_NOTE_READY')}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => setCommentAudio(null)} className="w-9 h-9 flex items-center justify-center rounded-none text-white  hover:bg-white/10">
                                                <Icons.X className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => {
                                                const fd = new FormData(); fd.append('file', commentAudio, 'voice.webm');
                                                if (commentText.trim()) fd.append('text', commentText.trim());
                                                onComment(post._id, fd); setCommentAudio(null); setCommentText('');
                                            }} className="w-9 h-9 flex items-center justify-center bg-white rounded-none text-black">
                                                <Icons.Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={(e) => { e.preventDefault(); if (commentText.trim()) { onComment(post._id, commentText); setCommentText(''); } }} className="flex-1 flex items-center bg-black  rounded-none overflow-hidden min-h-[46px]">
                                        <input
                                            id={`comment-input-${post._id}`}
                                            placeholder={t('FOUNDER_PLACEHOLDER')}
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            className="flex-1 min-w-0 bg-transparent py-3 px-3 text-sm text-white outline-none placeholder-gray-600 font-bold"
                                        />
                                        <div className="flex gap-1 pr-1 shrink-0">
                                            <button type="button" onClick={toggleCommentRecording} className={`w-9 h-9 flex items-center justify-center rounded-none ${isRecordingComment ? 'bg-red-600 text-white animate-pulse' : 'text-gray-500'}`}>
                                                <Icons.Mic className="w-4 h-4" />
                                            </button>
                                            <button type="submit" disabled={!commentText.trim()} className="w-9 h-9 flex items-center justify-center rounded-none bg-white text-black disabled:opacity-25   shrink-0">
                                                <Icons.Send className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                        {/* Description Section */}
                        <div className="px-4 sm:px-6 py-6 bg-transparent border-b border-white/10 z-10 relative">
                            <div className="space-y-4">
                                <div className="text-[15px] text-white border-l-[3px] border-white pl-5 py-2 pb-3 font-bold leading-relaxed w-full text-left whitespace-pre-wrap break-words">
                                    {parseText((translatedText || post.desc) && (translatedText || post.desc).length > 500 && !isExpanded ? (translatedText || post.desc).slice(0, 500) + '...' : (translatedText || post.desc), (tag) => {
                                        onClose();
                                        // Need a way to search hashtag, maybe just window location
                                    })}
                                    {(translatedText || post.desc) && (translatedText || post.desc).length > 500 && (
                                        <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-white text-[10px] font-black uppercase tracking-widest ml-2 hover:underline">
                                            {isExpanded ? t('READ_LESS') : t('READ_MORE')}
                                        </button>
                                    )}
                                </div>
                                <div className="pl-5">
                                    <button
                                        onClick={handleTranslate}
                                        disabled={isTranslating}
                                        className="text-[10px] font-black text-white uppercase tracking-widest hover:underline flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
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
                                        <CommentItem key={c._id || idx} comment={c} post={post} user={user} allUsers={allUsers} onEdit={onEditComment} onDelete={onDeleteComment} t={t} lang={lang} onViewProfile={onViewProfile} />
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
                            className="w-full h-auto object-contain cursor-pointer max-h-[75vh] md:max-h-[85vh] duration-500 will-change-transform transform-gpu"
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
                                    className="p-3 rounded-2xl bg-black/40 backdrop-blur-xl  text-white pointer-events-auto     group/btn shadow-xl"
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
                                            
                                            // Check if it's fullscreen capable
                                            if (videoRef.current) {
                                                if (videoRef.current.requestFullscreen) {
                                                    videoRef.current.requestFullscreen();
                                                } else if (videoRef.current.webkitRequestFullscreen) {
                                                    videoRef.current.webkitRequestFullscreen();
                                                } else if (videoRef.current.webkitEnterFullscreen) {
                                                    videoRef.current.webkitEnterFullscreen(); // For iOS
                                                } else {
                                                    onExpand(); // Fallback to modal
                                                }
                                            } else {
                                                onExpand(); // Fallback for youtube or missing ref
                                            }
                                        }}
                                        className="p-3 rounded-2xl bg-black/40 backdrop-blur-xl  text-white pointer-events-auto     group/btn shadow-xl"
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
                                className="w-full h-1.5 bg-white/10 backdrop-blur-sm rounded-full cursor-pointer relative group/seek shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/5"
                                onMouseDown={handleMouseDown}
                                onTouchStart={handleMouseDown}
                            >
                                <div className="absolute inset-x-0 -inset-y-4 group-hover/seek:bg-white/5 rounded-full" />
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--gold-primary)] to-[#ffea70] shadow-[0_0_15px_var(--gold-glow)] rounded-full"
                                    style={{ width: `${progress}%` }}
                                    transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                                />
                                <motion.div
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] scale-0 group-hover/seek:scale-100 hidden sm:block"
                                    style={{ left: `${progress}%`, marginLeft: '-6px' }}
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

    const isFounderSender = note?.sender?.role === 'Founder' || note?.fromRole === 'Founder';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-3 rounded-none cursor-pointer border-b border-white/5 group"
            onClick={handleClick}
        >
            <div className="relative">
                <div className="w-12 h-12 rounded-none bg-black overflow-hidden  shadow-md">
                    <ProfileAvatar user={{ username: note.fromUsername, profilePic: note.fromProfilePic }} />
                </div>
                {note.type === 'like' && <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-none p-1 border-2 border-black"><Icons.Heart className="w-3 h-3 text-white fill-current" /></div>}
                {note.type === 'comment' && <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-none p-1 border-2 border-black"><Icons.MessageSquare className="w-3 h-3 text-white fill-current" /></div>}
                {note.type === 'message' && <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-none p-1 border-2 border-black"><Icons.Mail className="w-3 h-3 text-white" /></div>}
                {note.type === 'follow' && <div className="absolute -bottom-1 -right-1 bg-[var(--gold-primary)] rounded-none p-1 border-2 border-black"><Icons.UserPlus className="w-3 h-3 text-black" /></div>}
                {note.type === 'follow_request' && <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-none p-1 border-2 border-black"><Icons.Shield className="w-3 h-3 text-white" /></div>}
                {note.type === 'security_alert' && <div className="absolute -bottom-1 -right-1 bg-orange-600 rounded-none p-1 border-2 border-black animate-pulse shadow-[0_0_10px_rgba(234,88,12,0.6)]"><Icons.ShieldCheck className="w-3 h-3 text-white" /></div>}
            </div>
            <div className="flex-1">
                <div className="text-sm flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-white group-hover:text-white uppercase tracking-tight">{(note.fromUsername && note.fromUsername !== 'Unknown' && note.fromUsername !== 'Someone') ? note.fromUsername : 'Agent'}</span>
                    <VerifiedBadge isFounder={isFounderSender} isUser={!isFounderSender} className="w-3.5 h-3.5 ml-1" />
                    {note?.fromDescriptor && (
                        <span className="text-gray-400 text-[10px] ml-1 uppercase tracking-widest font-bold">
                            • {t(`DESC_${note.fromDescriptor.toUpperCase()}`, note.fromDescriptor)}
                        </span>
                    )}
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
                    <div className="flex items-center gap-1.5 shrink-0">
                        <CyberDate date={note.createdAt} t={t} lang={lang} />
                    </div>
                    {!note.read && <div className="w-1.5 h-1.5 bg-[var(--gold-primary)] rounded-full" />}
                </div>

                {note.type === 'follow_request' && (
                    <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => onAcceptRequest(note.sender?._id || note.from, note._id)} className="flex-1 py-1.5 bg-[var(--gold-primary)] text-black text-[10px] font-black rounded-lg hover:scale-105 shadow-lg uppercase tracking-widest">{t('ACCEPT')}</button>
                        <button onClick={() => onRejectRequest(note.sender?._id || note.from, note._id)} className="flex-1 py-1.5 bg-white/5  text-gray-400 text-[10px] font-black rounded-lg    uppercase tracking-widest">{t('REJECT')}</button>
                    </div>
                )}
            </div>
            {note.postImage && (
                <div className="w-12 h-12 rounded-xl bg-gray-800  overflow-hidden shrink-0 group-hover:scale-105 ">
                    <img src={resolveMediaUrl(note.postImage)} className="w-full h-full object-cover opacity-60" />
                </div>
            )}
        </motion.div>
    );
});

const StoriesBar = ({ stories, user, onAddStory, onViewStory, imgKey }) => {
    const { t } = useTranslation(user);
    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-2 sm:px-4 border-b border-white/5 bg-transparent">
            {/* CURRENT USER ADD STORY */}
            <div onClick={onAddStory} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-none overflow-hidden bg-black  shadow-none relative group">
                    <ProfileAvatar user={user} className="opacity-80" key={imgKey} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white group-hover:scale-125 transition-transform">
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
                const authorPic = s.author?.profilePic ? resolveMediaUrl(s.author.profilePic, null, false, false, false) : '/logo.png';
                const authorName = s.author?.username || 'Agent';
                const storyMediaUrl = s.thumbnailUrl || s.image || s.videoUrl;

                return (
                    <div key={s._id || i} onClick={() => onViewStory(s)} className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-none p-[2px] bg-[var(--gold-primary)] shadow-none relative transition-transform duration-300 group-hover:scale-105 transform-gpu">
                            <div className="w-full h-full rounded-none overflow-hidden border border-black bg-black relative flex items-center justify-center">
                                {storyMediaUrl ? (
                                    <img src={resolveMediaUrl(storyMediaUrl, null, false, true)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                                ) : (
                                    <div className="w-full h-full bg-[#111] p-1 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-[7px] font-bold text-center break-words line-clamp-4 leading-tight">
                                            {s.desc}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {isNativeVideo && (
                                <div className="absolute bottom-[-4px] right-[-4px] w-5 h-5 bg-white text-black rounded-none flex items-center justify-center border border-black shadow-md z-10">
                                    <Icons.Play className="w-2.5 h-2.5 fill-black pl-[0.5px]" />
                                </div>
                            )}
                            {isYT && (
                                <div className="absolute bottom-[-4px] right-[-4px] w-5 h-5 bg-white text-black rounded-none flex items-center justify-center border border-black shadow-md z-10">
                                    <Icons.Play className="w-2.5 h-2.5 fill-black pl-[0.5px]" />
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] font-black text-white/70 uppercase tracking-wider group-hover:text-white transition-colors max-w-[60px] truncate">{authorName}</span>
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`premium-post-card group relative p-5 sm:p-7 mb-8 transition-all duration-300 will-change-transform overflow-hidden`}
        >
            {/* Subtle Ancient Greek Meander Top Border */}
            <div className="hidden" />
            <div className="hidden" />


            {/* UPLOADING OVERLAY */}
            {post.isUploading && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-none animate-fade-in pointer-events-none">
                    <div className="w-16 h-16 text-[var(--gold-primary)] mb-4">
                        <Icons.Loader />
                    </div>
                    <div className="text-white font-black uppercase tracking-[0.2em] animate-pulse text-lg drop-shadow-none">
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
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-none bg-black/60 shadow-none cursor-pointer overflow-hidden " onClick={() => onViewProfile(author)}>
                            <ProfileAvatar user={author} className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* RIGHT COL: CONTENT */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2 -mt-1 sm:-mt-0.5 min-w-0">
                            <div className="min-w-0 flex-1 pr-1 cursor-pointer" onClick={() => onOpenDetail(post)}>
                                <div className="flex flex-col gap-2 min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                                        <span className="font-bold text-white text-[13px] sm:text-[15px] hover:underline cursor-pointer break-words leading-tight" onClick={() => onViewProfile(author)}>{author?.username}</span>
                                        <VerifiedBadge isFounder={isFounder} isUser={!isFounder} className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
                                        <span className="text-gray-500 text-[13px] break-all">{formatUserHandle(author?.username)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CyberDate date={post.createdAt} t={t} lang={lang} />
                                    </div>
                                </div>
                            </div>

                            <DropdownMenu post={post} user={user} onShare={onShare} onEdit={onEditPost} onDelete={onDelete} t={t} />
                        </div>

                        <div className="space-y-3 mt-1 cursor-pointer" onClick={() => onOpenDetail(post)}>
                            {post.desc && (
                                <div className="space-y-2">
                                    <p className="text-[15px] sm:text-[16px] text-white/95 leading-relaxed font-medium whitespace-pre-wrap break-words pr-2 pb-1" onClick={(e) => { e.stopPropagation(); onOpenDetail(post); }}>
                                        {parseText(translatedText || post.desc, (tag) => onHashtagClick(tag))}
                                    </p>
                                    <button
                                        onClick={handleTranslate}
                                        disabled={isTranslating}
                                        className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-widest hover:underline flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
                                    >
                                        <Icons.Globe className={`w-3 h-3 ${isTranslating ? 'animate-spin' : ''}`} />
                                        {isTranslating ? t('DECRYPTING', 'DECRYPTING...') : (translatedText ? t('SHOW_ORIGINAL', 'SHOW ORIGINAL') : t('SEE_TRANSLATION', 'SEE TRANSLATION'))}
                                    </button>
                                </div>
                            )}

                            {(post.image || post.videoUrl) && (
                                <div className="rounded-none overflow-hidden  bg-[#050505] relative shadow-none h-auto min-h-[100px] mt-3">
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
                        <div className="flex items-center justify-between mt-4 w-full border-t border-white/10 pt-4 px-2">

                            {/* COMMENTS */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
                                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-none transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/10 ${showComments ? 'text-white bg-white/10 border-white/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Icons.MessageSquare className="w-5 h-5" />
                                <span className="text-[11px] font-black tabular-nums">{post.comments?.length || 0}</span>
                            </button>

                            {/* REPOSTS */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();

                                    onRepost && onRepost(post._id);
                                }}
                                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-none transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/10 ${post.reposts?.some(id => isSameId(id, user?._id)) ? 'text-green-500 bg-green-500/10 border-green-500/20 scale-105 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'text-gray-400 hover:text-green-400'}`}
                            >
                                <Icons.RefreshCcw className={`w-5 h-5 transition-transform ${post.reposts?.some(id => isSameId(id, user?._id)) ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : ''}`} />
                                <span className="text-[11px] font-black tabular-nums">{post.reposts?.length || 0}</span>
                            </button>

                            {/* LIKE */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const isLiked = post.likes?.some(id => isSameId(id, user?._id));
                                    playSound(isLiked ? 'cyber_unlike' : 'cyber_like');
                                    onLike(post._id);

                                }}
                                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-none transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/10 ${post.likes?.some(id => isSameId(id, user?._id)) ? 'text-red-500 bg-red-500/10 border-red-500/20 scale-105 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-red-400'}`}
                            >
                                    <Icons.Heart className={`w-5 h-5 transition-transform ${post.likes?.some(id => isSameId(id, user?._id)) ? 'fill-current scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`} />
                                <span className="text-[11px] font-black tabular-nums">{post.likes?.length || 0}</span>
                            </button>

                            {/* DISLIKE */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const isDisliked = post.dislikes?.some(id => isSameId(id, user?._id));
                                    playSound(isDisliked ? 'cyber_unlike' : 'cyber_like');
                                    onDislike(post._id);

                                }}
                                className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-none transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/10 ${post.dislikes?.some(id => isSameId(id, user?._id)) ? 'text-blue-500 bg-blue-500/10 border-blue-500/20 scale-105 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'text-gray-400 hover:text-blue-400'}`}
                            >
                                <Icons.ThumbsDown className={`w-5 h-5 transition-transform ${post.dislikes?.some(id => isSameId(id, user?._id)) ? 'fill-current scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
                                <span className="text-[11px] font-black tabular-nums">{post.dislikes?.length || 0}</span>
                            </button>

                            {/* SHARE */}

                        </div>

                        {showComments && (
                            <div className="mt-4 pt-4 border-t border-white/5 space-y-6 animate-fade-in relative z-20">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-none overflow-hidden shrink-0  bg-black">
                                        <ProfileAvatar user={user} />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-3">
                                        <div className="relative">
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder={t('WRITE_COMMENT')}
                                                className="w-full bg-black  rounded-none p-4 text-sm text-white outline-none focus:border-white min-h-[100px] resize-none pb-12"
                                            />
                                            <div className="absolute bottom-2 left-2 flex gap-2">
                                                <button onClick={toggleCommentRecording} className={`p-2 rounded-none  ${isRecordingComment ? 'bg-red-600 text-white animate-pulse' : 'bg-black  text-gray-500'}`}>
                                                    <Icons.Mic className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => { if (commentText.trim()) { onComment(post._id, commentText); setCommentText(''); } }} className="p-2 bg-white border border-white text-black rounded-none hover:opacity-90  ">
                                                    <Icons.Send className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        {commentAudio && (
                                            <div className="p-3 bg-white/10 border border-white/30 rounded-none flex items-center justify-between mt-3">
                                                <div className="flex items-center gap-3">
                                                    <Icons.Mic className="w-4 h-4 text-white" />
                                                    <span className="text-[10px] font-black text-white uppercase">VOICE READY</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setCommentAudio(null)} className="p-1.5  text-white rounded-none  hover:bg-white/10"><Icons.Trash className="w-4 h-4" /></button>
                                                    <button onClick={() => { const fd = new FormData(); fd.append('file', commentAudio, 'voice.webm'); onComment(post._id, fd); setCommentAudio(null); }} className="px-4 py-1 bg-white text-black font-black text-[10px] rounded-none">SEND</button>
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
    const normalizeWhisper = useCallback((message) => ({
        ...message,
        audio: message?.audio || message?.audioUrl || "",
        image: message?.image || "",
        isRead: message?.isRead ?? message?.read ?? false,
        isLocked: message?.isLocked ?? false
    }), []);

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
            const normalizedMessages = (res.data || []).map(normalizeWhisper);

            // Only update if data actually changed to avoid unnecessary re-renders and scroll jumps
            setMessages(prev => {
                const currentMsgs = prev[otherUserId] || [];
                // Simple comparison - for more complex objects we'd use a deep compare helper
                if (currentMsgs.length === normalizedMessages.length && JSON.stringify(currentMsgs[currentMsgs.length - 1]) === JSON.stringify(normalizedMessages[normalizedMessages.length - 1])) {
                    return prev;
                }
                return { ...prev, [otherUserId]: normalizedMessages };
            });

            // 🔥 WHISPERS: Auto-mark incoming messages as read (and trigger deletion on backend)
            const incomingUnread = normalizedMessages.filter(m => String(m.recipient) === String(user._id) && !m.isRead && !m.isLocked);
            if (incomingUnread.length > 0) {
                // Trigger burn protocol
                Promise.all(incomingUnread.map(m => axios.patch(`/messages/${m._id}/read`).catch(() => { })));
            }
                
        } catch (e) { console.error('Failed to fetch messages', e); }
    };

    const hasInitializedRef = useRef(false);

    useEffect(() => {
        if (!isOpen) {
            hasInitializedRef.current = false;
            setActiveChat(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && initialChatUser && !hasInitializedRef.current) {
            if (typeof initialChatUser === 'string') {
                const found = allUsers.find(u => isSameId(u._id, initialChatUser));
                if (found) {
                    setActiveChat(found);
                    hasInitializedRef.current = true;
                }
            } else if (initialChatUser._id || initialChatUser.id) {
                setActiveChat(initialChatUser);
                hasInitializedRef.current = true;
            }
        }
    }, [isOpen, initialChatUser, allUsers]);

    useEffect(() => {
        if (!isOpen || !activeChat?._id) return;
        const targetId = activeChat._id;
        fetchMessages(targetId);

        // Removed aggressive 5s polling. Socket updates are enough, polling overrides optimistic UI.
        
        // 🔥 REAL-TIME MESSAGE LISTENER
        const handleMessageReceived = (msg) => {
            const normalizedMessage = normalizeWhisper(msg);
            // Check if message belongs to THIS conversation
            const isFromCurrentTarget = isSameId(normalizedMessage.sender, targetId);
            const isToCurrentTarget = isSameId(normalizedMessage.recipient, targetId);

            if (isFromCurrentTarget || isToCurrentTarget) {
                console.log("📨 [SOCKET] New whisper received in current chat");
                setMessages(prev => {
                    const existing = prev[targetId] || [];
                    if (existing.some(m => m._id === normalizedMessage._id)) return prev;
                    return {
                        ...prev,
                        [targetId]: [...existing, normalizedMessage]
                    };
                });
                // Auto-read if we are looking at it
                if (isFromCurrentTarget && !normalizedMessage.isLocked && !normalizedMessage.isRead) {
                    axios.patch(`/messages/${normalizedMessage._id}/read`).catch(() => { });
                    setTimeout(() => {
                        setMessages(prev => {
                            const msgs = prev[targetId] || [];
                            const remaining = msgs.filter(m => m._id === normalizedMessage._id ? m.isLocked : true);
                            return { ...prev, [targetId]: remaining };
                        });
                    }, 5000);
                }
            }
        };

        const handleMessageDeleted = (data) => {
            if (data.messageId) {
                setMessages(prev => {
                    const newMessages = { ...prev };
                    Object.keys(newMessages).forEach(chatId => {
                        newMessages[chatId] = newMessages[chatId].filter(m => m._id !== data.messageId);
                    });
                    return newMessages;
                });
            }
        };

        socket.on('message.received', handleMessageReceived);
        socket.on('message.deleted', handleMessageDeleted);

        socket.on('chat.cleared', ({ withUser }) => {
            if (activeChat?._id === withUser) {
                setMessages(prev => ({ ...prev, [withUser]: [] }));
                onClose(); // Close the chat window automatically
                // Play a delete sound effect
            }
        });

        return () => {
            socket.off('message.received', handleMessageReceived);
            socket.off('message.deleted', handleMessageDeleted);
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
            }, 150);
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
            setMessages(prev => {
                const existing = prev[targetId] || [];
                if (existing.some(m => m._id === res.data._id)) return prev;
                return {
                    ...prev,
                    [targetId]: [...existing, normalizeWhisper(res.data)]
                };
            });

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

        } catch (e) { alert(t('MIC_REQUIRED')); }
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
        const isFollowing = user?.following?.some(id => isSameId(id, u._id));
        
        // Hide private accounts entirely from search unless you follow them
        if (u.isPrivate && !isFollowing) {
            return false;
        }
        
        const isSearchEmpty = searchQuery.trim() === '';
        const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());

        if (isSearchEmpty) {
            return isFollowing;
        }
        return matchesSearch;
    });

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[2200] flex items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-5xl h-full sm:h-[85vh] bg-black sm:rounded-none  flex overflow-hidden shadow-none">
                <div className={`w-full sm:w-80 border-r border-white/10 flex-col bg-black/50 backdrop-blur-xl absolute inset-0 sm:relative sm:inset-auto z-10 sm:z-0 transition-none ${activeChat ? 'hidden sm:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-white/10 space-y-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black italic flex items-center gap-2 text-white">
                                    <Icons.MessageSquare className="w-8 h-8 text-[var(--gold-primary)]" />
                                    {t('WHISPERS')}
                                </h2>
                                <button type="button" onClick={() => { onClose(); }} className="sm:hidden p-2 text-gray-400"><Icons.X className="w-6 h-6" /></button>
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
                                className="w-full bg-white/5  text-white rounded-xl py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--gold-primary)]  placeholder:text-gray-600"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredUsers.length === 0 && <div className="p-4 text-center text-gray-500 text-xs">{t('ZERO_AGENTS')}</div>}
                        {filteredUsers.map(u => {
                            const online = isUserOnline(u, user);
                            return (
                                <button
                                    key={u._id}
                                    type="button"
                                    onClick={() => { setActiveChat(u); }}
                                    className="w-full p-4 flex items-center gap-3 cursor-pointer text-left touch-manipulation border-l-2 border-transparent bg-transparent appearance-none focus:outline-none transition-none active:bg-transparent"
                                >
                                    <div className="relative shrink-0"><div className="w-12 h-12 rounded-full bg-black overflow-hidden "><ProfileAvatar user={u} /></div><div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-black ${online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-gray-500'}`} /></div>
                                    <div className="min-w-0 flex-1"><div className="font-bold text-sm text-white flex items-center gap-2 truncate">{u?.username} <VerifiedBadge isFounder={u.role === 'Founder'} isUser={u.role !== 'Founder'} className="w-4 h-4 shrink-0" /></div><div className={`text-[10px] font-bold ${online ? 'text-green-500/90' : 'text-gray-500'} uppercase tracking-wider`}>{online ? t('ONLINE') : t('OFFLINE')}</div></div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* CHAT WINDOW */}
                <div className={`flex-1 flex-col bg-[#050505] chat-shell absolute inset-0 sm:relative sm:inset-auto z-20 sm:z-0 transition-none ${activeChat ? 'flex' : 'hidden sm:flex'}`}>
                    {activeChat ? (
                        <>
                            <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-black/80 backdrop-blur-xl shrink-0 z-10">
                                <button
                                    onClick={() => { setActiveChat(null); }}
                                    className="sm:hidden p-2 -ml-2 text-gray-400"
                                >
                                    <Icons.Back className="w-6 h-6" />
                                </button>
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-black border border-white/10"><ProfileAvatar user={activeChat} /></div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-sm text-white flex items-center gap-2 truncate">
                                        {activeChat?.username}
                                        <VerifiedBadge isFounder={activeChat?.role === 'Founder'} isUser={activeChat?.role !== 'Founder'} className="w-4 h-4 shrink-0" />
                                    </div>
                                    {(() => {
                                        const chatUser = allUsers.find(au => isSameId(au._id, activeChat._id)) || activeChat;
                                        const isChatUserOnline = isUserOnline(chatUser, user);
                                        return (
                                            <div className={`text-[10px] flex items-center gap-1.5 ${isChatUserOnline ? 'text-green-500/90 font-bold uppercase tracking-widest' : 'text-gray-500 uppercase tracking-tighter'}`}>
                                                <div className={`w-2 h-2 rounded-full ${isChatUserOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]' : 'bg-gray-600'}`} />
                                                {isChatUserOnline ? t('ONLINE') : t('OFFLINE')}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <button onClick={() => { onClose(); }} className="hidden sm:block p-2 text-gray-400"><Icons.X className="w-6 h-6" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                <AnimatePresence initial={false}>
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
                                            <motion.div 
                                                key={m._id || i}
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)', x: isOwn ? 20 : -20, transition: { duration: 0.4, ease: "easeInOut" } }}
                                                layout
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group/msg items-center gap-2`}
                                            >
                                                {isOwn && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleLockMessage(); }}
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] border shadow-none opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 z-10 shrink-0 ${m.isLocked ? 'bg-[var(--gold-primary)] text-black border-[var(--gold-primary)] opacity-100' : 'bg-black text-gray-400 border-white/20 hover:bg-white/10'}`}
                                                        title={m.isLocked ? t('UNLOCK_MESSAGE', 'Ξεκλείδωμα μηνύματος για αυτόματη διαγραφή') : t('LOCK_MESSAGE', 'Κλείδωμα μηνύματος για μόνιμη αποθήκευση')}
                                                    >
                                                        <Icons.Lock className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <div
                                                    onDoubleClick={toggleLockMessage}
                                                    className={`max-w-[85%] px-4 py-2.5 sm:px-5 sm:py-3 rounded-[22px] text-[15px] shadow-sm relative border cursor-pointer select-none overflow-hidden ${isOwn ? 'bg-gradient-to-br from-[#101010] to-[#1a1a1a] text-white border-white/10 rounded-br-sm' : 'bg-black text-white border-white/10 rounded-bl-sm'} ${m.isLocked ? 'ring-2 ring-[var(--gold-primary)]/80' : ''} hover:scale-[1.02] transition-transform duration-200`}
                                                >
                                                {/* Subtle iOS Glass Effect overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none rounded-[22px]" />
                                                {/* IMAGE ATTACHMENT */}
                                                {imageUrl && (
                                                    <div className="mb-2 relative z-10">
                                                        <img
                                                            src={resolveMediaUrl(imageUrl)}
                                                            alt=""
                                                            className="max-w-full max-h-[300px] rounded-[14px] object-cover cursor-pointer hover:opacity-90 transition-opacity "
                                                            onClick={() => window.open(resolveMediaUrl(imageUrl), '_blank')}
                                                            loading="lazy"
                                                            onError={(e) => e.target.style.display = 'none'} // Hide if broken
                                                        />
                                                    </div>
                                                )}
                                                {/* AUDIO ATTACHMENT */}
                                                {realAudio ? (
                                                    <div className="flex flex-col gap-2 relative z-10">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full animate-pulse bg-[var(--gold-primary)]" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gold-primary)]">{t('VOICE_NOTE')}</span>
                                                        </div>
                                                        <audio src={resolveMediaUrl(realAudio)} controls className="h-8 max-w-full custom-audio-mini" />
                                                        {m.text && <p className="font-medium leading-relaxed mt-1 text-white/95">{m.text}</p>}
                                                    </div>
                                                ) : (
                                                    m.text && !imageUrl ? <p className="leading-relaxed font-medium text-white/95 relative z-10">{m.text}</p> : (m.text && imageUrl ? <p className="mt-2 leading-relaxed font-medium text-white/95 relative z-10">{m.text}</p> : null)
                                                )}
                                                <div className="flex justify-end items-center gap-1.5 mt-1 opacity-70 relative z-10">
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <CyberDate date={m.createdAt} t={t} lang={lang} />
                                                    </div>
                                                    {isOwn && (
                                                        <Icons.Check className={`w-3.5 h-3.5 ${m.isRead ? 'text-[var(--gold-primary)]' : 'text-gray-500'}`} />
                                                    )}
                                                </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                                <div ref={scrollRef} />
                            </div>
                            {/* Hidden image input */}
                            <input type="file" ref={imageInputRef} hidden accept="image/*, video/*" onChange={handleImageSelect} />

                            {/* IMAGE PREVIEW STRIP */}
                            {imagePreview && (
                                <div className="absolute bottom-full left-0 right-0 p-3 bg-black/90 backdrop-blur-xl border-t border-white/10">
                                    <div className="relative inline-block">
                                        <img src={imagePreview} alt="" className="h-24 max-w-[200px] rounded-xl object-cover  shadow-xl" />
                                        <button onClick={clearImage} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg   ">
                                            <Icons.X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="p-3 pb-14 sm:pb-2 bg-[#050505] border-t border-white/10 flex flex-col gap-2 z-[100] relative">
                                {activeChat?.isPrivate && !user?.following?.some(id => isSameId(id, activeChat._id)) ? (
                                    <div className="w-full py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/5 rounded-2xl border border-white/5">
                                        {t('MUST_FOLLOW_PRIVATE_MESSAGE', 'YOU MUST FOLLOW THIS PRIVATE AGENT TO SEND MESSAGES')}
                                    </div>
                                ) : (
                                    <div className="flex-1 relative flex items-center bg-[#111]  rounded-[1.3rem] px-4 py-1 focus-within:border-[var(--gold-primary)]  group overflow-hidden">
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
                                )}
                                <div className="flex items-center gap-2">
                                    {activeChat?.isPrivate && !user?.following?.some(id => isSameId(id, activeChat._id)) ? null : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => { setIsPhonetic(!isPhonetic); }}
                                                className={`w-12 h-12 flex items-center justify-center rounded-2xl border shrink-0 ${isPhonetic ? 'bg-[var(--gold-primary)]/20 border-[var(--gold-primary)] text-[var(--gold-primary)]' : 'bg-white/5 border-white/10 text-gray-400'}`}
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
                                                className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-500'}`}
                                            >
                                                <Icons.Mic className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleSend()}
                                                disabled={!inputText.trim() && !imageFile}
                                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--gold-primary)] text-black disabled:opacity-20 disabled:scale-100 shrink-0 font-black hover:opacity-90"
                                            >
                                                <Icons.Send className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center px-4">
                            <div className="flex flex-col items-center">
                                <button className="mb-6 bg-transparent border-none p-0 group">
                                    <Icons.MessageSquare className="w-24 h-24 text-white group-hover:scale-105 duration-500" />
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
        gold: { on: 'bg-white border-white', dot: '' },
        blue: { on: 'bg-blue-600 border-blue-500', dot: '' },
    };
    const c = colors[color] || colors.gold;
    return (
        <div
            onClick={() => !saving && onToggle()}
            className={`relative w-12 h-7 rounded-full transition-all duration-300 cursor-pointer border shrink-0 ${active ? c.on : 'bg-black border-white/20'}`}
        >
            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full ${active ? 'bg-black' : 'bg-white'} shadow-sm transition-all duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
    );
};

const ShareSettingLabel = ({ t }) => (
    <div className="flex items-center gap-2 min-w-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white shrink-0">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span className="text-sm font-bold text-white truncate">{t('SHARE_PROFILE_BUTTON', 'Share Button')}</span>
    </div>
);

const SectionHeader = ({ color, label }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className={`w-1 h-4 rounded-full ${color}`} />
        <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.25em]">{label}</h3>
    </div>
);

const SettingRow = ({ label, desc, children, hoverColor = '' }) => (
    <div className={`flex items-center justify-between gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5 ${hoverColor} group`}>
        <div className="flex-1 min-w-0">
            {typeof label === 'string' ? <div className="text-sm font-bold text-white truncate">{label}</div> : label}
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
    const [showProfileShareButton, setShowProfileShareButton] = useState(user?.settings?.showProfileShareButton !== false);
    const [showDanger, setShowDanger] = useState(false);
    const [themeCategory, setThemeCategory] = useState('primary');
    const pendingShareToggleRef = useRef(null);
    const latestUserRef = useRef(user);
    const normalizeLanguageCode = (value) => String(value || '').toLowerCase().split('-')[0];
    const activeLanguage = normalizeLanguageCode(lang || i18n.resolvedLanguage || i18n.language || user?.settings?.language || localStorage.getItem('language') || 'en');
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
        latestUserRef.current = user;
    }, [user]);

    useEffect(() => {
        if (user && isOpen) {
            setIsPrivate(user.isPrivate || false);
            setIsFollowersOnly(user.isFollowersOnly || false);
            const nextShareValue = pendingShareToggleRef.current !== null
                ? pendingShareToggleRef.current
                : user?.settings?.showProfileShareButton !== false;
            setShowProfileShareButton(nextShareValue);
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
    }, [user, isOpen]);

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
            if (key === 'showProfileShareButton') payload = { settings: { showProfileShareButton: Boolean(val) } };
            if (key === 'showProfileShareButton') {
                const nextToggleValue = Boolean(val);
                const baseUser = latestUserRef.current || user || {};
                pendingShareToggleRef.current = nextToggleValue;
                setShowProfileShareButton(nextToggleValue);
                onUpdateUser?.({
                    ...baseUser,
                    settings: {
                        ...(baseUser?.settings || {}),
                        showProfileShareButton: nextToggleValue
                    }
                });
            }
            const res = await axios.put('/users/settings', payload);
            const baseUser = latestUserRef.current || user || {};
            const mergedResponse = {
                ...baseUser,
                ...res.data,
                settings: {
                    ...(baseUser?.settings || {}),
                    ...(res.data?.settings || {}),
                    ...(payload.settings || {})
                }
            };
            latestUserRef.current = mergedResponse;
            onUpdateUser(mergedResponse);
            if (key === 'isPrivate') setIsPrivate(val);
            if (key === 'isFollowersOnly') setIsFollowersOnly(val);
            if (key === 'showProfileShareButton') setShowProfileShareButton(Boolean(val));

        } catch (e) {
            console.error("Settings update failed", e);
            if (key === 'isPrivate') setIsPrivate(!val);
            if (key === 'isFollowersOnly') setIsFollowersOnly(!val);
            if (key === 'showProfileShareButton') setShowProfileShareButton(!Boolean(val));
        } finally {
            if (key === 'showProfileShareButton') pendingShareToggleRef.current = null;
            setSaving(false);
        }
    };

    const handleLanguageSelect = async (nextLanguage) => {
        const normalizedLanguage = normalizeLanguageCode(nextLanguage);
        if (!normalizedLanguage || normalizedLanguage === activeLanguage || saving) return;

        localStorage.setItem('language', normalizedLanguage);

        const baseUser = latestUserRef.current || user || {};
        if (baseUser?._id) {
            const optimisticUser = {
                ...baseUser,
                settings: {
                    ...(baseUser?.settings || {}),
                    language: normalizedLanguage,
                },
            };
            latestUserRef.current = optimisticUser;
            onUpdateUser?.(optimisticUser);
        }

        if (normalizeLanguageCode(i18n.resolvedLanguage || i18n.language) !== normalizedLanguage) {
            await i18n.changeLanguage(normalizedLanguage);
        }

        await handleSave('language', normalizedLanguage);
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
                className="relative w-[95%] sm:w-full max-w-[420px] max-h-[90vh]  rounded-[2rem] overflow-hidden flex flex-col backdrop-blur-3xl will-change-transform"
                style={{ backgroundColor: 'var(--glass-bg)' }}
            >


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
                            <SettingRow label={<ShareSettingLabel t={t} />} desc={t('SHARE_PROFILE_DESC', 'Turn this off if you want to hide the share button on your profile.')} hoverColor="">
                                <Toggle
                                    active={showProfileShareButton}
                                    onToggle={() => {
                                        const v = !showProfileShareButton;
                                        setShowProfileShareButton(v);
                                        handleSave('showProfileShareButton', v);
                                    }}
                                    saving={saving}
                                    color="blue"
                                />
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
                                        }}
                                        onPointerUp={() => handleSave('zoom', zoomLevel)}
                                        onKeyUp={() => handleSave('zoom', zoomLevel)}
                                        className="w-full accent-[var(--gold-primary)]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="text-[11px] font-black text-gray-300 uppercase tracking-widest pl-1">
                                        {t('THEME')}
                                    </div>
                                    <div className="theme-swatch-grid">
                                        {THEME_PALETTE.map(({ value, labelKey }) => {
                                            const active = (user?.settings?.theme || localStorage.getItem('themeColor') || '#cc0000') === value;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => {
                                                        applyTheme(value);
                                                        handleSave('theme', value);
                                                    }}
                                                    className="theme-swatch-btn flex flex-col items-center gap-1.5"
                                                >
                                                    <span
                                                        className={`theme-swatch-dot block w-10 h-10 rounded-full border-2 transition-all ${active ? 'border-white ring-2 ring-white/90 ring-offset-2 ring-offset-black' : 'border-white/25 opacity-85 hover:opacity-100'}`}
                                                        style={{ backgroundColor: value }}
                                                    />
                                                    <span className={`text-[9px] font-bold uppercase tracking-wide text-center leading-tight max-w-[72px] ${active ? 'text-white' : 'text-gray-500'}`}>
                                                        {t(labelKey) || t('COLOR_WHITE')}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── ΓΝΩΣΗ (Language) ── */}
                    <section>
                        <SectionHeader color="bg-blue-500" label={t('COGNITION')} />
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'en', flag: '🇺🇸', label: 'EN', name: 'English' }, { id: 'el', flag: '🇬🇷', label: 'EL', name: 'Ελληνικά' },
                                { id: 'de', flag: '🇩🇪', label: 'DE', name: 'Deutsch' }, { id: 'ru', flag: '🇷🇺', label: 'RU', name: 'Русский' },
                                { id: 'cy', flag: '🇨🇾', label: 'CY', name: 'Κυπριακά' }, { id: 'es', flag: '🇪🇸', label: 'ES', name: 'Español' },
                                { id: 'tr', flag: '🇹🇷', label: 'TR', name: 'Türkçe' }, { id: 'fr', flag: '🇫🇷', label: 'FR', name: 'Français' }
                            ].map(l => (
                                <button key={l.id} type="button" disabled={saving || activeLanguage === l.id} onClick={() => { void handleLanguageSelect(l.id); }}
                                    className={`py-3 rounded-[18px] border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${activeLanguage === l.id ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/10 shadow-[0_0_15px_rgba(212,175,55,0.2)] scale-[1.02]' : 'border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10'} ${saving ? 'pointer-events-none' : ''}`}
                                >
                                    <div className={`text-xl transition-transform duration-300 ${activeLanguage === l.id ? 'scale-110 drop-shadow-md' : 'opacity-80 grayscale-[0.2]'}`}>{l.flag}</div>
                                    <div className={`text-[9px] font-black uppercase tracking-widest ${activeLanguage === l.id ? 'text-[var(--gold-primary)]' : 'text-gray-500'}`}>{l.label}</div>
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
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
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
                        onClick={() => { onClose(); onViewProfile(user); }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="w-[48px] h-[48px] rounded-none overflow-hidden shrink-0 ">
                                <ProfileAvatar user={user} className="w-full h-full object-cover" />
                            </div>
                        </div>

                        <div className="flex flex-col mt-1">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-[17px] text-white leading-tight break-words">{user?.username}</span>
                                <VerifiedBadge isFounder={user?.role === 'Founder'} isUser={user?.role !== 'Founder'} className="w-4 h-4 shrink-0" />
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
                            { id: 'chat', icon: Icons.MessageSquare, label: t('WHISPERS') },
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
            <div className="relative w-full max-w-2xl max-h-[80vh] bg-[#0a0a0a]  rounded-[2rem] overflow-hidden flex flex-col shadow-2xl animate-zoom-in">
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
    isOpen, onClose, profileUser, currentUser, allUsers, preloadedPosts, posts, onFollow, onUpdateUser, onViewProfile, onOpenChat, onOpenDetail, onOpenCreate, imgKey, setImgKey, fetchSpecificUser, lastDeletedPostId, followLoading, addToast, onDeletePost, onLike, onDislike, onRepost, onComment, onEditComment, onDeleteComment, onEditPost, onShare, onShareProfile, onHashtagClick, loadingActions, selectedPost }) => {
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

    // 🔥 SYNC PROFILE DATA: Keep userData perfectly aligned with global database changes
    useEffect(() => {
        if (profileUser) {
            const latest = (allUsers || []).find(u => isSameId(u._id, profileUser._id)) || profileUser;
            setUserData(latest);
        }
    }, [profileUser, allUsers]);
    const [clickLock, setClickLock] = useState(false);
    const lastOpenedAt = useRef(Date.now());
    const [bio, setBio] = useState(profileUser?.bio || "");
    const [editUsername, setEditUsername] = useState(profileUser?.username || "");
    const [profileDescriptor, setProfileDescriptor] = useState(normalizeProfileDescriptor(profileUser?.profileDescriptor || ""));
    const [founderAffiliation, setFounderAffiliation] = useState(getFounderAffiliation(profileUser));
    const [activeTab, setActiveTab] = useState('ALL');
    const [userSpecificPosts, setUserSpecificPosts] = useState(preloadedPosts || []);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [expandedDates, setExpandedDates] = useState({});
    const fileRef = useRef(null);
    const coverFileRef = useRef(null);
    const [coverUploading, setCoverUploading] = useState(false);
    const [profileUploading, setProfileUploading] = useState(false);
    const [isProfileSaving, setIsProfileSaving] = useState(false);

    const displayUser = React.useMemo(() => {
        if (!profileUser) return null;
        const profileUserId = safeId(profileUser);
        const currentUserId = safeId(currentUser);
        const isMe = isSameId(profileUserId, currentUserId);

        // 1. Determine the "base" data source (detailed info like bio)
        // Prefer local optimistic data first so profile edits are visible instantly,
        // even before the parent/currentUser poll catches up.
        const base = isMe ? (userData || currentUser || profileUser) : (userData || profileUser);

        // 2. Get "live" status (online status, latest follower counts) from global users list
        const live = allUsers.find(u => isSameId(u._id, base?._id)) || {};

        // 3. Merge: Prioritize 'base' for identity/bio, but use 'live' for real-time status
        // We merge live first, then base, so base fields (like bio/username) always win
        const merged = {
            ...live,
            ...base,
            username: base?.username || live?.username || profileUser?.username || 'Unknown Agent',
            // Ensure some live fields from the global sync win if they are present
            lastSeen: live.lastSeen || base.lastSeen,
            followers: live.followers || base.followers || [],
            following: live.following || base.following || [],
            followRequests: live.followRequests || base.followRequests || [],
            profileDescriptor: normalizeProfileDescriptor(base?.profileDescriptor ?? live?.profileDescriptor ?? profileUser?.profileDescriptor ?? ''),
            founderAffiliation: sanitizeAffiliation(base?.founderAffiliation ?? live?.founderAffiliation ?? profileUser?.founderAffiliation ?? getFounderAffiliation(base) ?? getFounderAffiliation(live) ?? getFounderAffiliation(profileUser)),
            settings: {
                ...(live?.settings || {}),
                ...(profileUser?.settings || {}),
                ...(base?.settings || {})
            }
        };

        return merged;
    }, [profileUser, currentUser, userData, allUsers]);

    const isMe = String(displayUser?._id || '') === String(currentUser?._id || '');
    const isFounderProfile = displayUser?.role === 'Founder';
    const canShowProfileShareButton = (isMe
        ? currentUser?.settings?.showProfileShareButton
        : displayUser?.settings?.showProfileShareButton) !== false;

    const toggleDate = (dateKey) => {
        // Disabled clicking - folders are always open
    };

    useEffect(() => {
        if (displayUser && !isEditing) {
            setBio(displayUser.bio || "");
            setEditUsername(displayUser.username || "");
            setProfileDescriptor(normalizeProfileDescriptor(displayUser.profileDescriptor || ""));
            setFounderAffiliation(getFounderAffiliation(displayUser));
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
    const selectedProfileDescriptor = PROFILE_DESCRIPTOR_MAP[normalizeProfileDescriptor(displayUser?.profileDescriptor || '')];
    const SelectedProfileDescriptorIcon = selectedProfileDescriptor?.Icon;
    const displayFounderAffiliation = getFounderAffiliation(displayUser);

    return (

        <div className="fixed inset-0 z-[2100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={onClose} />
            <motion.div initial={{ y: '100dvh' }} animate={{ y: 0 }} exit={{ y: '100dvh' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`relative w-full max-w-lg h-[100dvh] sm:h-[85vh] sm:rounded-none overflow-hidden flex flex-col bg-black`}>

                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>

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

                <div className={`flex-none p-4 flex items-center justify-between border-b border-white/10 z-10 relative ${displayUser?.coverPic ? 'bg-transparent backdrop-blur-md' : 'bg-black/60 backdrop-blur-3xl'}`}>
                    <button onClick={() => {
                        if (activeList) setActiveList(null);
                        else if (isEditing) setIsEditing(false);
                        else onClose();
                    }} className="p-2 -ml-2 rounded-full   "><Icons.Back className="w-6 h-6 text-white" /></button>
                    <div className="font-bold text-white text-sm uppercase tracking-widest leading-none">{activeList ? (activeList === 'followers' ? t('FOLLOWERS') : t('FOLLOWING')) : (isEditing ? t('EDIT_PROFILE') : displayUser?.username)}</div>
                    {!activeList && !isEditing && canShowProfileShareButton ? (
                        <button
                            onClick={async () => {
                                if (onShareProfile) onShareProfile(displayUser);
                            }}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center text-white"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                        </button>
                    ) : (
                        <div className="w-10" />
                    )}
                </div>

                <div className={`flex-1 overflow-y-auto custom-scrollbar relative overscroll-y-contain pb-10 z-10 ${displayUser?.coverPic ? 'bg-transparent' : 'bg-transparent'}`}>
                    {activeList ? (
                        <div className="p-4 space-y-4">
                            {getListUsers().length === 0 && !clickLock && <div className="p-10 text-center text-gray-500 font-bold uppercase tracking-widest text-xs opacity-50">{t('NO_AGENTS_FOUND')}</div>}
                            {getListUsers().map(u => (
                                <div key={u._id} onClick={() => {
                                    onViewProfile(u);
                                    setActiveList(null);
                                }} className="flex items-center gap-3 p-3  rounded-none cursor-pointer   border border-transparent">
                                      <div className="w-11 h-11 rounded-none bg-black overflow-hidden ">
                                          <ProfileAvatar user={u} />
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
                            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-none bg-gray-800 overflow-hidden border border-[#0a0a0a] relative shadow-none">
                                {profileUploading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <div className="w-8 h-8 text-white/50">
                                            <Icons.Loader />
                                        </div>
                                    </div>
                                ) : (
                                    <ProfileAvatar user={displayUser} size="large" key={imgKey} />
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
                                    } catch (e) { 
                                        console.error("❌ Profile picture upload error:", e);
                                        alert("Failed to update profile picture."); 
                                    }
                                    finally { 
                                        setProfileUploading(false); 
                                        e.target.value = ''; 
                                    }
                                }
                            }} />

                            <div className="flex gap-2 w-full">
                                <button onClick={e => { e.preventDefault(); !profileUploading && fileRef.current.click(); }} disabled={profileUploading}
                                    className="flex-1 py-4 bg-[#121212]  rounded-none text-[11px] text-gray-300 font-black uppercase tracking-[0.2em] cursor-pointer duration-300 flex items-center justify-center gap-3 disabled:opacity-50 group active:scale-95 hover:bg-white/5">
                                    {profileUploading ? (
                                        <div className="w-4 h-4 text-white/50">
                                            <Icons.Loader />
                                        </div>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" class="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                                            <circle cx="12" cy="13" r="3"></circle>
                                        </svg>
                                    )}
                                    {profileUploading ? (t('UPLOADING') || 'UPLOADING...') : (t('CHANGE_PROFILE_PIC') || 'CHANGE PROFILE PICTURE')}
                                </button>
                            </div>

                            <div className="flex gap-2 w-full mt-4">
                                <button onClick={e => { e.preventDefault(); !coverUploading && coverFileRef.current.click(); }} disabled={coverUploading}
                                    className="flex-1 py-4 bg-[#121212]  rounded-none text-[11px] text-gray-300 font-black uppercase tracking-[0.2em] cursor-pointer duration-300 flex items-center justify-center gap-3 disabled:opacity-50 group active:scale-95 hover:bg-white/5">
                                    {coverUploading ? (
                                        <div className="w-4 h-4 text-white/50">
                                            <Icons.Loader />
                                        </div>
                                    ) : <Icons.Image className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />}
                                    {coverUploading ? (t('UPLOADING') || 'UPLOADING...') : (t('CHANGE_COVER') || 'CHANGE BACKGROUND')}
                                </button>
                                {displayUser?.coverPic && (
                                    <button onClick={async (e) => {
                                        e.preventDefault();
                                        setCoverUploading(true);
                                        
                                        // 🔥 SAFE OPTIMISTIC UPDATE: Only update local display, NO onUpdateUser!
                                        if (currentUser && displayUser && isSameId(currentUser._id, displayUser._id)) {
                                            setUserData(prev => ({ ...prev, coverPic: null }));
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
                                        className="w-[52px] h-[52px] shrink-0 bg-[#121212]    rounded-none text-gray-400  flex items-center justify-center  duration-300 disabled:opacity-50 hover:bg-red-500/20 hover:text-red-400">
                                        <Icons.X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <input type="file" ref={coverFileRef} hidden accept="image/*, video/*" onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    // Ο Founder έχει όριο 500MB, οι άλλοι έχουν 90MB
                                    const maxUploadSize = displayUser?.role === 'Founder' ? 500 * 1024 * 1024 : 90 * 1024 * 1024;
                                    
                                    if (file.size > maxUploadSize) { 
                                        alert(displayUser?.role === 'Founder' ? "File too large. Max 500MB for Founders" : "File too large. Max 90MB"); 
                                        return e.target.value = ''; 
                                    }
                                    
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
                                <input type="text" value={editUsername} maxLength={19} onChange={e => setEditUsername(e.target.value.substring(0, 19))} className="w-full bg-white/5  rounded-2xl p-4 text-white text-sm font-bold focus:border-[var(--gold-primary)] outline-none " placeholder={t('USERNAME_PH')} />
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">{t('DESCRIPTION')}</label>
                                <div className="relative">
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        maxLength={500}
                                        className="w-full bg-white/5  rounded-2xl p-4 text-white text-sm focus:border-[var(--gold-primary)] outline-none resize-none h-32 "
                                        placeholder={t('BIO_PH')}
                                    />
                                    <div className="absolute bottom-3 right-3 text-[10px] font-black text-white/20 uppercase tracking-widest">{bio?.length || 0} / 500</div>
                                </div>
                            </div>

                            <div className="space-y-3 text-left">
                                <div className="flex items-center justify-between gap-3 pl-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('WHAT_BEST_DESCRIBES_YOU', 'WHAT BEST DESCRIBES YOU?')}</label>
                                    {profileDescriptor && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setProfileDescriptor('');
                                            }}
                                            className="text-[10px] font-black uppercase tracking-widest text-white/45 hover:text-white cursor-pointer touch-manipulation p-2 -mr-2"
                                        >
                                            {t('CLEAR', 'Clear')}
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2">
                                    {PROFILE_DESCRIPTOR_OPTIONS.map(option => {
                                        const isSelected = profileDescriptor === option.value;
                                        const OptionIcon = option.Icon;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setProfileDescriptor(option.value);
                                                }}
                                                className={`text-left rounded-2xl border px-3 py-3 transition-all duration-200 cursor-pointer touch-manipulation relative z-10 ${isSelected ? 'border-white bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.08)]' : 'border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]'}`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${isSelected ? 'border-black/10 bg-black text-white' : option.accentClass}`}>
                                                        <OptionIcon className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-black text-[12px] sm:text-[13px] uppercase tracking-wide truncate">{t(`DESC_${option.value.toUpperCase()}`, option.label)}</div>
                                                        <div className={`text-[10px] sm:text-[11px] leading-tight ${isSelected ? 'text-black/65' : 'text-gray-400'} whitespace-normal line-clamp-2`}>{t(`DESC_${option.value.toUpperCase()}_SUB`, option.description)}</div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {isFounderProfile && (
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <label className="text-[10px] font-black text-[var(--gold-primary)] uppercase tracking-widest pl-1 mb-2 block">FOUNDER AFFILIATION</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black">@</div>
                                            <input 
                                                type="text" 
                                                value={founderAffiliation}
                                                onChange={(e) => {
                                                    setFounderAffiliation(sanitizeAffiliation(e.target.value));
                                                }}
                                                placeholder="affiliated_username"
                                                className="w-full bg-black/40  rounded-2xl py-3 pl-8 pr-4 text-white text-sm font-bold focus:border-[var(--gold-primary)] outline-none"
                                            />
                                        </div>
                                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-2 pl-1">Links to another profile (e.g., your company).</div>
                                    </div>
                                )}
                            </div>

                            <button type="button" disabled={isProfileSaving} onClick={async () => {
                                if (isProfileSaving) return;
                                const previousUserSnapshot = displayUser ? {
                                    ...displayUser,
                                    settings: {
                                        ...(displayUser?.settings || {})
                                    }
                                } : null;
                                try {
                                    setIsProfileSaving(true);
                                    const trimmedBio = bio?.trim() || "";
                                    const trimmedUsername = editUsername?.trim() || "";
                                    const nextProfileDescriptor = normalizeProfileDescriptor(profileDescriptor || '');
                                    const nextFounderAffiliation = sanitizeAffiliation(founderAffiliation);
                                    const optimisticUser = {
                                        ...displayUser,
                                        bio: trimmedBio,
                                        username: trimmedUsername || displayUser?.username,
                                        profileDescriptor: nextProfileDescriptor,
                                        founderAffiliation: nextFounderAffiliation
                                    };
                                    setUserData(prev => ({ ...(prev || {}), ...optimisticUser }));
                                    if (isSameId(displayUser?._id, currentUser?._id)) {
                                        onUpdateUser?.(optimisticUser);
                                    }
                                    
                                    // Άμεσο κλείσιμο (optimistic navigation)
                                    setActiveList(null);
                                    setIsEditing(false);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    
                                    const res = await axios.put(`/users/${displayUser?._id}`, {
                                        bio: trimmedBio,
                                        username: trimmedUsername,
                                        profileDescriptor: nextProfileDescriptor,
                                        founderAffiliation: nextFounderAffiliation
                                    });
                                    if (res.data) {
                                        const mergedUpdatedUser = {
                                            ...optimisticUser,
                                            ...res.data,
                                            settings: {
                                                ...(optimisticUser?.settings || {}),
                                                ...(res.data?.settings || {})
                                            }
                                        };
                                        if (isSameId(displayUser?._id, currentUser?._id)) {
                                            localStorage.setItem('user', JSON.stringify(mergedUpdatedUser));
                                        }
                                        setUserData(prev => ({ ...(prev || {}), ...mergedUpdatedUser }));
                                        if (onUpdateUser) onUpdateUser(mergedUpdatedUser);
                                        fetchUsers(displayUser?._id).catch(() => { });
                                        if (addToast) addToast(t('PROFILE_UPDATED') || "Profile updated!", 'success');
                                    }
                                } catch (e) {
                                    console.error(e);
                                    if (displayUser) {
                                        setUserData(prev => ({ ...(prev || {}), ...(previousUserSnapshot || {}) }));
                                        if (isSameId(displayUser?._id, currentUser?._id) && previousUserSnapshot) {
                                            onUpdateUser?.(previousUserSnapshot);
                                        }
                                    }
                                    if (addToast) addToast(e.response?.data?.message || e.response?.data || "Update failed.", 'error');
                                } finally {
                                    setIsProfileSaving(false);
                                }
                            }} className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-none hover:bg-gray-200 transition-colors duration-300">
                                {isProfileSaving ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 text-black/50">
                                            <Icons.Loader />
                                        </div>
                                        {t('SAVING') || 'SAVING...'}
                                    </div>
                                ) : (t('SAVE') || 'SAVE')}
                            </button>
                        </div>
                    ) : (
                        <div className={`p-4 sm:p-6 pb-20 flex flex-col items-center ${displayUser?.coverPic ? 'pt-14 sm:pt-20 mt-0' : 'mt-2 sm:mt-4'}`}>
                            <div className="flex items-center justify-center mb-3 sm:mb-4 w-full">
                                <div className={`relative z-20 ${displayUser?.coverPic ? '-mt-14 sm:-mt-20' : ''}`}>
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-none bg-black overflow-hidden shadow-none shrink-0 relative group">
                                        <ProfileAvatar user={displayUser} size="large" key={imgKey} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6 px-2 w-full flex flex-col items-center text-center">
                                <div className="flex flex-col mb-4 items-center">
                                    <div className="flex items-center justify-center gap-2 leading-none uppercase tracking-[0.1em] flex-wrap">
                                        <span className="truncate font-black text-white text-xl sm:text-2xl">{displayUser?.username || "Unknown Agent"}</span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {isFounderProfile ? (
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
                                            ) : (
                                                <svg
                                                    aria-label="Verified User"
                                                    viewBox="0 0 22 22"
                                                    className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"
                                                    style={{ overflow: 'visible' }}
                                                >
                                                    <path
                                                        fill="#1D9BF0"
                                                        stroke="none"
                                                        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    {selectedProfileDescriptor && SelectedProfileDescriptorIcon && (
                                        <div className="mt-3 flex justify-center">
                                            <div className={`inline-flex items-center gap-2 rounded-none border px-3 py-1.5 ${selectedProfileDescriptor.accentClass}`}>
                                                <SelectedProfileDescriptorIcon className="w-3.5 h-3.5 shrink-0" />
                                                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">{t(`DESC_${displayUser.profileDescriptor?.toUpperCase()}`, selectedProfileDescriptor.label)}</span>
                                            </div>
                                        </div>
                                    )}
                                    {displayFounderAffiliation && (
                                        <div className="mt-2">
                                            <FounderAffiliationBadge username={displayFounderAffiliation} className="max-w-full" />
                                        </div>
                                    )}
                                    <div className="text-gray-400 text-sm font-bold mt-1 flex items-center gap-2">
                                        @{displayUser?.username?.toLowerCase().replace(/\s+/g, '')}
                                        <div className={`w-2 h-2 rounded-full border border-black ${isUserOnline(displayUser, currentUser) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'}`} title={isUserOnline(displayUser, currentUser) ? t('ONLINE') : t('OFFLINE')} />
                                    </div>
                                </div>

                                <div className="text-[14px] sm:text-[15px] text-white/90 leading-relaxed max-w-[90%] whitespace-pre-wrap font-medium mb-5 break-words">
                                    {parseText(displayUser?.bio && displayUser.bio.trim() !== "" ? displayUser.bio : t("DEFAULT_BIO"))}
                                </div>

                                {/* STATS GRID — 4 equal columns, no scroll */}
                                <div className="grid grid-cols-4 gap-2 w-full">

                                    {/* POSTS */}
                                    <div className="flex flex-col items-center justify-center gap-1 py-3 bg-black/40 backdrop-blur-md  rounded-2xl shadow-lg">
                                        <span className="font-black text-white text-base leading-none tabular-nums">{(userPosts || []).length}</span>
                                        <Icons.Grid className="w-3.5 h-3.5 text-gray-400" />
                                    </div>

                                    {/* REPOSTS */}
                                    <div className="flex flex-col items-center justify-center gap-1 py-3 bg-black/40 backdrop-blur-md  rounded-2xl shadow-lg">
                                        <span className="font-black text-white text-base leading-none tabular-nums">
                                            {(() => {
                                                const uid = safeId(displayUser);
                                                return (userSpecificPosts || []).filter(p =>
                                                    Array.isArray(p.reposts) && p.reposts.some(id => isSameId(id, uid)) &&
                                                    !isSameId(p.author, uid)
                                                ).length;
                                            })()}
                                        </span>
                                        <Icons.RefreshCcw className="w-3.5 h-3.5 text-gray-400" />
                                    </div>

                                    {/* FOLLOWERS */}
                                    <div onClick={(e) => {
                                        e.preventDefault(); e.stopPropagation(); setClickLock(true); lastOpenedAt.current = Date.now(); setActiveList('followers');
                                    }} className="flex flex-col items-center justify-center gap-0.5 py-3.5 bg-black/40 backdrop-blur-md  rounded-2xl cursor-pointer hover:bg-white/5 transition-all shadow-lg touch-manipulation select-none relative z-10">
                                        <span className="font-black text-white text-base leading-none tabular-nums">
                                            {[...new Set((displayUser?.followers || []).filter(id => (allUsers || []).some(u => isSameId(u._id, id))))].length}
                                        </span>
                                        <span className="text-gray-400 text-[7.5px] font-black uppercase tracking-wider mt-0.5 truncate w-full text-center px-1">
                                            {[...new Set((displayUser?.followers || []).filter(id => (allUsers || []).some(u => isSameId(u._id, id))))].length === 1 ? (t('FOLLOWER') || 'FOLLOWER') : t('FOLLOWERS')}
                                        </span>
                                    </div>

                                    {/* FOLLOWING */}
                                    <div onClick={(e) => {
                                        e.preventDefault(); e.stopPropagation(); setClickLock(true); lastOpenedAt.current = Date.now(); setActiveList('following');
                                    }} className="flex flex-col items-center justify-center gap-0.5 py-3.5 bg-black/40 backdrop-blur-md  rounded-2xl cursor-pointer hover:bg-white/5 transition-all shadow-lg touch-manipulation select-none relative z-10">
                                        <span className="font-black text-white text-base leading-none tabular-nums">
                                            {[...new Set((displayUser?.following || []).filter(id => (allUsers || []).some(u => isSameId(u._id, id))))].length}
                                        </span>
                                        <span className="text-gray-400 text-[7.5px] font-black uppercase tracking-wider mt-0.5 truncate w-full text-center px-1">{t('FOLLOWING')}</span>
                                    </div>

                                </div>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="px-2 mb-6 space-y-3 mt-2">
                                <div className="flex items-center gap-3">
                                    {isMe ? (
                                        <button onClick={() => setIsEditing(true)} className="flex-1 relative overflow-hidden py-4 bg-black/70 backdrop-blur-xl rounded-none border border-white/15 text-white text-[11px] sm:text-[12px] font-black uppercase tracking-[0.22em] transition-colors hover:bg-white/5 hover:border-white/30">
                                            <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/20" />
                                            <span className="relative z-10 flex items-center justify-center gap-2.5">
                                                <Icons.Settings className="w-4 h-4" />
                                                {t('EDIT_PROFILE')}
                                            </span>
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                disabled={followLoading[displayUser?._id]}
                                                onClick={() => onFollow(displayUser)}
                                                className={`flex-1 relative overflow-hidden py-4 rounded-none text-[11px] sm:text-[12px] font-black uppercase tracking-[0.22em] border transition-colors ${isFollowing ? 'bg-black/70 backdrop-blur-xl border-white/15 text-white hover:bg-red-500/10 hover:border-red-500/40' : 'bg-white border-white text-black hover:bg-neutral-200'}`}
                                            >
                                                <div className={`pointer-events-none absolute inset-x-3 top-0 h-px ${isFollowing ? 'bg-white/20' : 'bg-black/10'}`} />
                                                <span className="relative z-10 flex items-center justify-center gap-2.5">
                                                    {isFollowing ? <Icons.UserMinus className="w-4 h-4" /> : (hasRequested ? <Icons.Clock className="w-4 h-4" /> : <Icons.UserPlus className="w-4 h-4" />)}
                                                    {isFollowing ? t('UNFOLLOW') : (hasRequested ? t('REQUESTED') : t('FOLLOW'))}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    setTimeout(() => onOpenChat(displayUser), 50);
                                                }}
                                                title={t('DM_SAFE_DESC')}
                                                className="flex items-center justify-center gap-2.5 px-5 py-4 bg-black/70 backdrop-blur-xl border border-white/15 rounded-none shrink-0 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-white hover:bg-white/5 hover:border-white/30 transition-colors relative overflow-hidden"
                                            >
                                                <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/20" />
                                                <div className="relative z-10 flex items-center justify-center">
                                                    <Icons.MessageSquare className="w-5 h-5 text-white" />
                                                </div>
                                                <span className="relative z-10">{t('WHISPERS')}</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                                {!isMe && currentUser?.role === 'Founder' && (
                                    <button onClick={() => window.confirm(t('CONFIRM_BAN') || 'Confirm ban?') && axios.post(`/users/${displayUser?._id}/ban`, { days: 3 })} className="w-full px-6 py-3.5 bg-red-950/20 border border-red-500/20 rounded-none hover:bg-red-900/40 hover:border-red-500/50 transition-colors text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                        <Icons.Shield className="w-4 h-4" />
                                        {t('BAN_3_DAYS') || 'BAN 3 ΗΜΕΡΕΣ'}
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-4 gap-1 p-1 bg-transparent border-t border-white/10 mb-5">
                                {['ALL', 'POSTS', 'PHOTOS', 'VIDEO'].map(tab => {
                                    const renderIcon = (isActive) => {
                                        const iconClass = `w-5 h-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-500'}`;
                                        if (tab === 'ALL') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconClass}><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>;
                                        if (tab === 'POSTS') return <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className={iconClass}><path d="M 20 9 L 20 16 C 20 18.209 18.209 20 16 20 L 8 20 C 5.791 20 4 18.209 4 16 L 4 8 C 4 5.791 5.791 4 8 4 L 15 4" strokeWidth="1.5" /><line strokeLinecap="round" x1="10" y1="14" x2="18.5" y2="5.5" strokeWidth="2.25" /><line strokeLinecap="round" x1="20.5" y1="3.5" x2="21" y2="3" strokeWidth="2.25" /></svg>;
                                        if (tab === 'PHOTOS') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconClass}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
                                        if (tab === 'VIDEO') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${iconClass} fill-current`}><polygon points="5 3 19 12 5 21 5 3" /></svg>;
                                        return null;
                                    };
                                    const isActive = activeTab === tab;
                                    const tabLabel = t('TAB_' + tab, tab);
                                    const isLongTabLabel = tabLabel.length >= 10;
                                    return (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setActiveTab(tab)}
                                            style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none', touchAction: 'manipulation' }}
                                            className={`min-w-0 min-h-[66px] sm:min-h-[70px] px-1.5 sm:px-2.5 py-2.5 font-black uppercase flex flex-col items-center justify-center gap-2 transition-all duration-200 relative overflow-hidden select-none appearance-none focus:outline-none active:scale-[0.99] cursor-pointer bg-transparent border-t-2 ${isActive
                                                ? 'border-white text-white'
                                                : 'border-transparent text-gray-500 hover:text-white/80'
                                                }`}
                                        >
                                            {renderIcon(isActive)}
                                            <span
                                                className={`max-w-full text-center leading-none transition-colors duration-200 whitespace-nowrap ${isLongTabLabel
                                                    ? 'text-[7.5px] sm:text-[9px] md:text-[10px] tracking-[0.02em]'
                                                    : 'text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.06em]'
                                                    } ${isActive ? 'text-white font-black' : 'text-gray-500 font-bold'}`}
                                            >
                                                {tabLabel}
                                            </span>
                                        </button>
                                    );
                                })}
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
                                    <button onClick={onClose} className="mt-2 px-6 py-2 rounded-xl  text-[10px] font-black uppercase tracking-[0.2em] text-gray-400    ">
                                        {t('CLOSE', 'ΚΛΕΙΣΙΜΟ')}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {(isMe || userStories.length > 0) && (
                                        <div className="mb-6">
                                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">{t('HIGHLIGHTS')}</h3>
                                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                                                {isMe && (
                                                    <div onClick={() => onOpenCreate?.()} className="shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
                                                        <div className="w-[70px] h-[70px] rounded-full p-[2px] bg-gradient-to-tr from-white/5 to-white/20 shadow-lg relative group">
                                                            <div className="w-full h-full rounded-full overflow-hidden bg-[#050505] flex items-center justify-center relative">
                                                                <ProfileAvatar user={currentUser} className="opacity-40" />
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform shadow-sm">
                                                                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                                                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest mt-1">{t('ADD_STORY')}</span>
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
                                                            <div className="w-[70px] h-[70px] rounded-full p-[2px] bg-gradient-to-tr from-[var(--gold-primary)] via-white to-white/40 shadow-lg relative transition-transform duration-300 group-hover:scale-105 transform-gpu cursor-pointer">
                                                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-black bg-black relative">
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
                                                                            {/* Removed redundant play icon */}
                                                                        </div>
                                                                    ) : (
                                                                        <img src={resolveMediaUrl(s.thumbnailUrl || s.image)} className="w-full h-full object-cover" />
                                                                    )
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center p-1">
                                                                        <span className="text-[6px] text-gray-300 font-medium text-center leading-tight line-clamp-3">
                                                                            {s.desc}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                </div>
                                                                {(isNativeVideo || isYT) && (
                                                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-white text-black rounded-none flex items-center justify-center border border-black shadow-md z-10">
                                                                        <Icons.Play className="w-2 h-2 fill-black pl-[0.5px]" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-1 shrink-0">
                                                                <CyberDate date={s.createdAt} t={t} lang={lang} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6 pb-20">
                                        {loadingPosts ? (
                                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                                <Icons.Loader className="w-12 h-12 text-[var(--gold-primary)]" />
                                                <div className="text-white font-black uppercase tracking-[0.2em] text-[10px]">{t('DECRYPTING_FEED')}</div>
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
                                                        <div className="flex items-center justify-center mb-10 mt-8 relative">
                                                            <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                            <div className="flex items-center gap-2 mt-1 z-10 relative">
                                                                <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{dateKey}</span>
                                                            </div>
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

        // Ο Founder έχει όριο 500MB, οι άλλοι 90MB (όπως και στο profile cover)
        const maxUploadSize = user?.role === 'Founder' ? 500 * 1024 * 1024 : 90 * 1024 * 1024;
        
        if (file.size > maxUploadSize) {
            alert(user?.role === 'Founder' ? "File too large. Max 500MB for Founders" : "File too large. Max 90MB");
            e.target.value = '';
            return;
        }

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
        <div className="fixed inset-0 z-[3200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-sm glass-panel bg-black/30 backdrop-blur-3xl p-5 sm:p-6 rounded-3xl  shadow-2xl flex flex-col max-h-[85vh]">
                <div className="overflow-y-auto custom-scrollbar pr-1 flex-1 pb-4">
                    <h2 className="text-xl font-black italic mb-4 text-white uppercase tracking-tighter">{t('UPLOAD_TITLE')}</h2>
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-none bg-black overflow-hidden shrink-0 ">
                                  <ProfileAvatar user={user} />
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
                                    className="relative w-full bg-black/60 backdrop-blur-3xl  rounded-[1.5rem] px-5 py-4 text-[15px] text-white outline-none min-h-[150px] max-h-[50vh] resize-y placeholder-gray-600 focus:border-[var(--gold-primary)]/40   custom-scrollbar shadow-inner font-bold"
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
                    {/* YOUTUBE INPUT REMOVED PER USER REQUEST */}

                    <div onClick={() => fileRef.current.click()} className="cursor-pointer mb-4">
                        {preview ? (
                            <div className="w-full h-48 rounded-2xl overflow-hidden relative bg-black  shadow-inner flex items-center justify-center">
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
                        <input type="file" ref={fileRef} accept="*/*" hidden onChange={handleFileChange} />
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
                            const file = fileRef.current?.files?.[0];

                            // Auto-extract from description if they pasted it there instead of the dedicated box
                            const ytMatch = getYouTubeId(desc);
                            const youtube = ytMatch ? `https://youtube.com/watch?v=${ytMatch}` : '';

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
    const [saving, setSaving] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        if (post) {
            setDesc(post.desc || '');
            setPreview(post.image ? resolveMediaUrl(post.image) : (post.thumbnailUrl ? resolveMediaUrl(post.thumbnailUrl) : null));
            const isYT = isYouTubeUrl(post.videoUrl);
            setIsVideo(isYT ? false : (post.videoUrl ? true : (post.image?.match(/\.(mp4|mov|webm)$/i) ? true : false)));
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
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-md glass-panel bg-black/40 backdrop-blur-3xl p-6 sm:p-8 rounded-3xl  shadow-2xl flex flex-col max-h-[85vh]">
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
                                    className="relative w-full bg-black/60 backdrop-blur-3xl  rounded-[1.5rem] px-5 py-4 text-[15px] text-white outline-none min-h-[150px] max-h-[50vh] resize-y placeholder-gray-600 focus:border-[var(--gold-primary)]/40   custom-scrollbar shadow-inner"
                                />
                                <div className="absolute bottom-3 right-4 text-[10px] font-black text-gray-500 uppercase tracking-widest pointer-events-none">
                                    {desc.length} / 300
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-4 py-2.5 rounded-2xl group/note w-full">
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
                                    className="relative w-full bg-black/40  rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder-gray-700 focus:border-[var(--gold-primary)]/40   shadow-inner"
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
                                <div className="w-full min-h-[200px] aspect-video rounded-2xl overflow-hidden relative bg-black/60  shadow-2xl flex items-center justify-center group/preview">
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
                                            if (fileRef.current) fileRef.current.value = '';
                                        }}
                                        className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-xl  text-white  shadow-xl  opacity-0 group-hover/preview:opacity-100"
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
                            <input type="file" ref={fileRef} accept="*/*" hidden onChange={handleFileChange} />
                        </div>

                        <div className="flex gap-4">
                            <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-xs  text-white uppercase tracking-widest">{t('CANCEL')}</button>
                            <button disabled={saving} onClick={handleSave} className={`flex-1 py-3 ${saving ? 'opacity-60 cursor-wait' : 'bg-[var(--gold-primary)]'} rounded-xl text-black font-black text-xs uppercase tracking-widest shadow-lg`}>{saving ? '...' : t('PUBLISH')}</button>
                        </div>
                    </div>
                </div>
            </motion.div >
        </div>
    );
};

const hexToRgb = (hex) => {
    const h = String(hex || '').replace('#', '');
    if (h.length !== 6) return null;
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const applyTheme = (color) => {
    const getSecondary = (hex) => {
        if (hex === '#ff5500') return '#cc4400';
        if (hex === '#ffd700') return '#b8860b';
        return hex + 'aa';
    };
    const getHover = (hex) => {
        if (hex === '#ff5500') return '#ff661a';
        return hex + 'cc';
    };
    const secondary = getSecondary(color);
    const hover = getHover(color);
    const glow = `${color}44`;
    const glowSoft = `${color}1a`;
    const rgb = hexToRgb(color);

    document.documentElement.style.setProperty('--gold-primary', color);
    document.documentElement.style.setProperty('--gold-secondary', secondary);
    document.documentElement.style.setProperty('--gold-hover', hover);
    document.documentElement.style.setProperty('--gold-glow', glow);
    document.documentElement.style.setProperty('--gold-glow-soft', glowSoft);
    document.documentElement.style.setProperty('--app-text', '#e7e9ea');
    document.documentElement.style.setProperty('--f1-red', color);
    document.documentElement.style.setProperty('--f1-primary', color);
    if (rgb) {
        document.documentElement.style.setProperty('--gold-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
    document.body.classList.toggle('theme-orange-black', color === '#ff5500');

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

const PublicProfileLinktree = ({ username, publicUser, publicPosts, loadingUser, loadingPosts, onClose, onNavigateProfile, onOpenPost, t }) => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlLangParam = searchParams.get('lang');
    const urlThemeParam = searchParams.get('theme');
    const themeColor = publicUser?.settings?.theme || urlThemeParam || localStorage.getItem('themeColor') || '#ffd700';
    const [zoomImage, setZoomImage] = useState(null);

    if (loadingUser && !publicUser) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4" style={{ '--gold-primary': themeColor }}>
                <div className="w-12 h-12 text-[var(--gold-primary)]">
                    <Icons.Loader />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">GATHERING INTEL...</span>
            </div>
        );
    }

    if (!publicUser) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center gap-6" style={{ '--gold-primary': themeColor }}>
                <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">ACCESS LOCKED</h2>
                    <p className="text-xs text-gray-500 max-w-xs leading-relaxed uppercase tracking-wider">The requested agent profile is classified or does not exist in the active core directory.</p>
                </div>
                <button onClick={onClose} className="px-8 py-3 bg-white text-black font-black rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                    RETURN TO PORTAL
                </button>
            </div>
        );
    }

    const isFounder = publicUser.role === 'Founder';
    const resolvedPublicProfilePic = resolveMediaUrl(publicUser.profilePic, 320, true);
    const resolvedPublicCoverPic = resolveMediaUrl(publicUser.coverPic);
    const publicFounderAffiliation = getFounderAffiliation(publicUser);

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col items-center select-text" style={{ '--gold-primary': themeColor }}>
            {/* AMBIENT BACKGROUND GLOWS REMOVED FOR TETRAGONO */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            {/* DYNAMIC COVER BACKGROUND */}
            {resolvedPublicCoverPic && (
                <div className="absolute top-0 left-0 right-0 h-[220px] z-0 overflow-hidden">
                    {String(resolvedPublicCoverPic).match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
                        <video src={resolvedPublicCoverPic} autoPlay loop muted playsInline preload="metadata" className="w-full h-full object-cover opacity-60" />
                    ) : (
                        <img 
                            src={resolvedPublicCoverPic} 
                            className="w-full h-full object-cover opacity-60 blur-[1px] cursor-pointer" 
                            alt="" 
                            loading="eager" 
                            decoding="async" 
                            onClick={() => setZoomImage(resolvedPublicCoverPic)}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>
            )}

            <div className="relative z-10 w-full max-w-lg flex flex-col items-center px-4 pt-16 pb-24">
                {/* LOGOUT / BACK TO PORTAL FLOATING BUTTON */}
                <button onClick={onClose} className="absolute top-4 left-4 p-3 bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-none text-white hover:bg-white/[0.09] transition-colors flex items-center justify-center shadow-none">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                </button>

                {/* SIGN UP CALL TO ACTION */}
                <button onClick={onClose} className="absolute top-4 right-4 px-4 py-2 bg-white/[0.08] backdrop-blur-xl border border-white/10 text-white font-black text-[9px] uppercase tracking-widest rounded-none hover:bg-white/[0.12] transition-colors shadow-none">
                    {t('JOIN_ACADEMY_PRICE', 'JOIN ACADEMY • 4€/MO')}
                </button>

                {/* AVATAR & IDENTITY */}
                <div className="relative mt-8 mb-4">
                    <div className="w-28 h-28 rounded-none overflow-hidden bg-white/[0.05] backdrop-blur-xl border border-white/10 relative shadow-none group">
                        {resolvedPublicProfilePic ? (
                            <img 
                                src={resolvedPublicProfilePic} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" 
                                alt="" 
                                loading="eager" 
                                decoding="async" 
                                onClick={() => setZoomImage(resolvedPublicProfilePic)}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5 text-4xl font-bold uppercase text-white/40">
                                {publicUser.username?.[0]}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-[0.1em]">{publicUser.username}</h1>
                        <VerifiedBadge isFounder={isFounder} isUser={!isFounder} className="w-5 h-5 shrink-0" />
                        {publicUser.profileDescriptor && PROFILE_DESCRIPTOR_MAP[publicUser.profileDescriptor] && (
                            <div className={`inline-flex items-center gap-1.5 rounded-none border px-2.5 py-1 ${PROFILE_DESCRIPTOR_MAP[publicUser.profileDescriptor].accentClass}`}>
                                {React.createElement(PROFILE_DESCRIPTOR_MAP[publicUser.profileDescriptor].Icon, { className: "w-3.5 h-3.5" })}
                                <span className="text-[10px] font-black uppercase tracking-[0.18em]">{t(`DESC_${publicUser.profileDescriptor.toUpperCase()}`, PROFILE_DESCRIPTOR_MAP[publicUser.profileDescriptor].label)}</span>
                            </div>
                        )}
                    </div>
                    <span className="text-xs text-gray-500 font-bold tracking-widest uppercase mt-1">@{publicUser.username?.toLowerCase().replace(/\s+/g, '')}</span>
                    {publicFounderAffiliation && (
                        <div className="mt-2 flex justify-center">
                            <FounderAffiliationBadge username={publicFounderAffiliation} />
                        </div>
                    )}
                </div>

                {/* BIO CARD */}
                {publicUser.bio && (
                    <div className="w-full mt-6 p-5 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-none text-center shadow-none relative group">
                        <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed italic select-text">
                            "{publicUser.bio}"
                        </p>
                    </div>
                )}

                {/* STATS BAR */}
                <div className="w-full grid grid-cols-3 gap-3 mt-6">
                    <div className="p-4 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-none text-center shadow-none">
                        <span className="block text-lg font-black text-white tabular-nums">{publicPosts?.length || 0}</span>
                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider">{t('POSTS') || 'POSTS'}</span>
                    </div>
                    <div className="p-4 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-none text-center shadow-none">
                        <span className="block text-lg font-black text-white tabular-nums">{publicUser.followers?.length || 0}</span>
                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider">{t('FOLLOWERS') || 'FOLLOWERS'}</span>
                    </div>
                    <div className="p-4 bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-none text-center shadow-none">
                        <span className="block text-lg font-black text-white tabular-nums">{publicUser.following?.length || 0}</span>
                        <span className="text-[8px] text-gray-500 font-black uppercase tracking-wider">{t('FOLLOWING') || 'FOLLOWING'}</span>
                    </div>
                </div>

                {/* LINKTREE STYLE INVITATION CARD */}
                <div onClick={onClose} className="w-full mt-6 p-5 bg-white/[0.06] backdrop-blur-2xl border border-[var(--gold-primary)]/35 text-white rounded-none cursor-pointer hover:bg-white/[0.09] transition-colors flex items-center justify-between gap-4 group">
                    <div className="space-y-1 text-left">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gold-primary)]">{t('JOIN_ELITE', 'JOIN THE ACADEMY')}</h3>
                        <p className="text-xs font-bold leading-snug text-white/75">{t('CREATE_ACCOUNT_SUB', 'MEMBERSHIP • 4€ / MONTH')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-none bg-[var(--gold-primary)]/15 border border-[var(--gold-primary)]/35 text-[var(--gold-primary)] flex items-center justify-center shadow-none group-hover:scale-110 transition-transform shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </div>
                </div>

                {/* POST SHOWCASE SECTION TITLE */}
                <div className="w-full flex items-center gap-3 mt-10 mb-6">
                    <div className="w-1.5 h-4 bg-white rounded-none" />
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">{t('INTELLIGENCE_BRIEFINGS', 'INTELLIGENCE BRIEFINGS')}</span>
                    <div className="h-[1px] flex-1 bg-white/20" />
                </div>

                {/* simplified, READ-ONLY POST LIST */}
                <div className="w-full space-y-4">
                    {loadingPosts ? (
                        <div className="flex flex-col items-center justify-center p-12 gap-4 border border-dashed border-white/10 rounded-none bg-white/[0.01]">
                            <Icons.Loader className="w-10 h-10 text-[var(--gold-primary)]" />
                            <div className="text-center text-xs text-white/35 font-bold uppercase tracking-widest">
                                {t('LOADING_ARCHIVES', 'LOADING ARCHIVES...')}
                            </div>
                        </div>
                    ) : publicPosts.length === 0 ? (
                        <div className="p-12 text-center text-xs text-gray-600 font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-none bg-white/[0.01]">
                            {t('NO_ARCHIVES_DISPATCHED_YET', 'NO ARCHIVES DISPATCHED YET')}
                        </div>
                    ) : (
                        publicPosts.map(post => {
                            const publicPostMediaUrl = post.videoUrl || post.thumbnailUrl || post.image || '';
                            const isYouTubePost = isYouTubeUrl(publicPostMediaUrl);
                            const isNativeVideoPost = (!isYouTubePost) && (
                                (post.videoUrl && post.videoUrl.match(/\.(mp4|mov|webm|avi|m4v)(\?.*)?$/i)) ||
                                (post.image && post.image.match(/\.(mp4|mov|webm|avi|m4v)(\?.*)?$/i))
                            );
                            const isRepost = String(post.author?._id || post.author) !== String(publicUser._id);
                            const postAuthor = isRepost && typeof post.author === 'object' ? post.author : publicUser;
                            const postAuthorUsername = postAuthor?.username || 'Agent';
                            const postAuthorPic = isRepost ? resolveMediaUrl(postAuthor?.profilePic, 80, true) : resolvedPublicProfilePic;
                            const isAuthorFounder = postAuthor?.role === 'Founder';

                            return (
                                <div key={post._id} className="w-full p-5 bg-white/[0.02] backdrop-blur-3xl rounded-[32px] border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-4 relative group text-left overflow-hidden cursor-pointer hover:bg-white/[0.04] hover:border-white/10 active:scale-[0.995] transition-all touch-manipulation" onClick={(e) => {
                                    const selection = window.getSelection();
                                    if (selection && selection.toString().length > 0) return;
                                    if (post._id) {
                                        onOpenPost?.(post._id);
                                    }
                                }}>
                                    {/* Meander corners */}
                                    <div className="hidden" />
                                    <div className="hidden" />
                                    <div className="hidden" />
                                    <div className="hidden" />
                                    
                                    {isRepost && (
                                        <div 
                                            className="text-[9px] font-black text-white/50 uppercase tracking-widest flex items-center gap-1.5 -mb-2 cursor-pointer hover:text-white transition-colors z-10 w-fit"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onNavigateProfile?.(publicUser.username);
                                            }}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                                            @{publicUser.username} {t('REPOSTED', 'REPOSTED')}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-9 h-9 rounded-none overflow-hidden shrink-0 bg-black/40 cursor-pointer z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onNavigateProfile?.(postAuthorUsername);
                                            }}
                                        >
                                            {postAuthorPic ? (
                                                <img src={postAuthorPic} className="w-full h-full object-cover" alt="" loading="lazy" decoding="async" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5 text-sm font-bold uppercase text-white/40">
                                                    {postAuthorUsername?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5 z-10">
                                            <div 
                                                className="flex items-center gap-1 cursor-pointer hover:underline w-fit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNavigateProfile?.(postAuthorUsername);
                                                }}
                                            >
                                                <span className="font-bold text-xs text-white uppercase tracking-wider">{postAuthorUsername}</span>
                                                <VerifiedBadge isFounder={isAuthorFounder} isUser={!isAuthorFounder} className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {postAuthor?.profileDescriptor && PROFILE_DESCRIPTOR_MAP[postAuthor.profileDescriptor] ? (
                                                    <div className="flex items-center gap-1 text-gray-500 text-[9px] font-bold tracking-widest uppercase">
                                                        {React.createElement(PROFILE_DESCRIPTOR_MAP[postAuthor.profileDescriptor].Icon, { className: "w-2.5 h-2.5" })}
                                                        {t(`DESC_${postAuthor.profileDescriptor.toUpperCase()}`, PROFILE_DESCRIPTOR_MAP[postAuthor.profileDescriptor].label)}
                                                    </div>
                                                ) : (getFounderAffiliation(postAuthor) || (postAuthor === publicUser && publicFounderAffiliation)) && (
                                                    <FounderAffiliationBadge username={getFounderAffiliation(postAuthor) || publicFounderAffiliation} size="sm" />
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <CyberDate date={post.createdAt} t={t} lang={urlLangParam || 'en'} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CONTENT */}
                                    {post.desc && (
                                        <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed whitespace-pre-wrap select-text">
                                            {post.desc}
                                        </p>
                                    )}

                                    {/* MEDIA */}
                                    {(post.image || post.thumbnailUrl || post.videoUrl) && (
                                        <div className="w-full rounded-none overflow-hidden  bg-black mb-2 flex items-center justify-center">
                                            {isYouTubePost ? (
                                                <div className="w-full aspect-video bg-black" onClick={(e) => e.stopPropagation()}>
                                                    <NeuralVideoPlayer
                                                        src={post.videoUrl || post.thumbnailUrl || post.image}
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                            ) : isNativeVideoPost ? (
                                                <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                                                    <video 
                                                        src={resolveMediaUrl(post.videoUrl || post.image)}
                                                        poster={resolveMediaUrl(post.thumbnailUrl || post.videoUrl || post.image, null, false, true)}
                                                        className="w-full h-auto object-contain max-h-[400px]" 
                                                        controls
                                                        controlsList="nodownload"
                                                        preload="metadata"
                                                        playsInline
                                                        onClick={(e) => e.stopPropagation()}
                                                        onPlay={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            ) : (
                                                <img 
                                                    src={resolveMediaUrl(post.image || post.thumbnailUrl)} 
                                                    className="w-full h-auto object-contain max-h-[400px] cursor-pointer" 
                                                    alt="" 
                                                    loading="lazy"
                                                    decoding="async"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setZoomImage(resolveMediaUrl(post.image || post.thumbnailUrl));
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* simplified READ-ONLY STATS */}
                                    <div className="flex items-center gap-4 mt-2 border-t border-white/10 pt-4 text-gray-500 text-[10px] font-black uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5">
                                            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2.5" className="w-4 h-4 text-red-500"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                            <span className="tabular-nums">{post.likes?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                            <span className="tabular-nums">{post.comments?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-green-500"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                                            <span className="tabular-nums">{post.reposts?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* FULL SCREEN IMAGE ZOOM MODAL */}
            {zoomImage && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setZoomImage(null)}
                >
                    <button 
                        onClick={() => setZoomImage(null)} 
                        className="absolute top-4 right-4 p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors z-50"
                    >
                        <Icons.X className="w-6 h-6" />
                    </button>
                    <img 
                        src={zoomImage} 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                        alt="Zoomed"
                    />
                </div>
            )}
        </div>
    );
};

const App = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlLang = searchParams.get('lang');
    const urlTheme = searchParams.get('theme');
    
    // Check and set language from URL if present before any rendering
    useEffect(() => {
        if (urlLang && ['en', 'el', 'de', 'ru', 'es', 'tr', 'fr', 'cy'].includes(urlLang)) {
            localStorage.setItem('language', urlLang);
            // i18n instance will pick it up on mount, or we can manually change it here
            // It will be applied by useTranslation hook inside App component
        }
    }, [urlLang]);
    useEffect(() => {
        if (urlTheme) {
            localStorage.setItem('themeColor', urlTheme);
            applyTheme(urlTheme);
        }
    }, [urlTheme]);

    const [publicProfileUsername, setPublicProfileUsername] = useState(searchParams.get('profile'));
    const [publicUser, setPublicUser] = useState(null);
    const [publicPosts, setPublicPosts] = useState([]);
    const [publicUserLoading, setPublicUserLoading] = useState(false);
    const [publicPostsLoading, setPublicPostsLoading] = useState(false);
    const [viewPostId, setViewPostId] = useState(searchParams.get('postId'));

    const syncUrlState = useCallback(() => {
        const params = new URLSearchParams(window.location.search);
        setPublicProfileUsername(params.get('profile'));
        setViewPostId(params.get('postId'));
    }, []);

    const navigatePublicProfile = useCallback((username) => {
        const params = new URLSearchParams(window.location.search);
        params.delete('postId');
        const savedLang = params.get('lang') || localStorage.getItem('language') || 'en';
        const savedTheme = params.get('theme') || localStorage.getItem('themeColor') || '#ffd700';
        params.set('profile', username);
        params.set('lang', savedLang);
        params.set('theme', savedTheme);
        const nextUrl = `/?${params.toString()}`;
        window.history.pushState({}, '', nextUrl);
        syncUrlState();
    }, [syncUrlState]);

    const openPublicPost = useCallback((postId) => {
        const params = new URLSearchParams(window.location.search);
        const savedLang = params.get('lang') || localStorage.getItem('language') || 'en';
        const savedTheme = params.get('theme') || localStorage.getItem('themeColor') || '#ffd700';
        params.set('postId', postId);
        params.set('lang', savedLang);
        params.set('theme', savedTheme);
        const nextUrl = `/?${params.toString()}`;
        window.history.pushState({}, '', nextUrl);
        syncUrlState();
    }, [syncUrlState]);

    useEffect(() => {
        const handlePopState = () => syncUrlState();
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [syncUrlState]);

    useEffect(() => {
        if (!publicProfileUsername) return;

        let isActive = true;
        const normalizedUsername = decodeURIComponent(String(publicProfileUsername || '')).trim();

        const loadPublicProfile = async () => {
            setPublicUserLoading(true);
            setPublicPostsLoading(true);
            setPublicUser(null);
            setPublicPosts([]);

            const [userResult, postsResult] = await Promise.allSettled([
                axios.get(`/users/username/${encodeURIComponent(normalizedUsername)}`, { timeout: 12000 }),
                axios.get(`/users/public/posts/${encodeURIComponent(normalizedUsername)}`, { timeout: 12000 })
            ]);

            if (!isActive) return;

            if (userResult.status === 'fulfilled') {
                setPublicUser(userResult.value?.data || null);
            } else {
                console.error("Failed to load public profile:", userResult.reason);
                setPublicUser(null);
            }

            if (postsResult.status === 'fulfilled') {
                setPublicPosts(Array.isArray(postsResult.value?.data) ? postsResult.value.data : []);
            } else {
                console.error("Failed to load public posts:", postsResult.reason);
                setPublicPosts([]);
            }

            setPublicUserLoading(false);
            setPublicPostsLoading(false);
        };

        loadPublicProfile();

        return () => {
            isActive = false;
        };
    }, [publicProfileUsername]);

    const isPublicExperience = Boolean(publicProfileUsername || viewPostId);
    const [user, setUser] = useState(null);
    const [imgKey, setImgKey] = useState(Date.now());
    const { t, i18n, lang } = useTranslation();

    useEffect(() => {
        if (urlLang && ['en', 'el', 'de', 'ru', 'es', 'tr', 'fr', 'cy'].includes(urlLang)) {
            i18n.changeLanguage(urlLang);
        }
    }, [urlLang, i18n]);

    const [uploadProgress, setUploadProgress] = useState(0);
    const [toasts, setToasts] = useState([]);
    const addToast = (text, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, text, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const [showPassword, setShowPassword] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '', username: '' });

    const handleAuthInputChange = (e) => {
        setAuthError(''); // Clear error on typing
        const { id, value } = e.target;
        const key = id.replace('l-', '').replace('r-', '').replace('f-', '');
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleAuthModeChange = (mode) => {
        setAuthError('');
        setAuthMode(mode);
    };

    const commitAuthenticatedUser = useCallback((userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('language', userData.settings?.language || 'en');
        localStorage.setItem('themeColor', userData.settings?.theme || '#ffd700');
        startTransition(() => setUser(userData));
    }, []);

    const googleLogin = useGoogleLogin({
        flow: 'implicit',
        onSuccess: async (tokenResponse) => {
            setAuthLoading(true);
            try {
                // Fetch user info from Google using access token
                const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                
                // Send real Google info to backend
                const res = await axios.post('/auth/google', {
                    email: userInfo.data.email,
                    name: userInfo.data.name,
                    picture: userInfo.data.picture
                });
                localStorage.setItem('token', res.data.token);
                commitAuthenticatedUser(res.data.user);
                addToast("Connected via Secure Google Protocol!", "success");
            } catch (err) {
                console.error("Google Auth Failed", err);
                alert("Google Authentication Failed.");
            } finally {
                setAuthLoading(false);
            }
        },
        onError: errorResponse => {
            console.error("Google Sign In Error:", errorResponse);
            addToast("Google Sign-In Cancelled", "error");
        },
        prompt: 'select_account' // Forces the account selection screen
    });

    const handleGoogleSignIn = () => {
        googleLogin();
    };

    const [posts, setPosts] = useState([]);
    const [lastDeletedPostId, setLastDeletedPostId] = useState(null);
    const [users, setUsers] = useState([]);
    const [isLoadingFeed, setIsLoadingFeed] = useState(false);
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
    const [authMode, setAuthMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            const sessionId = params.get('session_id'); // From Stripe Redirect
            
            if (path === '/reset-password' && token) return 'reset';
            if (sessionId) return 'register'; // Auto-open Register if coming from Stripe
        }
        return 'login';
    });
    const [showPaywall, setShowPaywall] = useState(false);
    const [chatTarget, setChatTarget] = useState(null);
    const registerFileRef = useRef(null);
    const [registerPreview, setRegisterPreview] = useState(null);
    const [expandedDates, setExpandedDates] = useState({});
    const [showScrollTop, setShowScrollTop] = useState(false);
    const mainScrollRef = useRef(null);
    const selectedPostRef = useRef(selectedPost);
    const postsRef = useRef(posts);
    const usersRef = useRef(users);
    const onlineUsersRef = useRef(new Set());

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

    // Track online users to show a toast when someone comes online
    useEffect(() => {
        if (!user) return;
        const currentOnline = new Set();
        users.forEach(u => {
            if (isUserOnline(u, user) && !isSameId(u._id, user._id)) {
                currentOnline.add(String(u._id));
            }
        });

        // Don't show toast on initial load (when previous size was 0)
        if (onlineUsersRef.current.size > 0) {
            currentOnline.forEach(id => {
                if (!onlineUsersRef.current.has(id)) {
                    const comingOnlineUser = users.find(u => String(u._id) === id);
                    if (comingOnlineUser) {
                        // Ελέγχουμε αν υπάρχει ήδη ενεργό toast για αυτόν τον χρήστη για αποφυγή spam (debounce)
                        const toastMsg = t('USER_IS_ONLINE', { user: comingOnlineUser.username, defaultValue: `${comingOnlineUser.username} is now online` });
                        addToast(toastMsg, 'success');
                    }
                }
            });
        }
        onlineUsersRef.current = currentOnline;
    }, [users, user, addToast]);
    const isProcessingRequest = useRef(false);

    // SCROLL TO TOP ON LOGIN / TAB CHANGE
    useEffect(() => {
        if (mainScrollRef.current) {
            // Force reset of scroll position with a slight delay to allow rendering to complete
            setTimeout(() => {
                if (mainScrollRef.current) {
                    mainScrollRef.current.scrollTo(0, 0);
                    mainScrollRef.current.scrollTop = 0;
                }
                window.scrollTo(0, 0);
            }, 50);
        }
    }, [user?._id, activeTab]);

    useEffect(() => {
        if (!user && mainScrollRef.current) {
            mainScrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
            setShowScrollTop(false);
        }
        window.scrollTo(0, 0);
    }, [authMode, user]);

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

        // 🔥 SAFETY: Only proceed if updatedUser has _id
        if (!updatedUser._id) return;
        
        const uid = safeId(updatedUser);
        if (!uid) return;

        // 🔥 EXTRA PROTECTION: If payload is missing username (e.g. partial response), do not merge it as it would overwrite name with undefined!
        if (!updatedUser.username) {
            console.warn("⚠️ [SAFETY] Received user update without a username, fetching full user to prevent corruption:", uid);
            fetchUsers(uid);
            return;
        }

        // Cache-break ONLY for real URLs (not blob)
        if (updatedUser.profilePic && !updatedUser.profilePic.startsWith('blob:') && !updatedUser.profilePic.includes('t=')) {
            const sep = updatedUser.profilePic.includes('?') ? '&' : '?';
            updatedUser.profilePic += `${sep}t=${Date.now()}`;
        }
        if (updatedUser.coverPic && !updatedUser.coverPic.startsWith('blob:') && !updatedUser.coverPic.includes('t=')) {
            const sep = updatedUser.coverPic.includes('?') ? '&' : '?';
            updatedUser.coverPic += `${sep}t=${Date.now()}`;
        }

        // Update users list - ONLY with full real users
        setUsers(prev => {
            const list = prev || [];
            const exists = list.some(u => safeId(u) === uid);
            const mergeUser = (base, incoming) => ({
                ...base,
                ...incoming,
                settings: {
                    ...(base?.settings || {}),
                    ...(incoming?.settings || {})
                }
            });
            return exists 
                ? list.map(u => safeId(u) === uid ? mergeUser(u, updatedUser) : u)
                : [...list, updatedUser];
        });

        // Update current user
        if (user && safeId(user) === uid) {
            const merged = {
                ...user,
                ...updatedUser,
                settings: {
                    ...(user?.settings || {}),
                    ...(updatedUser?.settings || {})
                }
            };
            setUser(merged);
            localStorage.setItem('user', JSON.stringify(merged));
            setImgKey(Date.now());
        }

        // Update profile view IMMEDIATELY
        setProfileUser(prev => {
            if (prev && safeId(prev) === uid) {
                return {
                    ...prev,
                    ...updatedUser,
                    settings: {
                        ...(prev?.settings || {}),
                        ...(updatedUser?.settings || {})
                    }
                };
            }
            return prev;
        });

        // Update posts
        setPosts(prevPosts => (prevPosts || []).map(p => {
            const authorId = safeId(p.author);
            if (authorId === uid) {
                const currentAuthor = typeof p.author === 'object' && p.author ? p.author : { _id: uid };
                const nextAuthor = { ...currentAuthor };
                Object.keys(updatedUser).forEach(key => {
                    if (updatedUser[key] !== null && updatedUser[key] !== undefined && updatedUser[key] !== '') {
                        nextAuthor[key] = updatedUser[key];
                    }
                });
                return { ...p, author: nextAuthor, profilePic: updatedUser.profilePic || p.profilePic || nextAuthor.profilePic };
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
                if (!parsedUserId || parsedUserId === 'unknown' || parsedUserId === '[object Object]' || !userData.username) {
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
            // CLEAN ALL STATE: Reset users/posts and fetch fresh
            setUsers([]);
            setPosts([]);
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
        if (user && !isPublicExperience && user._id !== lastInitializedId.current) {
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
        } else if (!user || isPublicExperience) {
            lastInitializedId.current = null;
            stopHeartbeat();
            stopUserPoll();
            stopPostPoll();
            stopNotificationPoll();
        }
    }, [user, isPublicExperience]);

    // Fetch posts on tab change only (login/refresh handled by user init effect)
    useEffect(() => {
        if (user && !isPublicExperience) fetchPosts();
    }, [activeTab, user, isPublicExperience]);

    // 🔥 GLOBAL REAL-TIME LISTENERS
    useEffect(() => {
        if (!user || isPublicExperience) return;

        const onNotificationRecv = (data) => {
            console.log("📡 [SOCKET] Real-time notification received", data);

            // Άμεση ενημέρωση του UI χωρίς αναμονή για το δίκτυο
            setAlerts(prev => [data, ...prev]);
            setUser(prev => {
                if (!prev) return prev;
                const updated = { ...prev, notifications: [data, ...(prev.notifications || [])] };
                localStorage.setItem('user', JSON.stringify(updated));
                return updated;
            });
            
            // Το Toast δείχνει αμέσως την ειδοποίηση
            let toastMsg = data.text || "New Notification";
            if (data.type === 'follow') toastMsg = `${data.fromUsername} ${t('NOTIF_FOLLOW', 'started following you')}`;
            if (data.type === 'like') toastMsg = `${data.fromUsername} ${t('NOTIF_LIKE', 'liked your post')}`;
            if (data.type === 'comment') toastMsg = `${data.fromUsername} ${t('NOTIF_COMMENT', 'commented on your post')}`;
            
            addToast(toastMsg, 'info');

            fetchNotifications(true); // silent = true to ensure DB is perfectly synced
        };

        const onMessageRecv = (msg) => {
            // Only play sound if the message is for US and from someone else
            if (user && String(msg.recipient) === String(user._id) && String(msg.sender) !== String(user._id)) {
                console.log("📨 [SOCKET] Live message sound trigger");
                
                // Show a toast if chat window is not open with this user
                if (!activeChat || String(activeChat._id) !== String(msg.sender)) {
                    addToast(`${t('NOTIF_MESSAGE', 'New message from')} ${msg.senderName || 'Agent'}`, 'info');
                }
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
            handleUpdateUser(data);

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
    }, [user, selectedPost?._id, isPublicExperience]);


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
                const resolved = resolveFullUser(p.author, latestUsers);

                // 🔥 HIGH SAFETY GUARD: Only update if the resolved user actually has a valid, real username
                if (resolved && resolved.username && resolved.username !== 'Unknown' && resolved.username !== 'Agent') {
                    const currentUsername = p.author?.username || '';
                    if (currentUsername !== resolved.username) {
                        changed = true;
                        return { ...p, author: resolved };
                    }
                }
                return p;
            });
            return changed ? next : prev;
        });

        if (selectedPost) {
            setSelectedPost(prev => {
                if (!prev) return prev;
                const resolved = resolveFullUser(prev.author, latestUsers);
                if (resolved && resolved.username && resolved.username !== 'Unknown' && resolved.username !== 'Agent') {
                    const currentUsername = prev.author?.username || '';
                    if (currentUsername !== resolved.username) {
                        return { ...prev, author: resolved };
                    }
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
        if (!user || isPublicExperience) return;
        if (selectedPostRef.current) return;
        if (!postsRef.current || postsRef.current.length === 0) {
            setIsLoadingFeed(true);
        }
        const startTime = Date.now();
        try {
            const res = await axios.get(`/posts?limit=30`);
            setPosts(res.data);
            localStorage.setItem('cached_posts', JSON.stringify(res.data.slice(0, 20)));
        } catch (e) { }
        finally {
            const elapsed = Date.now() - startTime;
            if (elapsed < 1000) {
                await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
            }
            setIsLoadingFeed(false);
        }
    };

    const fetchUsers = async (specificId = null) => {
        if (!user || isPublicExperience) return;
        try {
            if (specificId) {
                // Targeted refresh for instant online status
                const res = await axios.get(`/users/find/${specificId}?t=${Date.now()}`);
                if (res.data) {
                    setUsers(prev => {
                        const exists = prev.find(u => isSameId(u._id, specificId));
                        const mergedUser = exists ? {
                            ...exists,
                            ...res.data,
                            profileDescriptor: res.data?.profileDescriptor ?? exists?.profileDescriptor ?? '',
                            founderAffiliation: res.data?.founderAffiliation ?? exists?.founderAffiliation ?? getFounderAffiliation(res.data) ?? getFounderAffiliation(exists),
                            settings: {
                                ...(exists?.settings || {}),
                                ...(res.data?.settings || {})
                            }
                        } : res.data;
                        if (exists) return prev.map(u => isSameId(u._id, specificId) ? mergedUser : u);
                        return [...prev, mergedUser];
                    });
                    // Also update profileUser if the profile modal is open for this user
                    setProfileUser(prev => {
                        if (prev && isSameId(prev._id, specificId)) {
                            return {
                                ...prev,
                                ...res.data,
                                profileDescriptor: res.data?.profileDescriptor ?? prev?.profileDescriptor ?? '',
                                founderAffiliation: res.data?.founderAffiliation ?? prev?.founderAffiliation ?? getFounderAffiliation(res.data) ?? getFounderAffiliation(prev),
                                settings: {
                                    ...(prev?.settings || {}),
                                    ...(res.data?.settings || {})
                                }
                            };
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
                            prev.bio !== me.bio ||
                            prev.profileDescriptor !== me.profileDescriptor ||
                            sanitizeAffiliation(prev.founderAffiliation) !== sanitizeAffiliation(me.founderAffiliation) ||
                            prev.settings?.showProfileShareButton !== me.settings?.showProfileShareButton;

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

                            const updated = {
                                ...prev,
                                ...me,
                                profilePic: nextPic,
                                settings: {
                                    ...(prev?.settings || {}),
                                    ...(me?.settings || {})
                                }
                            };
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
                        // Preserve fresh local optimistic data, but never lose new server-backed profile metadata.
                        return {
                            ...u,
                            ...user,
                            profileDescriptor: user.profileDescriptor ?? u.profileDescriptor,
                            founderAffiliation: user.founderAffiliation ?? u.founderAffiliation ?? getFounderAffiliation(user) ?? getFounderAffiliation(u),
                            settings: {
                                ...(u?.settings || {}),
                                ...(user?.settings || {}),
                                showProfileShareButton: user?.settings?.showProfileShareButton ?? u?.settings?.showProfileShareButton
                            }
                        };
                    }
                    return u;
                });
            });
        } catch (e) { }
    };

    // Notifications
    const fetchNotifications = async (silent = false) => {
        if (!user || isPublicExperience) return;
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
            // Update the separate alerts state used for rendering the list
            setAlerts(prev => prev.map(a => ({ ...a, read: true })));
            // Update the main user object which drives the red dot indicator
            setUser(prev => {
                if (!prev || !prev.notifications) return prev;
                const updatedNotifications = prev.notifications.map(n => ({ ...n, read: true }));
                const updated = { ...prev, notifications: updatedNotifications };
                localStorage.setItem('user', JSON.stringify(updated));
                return updated;
            });
            // Update the users array as well to ensure total consistency
            setUsers(prev => {
                const currentUserId = safeId(user);
                return prev.map(u => {
                    if (isSameId(u._id, currentUserId)) {
                        return {
                            ...u,
                            notifications: (u.notifications || []).map(n => ({ ...n, read: true }))
                        };
                    }
                    return u;
                });
            });
        } catch (e) { console.error('Mark read failed', e); }
    };

    // Polling intervals stored in refs to avoid re-creation on renders
    const _notifInterval = useRef(null);
    const _hbInterval = useRef(null);
    const _userInterval = useRef(null);
    const _postInterval = useRef(null);

    const startNotificationPoll = () => {
        if (!user || isPublicExperience) return;
        if (_notifInterval.current) clearInterval(_notifInterval.current);
        _notifInterval.current = setInterval(fetchNotifications, 90000); // 90s fallback
    };
    const stopNotificationPoll = () => { if (_notifInterval.current) { clearInterval(_notifInterval.current); _notifInterval.current = null; } };

    const startHeartbeat = () => {
        if (!user || isPublicExperience) return;
        stopHeartbeat();
        const doHb = () => { if (!user) return; axios.put('/users/heartbeat').catch(() => { }); };
        doHb();
        _hbInterval.current = setInterval(doHb, 25000); // 25s heartbeat
    };
    const stopHeartbeat = () => { if (_hbInterval.current) { clearInterval(_hbInterval.current); _hbInterval.current = null; } };

    const startUserPoll = () => {
        if (!user || isPublicExperience) return;
        if (_userInterval.current) clearInterval(_userInterval.current);
        _userInterval.current = setInterval(fetchUsers, 30000); // 30s — was 4s (too aggressive!)
    };
    const stopUserPoll = () => { if (_userInterval.current) { clearInterval(_userInterval.current); _userInterval.current = null; } };

    const startPostPoll = () => {
        if (!user || isPublicExperience) return;
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

    // Make lang available for share URLs by getting it from useTranslation or fallback
    const currentLanguage = user?.settings?.language || localStorage.getItem('language') || 'en';

    // FIX: Real Share Functionality with Visual Card Generation
    const [shareModalPost, setShareModalPost] = useState(null);
    const [shareModalProfile, setShareModalProfile] = useState(null);

    const handleShare = async (post) => {
        setShareModalPost(post);
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

    // iOS PWA FIX: Blur active inputs when app goes to background to prevent freezing
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                    document.activeElement.blur();
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const logout = () => {
        if (user) {
            socket.emit('logout', user._id);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Do NOT call setUser(null) here. It causes a React re-render crash before the page reloads.
        window.location.replace('/');
    };

    const deleteNotifications = async () => { try { await axios.delete('/users/notifications'); setAlerts([]); const u = { ...user, notifications: [] }; setUser(u); localStorage.setItem('user', JSON.stringify(u)); cyberDeleteEffect(); } catch (e) { } };

    // Optimization: memoize feed calculation to avoid flickering & re-running heavy filters
    const preloadedProfilePosts = useMemo(() => {
        if (!profileUser?._id && !profileUser) return [];
        const targetId = String(profileUser?._id || profileUser?.userId || profileUser);
        return posts.filter(p =>
            String(p.author?._id || p.author) === targetId ||
            (Array.isArray(p.reposts) && p.reposts.some(id => String(id) === targetId))
        );
    }, [posts, profileUser]);

    // IF DIRECT LINK TO COMMENT VIEW - Moved here to prevent hook order violations
    if (viewPostId) {
        return <CommentView postId={viewPostId} user={user} onClose={() => {
            const params = new URLSearchParams(window.location.search);
            params.delete('postId');
            const nextSearch = params.toString();
            window.history.pushState({}, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`);
            syncUrlState();
        }} onViewProfile={(u) => navigatePublicProfile(u.username || u._id)} />;
    }

    // IF DIRECT LINK TO PUBLIC PROFILE
    if (publicProfileUsername) {
        return (
            <PublicProfileLinktree 
                username={publicProfileUsername} 
                publicUser={publicUser} 
                publicPosts={publicPosts} 
                loadingUser={publicUserLoading}
                loadingPosts={publicPostsLoading}
                onClose={() => {
                    const params = new URLSearchParams(window.location.search);
                    params.delete('profile');
                    const nextSearch = params.toString();
                    window.history.pushState({}, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`);
                    syncUrlState();
                }}
                onNavigateProfile={navigatePublicProfile}
                onOpenPost={openPublicPost}
                t={t}
            />
        );
    }

    return (
        <div className="app-container">
            {!user ? (
                <>
                    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
                    {/* CINEMATIC ANCIENT GREEK BACKGROUND */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black z-0">
                        {/* High-res Parthenon Image with slow zoom (Ken Burns) */}
                        <img 
                            src="https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=2000&q=80"
                            className="absolute inset-0 w-full h-full object-cover object-top opacity-80"
                            style={{ 
                                animation: 'kenburns 30s infinite alternate ease-in-out',
                                transformOrigin: 'top center'
                            }}
                            alt="Ancient Greece Background"
                        />
                        {/* Light overlays so the image is fully visible but text is readable */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-[var(--gold-primary)] opacity-[0.15] mix-blend-color" />
                        
                        {/* Animated Orbs for magical ancient vibe */}
                        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--gold-primary)]/20 blur-[100px] md:animate-pulse" style={{ animationDuration: '8s' }} />
                        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[var(--gold-primary)]/10 blur-[120px] md:animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
                    </div>

                    {/* MAIN GLASS CARD */}
                    <div className="relative w-full max-w-[400px] mx-4 z-10">
                        <div className="relative bg-white/[0.04] backdrop-blur-[40px] border border-white/[0.08] rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            <div className="absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-[var(--gold-primary)]/5 to-transparent pointer-events-none" />

                            <div className="relative p-8 pb-10 overflow-y-auto max-h-[90dvh] no-scrollbar">
                                {/* LOGO */}
                                <div className="flex flex-col items-center mb-8 relative">
                                    <div className="relative flex justify-center items-center w-full h-40 md:h-48 mb-2">
                                        <img src="/logo.png" alt="Legacy Academy" className={`h-full w-auto max-w-[90%] object-contain transform-gpu transition-opacity duration-300 drop-shadow-none ${authLoading ? 'opacity-50' : 'opacity-100'}`} style={{ imageRendering: '-webkit-optimize-contrast' }} />
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[var(--gold-primary)]/40" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--gold-primary)]/60">
                                            {authMode === 'login' ? 'SIGN IN' : authMode === 'register' ? 'CREATE ACCOUNT' : 'RESET PASSWORD'}
                                        </span>
                                        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[var(--gold-primary)]/40" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {authMode === 'login' && (
                                        <form onSubmit={(e) => { e.preventDefault(); /* login logic handled by button onClick */ }}>
                                            <div className="relative group mb-3">
                                                <div className="absolute inset-0 rounded-2xl bg-white/[0.03] group-focus-within:bg-white/[0.06] transition-colors duration-300" />
                                                <div className="absolute inset-0 rounded-2xl border border-white/[0.08] group-focus-within:border-[var(--gold-primary)]/40 transition-colors duration-300" />
                                                <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-[var(--gold-primary)]/60 transition-colors duration-300 z-10" />
                                                <input type="email" placeholder="Email address" id="l-email" value={formData.email} onChange={handleAuthInputChange} className="relative w-full bg-transparent py-4 pl-11 pr-4 text-white text-sm font-medium outline-none placeholder:text-white/20 z-10" />
                                            </div>
                                            <div className="relative group mb-3">
                                                <div className="absolute inset-0 rounded-2xl bg-white/[0.03] group-focus-within:bg-white/[0.06] transition-colors duration-300" />
                                                <div className="absolute inset-0 rounded-2xl border border-white/[0.08] group-focus-within:border-[var(--gold-primary)]/40 transition-colors duration-300" />
                                                <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-[var(--gold-primary)]/60 transition-colors duration-300 z-10" />
                                                <input type={showPassword ? "text" : "password"} placeholder="Password" id="l-password" value={formData.password} onChange={handleAuthInputChange} className="relative w-full bg-transparent py-4 pl-11 pr-11 text-white text-sm font-medium outline-none placeholder:text-white/20 z-10" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors z-10">
                                                    {showPassword ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            
                                            {authError && (
                                                <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                                                    <Icons.AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                    <span className="text-red-400 text-[10px] font-black uppercase tracking-widest leading-tight">{authError}</span>
                                                </div>
                                            )}

                                            <button type="button" disabled={authLoading} onClick={async () => {
                                                if (!formData.email || !formData.password) {
                                                    setAuthError('Email and Password are required.');
                                                    return;
                                                }
                                                setAuthLoading(true);
                                                setAuthError('');
                                                try {
                                                    const res = await axios.post('/auth/login', { email: formData.email, password: formData.password });
                                                    localStorage.setItem('token', res.data.token);
                                                    commitAuthenticatedUser(res.data.user);
                                                } catch (e) {
                                                    setAuthError(e.response?.data?.message || "Invalid clearance codes or account not found.");
                                                    setAuthLoading(false); // Only stop loading if error
                                                } 
                                            }} className="mt-2 w-full relative group overflow-hidden rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.2em] disabled:opacity-40" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.9), rgba(255,180,0,0.8))', color: '#000' }}>
                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                {authLoading ? (
                                                    <div className="w-5 h-5 text-black">
                                                        <Icons.Loader />
                                                    </div>
                                                ) : <span className="relative">SIGN IN</span>}
                                            </button>
                                            <div className="flex justify-between text-xs text-white/30 px-1 pt-2 font-bold tracking-wide">
                                                 <button type="button" onClick={() => setShowPaywall(true)} className="cursor-pointer hover:text-[var(--gold-primary)] transition-colors bg-transparent border-none outline-none p-0 font-bold text-[var(--gold-primary)]/80 uppercase tracking-widest text-[9px]">Create Account</button>
                                                 <button type="button" onClick={() => { handleAuthModeChange('forgot'); setFormData({ email: '', password: '', username: '' }); }} className="cursor-pointer hover:text-white/60 transition-colors bg-transparent border-none outline-none p-0 font-bold uppercase tracking-widest text-[9px]">Forgot Password?</button>
                                            </div>
                                            <div className="flex items-center my-3.5">
                                                 <div className="flex-1 h-[1px] bg-white/5" />
                                                 <span className="px-3 text-[9px] text-white/20 uppercase tracking-[0.2em] font-black">OR ENTER SYSTEM WITH</span>
                                                 <div className="flex-1 h-[1px] bg-white/5" />
                                             </div>
                                             <button onClick={handleGoogleSignIn} disabled={authLoading} className="w-full relative group overflow-hidden rounded-2xl py-3.5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.08] transition-all duration-300 flex items-center justify-center gap-3 text-white text-xs font-black uppercase tracking-[0.15em] hover:border-white/15">
                                                 <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                 <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                                                     <path fill="#EA4335" d="M12 5.04c1.67 0 3.19.58 4.37 1.71l3.27-3.27C17.65 1.58 15.01 1 12 1 7.24 1 3.2 3.75 1.25 7.78l3.92 3.04C6.12 7.76 8.81 5.04 12 5.04z" />
                                                     <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.45c-.28 1.48-1.12 2.74-2.38 3.59l3.71 2.87c2.17-2 3.71-4.94 3.71-8.55z" />
                                                     <path fill="#FBBC05" d="M5.17 14.74a7.12 7.12 0 0 1 0-4.48L1.25 7.22A11.96 11.96 0 0 0 0 12c0 1.72.36 3.35 1.25 4.78l3.92-3.04z" />
                                                     <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.71-2.87c-1.03.69-2.35 1.1-4.25 1.1-3.19 0-5.88-2.72-6.84-5.78L1.24 15.57C3.19 19.6 7.24 23 12 23z" />
                                                 </svg>
                                                 <span>GOOGLE SIGN-IN</span>
                                             </button>
                                        </form>
                                    )}
                                    {authMode === 'register' && (
                                        <>
                                            <div onClick={() => registerFileRef.current.click()} className="w-20 h-20 mx-auto rounded-[18px] bg-white/5  overflow-hidden cursor-pointer relative group mb-2 flex items-center justify-center">
                                                {registerPreview ? <img src={registerPreview} className="w-full h-full object-cover" /> : (
                                                    <div className="flex flex-col items-center gap-1 text-white/20 group-hover:text-white/40 transition-colors">
                                                        <Icons.Camera className="w-6 h-6" />
                                                        <span className="text-[8px] uppercase tracking-wider font-black">Photo</span>
                                                    </div>
                                                )}
                                                <input type="file" ref={registerFileRef} hidden accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) setRegisterPreview(URL.createObjectURL(file)); }} />
                                            </div>
                                            {[{ id: 'r-username', type: 'text', icon: <Icons.User className="w-4 h-4" />, ph: 'Username', val: formData.username, max: 19 },
          { id: 'r-email', type: 'email', icon: <Icons.Mail className="w-4 h-4" />, ph: 'Email Address', val: formData.email },
        ].map(f => (
                                                <div key={f.id} className="relative group">
                                                    <div className="absolute inset-0 rounded-2xl bg-white/[0.03] group-focus-within:bg-white/[0.06] transition-colors duration-300" />
                                                    <div className="absolute inset-0 rounded-2xl border border-white/[0.08] group-focus-within:border-[var(--gold-primary)]/40 transition-colors duration-300" />
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-[var(--gold-primary)]/60 transition-colors duration-300 z-10">{f.icon}</span>
                                                    <input type={f.type} placeholder={f.ph} id={f.id} value={f.val} maxLength={f.max} onChange={(e) => { if (!f.max || e.target.value.length <= f.max) handleAuthInputChange(e); }} className="relative w-full bg-transparent py-3.5 pl-11 pr-4 text-white text-sm font-medium outline-none placeholder:text-white/20 z-10" />
                                                </div>
                                            ))}
                                            <div className="relative group">
                                                <div className="absolute inset-0 rounded-2xl bg-white/[0.03] group-focus-within:bg-white/[0.06] transition-colors duration-300" />
                                                <div className="absolute inset-0 rounded-2xl border border-white/[0.08] group-focus-within:border-[var(--gold-primary)]/40 transition-colors duration-300" />
                                                <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-[var(--gold-primary)]/60 transition-colors duration-300 z-10" />
                                                <input type={showPassword ? "text" : "password"} placeholder="Password" id="r-password" value={formData.password} onChange={handleAuthInputChange} className="relative w-full bg-transparent py-3.5 pl-11 pr-11 text-white text-sm font-medium outline-none placeholder:text-white/20 z-10" />
                                                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 z-10">{showPassword ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}</button>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute inset-0 rounded-2xl bg-white/[0.03] group-focus-within:bg-white/[0.06] transition-colors duration-300" />
                                                <div className="absolute inset-0 rounded-2xl border border-white/[0.08] group-focus-within:border-[var(--gold-primary)]/40 transition-colors duration-300" />
                                                <textarea placeholder="Bio (Optional)" id="r-bio" value={formData.bio || ''} onChange={handleAuthInputChange} maxLength={500} className="relative w-full bg-transparent py-3.5 px-4 text-white text-sm font-medium outline-none placeholder:text-white/20 resize-none h-20 z-10" />
                                                <div className="absolute bottom-2 right-3 text-[9px] font-black text-white/15 z-10">{(formData.bio || '').length}/500</div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">SELECT LANGUAGE</label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[
                                                        { code: 'en', label: 'English', flag: '🇬🇧' },
                                                        { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
                                                        { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
                                                        { code: 'fr', label: 'Français', flag: '🇫🇷' },
                                                        { code: 'es', label: 'Español', flag: '🇪🇸' },
                                                        { code: 'ru', label: 'Русский', flag: '🇷🇺' },
                                                        { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
                                                        { code: 'cy', label: 'Cypriot', flag: '🇨🇾' }
                                                    ].map(lang => (
                                                        <button
                                                            key={lang.code}
                                                            onClick={() => setFormData(prev => ({ ...prev, language: lang.code }))}
                                                            className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200 ${formData.language === lang.code ? 'border-white bg-white/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:border-white/30'}`}
                                                        >
                                                            <span className="text-xl">{lang.flag}</span>
                                                            <span className="text-[8px] font-black uppercase tracking-wider">{lang.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {authError && (
                                                <div className="mt-3 mb-1 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                                                    <Icons.AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                    <span className="text-red-400 text-[10px] font-black uppercase tracking-widest leading-tight">{authError}</span>
                                                </div>
                                            )}

                                            <button type="button" disabled={authLoading} onClick={async () => {
                                                if (!formData.email || !formData.password || !formData.username) {
                                                    setAuthError('Email, Password, and Username are required.');
                                                    return;
                                                }
                                                setAuthLoading(true);
                                                setAuthError('');
                                                try {
                                                    const fd = new FormData();
                                                    fd.append('username', formData.username?.trim());
                                                    fd.append('email', formData.email?.trim());
                                                    fd.append('password', formData.password);
                                                    if (formData.bio !== undefined) fd.append('bio', formData.bio.trim());
                                                    fd.append('language', formData.language || 'en');
                                                    fd.append('theme', '#ffd700'); // Always use default theme
                                                    if (registerFileRef.current.files[0]) fd.append('image', registerFileRef.current.files[0]);
                                                    const res = await axios.post('/auth/register', fd);
                                                    localStorage.setItem('token', res.data.token);
                                                    if (formData.language) localStorage.setItem('language', formData.language);
                                                    localStorage.setItem('themeColor', '#ffd700');
                                                    commitAuthenticatedUser(res.data.user);
                                                } catch (e) {
                                                    setAuthError(e.response?.data?.message || e.response?.data || 'Account creation failed.');
                                                    setAuthLoading(false);
                                                } 
                                            }} className="mt-2 w-full relative group overflow-hidden rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.2em] disabled:opacity-40" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.9), rgba(255,180,0,0.8))', color: '#000' }}>
                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                {authLoading ? (
                                                    <div className="w-5 h-5 text-black">
                                                        <Icons.Loader />
                                                    </div>
                                                ) : <span className="relative">CREATE ACCOUNT</span>}
                                            </button>
                                            <div className="flex items-center my-3.5">
                                                 <div className="flex-1 h-[1px] bg-white/5" />
                                                 <span className="px-3 text-[9px] text-white/20 uppercase tracking-[0.2em] font-black">OR REGISTER WITH</span>
                                                 <div className="flex-1 h-[1px] bg-white/5" />
                                             </div>
                                             <button onClick={handleGoogleSignIn} disabled={authLoading} className="w-full relative group overflow-hidden rounded-2xl py-3.5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.08] transition-all duration-300 flex items-center justify-center gap-3 text-white text-xs font-black uppercase tracking-[0.15em] hover:border-white/15">
                                                 <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                 <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                                                     <path fill="#EA4335" d="M12 5.04c1.67 0 3.19.58 4.37 1.71l3.27-3.27C17.65 1.58 15.01 1 12 1 7.24 1 3.2 3.75 1.25 7.78l3.92 3.04C6.12 7.76 8.81 5.04 12 5.04z" />
                                                     <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.45c-.28 1.48-1.12 2.74-2.38 3.59l3.71 2.87c2.17-2 3.71-4.94 3.71-8.55z" />
                                                     <path fill="#FBBC05" d="M5.17 14.74a7.12 7.12 0 0 1 0-4.48L1.25 7.22A11.96 11.96 0 0 0 0 12c0 1.72.36 3.35 1.25 4.78l3.92-3.04z" />
                                                     <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.71-2.87c-1.03.69-2.35 1.1-4.25 1.1-3.19 0-5.88-2.72-6.84-5.78L1.24 15.57C3.19 19.6 7.24 23 12 23z" />
                                                 </svg>
                                                 <span>GOOGLE REGISTER</span>
                                             </button>
                                            <button type="button" className="mt-3.5 w-full text-xs text-white/25 cursor-pointer text-center pt-1 font-bold hover:text-white/50 transition-colors bg-transparent border-none outline-none" onClick={() => handleAuthModeChange('login')}>BACK TO LOGIN</button>
                                        </>
                                    )}
                                    {authMode === 'forgot' && (
                                        <form onSubmit={(e) => { e.preventDefault(); /* submit handled by button */ }}>
                                            <p className="text-xs text-white/40 mb-2 text-center leading-relaxed">Enter your email address to receive a secure password reset link.</p>
                                            <div className="relative group mb-3">
                                                <div className="absolute inset-0 rounded-2xl bg-white/[0.03] group-focus-within:bg-white/[0.06] transition-colors duration-300" />
                                                <div className="absolute inset-0 rounded-2xl border border-white/[0.08] group-focus-within:border-[var(--gold-primary)]/40 transition-colors duration-300" />
                                                <Icons.Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-[var(--gold-primary)]/60 transition-colors duration-300 z-10" />
                                                <input type="email" placeholder="Email Address" id="f-email" value={formData.email} onChange={handleAuthInputChange} className="relative w-full bg-transparent py-4 pl-11 pr-4 text-white text-sm font-medium outline-none placeholder:text-white/20 z-10" />
                                            </div>

                                            {authError && (
                                                <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                                                    <Icons.AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                    <span className="text-red-400 text-[10px] font-black uppercase tracking-widest leading-tight">{authError}</span>
                                                </div>
                                            )}

                                            <button type="button" disabled={authLoading} onClick={async () => {
                                                if (!formData.email) {
                                                    setAuthError('Email is required.');
                                                    return;
                                                }
                                                setAuthLoading(true);
                                                setAuthError('');
                                                try {
                                                    const res = await axios.post('/auth/forgot-password', { email: formData.email });
                                                    if (res.data.success && res.data.message.includes('missing')) {
                                                        addToast('Email system is currently disabled on the server. Please contact support.', 'error');
                                                    } else {
                                                        addToast('Password reset link sent! Check your email.', 'success');
                                                        setTimeout(() => setAuthMode('login'), 3000);
                                                    }
                                                } catch (e) {
                                                    setAuthError(e.response?.data?.message || 'Failed to send reset link.');
                                                } finally { setAuthLoading(false); }
                                            }} className="mt-2 w-full relative group overflow-hidden rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.2em] disabled:opacity-40" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.9), rgba(255,180,0,0.8))', color: '#000' }}>
                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                {authLoading ? (
                                                    <div className="w-5 h-5 text-black">
                                                        <Icons.Loader />
                                                    </div>
                                                ) : <span className="relative">SEND RESET LINK</span>}
                                            </button>
                                             <button type="button" className="w-full text-xs text-white/25 cursor-pointer text-center pt-1 font-bold hover:text-white/50 transition-colors bg-transparent border-none outline-none" onClick={() => handleAuthModeChange('login')}>BACK TO LOGIN</button>
                                        </form>
                                    )}
                                    {authMode === 'reset' && (
                                        <form onSubmit={(e) => { e.preventDefault(); }}>
                                            <p className="text-xs text-white/40 mb-2 text-center leading-relaxed">Enter your new clearance codes.</p>
                                            <div className="relative group mb-3">
                                                <div className="absolute inset-0 rounded-2xl bg-white/[0.03] group-focus-within:bg-white/[0.06] transition-colors duration-300" />
                                                <div className="absolute inset-0 rounded-2xl border border-white/[0.08] group-focus-within:border-[var(--gold-primary)]/40 transition-colors duration-300" />
                                                <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-[var(--gold-primary)]/60 transition-colors duration-300 z-10" />
                                                <input type={showPassword ? "text" : "password"} placeholder="New Password" id="r-password" value={formData.password} onChange={handleAuthInputChange} className="relative w-full bg-transparent py-4 pl-11 pr-11 text-white text-sm font-medium outline-none placeholder:text-white/20 z-10" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors z-10">
                                                    {showPassword ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            {authError && (
                                                <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                                                    <Icons.AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                    <span className="text-red-400 text-[10px] font-black uppercase tracking-widest leading-tight">{authError}</span>
                                                </div>
                                            )}

                                            <button type="button" disabled={authLoading} onClick={async () => {
                                                if (!formData.password) {
                                                    setAuthError('New password is required.');
                                                    return;
                                                }
                                                setAuthLoading(true);
                                                setAuthError('');
                                                try {
                                                    const searchParams = new URLSearchParams(window.location.search);
                                                    const res = await axios.post('/auth/reset-password', { token: searchParams.get('token'), newPassword: formData.password });
                                                    setAuthError('Password reset successful! Redirecting...');
                                                    setTimeout(() => { window.location.href = '/'; }, 2000);
                                                } catch (e) {
                                                    setAuthError(e.response?.data?.message || 'Failed to reset password. Link may be expired.');
                                                } finally { setAuthLoading(false); }
                                            }} className="mt-2 w-full relative group overflow-hidden rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.2em] disabled:opacity-40" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.9), rgba(255,180,0,0.8))', color: '#000' }}>
                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                {authLoading ? (
                                                    <div className="w-5 h-5 text-black">
                                                        <Icons.Loader />
                                                    </div>
                                                ) : <span className="relative">UPDATE PASSWORD</span>}
                                            </button>
                                            <button type="button" className="mt-3.5 w-full text-xs text-white/25 cursor-pointer text-center pt-1 font-bold hover:text-white/50 transition-colors bg-transparent border-none outline-none" onClick={() => { window.location.href = '/'; }}>BACK TO LOGIN</button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-6 text-[10px] text-white/15 uppercase tracking-[0.3em] font-black">Legacy Academy © 2026</div>
                    </div>
                </div>

                {/* PAYWALL MODAL */}
                {showPaywall && (
                    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                        <div className="bg-[#050505]  rounded-[20px] max-w-[400px] w-full overflow-hidden relative">
                            {/* Decorative Top Line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--gold-primary)] to-transparent opacity-50" />
                            
                            <div className="p-8 text-center flex flex-col items-center">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center  mb-6 relative">
                                    <Icons.Lock className="w-8 h-8 text-[var(--gold-primary)]" />
                                </div>
                                
                                <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Restricted Access</h2>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed mb-8 px-4">
                                    Legacy Academy Intel is a premium network. To create an account and access the intelligence feed, an active subscription is required.
                                </p>
                                
                                <div className="bg-white/5  rounded-xl p-4 w-full mb-8">
                                    <div className="text-3xl font-black text-white mb-1">4€ <span className="text-sm text-gray-500 uppercase tracking-widest">/ month</span></div>
                                    <div className="text-[10px] text-[var(--gold-primary)] uppercase tracking-widest font-bold">Premium Membership</div>
                                </div>
                                
                                <button onClick={() => window.location.href = "https://buy.stripe.com/3cI9ATa9J3Jw0cE22U6Na05"} className="w-full py-4 bg-[var(--gold-primary)] text-black font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-transform duration-300 mb-4 text-xs">
                                    Purchase Access
                                </button>
                                
                                <button onClick={() => setShowPaywall(false)} className="text-[10px] text-white/40 uppercase tracking-widest font-black hover:text-white transition-colors">
                                    Return to Login
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                </>
            ) : (
                <div className="h-[100dvh] bg-[var(--app-bg)] text-[var(--app-text)] relative font-sans overflow-hidden flex flex-col">
                    <div className="fixed inset-0 z-0" style={{ backgroundColor: 'var(--app-bg)' }}></div>
                    <main ref={mainScrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar app-main-scroll p-0 relative z-10 overscroll-y-none">
                        <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[var(--gold-primary)]/5 to-transparent pointer-events-none z-0" />
                        <header className="relative w-full z-[20] bg-black border-b border-white/20 shrink-0">
                            <div className="w-full px-3 sm:px-6 py-6 sm:py-4 flex items-center justify-between">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <EnhancedButton
                                        onClick={() => { setIsDrawerOpen(true); }}
                                        className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-none bg-black  transition-all duration-300 z-50 p-2.5 -ml-2 group overflow-hidden"
                                        aria-label="Open menu"
                                        sound={null}
                                        scaleDown={1}
                                        duration={0}
                                    >
                                        <svg fill="none" width="28" viewBox="0 0 24 24" height="28" className="text-gray-300 group-hover:text-white transition-colors duration-300 pointer-events-none">
                                            <path fill="currentColor" stroke="none" strokeWidth="0" strokeLinecap="butt" strokeLinejoin="miter" fillRule="evenodd" clipRule="evenodd" d="M2 6a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm0 6a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm0 6a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Z"></path>
                                        </svg>
                                    </EnhancedButton>
                                </div>
                                <div className="flex-1 flex justify-center py-2">
                                    <img src="/logo.png" alt="Legacy Academy" className="h-48 w-auto object-contain transform-gpu drop-shadow-none" style={{ imageRendering: '-webkit-optimize-contrast', WebkitBackfaceVisibility: 'hidden' }} />
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
                                                <>
                                                    <button
                                                        onClick={markAllNotificationsRead}
                                                        title={t('MARK_ALL_READ', 'Mark all as read')}
                                                        className="w-9 h-9 sm:w-auto sm:px-4 bg-green-500/10 rounded-full text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20 flex items-center justify-center gap-0 group shadow-lg"
                                                    >
                                                        <Icons.Check className="w-4 h-4 group-hover:scale-110" />
                                                    </button>
                                                    <button
                                                        onClick={deleteNotifications}
                                                        title={t('CLEAR_ALL')}
                                                        className="w-9 h-9 sm:w-auto sm:px-4 bg-red-500/10 rounded-full text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 flex items-center justify-center gap-0 group shadow-lg"
                                                    >
                                                        <Icons.Trash className="w-4 h-4 group-hover:scale-110" />
                                                    </button>
                                                </>
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
                                                <div className="relative">
                                                    <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10 pointer-events-none" />
                                                    <input id="main-search" name="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('SEARCH_PH')} className="w-full bg-black  rounded-none py-4 pl-12 pr-4 font-bold outline-none focus:border-white shadow-none" />
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center justify-between px-1">
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                                            <div className="w-1 h-3 bg-white rounded-none" />
                                                            {t('TRENDING_NOW') || 'TOP POSTS'}
                                                        </h3>
                                                    </div>
                                                    <div 
                                                        className="flex gap-4 p-1 overflow-x-auto custom-scrollbar pb-4"
                                                    >
                                                        {[...(posts || [])].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 6).map((post, i) => (
                                                            <div
                                                                key={post._id || i}
                                                                onClick={() => setSelectedPost(post)}
                                                                className="flex-shrink-0 w-[280px] sm:w-[320px] liquid-image-card cursor-pointer snap-center group"
                                                            >
                                                                {/* Meander corners */}
                                                                <div className="hidden" />
                                                                <div className="hidden" />
                                                                <div className="hidden" />
                                                                <div className="hidden" />
                                                                
                                                                <div className="w-full aspect-[4/5] relative bg-black overflow-hidden">
                                                                    {(post.image || post.videoUrl || post.thumbnailUrl) ? (
                                                                         isYouTubeUrl(post.videoUrl || post.thumbnailUrl || post.image || '') ? (
                                                                             <div className="w-full h-full relative">
                                                                                 <img src={`https://img.youtube.com/vi/${getYouTubeId(post.videoUrl || post.thumbnailUrl || post.image)}/maxresdefault.jpg`} className="w-full h-full object-cover" alt="" />
                                                                                 <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                                                                     <div className="w-12 h-12 rounded-none border border-white bg-white text-black flex items-center justify-center shadow-none backdrop-blur-sm">
                                                                                         <Icons.Play className="w-6 h-6 text-black ml-1" />
                                                                                     </div>
                                                                                 </div>
                                                                             </div>
                                                                         ) : (post.videoUrl || (post.image && post.image.match(/\.(mp4|mov|webm)$/i))) ? (
                                                                             <video
                                                                                src={resolveMediaUrl(post.videoUrl || post.image)}
                                                                                poster={resolveMediaUrl(post.thumbnailUrl || post.videoUrl || post.image, null, false, true)}
                                                                                className="w-full h-full object-cover pointer-events-none"
                                                                                autoPlay
                                                                                muted
                                                                                loop
                                                                                playsInline
                                                                            />
                                                                         ) : (
                                                                             <img
                                                                                 src={resolveMediaUrl(post.image || post.thumbnailUrl)}
                                                                                 className="w-full h-full object-cover"
                                                                                 loading="lazy"
                                                                             />
                                                                         )
                                                                    ) : (
                                                                        <div className="w-full h-full bg-black flex items-center justify-center p-6 text-center ">
                                                                            <span className="font-black text-white/90 text-lg uppercase tracking-tighter leading-tight italic line-clamp-6">{post.desc}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                                                                    
                                                                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 z-10">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <div className="w-6 h-6 rounded-none overflow-hidden ">
                                                                                <ProfileAvatar user={post.author} />
                                                                            </div>
                                                                            <span className="text-[11px] font-bold text-white uppercase tracking-wider truncate shadow-sm">
                                                                                {post.author?.username || 'Agent'}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-white/90 font-medium line-clamp-2 leading-snug drop-shadow-md">{post.content || post.desc}</p>
                                                                        <div className="flex items-center gap-4 text-[10px] text-white font-black uppercase tracking-widest pt-1">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Icons.Heart className="w-3.5 h-3.5" />
                                                                                <span>{post.likes?.length || 0}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 text-gray-300">
                                                                                <Icons.MessageSquare className="w-3.5 h-3.5" />
                                                                                <span>{post.comments?.length || 0}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-6">
                                            {isLoadingFeed ? (
                                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                                    <Icons.Loader className="w-12 h-12 text-[var(--gold-primary)]" />
                                                    <div className="text-white font-black uppercase tracking-[0.2em] text-xs">{t('DECRYPTING_FEED')}</div>
                                                </div>
                                            ) : activeTab === 'search' && searchQuery && (
                                                <div className="space-y-2">
                                                    {users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()) && u._id !== user._id).slice(0, 5).map(u => (
                                                        <div key={u._id} onClick={() => viewProfile(u)} className="flex items-center gap-3 p-3 bg-black rounded-none  cursor-pointer hover:border-white transition-colors">
                                                            <div className="w-10 h-10 rounded-none bg-gray-800 overflow-hidden ">
                                                                <ProfileAvatar user={u} />
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
                                                                                    fill="#ffffff"
                                                                                    stroke="none"
                                                                                    d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                                                                                />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{u.followers?.length || 0} {t('FOLLOWERS_COUNT')}</div>
                                                            </div>
                                                            <button className="px-3 py-1.5 bg-white text-black rounded-none text-[10px] font-black uppercase tracking-widest">{t('VIEW')}</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="space-y-4">

                                                {(activeTab === 'home' || (activeTab === 'search' && searchQuery)) && groupedPosts.map(group => {
                                                    const dateKey = group.key;
                                                    return (
                                                        <div key={dateKey} className="animate-fade-in group mb-12">
                                                            <div className="flex items-center justify-center mb-10 mt-4 relative">
                                                                <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                                <div className="flex items-center gap-2 mt-1 z-10 relative">
                                                                    <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{dateKey}</span>
                                                                </div>
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

                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </main>

                    {showScrollTop && !isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost && (
                        <button
                            onClick={scrollToTop}
                            className="fixed bottom-[calc(140px+env(safe-area-inset-bottom))] right-20 sm:right-32 z-[950] w-14 h-14 sm:w-14 sm:h-14 rounded-full bg-white/10  flex items-center justify-center text-[var(--gold-primary)] shadow-2xl backdrop-blur-xl"
                        >
                            <Icons.ArrowUp className="w-7 h-7 sm:w-7 sm:h-7" />
                        </button>
                    )}

                    {/* CREATE FAB (Bluesky Style) */}
                    {(!isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost) && (
                        <button
                            onClick={() => { setIsCreateOpen(true); }}
                            className="fixed bottom-[calc(140px+env(safe-area-inset-bottom))] right-4 sm:right-10 z-[1000] w-14 h-14 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-[0_8px_32px_rgba(0,0,0,0.8)] hover:bg-white/20 transition-all duration-300"
                        >
                            <Icons.Compose className="w-7 h-7 sm:w-7 sm:h-7" />
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
                        setImgKey={setImgKey}
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
                        onShareProfile={setShareModalProfile}
                        onHashtagClick={handleHashtagClick}
                        onOpenCreate={() => {
                            setIsProfileOpen(false);
                            requestAnimationFrame(() => {
                                setCreateModeStory(true);
                                setIsCreateOpen(true);
                            });
                        }}
                        loadingActions={loadingActions}
                    />
                    <ChatModal isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); setChatTarget(null); }} user={user} allUsers={users} initialChatUser={chatTarget} addToast={addToast} fetchSpecificUser={fetchUsers} />

                    <BottomNavbar
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        alerts={alerts}
                        user={user}
                        onCreate={() => setIsCreateOpen(true)}
                        onProfile={() => user && viewProfile(user)}
                        ProfileAvatar={ProfileAvatar}
                    />

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
                                        <div className="w-10 h-10 rounded-xl bg-white/5  flex items-center justify-center text-[var(--gold-primary)]">
                                            <Icons.ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-[var(--gold-primary)] font-black uppercase text-sm tracking-widest">{t('TERMS_S1_TITLE')}</h3>
                                    </div>
                                    <div className="pl-[52px] text-gray-400 group-hover:text-white">{t('TERMS_S1_DESC')}</div>
                                </section>

                                <section className="space-y-3 relative group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5  flex items-center justify-center text-[var(--gold-primary)]">
                                            <Icons.Activity className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-[var(--gold-primary)] font-black uppercase text-sm tracking-widest">{t('TERMS_S2_TITLE')}</h3>
                                    </div>
                                    <div className="pl-[52px] text-gray-400 group-hover:text-white">{t('TERMS_S2_DESC')}</div>
                                </section>

                                <section className="space-y-3 relative group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5  flex items-center justify-center text-[var(--gold-primary)]">
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
                                <div className="p-3 sm:p-4 bg-white/5  rounded-2xl flex items-center gap-3 sm:gap-5">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--gold-primary)]/10 rounded-full flex items-center justify-center text-[var(--gold-primary)] shrink-0">
                                        <Icons.Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <p className="text-white font-medium leading-tight text-sm sm:text-base min-w-0 break-words">{t('PRIVACY_WELCOME')}</p>
                                </div>

                                <section className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5  flex items-center justify-center text-[var(--gold-primary)]">
                                            <Icons.HardDrive className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-white font-black uppercase text-sm tracking-tighter">{t('PRIVACY_S1_TITLE')}</h3>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed pl-11">{t('PRIVACY_S1_DESC')}</p>
                                </section>

                                <section className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5  flex items-center justify-center text-[var(--gold-primary)]">
                                            <Icons.Fingerprint className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-white font-black uppercase text-sm tracking-tighter">{t('PRIVACY_S2_TITLE')}</h3>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed pl-11">{t('PRIVACY_S2_DESC')}</p>
                                </section>

                                <section className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5  flex items-center justify-center text-[var(--gold-primary)]">
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
                            onViewProfile={(u) => {
                                setSelectedPost(null);
                                viewProfile(u);
                            }}
                        />
                    )}
                </div>
            )}
            
            {shareModalPost && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <button onClick={() => setShareModalPost(null)} className="absolute top-4 right-4 p-3 bg-white/10 rounded-[14px] hover:bg-white/20 transition">
                        <Icons.X className="w-6 h-6 text-white" />
                    </button>
                    
                    <div className="bg-black  rounded-[20px] max-w-[400px] w-full overflow-hidden shadow-2xl">
                        <div id="share-card-content" className="bg-[#0a0a0a] p-6 pb-8 relative overflow-hidden flex flex-col items-center text-center">
                            {/* Watermark */}
                            <div className="absolute top-4 right-6 opacity-10 font-black italic text-2xl tracking-tighter text-white">LEGACY</div>
                            
                            {/* Author */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-none bg-gray-800 overflow-hidden  shrink-0">
                                    <ProfileAvatar user={shareModalPost.author} />
                                </div>
                                <div>
                                    <div className="font-bold text-white text-base flex items-center gap-1.5 leading-none">
                                        {shareModalPost.author?.username}
                                        <VerifiedBadge isFounder={shareModalPost.author?.role === 'Founder'} isUser={shareModalPost.author?.role !== 'Founder'} className="w-4 h-4" />
                                    </div>
                                    {shareModalPost.author?.profileDescriptor && PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor] ? (
                                        <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">
                                            {React.createElement(PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor].Icon, { className: "w-3 h-3" })}
                                            {t(`DESC_${shareModalPost.author.profileDescriptor.toUpperCase()}`, PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor].label)}
                                            <span className="opacity-50 mx-1">•</span>
                                            <div className="flex items-center gap-2">
                                                <CyberDate date={shareModalPost.createdAt} t={t} lang={currentLanguage} />
                                            </div>
                                        </div>
                                    ) : getFounderAffiliation(shareModalPost.author) ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <FounderAffiliationBadge username={getFounderAffiliation(shareModalPost.author)} size="sm" />
                                            <span className="text-gray-500 text-xs font-bold tracking-widest uppercase opacity-50">•</span>
                                            <div className="flex items-center gap-2">
                                                <CyberDate date={shareModalPost.createdAt} t={t} lang={currentLanguage} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-1">
                                            <CyberDate date={shareModalPost.createdAt} t={t} lang={currentLanguage} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Text */}
                            {shareModalPost.desc && (
                                <p className="text-white text-base leading-relaxed mb-4 whitespace-pre-wrap">{shareModalPost.desc}</p>
                            )}
                            
                            {/* Media - FULL COVER/CONTAIN */}
                            {(shareModalPost.image || shareModalPost.thumbnailUrl || shareModalPost.videoUrl) && (
                                <div className="w-full rounded-[14px] overflow-hidden  bg-black mb-2 flex items-center justify-center">
                                    {shareModalPost.videoUrl && !shareModalPost.image && !shareModalPost.thumbnailUrl ? (
                                        <video 
                                            src={resolveMediaUrl(shareModalPost.videoUrl, 1200)} 
                                            className="w-full h-auto object-contain max-h-[400px]" 
                                            controls
                                            controlsList="nodownload"
                                        />
                                    ) : (
                                        <img 
                                            src={resolveMediaUrl(shareModalPost.image || shareModalPost.thumbnailUrl, 1200)} 
                                            className="w-full h-auto object-contain max-h-[400px]" 
                                            alt="" 
                                        />
                                    )}
                                </div>
                            )}
                            
                            {/* Footer stats */}
                            <div className="flex items-center gap-6 mt-4 text-gray-500 text-sm font-medium">
                                <div className="flex items-center gap-1.5"><Icons.Heart className="w-4 h-4 text-red-500 fill-current" /> {shareModalPost.likes?.length || 0}</div>
                                <div className="flex items-center gap-1.5"><Icons.MessageSquare className="w-4 h-4" /> {shareModalPost.comments?.length || 0}</div>
                                <div className="flex items-center gap-1.5"><Icons.RefreshCcw className="w-4 h-4 text-green-500" /> {shareModalPost.reposts?.length || 0}</div>
                            </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
                            <button 
                                onClick={async () => {
                                    const shareUrl = `${window.location.origin}${buildPublicUrl('post', shareModalPost._id, { lang: currentLanguage })}`;
                                    if (navigator.share) {
                                        try { await navigator.share({ title: 'Legacy Post', url: shareUrl }); } catch (e) { }
                                    } else {
                                        navigator.clipboard.writeText(shareUrl);
                                        addToast(t('PROFILE_LINK_COPIED') || "Link copied!", "success");
                                    }
                                    setShareModalPost(null);
                                }}
                                className="flex-1 bg-white text-black font-black py-3 rounded-[14px] flex items-center justify-center gap-2 hover:bg-gray-200"
                            >
                                <Icons.Share className="w-5 h-5" />
                                SHARE LINK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Share Modal */}
            {shareModalProfile && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <button onClick={() => setShareModalProfile(null)} className="absolute top-4 right-4 p-3 bg-white/10 rounded-[14px] hover:bg-white/20 transition">
                        <Icons.X className="w-6 h-6 text-white" />
                    </button>
                    
                    <div className="bg-black  rounded-[20px] max-w-[360px] w-full overflow-hidden shadow-2xl">
                        <div id="share-card-content" className="bg-[#0a0a0a] relative overflow-hidden flex flex-col items-center pt-10 pb-8 px-6 text-center">
                            {/* Watermark */}
                            <div className="absolute top-4 right-6 opacity-10 font-black italic text-xl tracking-tighter text-white">LEGACY</div>
                            
                            {/* Profile Image */}
                              <div className="w-24 h-24 rounded-none bg-black overflow-hidden  shrink-0 mb-4">
                                  <ProfileAvatar user={shareModalProfile} size="large" />
                              </div>
                            
                            {/* Profile Name & Badge */}
                            <div className="font-black text-white text-2xl flex items-center justify-center gap-2 leading-none mb-1 flex-wrap">
                                {shareModalProfile.username}
                                <VerifiedBadge isFounder={shareModalProfile.role === 'Founder'} isUser={shareModalProfile.role !== 'Founder'} className="w-6 h-6" />
                                {shareModalProfile.profileDescriptor && PROFILE_DESCRIPTOR_MAP[shareModalProfile.profileDescriptor] && (
                                    <div className={`inline-flex items-center gap-1.5 rounded-none border px-2.5 py-1 ${PROFILE_DESCRIPTOR_MAP[shareModalProfile.profileDescriptor].accentClass}`}>
                                        {React.createElement(PROFILE_DESCRIPTOR_MAP[shareModalProfile.profileDescriptor].Icon, { className: "w-3.5 h-3.5" })}
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em]">{t(`DESC_${shareModalProfile.profileDescriptor.toUpperCase()}`, PROFILE_DESCRIPTOR_MAP[shareModalProfile.profileDescriptor].label)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mb-4" />
                            {getFounderAffiliation(shareModalProfile) && (
                                <FounderAffiliationBadge username={getFounderAffiliation(shareModalProfile)} className="mb-4" />
                            )}
                            
                            {/* Bio */}
                            {shareModalProfile.bio && (
                                <p className="text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap">{shareModalProfile.bio}</p>
                            )}
                            
                            {/* Stats */}
                            <div className="flex items-center justify-center gap-8 w-full border-t border-white/10 pt-6">
                                <div className="flex flex-col items-center">
                                    <div className="font-black text-white text-xl">{shareModalProfile.followers?.length || 0}</div>
                                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Followers</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="font-black text-white text-xl">{shareModalProfile.following?.length || 0}</div>
                                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Following</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
                            <button 
                                onClick={async () => {
                                    const shareUrl = `${window.location.origin}${buildPublicUrl('profile', shareModalProfile.username, { lang: currentLanguage })}`;
                                    if (navigator.share) {
                                        try { await navigator.share({ title: 'Legacy Profile', url: shareUrl }); } catch (e) { }
                                    } else {
                                        navigator.clipboard.writeText(shareUrl);
                                        addToast(t('PROFILE_LINK_COPIED') || "Link copied!", "success");
                                    }
                                    setShareModalProfile(null);
                                }}
                                className="flex-1 bg-white text-black font-black py-3 rounded-[14px] flex items-center justify-center gap-2 hover:bg-gray-200"
                            >
                                <Icons.Share className="w-5 h-5" />
                                SHARE PROFILE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
