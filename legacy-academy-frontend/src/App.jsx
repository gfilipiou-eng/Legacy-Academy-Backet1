import React, { useState, useEffect, useRef, memo, useMemo, useCallback, startTransition } from 'react';
import { createPortal } from 'react-dom';
import EnhancedButton from './components/EnhancedButton';
// DEPLOYMENT_VERSION: V12_PORTAL_FIX

export const getActiveStreak = (u) => {
    if (!u || !u.missionsStreak || !u.lastMissionCompleted) return 0;
    const diffHours = Math.abs(new Date() - new Date(u.lastMissionCompleted)) / 3600000;
    return diffHours <= 48 ? u.missionsStreak : 0;
};

export const isTopStreak = (u) => {
    if (!u || u.isPrivate || !window.topStreakValue) return false;
    const streak = getActiveStreak(u);
    return streak > 0 && streak === window.topStreakValue;
};

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
import { WebsiteManager, PublicWebsiteViewer } from './components/WebsiteBuilder';
// --- CONFIG ---
const API_URL = axios.defaults.baseURL;
const BASE_URL = API_URL.replace('/api', '');
const APP_ASSET_VERSION = '20260620a';
const ASSET_PATHS = {
    favicon: `/favicon.png?v=${APP_ASSET_VERSION}`,
    applogo: `/Applogo.png?v=${APP_ASSET_VERSION}`,
    logo: `/logo.png?v=${APP_ASSET_VERSION}`,
    manifest: `/manifest.json?v=${APP_ASSET_VERSION}`,
};
const PUBLIC_PROFILE_CACHE_PREFIX = 'public-profile-cache-v3:';

// Wake up Render.com backend immediately
if (typeof window !== 'undefined') {
    const pingEndpoint = (axios.defaults.baseURL || '') + '/health';
    fetch(pingEndpoint).catch(() => {});
}

const upsertHeadLink = ({ rel, href, sizes, type = 'image/png' }) => {
    if (typeof document === 'undefined' || !rel || !href) return;
    const selector = sizes ? `link[rel="${rel}"][sizes="${sizes}"]` : `link[rel="${rel}"]`;
    let link = document.head.querySelector(selector);
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        if (sizes) link.setAttribute('sizes', sizes);
        document.head.appendChild(link);
    }
    if (type) link.setAttribute('type', type);
    link.setAttribute('href', href);
};

const applyHeadBranding = ({ title } = {}) => {
    if (typeof document === 'undefined') return;
    document.title = title || 'Legacy Academy Intel';
    upsertHeadLink({ rel: 'icon', sizes: '16x16', href: ASSET_PATHS.favicon });
    upsertHeadLink({ rel: 'icon', sizes: '32x32', href: ASSET_PATHS.favicon });
    upsertHeadLink({ rel: 'icon', sizes: '192x192', href: ASSET_PATHS.applogo });
    upsertHeadLink({ rel: 'icon', sizes: '512x512', href: ASSET_PATHS.applogo });
    upsertHeadLink({ rel: 'apple-touch-icon', sizes: '180x180', href: ASSET_PATHS.applogo });
    upsertHeadLink({ rel: 'manifest', href: ASSET_PATHS.manifest, type: 'application/manifest+json' });
};

const readPublicProfileCache = (username) => {
    if (typeof window === 'undefined' || !username) return null;
    try {
        const raw = window.sessionStorage.getItem(`${PUBLIC_PROFILE_CACHE_PREFIX}${username}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return {
            user: parsed.user || null,
            posts: Array.isArray(parsed.posts) ? parsed.posts : [],
        };
    } catch {
        return null;
    }
};

const writePublicProfileCache = (username, payload) => {
    if (typeof window === 'undefined' || !username || !payload) return;
    try {
        window.sessionStorage.setItem(`${PUBLIC_PROFILE_CACHE_PREFIX}${username}`, JSON.stringify({
            user: payload.user || null,
            posts: Array.isArray(payload.posts) ? payload.posts : [],
            cachedAt: Date.now(),
        }));
    } catch {
        // Ignore storage failures in private mode / quota errors.
    }
};

const GREEK_PHONETIC = {
    'a': 'α', 'b': 'β', 'c': 'ψ', 'd': 'δ', 'e': 'ε', 'f': 'φ', 'g': 'γ', 'h': 'η', 'i': 'ι', 'j': 'ξ', 'k': 'κ', 'l': 'λ', 'm': 'μ', 'n': 'ν', 'o': 'ο', 'p': 'π', 'q': 'θ', 'r': 'ρ', 's': 'σ', 't': 'τ', 'u': 'υ', 'v': 'ω', 'w': 'ς', 'x': 'χ', 'y': 'υ', 'z': 'ζ',
    'A': 'Α', 'B': 'Β', 'C': 'Ψ', 'D': 'Δ', 'E': 'Ε', 'F': 'Φ', 'G': 'Γ', 'H': 'Η', 'I': 'Ι', 'J': 'Ξ', 'K': 'Κ', 'L': 'Λ', 'M': 'Μ', 'N': 'Ν', 'O': 'Ο', 'P': 'Π', 'Q': 'Θ', 'R': 'Ρ', 'S': 'Σ', 'T': 'Τ', 'U': 'Υ', 'V': 'Ω', 'W': 'Σ', 'X': 'Χ', 'Y': 'Υ', 'Z': 'Ζ'
};

const resolveMediaUrl = (path, width = null, isAvatar = false, isPoster = false, isCover = false, cacheKey = null) => {
    if (!path) return '';
    let url = path;
    if (!path.startsWith('http') && !path.startsWith('blob:')) {
        url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    }
    // CLEANUP: If URL is just 'undefined' or 'null' as string (backend artifacts), treat as null
    const cleanUrl = String(url || '').trim();
    if (!cleanUrl || cleanUrl === 'undefined' || cleanUrl === 'null' || cleanUrl === '[object Object]') return null;

    // AUTO-OPTIMIZE CLOUDINARY
    if (cleanUrl.includes('cloudinary.com') && cleanUrl.includes('/upload/')) {
        const parts = cleanUrl.split('/upload/');
        if (parts.length < 2) return cleanUrl; // Ensure there's a path after /upload/
        // Only inject if not already transformed
        if (!parts[1].startsWith('c_') && !parts[1].startsWith('w_') && !parts[1].startsWith('so_') && !parts[1].startsWith('q_')) {
            const isVideo = cleanUrl.includes('/video/upload/');

            // 4K Background Support: Keep high quality for cover images
            if (isCover) {
                url = cleanUrl.replace(/\/upload\/.*?(v\d+\/)/i, '/upload/w_2000,c_limit,q_auto:best/$1');
            } else {
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
                } else if (width && !isNaN(width)) {
                    transform = `w_${Math.min(width, 1200)},c_limit,q_auto,${isVideo ? 'vc_auto' : 'f_auto'}`;
                } else {
                    transform = `c_limit,w_1920,q_auto:best,f_auto`;
                }

                url = parts[0] + '/upload/' + transform + '/' + parts[1];
            }
        }
    }

    // Add cache-busting parameter if provided
    if (cacheKey && url && !url.startsWith('blob:')) {
        const sep = url.includes('?') ? '&' : '?';
        url = `${url}${sep}v=${cacheKey}`;
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
            box-sizing: border-box;
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        *, *:before, *:after {
            box-sizing: inherit;
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

const formatDisplayUrl = (rawUrl) => {
    if (!rawUrl) return '';
    try {
        const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
        const host = parsed.hostname.replace(/^www\./i, '');
        const cleanPath = parsed.pathname.replace(/\/+$/, '') || '/';
        const shortPath = cleanPath === '/' ? '' : cleanPath.split('/').slice(0, 2).join('/');
        const suffix = cleanPath.length > 28 ? '...' : '';
        return `${host}${shortPath}${suffix}`;
    } catch {
        return String(rawUrl || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    }
};

const BACKGROUND_MODES = [
    { value: 'dark', labelKey: 'DARK_MODE', color: '#000000', className: 'bg-dark' },
    { value: 'dark-blue', labelKey: 'DARK_BLUE_MODE', color: '#050a14', className: 'bg-dark-blue' },
    { value: 'midnight', labelKey: 'MIDNIGHT_MODE', color: '#0a0a12', className: 'bg-midnight' },
    { value: 'purple-night', labelKey: 'PURPLE_NIGHT_MODE', color: '#0d0818', className: 'bg-purple-night' },
    { value: 'forest', labelKey: 'FOREST_MODE', color: '#051208', className: 'bg-forest' },
    { value: 'crimson', labelKey: 'CRIMSON_MODE', color: '#120508', className: 'bg-crimson' },
    { value: 'slate', labelKey: 'SLATE_MODE', color: '#0f1115', className: 'bg-slate' },
    { value: 'ocean', labelKey: 'OCEAN_MODE', color: '#041018', className: 'bg-ocean' },
    { value: 'obsidian', labelKey: 'OBSIDIAN_MODE', color: '#09090b', className: 'bg-obsidian' },
    { value: 'pink-aesthetic', labelKey: 'PINK_AESTHETIC_MODE', color: '#2a0919', className: 'bg-pink-aesthetic' },
    { value: 'razer-green', labelKey: 'RAZER_GREEN_MODE', color: '#041a08', className: 'bg-razer-green' },
];

const getBackgroundMode = (user) => user?.settings?.background || localStorage.getItem('backgroundMode') || 'dark-blue';

const getBackgroundEntry = (mode) => BACKGROUND_MODES.find((entry) => entry.value === mode) || BACKGROUND_MODES.find((entry) => entry.value === 'dark-blue') || BACKGROUND_MODES[0];

const getPostTextPreview = (text, maxLen = 110) => {
    if (!text) return '';
    const withoutUrls = String(text)
        .replace(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!withoutUrls) return 'Link post';
    if (withoutUrls.length <= maxLen) return withoutUrls;
    return `${withoutUrls.slice(0, maxLen).trim()}…`;
};

const isPostMediaPath = (value) => {
    const path = String(value || '').trim();
    if (!path || path === 'undefined' || path === 'null' || path === '[object Object]') return false;
    if (path.startsWith('blob:')) return true;
    if (path.includes('cloudinary.com') && (path.includes('/image/upload/') || path.includes('/video/upload/'))) return true;
    if (/^\/?uploads\//i.test(path) || path.includes('/uploads/')) return true;
    if (isYouTubeUrl(path)) return true;
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|mp4|mov|webm|avi|m4v)(\?|#|$)/i.test(path)) return true;
    if (/^https?:\/\//i.test(path)) return false;
    if (!path.startsWith('http')) return true;
    return false;
};

const postHasMedia = (post) => {
    if (!post) return false;
    return isPostMediaPath(post.image) || isPostMediaPath(post.videoUrl) || isPostMediaPath(post.thumbnailUrl);
};

const parseText = (text, onHashtagClick, onMentionClick) => {
    if (!text) return [];
    
    // First, split by URLs to protect them from hashtag splitting
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            const href = part.startsWith('http') ? part : `https://${part}`;
            const displayUrl = formatDisplayUrl(part);
            return (
                <a
                    key={`url-${i}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link-chip text-link-chip--url"
                    onClick={(e) => e.stopPropagation()}
                    title={href}
                >
                    <Icons.Link className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span className="truncate max-w-[240px] sm:max-w-[300px]">{displayUrl}</span>
                </a>
            );
        }
        
        // It's normal text, now we can safely parse hashtags and mentions
        const tagRegex = /([#@][\p{L}\p{N}_.]+)/gu;
        const subParts = part.split(tagRegex);
        
        return subParts.map((subPart, j) => {
            if (subPart.startsWith('#')) {
                return (
                    <span 
                        key={`tag-${i}-${j}`} 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (onHashtagClick) onHashtagClick(subPart);
                        }} 
                        className="text-link-chip text-link-chip--tag"
                    >
                        {subPart}
                    </span>
                );
            } else if (subPart.startsWith('@')) {
                return (
                    <span 
                        key={`tag-${i}-${j}`} 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (onMentionClick) onMentionClick(subPart.slice(1));
                        }} 
                        className="text-link-chip text-link-chip--mention"
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
    { value: '#39ff14', labelKey: 'COLOR_NEON_GREEN' },
    { value: '#3b82f6', labelKey: 'COLOR_BLUE' },
    { value: '#0ea5e9', labelKey: 'COLOR_WATER' },
    { value: '#10b981', labelKey: 'COLOR_GREEN' },
    { value: '#ff5500', labelKey: 'COLOR_ORANGE' },
    { value: '#a855f7', labelKey: 'COLOR_PURPLE' },
    { value: '#c0c0c0', labelKey: 'COLOR_METALLIC' },
];
const PROFILE_DESCRIPTOR_OPTIONS = [
    {
        value: 'entrepreneur',
        label: 'Entrepreneur',
        description: 'Building something big',
        Icon: Icons.Briefcase,
        accentClass: 'descriptor-entrepreneur'
    },
    {
        value: 'creator',
        label: 'Creator',
        description: 'Making content and ideas',
        Icon: Icons.Camera,
        accentClass: 'descriptor-creator'
    },
    {
        value: 'popular',
        label: 'Popular',
        description: 'Always in demand',
        Icon: Icons.Sparkles,
        accentClass: 'descriptor-popular'
    },
    {
        value: 'pet-lover',
        label: 'Dog Lover',
        description: 'Pets are family',
        Icon: Icons.PawPrint,
        accentClass: 'descriptor-pet-lover'
    },
    {
        value: 'community',
        label: 'Community',
        description: 'People first energy',
        Icon: Icons.Users,
        accentClass: 'descriptor-community'
    },
    {
        value: 'visionary',
        label: 'Visionary',
        description: 'Future focused mindset',
        Icon: Icons.Zap,
        accentClass: 'descriptor-visionary'
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
        .get(`/users/username/${encodeURIComponent(normalizedUsername)}`, { timeout: 3000 })
        .then((res) => {
            const user = res.data || null;
            founderAffiliationUserCache.set(normalizedUsername, user);
            // Cache for 10 minutes
            setTimeout(() => founderAffiliationUserCache.delete(normalizedUsername), 10 * 60 * 1000);
            return user;
        })
        .catch(() => null)
        .finally(() => {
            founderAffiliationPendingRequests.delete(normalizedUsername);
        });

    founderAffiliationPendingRequests.set(normalizedUsername, request);
    return request;
};

const FounderAffiliationBadge = ({ username, linkedUser, size = 'md', className = '', maxTextWidth, iconOnly = false }) => {
    const normalizedUsername = sanitizeAffiliation(username);
    if (!normalizedUsername) return null;

    const [resolvedLinkedUser, setResolvedLinkedUser] = useState(() => linkedUser || founderAffiliationUserCache.get(normalizedUsername) || null);
    const [isLoading, setIsLoading] = useState(() => !resolvedLinkedUser);

    useEffect(() => {
        let cancelled = false;
        if (linkedUser?._id || linkedUser?.profilePic || linkedUser?.username) {
            founderAffiliationUserCache.set(normalizedUsername, linkedUser);
            setResolvedLinkedUser(linkedUser);
            setIsLoading(false);
            return () => { };
        }

        const cachedUser = founderAffiliationUserCache.get(normalizedUsername);
        if (cachedUser) {
            setResolvedLinkedUser(cachedUser);
            setIsLoading(false);
            return () => { };
        }

        setIsLoading(true);
        fetchFounderAffiliationUser(normalizedUsername)
            .then((user) => {
                if (!cancelled) {
                    setResolvedLinkedUser(user || null);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setResolvedLinkedUser(null);
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [normalizedUsername, linkedUser]);

    // Request a 100px image for perfect clarity on a 24px circle (Retina/4K)
    const resolvedProfilePic = resolveMediaUrl(resolvedLinkedUser?.profilePic, 100, true);

    return (
        <div 
            onClick={(e) => {
                e.stopPropagation();
                window.location.href = founderAffiliationHref(normalizedUsername);
            }}
            className={`group inline-flex items-center gap-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-[24px] border border-white/10 pl-1.5 pr-4 py-1.5 rounded-[100px] shadow-sm transition-all duration-300 cursor-pointer select-none relative overflow-hidden ${className}`}
            title={`Affiliated with @${normalizedUsername}`}
        >
            {/* Liquid Glass Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* The Circular Avatar */}
            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/20 shadow-inner group-hover:scale-[1.03] transition-all duration-300 z-10">
                {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center bg-black/60 backdrop-blur-sm ">
                        <Icons.Loader className="w-3 h-3 text-white/50 animate-spin" />
                    </div>
                ) : resolvedProfilePic ? (
                    <img 
                        src={resolvedProfilePic} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        loading="lazy" 
                        decoding="async" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950">
                        <span className="text-[12px] font-bold text-white/80 transition-colors duration-500">
                            {(resolvedLinkedUser?.username || normalizedUsername)[0]?.toUpperCase() || '@'}
                        </span>
                    </div>
                )}
            </div>
            
            {/* The Text Info */}
            <div className="flex flex-col justify-center relative z-10 pt-0.5 pb-[2px]">
                <span className="text-[8px] font-bold text-white/50 uppercase tracking-[0.2em] leading-tight mb-0.5">
                    Affiliated
                </span>
                <span className="text-[12px] sm:text-[13px] font-black text-white/95 leading-tight tracking-wide">
                    @{normalizedUsername}
                </span>
            </div>
        </div>
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
                        <div className="flex items-center justify-between p-4 bg-white/5  rounded-none ">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-none bg-white" />
                                <span className="text-xs font-black text-white uppercase tracking-widest">{t('VOICE_NOTE_READY')}</span>
                            </div>
                            <button onClick={() => setAudioBlob(null)} className="p-2 rounded-none"><Icons.Trash className="w-5 h-5 text-red-500" /></button>
                        </div>
                    ) : isRecording ? (
                        <div className="flex items-center justify-between p-5 bg-red-600 border border-red-500 rounded-none ">
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
        <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center text-white relative overflow-hidden">
            {name ? <span className={`${size === "large" ? "text-3xl" : "text-sm"} font-black uppercase select-none text-white/50`}>{name.substring(0, 1)}</span> : <Icons.User className={`${size === "large" ? "w-10 h-10" : "w-1/2 h-1/2"} opacity-40 text-white`} />}
        </div>
    );
};

const ProfileAvatar = ({ user, size = "normal", className, onClick, priority = false, cacheKey = null }) => {
    const [imgError, setImgError] = useState(false);

    if (!user || typeof user !== 'object') return <DefaultAvatar size={size} />;

    const rawUrl = user.profilePic || user.fromProfilePic;
    const name = user.username || user.fromUsername;

    // Reset error state if url or cache key changes
    useEffect(() => { setImgError(false); }, [String(rawUrl || ''), cacheKey]);

    const mediaUrl = resolveMediaUrl(rawUrl, size === 'large' ? 600 : 300, !String(rawUrl || '').includes('/video/upload/'), false, false, cacheKey);
    const isVideo = rawUrl && (rawUrl.match(/\.(mp4|mov|webm)($|\?)/i) || rawUrl.includes('/video/upload/')) && mediaUrl;

    const isFounder = user?.role === 'Founder';
    let baseClass = 'w-full h-full object-cover rounded-full';
    if (className) {
        baseClass = `${baseClass} ${className}`;
    }
    const finalClassName = baseClass.replace(/rounded-none/g, '');

    if (imgError || !mediaUrl) return <DefaultAvatar name={name} size={size} />;

    if (isVideo) {
        return (
            <div className={`w-full h-full bg-gray-900 ${finalClassName}`} onClick={onClick}>
                <div className={`w-full h-full relative overflow-hidden bg-black ${finalClassName}`}>
                    <video
                        src={mediaUrl}
                        className={`w-full h-full object-cover pointer-events-none ${finalClassName}`}
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
            decoding={priority ? 'sync' : 'async'}
            alt=""
            onError={() => setImgError(true)}
        />
    ) : (
        <div className={`w-full h-full overflow-hidden ${finalClassName}`}>
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
            const menuWidth = 180;
            let left = rect.right - menuWidth;
            // Ensure menu doesn't go off-screen on left
            if (left < 8) left = 8;
            // Ensure menu doesn't go off-screen on right
            const maxLeft = window.innerWidth - menuWidth - 8;
            if (left > maxLeft) left = maxLeft;
            setCoords({ top: rect.bottom + 8, left });
        }
        setShowMenu(!showMenu);

    };

    return (
        <div className="relative shrink-0 z-30">
            <button ref={btnRef} onClick={toggle} className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-85 liquid-glass-control">
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
                        className="w-[180px] liquid-glass-video-panel rounded-2xl overflow-hidden flex flex-col gap-1 p-2 animate-fade-in"
                    >
                        {isOwner && (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(post); setShowMenu(false); }} className="flex items-center gap-3 p-3 rounded-xl w-full text-left group/item transition-all hover:bg-white/10 active:scale-95">
                                <Icons.Edit className="w-5 h-5 text-blue-400 group-hover/item:scale-110" />
                                <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{t('EDIT')}</span>
                            </button>
                        )}
                        {canDelete && (
                            <button onClick={(e) => { e.stopPropagation(); onDelete(post._id); setShowMenu(false); }} className="flex items-center gap-3 p-3 rounded-xl w-full text-left group/item transition-all hover:bg-red-500/10 active:scale-95">
                                <Icons.Trash className="w-5 h-5 text-red-500 group-hover/item:scale-110" />
                                <span className="text-xs font-black text-red-500 uppercase tracking-widest">{t('DELETE')}</span>
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

const VerifiedBadge = ({ isFounder, className = "w-4 h-4", forceGold = false, isUser = false, user }) => {
    // If user settings specify showBadge is false, don't show the badge!
    if (user && user.settings && user.settings.showBadge === false) {
        return null;
    }

    // Check role from user object if available, otherwise fall back to isFounder
    const resolvedRole = user?.role || (isFounder && !isUser ? 'Founder' : 'User');
    const isGold = (resolvedRole === 'Founder' || forceGold);
    let isHolo = false;
    let isMetallic = false;

    // Default to intense 3D Blue (X Platform style)
    let baseColor = '#2F80ED'; // Intense bright blue
    let darkColor = '#1CB5E0'; // Cyan/Blue gradient
    let gradId = 'blue3DGrad';

    if (isGold) {
        baseColor = '#F6E27A';
        darkColor = '#CB9B51';
        gradId = 'gold3DGrad';
    }

    // Apply custom badge color from settings if available
    if (user?.settings?.badgeColor) {
        const customColor = user.settings.badgeColor;
        if (customColor === 'gold') { baseColor = '#F6E27A'; darkColor = '#CB9B51'; gradId = 'gold3DGrad'; }
        else if (customColor === 'crimson') { baseColor = '#FF0844'; darkColor = '#93001E'; gradId = 'crimson3DGrad'; }
        else if (customColor === 'neon-purple') { baseColor = '#B026FF'; darkColor = '#590FB7'; gradId = 'purple3DGrad'; }
        else if (customColor === 'blue') { baseColor = '#2F80ED'; darkColor = '#1CB5E0'; gradId = 'blue3DGrad'; }
        else if (customColor === 'metal-blue') { baseColor = '#00B4DB'; darkColor = '#0083B0'; gradId = 'metalBlueGrad'; isMetallic = true; }
        else if (customColor === 'holographic') isHolo = true;
        else if (customColor === 'live-gold' && resolvedRole === 'Founder') {
            isMetallic = true;
        }
    }

    if (isMetallic) {
        const isBlue = user?.settings?.badgeColor === 'metal-blue';
        const stops = isBlue
            ? [
                { offset: "0%", color: "#0F2027" },
                { offset: "25%", color: "#203A43" },
                { offset: "50%", color: "#00E1FF" },
                { offset: "75%", color: "#2C5364" },
                { offset: "100%", color: "#0F2027" }
              ]
            : [
                { offset: "0%", color: "#bf953f" },
                { offset: "25%", color: "#fcf6ba" },
                { offset: "50%", color: "#b38728" },
                { offset: "75%", color: "#fbf5b7" },
                { offset: "100%", color: "#aa771c" }
              ];
              
        return (
            <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0 drop-shadow-sm`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id={isBlue ? "metalBlueGrad" : "metalGoldGrad"} x1="0%" y1="0%" x2="100%" y2="100%">
                        {stops.map((stop, i) => <stop key={i} offset={stop.offset} stopColor={stop.color} />)}
                    </linearGradient>
                </defs>
                <circle cx="11" cy="11" r="6" fill="#ffffff" />
                <path fill={isBlue ? "url(#metalBlueGrad)" : "url(#metalGoldGrad)"} d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
            </svg>
        );
    }

    if (isHolo) {
        return (
            <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="holoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff007f" />
                        <stop offset="25%" stopColor="#7f00ff" />
                        <stop offset="50%" stopColor="#00f0ff" />
                        <stop offset="75%" stopColor="#00ff7f" />
                        <stop offset="100%" stopColor="#ff007f" />
                    </linearGradient>
                </defs>
                <circle cx="11" cy="11" r="6" fill="#ffffff" />
                <path
                    fill="url(#holoGrad)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="0.5"
                    d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0 drop-shadow-sm`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={darkColor} />
                    <stop offset="100%" stopColor={baseColor} />
                </linearGradient>
            </defs>
            {/* White backdrop for the checkmark cutout */}
            <circle cx="11" cy="11" r="6" fill="#ffffff" />
            <path
                fill={`url(#${gradId})`}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.5"
                d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
            />
        </svg>
    );
};

const playCyberSFX = (type = 'click') => {
    if (localStorage.getItem('cyberSFX') === 'false') return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        if (type === 'click' || type === 'menu') {
            // Premium luxury sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
            
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
            
            // Add a slight high-frequency "glass" chime
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1200, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.1);
            gain2.gain.setValueAtTime(0, ctx.currentTime);
            gain2.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.01);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.1);
        } else if (type === 'success') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            osc.frequency.setValueAtTime(800, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        }
    } catch (e) {}
};

const MatrixBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const columns = Math.floor(canvas.width / 20);
        const yPositions = Array(columns).fill(0);
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZΛΞC';

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#D4AF37'; // Gold
            ctx.font = '12px monospace';

            for (let i = 0; i < yPositions.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * 20;
                const y = yPositions[i];
                ctx.fillText(char, x, y);

                if (y > 100 + Math.random() * 10000) {
                    yPositions[i] = 0;
                } else {
                    yPositions[i] += 20;
                }
            }
            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none z-0" />;
};

const NeuralNarratorButton = ({ text }) => {
    const [speaking, setSpeaking] = useState(false);

    const handleNarrate = (e) => {
        e.stopPropagation();
        playCyberSFX('click');
        if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            return;
        }

        const cleanText = String(text || '').replace(/#\w+/g, '').replace(/@\w+/g, '').trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        
        utterance.rate = 1.05;
        utterance.pitch = 0.95;

        setSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    return (
        <button
            onClick={handleNarrate}
            className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest hover:underline flex items-center gap-1.5 transition-all ${speaking ? 'text-[var(--gold-primary)] opacity-100 ' : 'text-white opacity-60 hover:opacity-100'}`}
        >
            {speaking ? (
                <>
                    <Icons.Volume2 className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                    Narrating...
                </>
            ) : (
                <>
                    <Icons.VolumeX className="w-3.5 h-3.5" />
                    Narrate
                </>
            )}
        </button>
    );
};

const CommentItem = memo(({ comment, post, user, allUsers, onEdit, onDelete, t = (k) => k, lang, onViewProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [translatedText, setTranslatedText] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const currentCommentAuthorId = comment.authorId || comment.user?._id || comment.userId;
    const isCommentAuthor = isSameId(currentCommentAuthorId, user?._id);
    const postAuthorId = post.author?._id || post.author;

    const foundUserInList = allUsers?.find(u => isSameId(u._id, currentCommentAuthorId));
    const commentAuthor = isCommentAuthor
        ? user
        : (foundUserInList || comment.user || { username: comment.authorName, profilePic: comment.authorProfilePic });
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
        <div
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`x-comment relative group ${menuOpen ? 'z-50' : 'z-10'}`}
        >
            {/* Avatar */}
            <div
                className="x-comment__avatar"
                onClick={() => onViewProfile && onViewProfile(commentAuthor)}
            >
                <ProfileAvatar user={commentAuthor} />
            </div>

            {/* Body */}
            <div className="x-comment__body pr-7">

                {/* Header: Name + Badge + Handle + Dot + Time */}
                <div className="x-comment__header flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
                    <span
                        className="x-comment__username font-bold text-[14px] text-white hover:underline cursor-pointer truncate max-w-[120px] sm:max-w-[160px] shrink-0"
                        onClick={() => onViewProfile && onViewProfile(commentAuthor)}
                    >
                        {commentAuthor?.username || 'User'}
                    </span>
                    <VerifiedBadge isFounder={isFounder} isUser={!isFounder} className="w-3.5 h-3.5 shrink-0" user={commentAuthor} />
                    <span className="text-[13px] text-white/40 truncate max-w-[100px] sm:max-w-none shrink">
                        {`@${String(commentAuthor?.username || 'user').toLowerCase().replace(/\s+/g, '')}`}
                    </span>
                    <span className="x-comment__dot">·</span>
                    <span className="x-comment__time"><CyberDate date={comment.createdAt} t={t} lang={lang} /></span>
                </div>

                {/* Edit mode */}
                {isEditing ? (
                    <div className="w-full mt-2">
                        <textarea
                            autoFocus
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            className="w-full bg-transparent border border-white/15 rounded-xl px-3 py-2.5 text-[15px] text-white outline-none mb-2 focus:border-white/35 min-h-[72px] resize-none leading-relaxed"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-1.5 rounded-full border border-white/15 text-[12px] font-bold text-white/60 hover:text-white hover:border-white/30 active:scale-95 uppercase tracking-wide transition-all cursor-pointer"
                            >
                                {t('CANCEL')}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-1.5 rounded-full bg-white text-[12px] font-bold text-black hover:bg-gray-200 active:scale-95 uppercase tracking-wide transition-all cursor-pointer"
                            >
                                {t('SAVE')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Comment text */}
                        {comment.text && (
                            <p className="x-comment__text">
                                {parseText(translatedText || comment.text, null, (username) => {
                                    const u = allUsers?.find(u => String(u.username).toLowerCase() === String(username).toLowerCase());
                                    if (u && onViewProfile) onViewProfile(u);
                                })}
                            </p>
                        )}

                        {/* Voice note */}
                        {comment.audioUrl && (
                            <div className="flex flex-col gap-1 mt-1 mb-2 w-full">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" /> {t('VOICE_NOTE')}
                                </div>
                                <VoiceNotePlayer src={resolveMediaUrl(comment.audioUrl)} t={t} />
                            </div>
                        )}

                        {/* Translate link */}
                        {comment.text && comment.text.length > 3 && (
                            <div className="mt-1 flex items-center">
                                <button
                                    type="button"
                                    onClick={handleTranslate}
                                    disabled={isTranslating}
                                    className="text-[12px] font-medium text-[#1d9bf0] hover:underline transition-all flex items-center gap-1 cursor-pointer touch-manipulation disabled:opacity-50"
                                >
                                    <Icons.Globe className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                                    <span>{isTranslating ? '...' : (translatedText ? t('SHOW_ORIGINAL') : t('SEE_TRANSLATION'))}</span>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Options Dropdown / Bottom Sheet (Edit/Delete) */}
            {(canEdit || canDelete) && !isEditing && (
                <div className="absolute right-0 top-2.5 z-30">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(!menuOpen);
                        }}
                        className="p-1.5 rounded-full text-white/30 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer touch-manipulation"
                        aria-label="Comment actions"
                    >
                        <Icons.MoreHorizontal className="w-4 h-4" />
                    </button>

                    {menuOpen && (
                        <>
                            {/* Backdrop to close the menu on tap/click outside */}
                            <div
                                className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm cursor-default"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                }}
                            />

                            {/* Dropdown / Bottom Sheet Menu */}
                            <div className="fixed bottom-0 left-0 right-0 w-full bg-[#0f1419] border-t border-white/10 rounded-t-3xl py-4 shadow-2xl z-[99999] animate-in slide-in-from-bottom duration-200 pr-10">
                                {/* Grab handle for mobile bottom sheet */}
                                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

                                {/* Close X button */}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                                    className="absolute top-2 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 text-white/60 transition-colors"
                                    aria-label="Close"
                                >
                                    <Icons.X className="w-4 h-4" />
                                </button>

                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            setIsEditing(true);
                                            setEditText(comment.text || '');
                                        }}
                                        className="w-full px-5 py-3 text-left text-base font-bold text-white hover:bg-white/5 active:bg-white/10 transition-colors flex items-center gap-3 cursor-pointer touch-manipulation"
                                    >
                                        <Icons.Edit className="w-5 h-5 text-white/60" />
                                        <span>{t('EDIT') || 'Edit'}</span>
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onDelete?.(post._id, comment._id);
                                        }}
                                        className="w-full px-5 py-3 text-left text-base font-bold text-red-500 hover:bg-red-500/10 active:bg-red-500/25 transition-colors flex items-center gap-3 border-t border-white/[0.06] cursor-pointer touch-manipulation"
                                    >
                                        <Icons.Trash className="w-5 h-5" />
                                        <span>{t('DELETE') || 'Delete'}</span>
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
});

const PostDetailModal = ({ post, user, allUsers, onClose, onLike, onDislike, onRepost, onOpenChat, onComment, onDelete, onEdit, onDeleteComment, onEditComment, onShare, loadingActions, onClearComments, onViewProfile, onHashtagClick }) => {
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
    const [zoomImage, setZoomImage] = useState(null);

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
        <div className="fixed inset-0 z-[2500] bg-black/98 backdrop-blur-md flex flex-col items-center justify-start md:justify-center p-0 md:p-4 overflow-hidden duration-300" onClick={onClose}>
            <button onClick={onClose} className="fixed top-4 right-4 p-3 bg-transparent hover:bg-white/10 hover:scale-105 active:scale-95 rounded-full z-[2600] transition-all duration-300 group">
                <Icons.X className="w-6 h-6 text-red-500 group-hover:text-red-400 group-hover:rotate-90 transition-all duration-300" />
            </button>
            <div className="w-full max-w-6xl h-[100dvh] md:h-[90vh] bg-[#050505]/95 backdrop-blur-md rounded-none flex flex-col md:flex-row border-none md:border md:border-white/10 shrink-0 my-auto transform-gpu relative shadow-[0_15px_50px_rgba(0,0,0,0.8)]" onClick={(e) => e.stopPropagation()}>
                {/* Image Section */}
                <div className="w-full md:flex-1 bg-black flex items-center justify-center relative shadow-inner overflow-hidden h-[50vh] md:h-full shrink-0">
                    {postHasMedia(post) ? (
                        (post.videoUrl || (post.image && post.image.match(/\.(mp4|mov|webm)$/i))) ? (
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
                                    className="max-w-full max-h-full object-contain cursor-zoom-in"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setZoomImage(resolveMediaUrl(post.image || post.thumbnailUrl, null, false, false));
                                    }}
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
                    ) : (
                        <div className="p-10 text-center text-lg sm:text-2xl text-white bg-black w-full h-full flex items-center justify-center">
                            <p className="font-medium leading-relaxed break-words whitespace-pre-wrap max-w-prose">
                                {parseText(post.desc, (tag) => onHashtagClick?.(tag), (username) => {
                                    const u = allUsers?.find(u => String(u.username).toLowerCase() === String(username).toLowerCase());
                                    if (u && onViewProfile) onViewProfile(u);
                                })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="w-full md:w-[450px] flex flex-col bg-black/40 backdrop-blur-md border-l border-white/5 flex-1 min-h-0 md:h-full relative font-sans">
                    <div className="p-3 sm:p-4 border-b border-white/10 flex items-center justify-between bg-transparent shrink-0 relative z-50 gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-11 h-11 relative group shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); onViewProfile(author); }}>
                                <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-500"></div>
                                <div className="absolute inset-[2.5px] rounded-full overflow-hidden">
                                    <ProfileAvatar user={author} />
                                </div>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1 pr-2">
                                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                                    <span className="font-bold text-white text-[14px] leading-tight break-words">{author?.username}</span>
                                    {getActiveStreak(author) > 0 && <span className="text-orange-500 font-bold text-xs shrink-0 flex items-center">🔥{getActiveStreak(author)}{isTopStreak(author) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}
                                    <VerifiedBadge isFounder={author?.role === 'Founder'} isUser={author?.role !== 'Founder'} className="w-4 h-4 shrink-0" user={author} />
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
                                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-colors active:scale-95 touch-manipulation cursor-pointer select-none action-btn-comment text-gray-500 md:hover:bg-[#1D9BF0]/10 md:hover:text-[#1D9BF0] active:bg-[#1D9BF0]/20 active:text-[#1D9BF0]"
                                >
                                    <Icons.MessageSquare className="w-5 h-5" />
                                    <span className="text-[12px] font-bold tabular-nums tracking-wide">{post.comments?.length || 0}</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRepost?.(post._id); }}
                                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-colors active:scale-95 touch-manipulation cursor-pointer select-none action-btn-repost ${post.reposts?.some(id => isSameId(id, user?._id)) ? 'text-[#00BA7C]' : 'text-gray-500 md:hover:bg-[#00BA7C]/10 md:hover:text-[#00BA7C] active:bg-[#00BA7C]/20 active:text-[#00BA7C]'}`}
                                >
                                    <Icons.RefreshCcw className={`w-5 h-5 transition-transform ${post.reposts?.some(id => isSameId(id, user?._id)) ? 'scale-110' : ''}`} />
                                    <span className="text-[12px] font-bold tabular-nums tracking-wide">{post.reposts?.length || 0}</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onLike(post._id); }}
                                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-colors active:scale-95 touch-manipulation cursor-pointer select-none action-btn-like ${post.likes?.some(id => isSameId(id, user?._id)) ? 'text-[#F91880]' : 'text-gray-500 md:hover:bg-[#F91880]/10 md:hover:text-[#F91880] active:bg-[#F91880]/20 active:text-[#F91880]'}`}
                                >
                                    <Icons.Heart className={`w-5 h-5 transition-transform ${post.likes?.some(id => isSameId(id, user?._id)) ? 'fill-current scale-110' : ''}`} />
                                    <span className="text-[12px] font-bold tabular-nums tracking-wide">{post.likes?.length || 0}</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDislike(post._id); }}
                                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-colors active:scale-95 touch-manipulation cursor-pointer select-none action-btn-dislike ${post.dislikes?.some(id => isSameId(id, user?._id)) ? 'text-purple-500' : 'text-gray-500 md:hover:bg-purple-500/10 md:hover:text-purple-500 active:bg-purple-500/20 active:text-purple-500'}`}
                                >
                                    <Icons.ThumbsDown className={`w-5 h-5 transition-transform ${post.dislikes?.some(id => isSameId(id, user?._id)) ? 'fill-current scale-110' : ''}`} />
                                    <span className="text-[12px] font-bold tabular-nums tracking-wide">{post.dislikes?.length || 0}</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-3 w-full">
                                <div className="w-10 h-10 relative group shrink-0">
                                    <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-500"></div>
                                    <div className="absolute inset-[2.5px] rounded-full overflow-hidden">
                                        <ProfileAvatar user={user} />
                                    </div>
                                </div>
                                {isRecordingComment ? (
                                    <div className="flex-1 min-w-0 bg-black/80 text-white border border-white/20 rounded-2xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 pl-1 shrink-0">
                                            <div className="w-3 h-3 rounded-full bg-red-500 " />
                                            <span className="text-[11px] font-bold text-white uppercase tracking-widest">{t('TRANSMITTING')}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => stopRecording(true)} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-150 sturdy-active touch-manipulation"><Icons.X className="w-5 h-5" /></button>
                                            <button onClick={() => stopRecording(false)} className="px-4 py-2 rounded-full bg-white text-black font-bold text-[11px] uppercase tracking-widest hover:brightness-90 transition-all duration-150 sturdy-active touch-manipulation">{t('STOP')}</button>
                                        </div>
                                    </div>
                                ) : commentAudio ? (
                                    <div className="flex-1 min-w-0 flex items-center justify-between px-3 bg-black/80 border border-white/20 rounded-2xl p-2">
                                        <div className="flex items-center gap-2 pl-2 min-w-0">
                                            <div className="w-2.5 h-2.5 rounded-full bg-white  shrink-0" />
                                            <span className="text-[11px] font-bold text-white uppercase tracking-widest truncate">{t('VOICE_NOTE_READY')}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => setCommentAudio(null)} className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-150 sturdy-active touch-manipulation">
                                                <Icons.X className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => {
                                                const fd = new FormData(); fd.append('file', commentAudio, 'voice.webm');
                                                if (commentText.trim()) fd.append('text', commentText.trim());
                                                onComment(post._id, fd); setCommentAudio(null); setCommentText('');
                                            }} className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-black hover:brightness-90 transition-all duration-150 sturdy-active touch-manipulation">
                                                <Icons.Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={(e) => { e.preventDefault(); if (commentText.trim()) { onComment(post._id, commentText); setCommentText(''); } }} className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden min-h-[48px]">
                                        <input
                                            id={`comment-input-${post._id}`}
                                            placeholder={t('FOUNDER_PLACEHOLDER')}
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            className="flex-1 min-w-0 bg-transparent py-3 px-4 text-base text-white outline-none placeholder-gray-500 font-medium"
                                        />
                                        <div className="flex gap-1 pr-2 shrink-0">
                                            <button type="button" onClick={toggleCommentRecording} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-150 ${isRecordingComment ? 'bg-red-500 text-white ' : 'text-gray-400 hover:text-white hover:bg-white/10'} sturdy-active touch-manipulation`}>
                                                <Icons.Mic className="w-5 h-5" />
                                            </button>
                                            <button type="submit" disabled={!commentText.trim()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black disabled:opacity-25 hover:brightness-90 transition-all duration-150 sturdy-active touch-manipulation shrink-0">
                                                <Icons.Send className="w-5 h-5" />
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
                                        if (onHashtagClick) onHashtagClick(tag);
                                    }, (username) => {
                                        onClose();
                                        const u = allUsers?.find(u => String(u.username).toLowerCase() === String(username).toLowerCase());
                                        if (u && onViewProfile) onViewProfile(u);
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
                            <div className="w-full animate-fade-in border-t border-white/[0.06] mt-2">
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

            {/* FULL SCREEN IMAGE ZOOM MODAL FOR POST DETAIL */}
            {zoomImage && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={(e) => { e.stopPropagation(); setZoomImage(null); }}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); setZoomImage(null); }} 
                        className="absolute top-4 right-4 p-3 bg-transparent hover:bg-white/10 hover:scale-105 active:scale-95 rounded-full transition-all duration-300 z-50 group"
                    >
                        <Icons.X className="w-6 h-6 text-red-500 group-hover:text-red-400 group-hover:rotate-90 transition-all duration-300" />
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
    const [videoError, setVideoError] = useState(false);
    const playerUniqueId = useMemo(() => `yt-${Math.random().toString(36).substr(2, 9)}`, []);

    const ytId = getYouTubeId(src);

    // Reset video error when src changes
    useEffect(() => {
        setVideoError(false);
    }, [src]);

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

    if (videoError) {
        return (
            <div className={`relative flex items-center justify-center bg-white/5 ${className || ''}`}>
                <div className="w-full h-40 flex flex-col items-center justify-center text-gray-600 gap-2">
                    <Icons.Image className="w-8 h-8 opacity-20" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Media Expired</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative group/video overflow-hidden flex items-center justify-center pointer-events-auto ${className?.includes('liquid-glass-video-panel') ? 'liquid-glass-video-panel' : 'bg-black'} ${className || ''}`}
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
                            onError={() => setVideoError(true)}
                            className="w-full h-auto object-contain cursor-pointer max-h-[75vh] md:max-h-[85vh] duration-500 will-change-transform transform-gpu"
                        />
                    )}
                </div>
            )}

            {/* NEURAL OVERLAY - ALWAYS VISIBLE OVER EVERYTHING */}
            <>
                {(isHovered || !isPlaying || isDragging) && (
                    <div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/30 flex flex-col justify-between p-4 pointer-events-none z-20"
                    >
                        <div className="flex flex-col items-start gap-4">
                            <div className="flex justify-start items-start gap-2.5">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleMute(e); }}
                                    className="p-3 rounded-2xl liquid-glass-control text-white pointer-events-auto group/btn"
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
                                        className="p-3 rounded-2xl liquid-glass-control text-white pointer-events-auto group/btn"
                                    >
                                        <Icons.Maximize className="w-5 h-5 group-hover/btn:scale-110 " />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <button
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={(e) => { e.stopPropagation(); togglePlay(e); }}
                                className="w-16 h-16 rounded-full liquid-glass-control flex items-center justify-center text-black shadow-2xl pointer-events-auto"
                            >
                                {isPlaying ? <Icons.Pause className="w-8 h-8 fill-white" /> : <Icons.Play className="w-8 h-8 fill-white ml-1" />}
                            </button>
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
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--gold-primary)] to-[#ffea70] rounded-full"
                                    style={{ width: `${progress}%` }}
                                    transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                                />
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover/seek:scale-100 hidden sm:block"
                                    style={{ left: `${progress}%`, marginLeft: '-6px' }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </>
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
        <div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-all duration-200 mb-2.5 group ${
                note.read ? 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10' : 'bg-white/[0.03] border-[var(--gold-primary)]/15 hover:bg-white/[0.05] hover:border-[var(--gold-primary)]/30'
            }`}
            onClick={handleClick}
        >
            <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 relative">
                    <ProfileAvatar user={{ username: note.fromUsername, profilePic: note.fromProfilePic }} />
                </div>
                {note.type === 'like' && (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 border border-black shadow-lg">
                        <Icons.Heart className="w-2.5 h-2.5 text-white fill-current" />
                    </div>
                )}
                {note.type === 'comment' && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border border-black shadow-lg">
                        <Icons.MessageSquare className="w-2.5 h-2.5 text-white fill-current" />
                    </div>
                )}
                {note.type === 'message' && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border border-black shadow-lg">
                        <Icons.Mail className="w-2.5 h-2.5 text-white" />
                    </div>
                )}
                {note.type === 'follow' && (
                    <div className="absolute -bottom-1 -right-1 bg-[var(--gold-primary)] rounded-full p-1 border border-black shadow-lg">
                        <Icons.UserPlus className="w-2.5 h-2.5 text-black" />
                    </div>
                )}
                {note.type === 'follow_request' && (
                    <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1 border border-black shadow-lg">
                        <Icons.Shield className="w-2.5 h-2.5 text-white" />
                    </div>
                )}
                {note.type === 'security_alert' && (
                    <div className="absolute -bottom-1 -right-1 bg-orange-500 rounded-full p-1 border border-black shadow-lg ">
                        <Icons.ShieldCheck className="w-2.5 h-2.5 text-white" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-white uppercase tracking-tight text-xs sm:text-sm">
                        {(note.fromUsername && note.fromUsername !== 'Unknown' && note.fromUsername !== 'Someone') ? note.fromUsername : 'Agent'}
                    </span>
                    <VerifiedBadge isFounder={isFounderSender} isUser={!isFounderSender} className="w-3.5 h-3.5" user={note.sender} />
                    {getActiveStreak(note?.sender) > 0 && (
                        <span className="text-orange-500 font-bold text-[11px] shrink-0 flex items-center">🔥{getActiveStreak(note?.sender)}{isTopStreak(note?.sender) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>
                    )}
                    {note.sender?.profileDescriptor && PROFILE_DESCRIPTOR_MAP[note.sender.profileDescriptor] ? (
                        <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 backdrop-blur-xl text-[9px] font-black uppercase tracking-wider shrink-0 ${PROFILE_DESCRIPTOR_MAP[note.sender.profileDescriptor].accentClass.replace(/rounded-none/g, '').replace(/!/g, '')}`}>
                            {React.createElement(PROFILE_DESCRIPTOR_MAP[note.sender.profileDescriptor].Icon, { className: "w-2.5 h-2.5 shrink-0" })}
                            <span className="text-[9px] font-black uppercase tracking-[0.12em]">{t(`DESC_${note.sender.profileDescriptor.toUpperCase()}`, PROFILE_DESCRIPTOR_MAP[note.sender.profileDescriptor].label)}</span>
                        </div>
                    ) : (note?.fromDescriptor && (
                        <span className="text-[9px] text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest shrink-0">
                            {t(`DESC_${note.fromDescriptor.toUpperCase()}`, note.fromDescriptor)}
                        </span>
                    ))}

                </div>

                <div className="text-[11px] sm:text-xs text-gray-300 mt-1 uppercase font-bold tracking-wider leading-snug">
                    {note.type === 'follow' ? t('NOTIF_FOLLOW') :
                        note.type === 'like' ? t('NOTIF_LIKE') :
                            note.type === 'comment' ? t('NOTIF_COMMENT') :
                                note.type === 'message' ? t('NOTIF_MESSAGE') :
                                    note.type === 'mention' ? t('NOTIF_MENTION') :
                                        note.type === 'security_alert' ? (lang === 'el' ? 'ΑΝΕΥΡΕΣΗ ΑΝΩΜΑΛΙΑΣ' : 'SECURITY ANOMALY DETECTED') :
                                            note.type === 'follow_request' ? t('NOTIF_REQUEST') : ''}
                </div>

                {note.text && (
                    <div className="text-xs text-gray-400 mt-1.5 p-2 bg-white/[0.02] border border-white/5 rounded-lg italic font-medium max-w-full truncate">
                        "{note.text}"
                    </div>
                )}

                <div className="flex items-center gap-3 mt-2">
                    <CyberDate date={note.createdAt} t={t} lang={lang} />
                    {!note.read && (
                        <span className="text-[8px] font-black uppercase text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 px-1.5 py-0.5 rounded border border-[var(--gold-primary)]/20">NEW</span>
                    )}
                </div>

                {note.type === 'follow_request' && (
                    <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => onAcceptRequest(note.sender?._id || note.from, note._id)} className="flex-1 py-1.5 bg-[var(--gold-primary)] text-black text-[10px] font-black rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform uppercase tracking-widest">{t('ACCEPT')}</button>
                        <button onClick={() => onRejectRequest(note.sender?._id || note.from, note._id)} className="flex-1 py-1.5 bg-white/5 text-gray-400 text-[10px] font-black rounded-lg hover:bg-white/10 uppercase tracking-widest">{t('REJECT')}</button>
                    </div>
                )}
            </div>

            {note.postImage && (
                <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden shrink-0 transition-transform group-hover:scale-105">
                    <img 
                        src={resolveMediaUrl(note.postImage)} 
                        className="w-full h-full object-cover opacity-80" 
                        onError={(e) => { e.target.style.display = 'none'; }} 
                        alt=""
                    />
                </div>
            )}
        </div>
    );
});

const StoriesBar = ({ stories, user, onAddStory, onViewStory, imgKey }) => {
    const { t } = useTranslation(user);
    const storySizeClass = 'w-[74px] h-[74px] sm:w-[76px] sm:h-[76px]';
    return (
        <div className="flex gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar py-3.5 px-3 sm:px-4 border-b border-white/5 bg-transparent">
            {/* CURRENT USER ADD STORY */}
            <div onClick={onAddStory} className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0">
                <div className={`${storySizeClass} rounded-full relative group border-2 border-dashed border-white/25 bg-white/[0.03]`}>
                    <div className="absolute inset-[3px] rounded-full overflow-hidden bg-[#050505]">
                        <ProfileAvatar user={user} className="object-cover w-full h-full" key={imgKey} cacheKey={imgKey} />
                        <div className="absolute inset-0 bg-black/30" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 group-active:scale-95 transition-all duration-300">
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
                const authorName = s.author?.username || 'Agent';
                const hasStoryMedia = postHasMedia(s);
                const storyMediaUrl = hasStoryMedia ? (s.thumbnailUrl || s.image || s.videoUrl) : null;

                return (
                    <div key={s._id || i} onClick={() => onViewStory(s)} className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group">
                        <div className={`${storySizeClass} rounded-full p-[2.5px] bg-gradient-to-tr from-[#1D9BF0]/90 via-[#1D9BF0]/40 to-white/30 relative transition-transform duration-300 group-hover:scale-105 group-active:scale-95 transform-gpu`}>
                            <div className="w-full h-full rounded-full overflow-hidden bg-black border border-black">
                                {hasStoryMedia && storyMediaUrl ? (
                                    <img 
                                        src={resolveMediaUrl(storyMediaUrl, null, false, true)} 
                                        className="w-full h-full object-cover object-center" 
                                        alt="" 
                                        onError={(e) => { e.target.style.display = 'none'; }} 
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#111] p-1.5 flex items-center justify-center">
                                        <span className="text-white text-[7px] font-bold text-center break-words line-clamp-4 leading-tight">
                                            {getPostTextPreview(s.desc, 48)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {(isNativeVideo || isYT) && (
                                <div className="absolute bottom-0 right-0 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center border border-black z-10">
                                    <Icons.Play className="w-2.5 h-2.5 fill-black pl-[0.5px]" />
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider group-hover:text-white transition-colors max-w-[68px] truncate text-center">{authorName}</span>
                    </div>
                );
            })}
        </div>
    );
};

const PostCard = memo(({ post, user, allUsers, onLike, onDislike, onRepost = null, onComment, onDelete, onViewProfile, onOpenDetail, onOpenChat, onEditComment, onDeleteComment, onEditPost, onShare, onHashtagClick, loadingActions, reposter = null, forcePause = false, onMediaClick = null, isReadOnly = false, isDeleting = false, cacheKey = null, compact = false, onOpenSubscription = null, openCommentsInModal = false }) => {
    console.log("📦 [POST CARD] Received post:", post._id, { isRepost: post.isRepost, repostedBy: post.repostedBy, author: post.author });
    const { t, lang } = useTranslation(user);
    const [commentAudio, setCommentAudio] = useState(null);
    const [isRecordingComment, setIsRecordingComment] = useState(false);
    const commentRecorderRef = useRef(null);
    const commentStreamRef = useRef(null);
    const discardRef = useRef(false);
    const [imgError, setImgError] = useState(false); // Handle broken images
    const [revealed, setRevealed] = useState(false);

    const isCurrentUserFounder = user?.role === 'Founder';

    const authorId = post.author?._id || post.author;
    const baseAuthor = (post.author && typeof post.author === 'object' && post.author.username)
        ? post.author
        : (allUsers?.find(u => isSameId(u._id, authorId)) || { username: 'Unknown', _id: authorId });

    const author = isSameId(authorId, user?._id)
        ? { ...baseAuthor, ...user }
        : ((allUsers?.find(u => isSameId(u._id, authorId))) ? { ...baseAuthor, ...(allUsers.find(u => isSameId(u._id, authorId))) } : baseAuthor);

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
    const hasEnoughEquity = user ? (user.sharesBalance || 0) >= 0.01 : false;
    const shouldBlur = post.is18Plus && (user?.settings?.blur18Plus !== false || !hasEnoughEquity) && !revealed;
    const canDelete = isOwner || isCurrentUserFounder;

    const handleRevealClick = (e) => {
        e.stopPropagation();
        if (!hasEnoughEquity) {
            alert("LΞC EQUITY REQUIRED: To unlock this 18+ content, you must hold a minimum of 0.01 LΞC shares (~$8.90 USD). Please open the Empire Capital dashboard to deposit capital.");
            if (onOpenSubscription) onOpenSubscription();
            return;
        }
        if (window.confirm("WARNING: This content is intended for audiences 18 years and older. Do you wish to proceed?")) {
            setRevealed(true);
        }
    };
    const cardSpacingClass = compact ? 'p-2.5 sm:p-3.5 mb-3 sm:mb-3.5' : 'p-3 sm:p-4 mb-4 sm:mb-4';
    const headerGapClass = compact ? 'gap-2.5 sm:gap-4' : 'gap-3 sm:gap-4';
    const metaGapClass = compact ? 'gap-1.5 sm:gap-2' : 'gap-2';
    const nameClass = compact ? 'font-bold text-white text-[13px] sm:text-[15px] leading-snug hover:underline cursor-pointer break-words min-w-0 max-w-full' : 'font-bold text-white text-[13px] sm:text-[15px] leading-tight hover:underline cursor-pointer break-words min-w-0 max-w-full';
    const handleClass = compact ? 'text-sky-100/80 text-[11px] sm:text-[13px] leading-snug break-words min-w-0 max-w-full' : 'text-sky-200/70 text-[12px] sm:text-[13px] leading-tight break-words min-w-0 max-w-full';
    const bodyTextClass = compact ? 'post-card-body-text text-[13px] sm:text-[14px] text-white/95 leading-[1.5] font-normal whitespace-pre-wrap break-words pb-0.5' : 'post-card-body-text text-[15px] sm:text-[16px] text-white/95 leading-relaxed font-normal whitespace-pre-wrap break-words pr-1 pb-1';
    const actionBarClass = compact ? 'flex items-center justify-between mt-3 w-full border-t border-white/10 pt-3 gap-1.5 sm:gap-2 px-0' : 'flex items-center justify-between mt-4 w-full border-t border-white/10 pt-4 px-2';
    const actionButtonBaseClass = compact ? 'flex min-w-0 flex-1 sm:flex-none items-center justify-center gap-1.5 px-2 py-2 sm:px-3 rounded-full transition-colors active:scale-95 touch-manipulation select-none cursor-pointer' : 'flex min-w-0 flex-1 items-center justify-center gap-2 px-2 sm:px-4 py-2 rounded-full transition-colors active:scale-95 touch-manipulation select-none cursor-pointer';
    const actionIconClass = compact ? 'w-[18px] h-[18px] sm:w-5 sm:h-5' : 'w-5 h-5';
    const actionCountClass = compact ? 'text-[11px] sm:text-[12px] font-bold tabular-nums tracking-wide' : 'text-[12px] font-bold tabular-nums tracking-wide';
    const mediaWrapClass = compact ? 'rounded-[18px] overflow-hidden bg-transparent relative shadow-none h-auto min-h-[100px] mt-3 liquid-glass-video-panel' : 'rounded-none overflow-hidden bg-[#050505] relative shadow-none h-auto min-h-[100px] mt-3';
    const mediaClass = compact ? 'w-full h-auto max-h-[65vh] object-contain bg-transparent' : 'w-full h-auto object-contain bg-[#050505]';

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
    <div
      initial={{ opacity: 0, y: 15 }}
      animate={{ 
        opacity: isDeleting ? 0 : 1, 
        y: isDeleting ? 50 : 0, 
        scale: isDeleting ? 0.8 : 1, 
        filter: isDeleting ? 'blur(10px)' : 'none'
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className={`premium-post-card group relative ${cardSpacingClass} transition-all duration-300 will-change-transform overflow-visible transform-gpu touch-manipulation w-full max-w-full`}
      style={{ overflow: 'visible' }}
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
                    <div className="text-white font-black uppercase tracking-[0.2em]  text-lg drop-shadow-none">
                        {t('TRANSMITTING_PERCENT', { percent: post.uploadProgress || 0 })}
                    </div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">{t('ENCRYPTING_DATA')}</div>
                </div>
            )}

            {/* CARD CONTENT */}
            <div className="relative z-10 flex flex-col w-full max-w-full overflow-visible">
                {resolvedReposter && (
                    <div className="flex items-center gap-2 mb-3 px-1 text-green-500/80">
                        <Icons.RefreshCcw className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            {(resolvedReposter?.username || 'Agent') === user?.username ? t('YOU_REPOSTED', 'YOU REPOSTED') : `${resolvedReposter?.username || 'Agent'} ${t('REPOSTED', 'REPOSTED')}`}
                        </span>
                    </div>
                )}
                <div className={`flex ${headerGapClass} w-full max-w-full overflow-visible`}>
                    {/* LEFT COL: AVATAR */}
                    <div className="post-card-avatar-col shrink-0 flex flex-col items-center">
                        <div className={`post-card-avatar ${compact ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-14 h-14 sm:w-16 sm:h-16'} relative group cursor-pointer rounded-full border-2 border-white/15 overflow-hidden bg-[#050505]`} onClick={() => onViewProfile(author)}>
                            <ProfileAvatar user={author} className="object-cover w-full h-full" cacheKey={cacheKey} />
                        </div>
                    </div>

                    {/* RIGHT COL: CONTENT */}
                    <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-visible">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2 -mt-1 sm:-mt-0.5 min-w-0 w-full max-w-full">
                            <div className="min-w-0 flex-1 pr-1 w-full max-w-full">
                                <div className={`flex flex-col ${metaGapClass} min-w-0 w-full max-w-full`}>
                                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0 w-full max-w-full">
                                        <span className={nameClass} onClick={() => onViewProfile(author)}>{author?.username}</span>
                                        <VerifiedBadge isFounder={isFounder} isUser={!isFounder} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 flex-shrink-0" user={author} />
                                        {author?.profileDescriptor && PROFILE_DESCRIPTOR_MAP[author.profileDescriptor] && (
                                            <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 backdrop-blur-xl text-[9px] font-black uppercase tracking-wider shrink-0 ${PROFILE_DESCRIPTOR_MAP[author.profileDescriptor].accentClass.replace(/rounded-none/g, '')}`}>
                                                {React.createElement(PROFILE_DESCRIPTOR_MAP[author.profileDescriptor].Icon, { className: "w-2.5 h-2.5 shrink-0" })}
                                                <span className="text-[9px] font-black uppercase tracking-[0.12em]">{t(`DESC_${author.profileDescriptor.toUpperCase()}`, PROFILE_DESCRIPTOR_MAP[author.profileDescriptor].label)}</span>
                                            </div>
                                        )}
                                        {getActiveStreak(author) > 0 && <span className="text-orange-500 font-bold text-[11px] sm:text-xs shrink-0 flex items-center">🔥{getActiveStreak(author)}{isTopStreak(author) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}
                                        <span className={handleClass}>{formatUserHandle(author?.username)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <CyberDate date={post.createdAt} t={t} lang={lang} />
                                    </div>
                                </div>
                            </div>

                            {!isReadOnly && <DropdownMenu post={post} user={user} onShare={onShare} onEdit={onEditPost} onDelete={onDelete} t={t} />}
                        </div>

                        <div className="space-y-3 mt-1">
                            {post.desc && (
                                <div className="space-y-2">
                                    {shouldBlur ? (
                                        <div className="flex items-center gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl cursor-pointer" onClick={handleRevealClick}>
                                            <Icons.Lock className="w-4 h-4 text-red-500 shrink-0" />
                                            <div className="text-left">
                                                <span className="text-xs font-black text-red-500 uppercase tracking-widest block">{t('NSFW_CONTENT_LOCKED')}</span>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mt-0.5">{t('REVEAL_CONTENT')}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className={bodyTextClass} onClick={(e) => { e.stopPropagation(); }}>
                                                {parseText(translatedText || post.desc, (tag) => !isReadOnly && onHashtagClick?.(tag), (username) => {
                                                    if (isReadOnly) return;
                                                    const u = allUsers?.find(u => String(u.username).toLowerCase() === String(username).toLowerCase());
                                                    if (u && onViewProfile) onViewProfile(u);
                                                })}
                                            </p>
                                            {!isReadOnly && (
                                                <div className="flex flex-wrap items-center gap-4 mt-1 pb-1">
                                                    <button
                                                        onClick={handleTranslate}
                                                        disabled={isTranslating}
                                                        className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-widest hover:underline flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
                                                    >
                                                        <Icons.Translate className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                                                        {isTranslating ? t('DECRYPTING', 'DECRYPTING...') : (translatedText ? t('SHOW_ORIGINAL', 'SHOW ORIGINAL') : t('SEE_TRANSLATION', 'SEE TRANSLATION'))}
                                                    </button>
                                                    {localStorage.getItem('neuralNarrator') === 'true' && (
                                                        <NeuralNarratorButton text={translatedText || post.desc} />
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {postHasMedia(post) && (
                                <div className={`${mediaWrapClass} relative overflow-hidden group/media`}>
                                    <div className={shouldBlur ? 'blur-2xl pointer-events-none select-none transition-all duration-300' : 'transition-all duration-300'}>
                                        {(post.videoUrl || (post.image && post.image.match(/\.(mp4|mov|webm)$/i))) ? (
                                            <NeuralVideoPlayer src={resolveMediaUrl(post.videoUrl || post.image)} poster={resolveMediaUrl(post.thumbnailUrl || post.videoUrl || post.image, null, false, true)} className={compact ? 'w-full h-auto max-h-[62vh] liquid-glass-video-panel rounded-2xl' : 'w-full h-auto'} onExpand={() => onMediaClick ? onMediaClick(post) : onOpenDetail(post)} forcePause={forcePause || shouldBlur} />
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
                                                    className={mediaClass}
                                                    loading="lazy"
                                                    decoding="async"
                                                    onClick={() => onMediaClick ? onMediaClick(post) : onOpenDetail(post)}
                                                    onDoubleClick={onMediaClick ? () => onMediaClick(post) : handleDoubleTap}
                                                    onError={() => {
                                                        setImgError(true);
                                                        // Auto-cleanup broken link (Only for Author/Founder)
                                                        if (canDelete) { axios.put(`/posts/${post._id}`, { image: "" }).catch(() => { }); }
                                                    }}
                                                />
                                            )
                                        )}
                                    </div>
                                    {shouldBlur && (
                                        <div onClick={handleRevealClick} className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center cursor-pointer p-4 transition-all hover:bg-black/90" style={{ touchAction: 'manipulation' }}>
                                            <div className="w-14 h-14 rounded-full liquid-glass-control flex items-center justify-center text-red-400 mb-3 pointer-events-auto">
                                                <Icons.EyeOff className="w-7 h-7" />
                                            </div>
                                            <span className="text-sm font-bold text-red-400 uppercase tracking-widest">{t('NSFW_MEDIA_LOCKED')}</span>
                                            <span className="text-xs text-gray-300 font-bold uppercase tracking-wider mt-2">{t('REVEAL_MEDIA')}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── POST ACTIONS/STATS BAR ── */}
                        {!isReadOnly ? (
                            <div className={actionBarClass}>
                                {/* COMMENTS */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (openCommentsInModal && onOpenDetail) {
                                            onOpenDetail(post);
                                        } else {
                                            setShowComments(!showComments);
                                        }
                                    }}
                                    className={`${actionButtonBaseClass} action-btn-comment ${showComments ? 'text-[#1D9BF0]' : 'text-gray-500 md:hover:bg-[#1D9BF0]/10 md:hover:text-[#1D9BF0] active:bg-[#1D9BF0]/20 active:text-[#1D9BF0]'}`}
                                >
                                    <Icons.MessageSquare className={actionIconClass} />
                                    <span className={actionCountClass}>{post.comments?.length || 0}</span>
                                </button>

                                {/* REPOSTS */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRepost && onRepost(post._id);
                                    }}
                                    className={`${actionButtonBaseClass} action-btn-repost ${post.reposts?.some(id => isSameId(id, user?._id)) ? 'text-[#00BA7C]' : 'text-gray-500 md:hover:bg-[#00BA7C]/10 md:hover:text-[#00BA7C] active:bg-[#00BA7C]/20 active:text-[#00BA7C]'}`}
                                >
                                    <Icons.RefreshCcw className={`${actionIconClass} transition-transform ${post.reposts?.some(id => isSameId(id, user?._id)) ? 'scale-110' : ''}`} />
                                    <span className={actionCountClass}>{post.reposts?.length || 0}</span>
                                </button>

                                {/* LIKE */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const isLiked = post.likes?.some(id => isSameId(id, user?._id));
                                        playSound(isLiked ? 'cyber_unlike' : 'cyber_like');
                                        onLike(post._id);
                                    }}
                                    className={`${actionButtonBaseClass} action-btn-like ${post.likes?.some(id => isSameId(id, user?._id)) ? 'text-[#F91880]' : 'text-gray-500 md:hover:bg-[#F91880]/10 md:hover:text-[#F91880] active:bg-[#F91880]/20 active:text-[#F91880]'}`}
                                >
                                        <Icons.Heart className={`${actionIconClass} transition-transform ${post.likes?.some(id => isSameId(id, user?._id)) ? 'fill-current scale-110' : ''}`} />
                                    <span className={actionCountClass}>{post.likes?.length || 0}</span>
                                </button>

                                {/* DISLIKE */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const isDisliked = post.dislikes?.some(id => isSameId(id, user?._id));
                                        playSound(isDisliked ? 'cyber_unlike' : 'cyber_like');
                                        onDislike(post._id);
                                    }}
                                    className={`${actionButtonBaseClass} action-btn-dislike ${post.dislikes?.some(id => isSameId(id, user?._id)) ? 'text-purple-500' : 'text-gray-500 md:hover:bg-purple-500/10 md:hover:text-purple-500 active:bg-purple-500/20 active:text-purple-500'}`}
                                >
                                    <Icons.ThumbsDown className={`${actionIconClass} transition-transform ${post.dislikes?.some(id => isSameId(id, user?._id)) ? 'fill-current scale-110' : ''}`} />
                                    <span className={actionCountClass}>{post.dislikes?.length || 0}</span>
                                </button>
                            </div>
                        ) : (
                            <div className={actionBarClass}>
                                {/* REPOSTS (read-only) */}
                                <div className={`${compact ? 'flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2.5 py-2 text-gray-400' : 'flex items-center justify-center gap-2 px-4 py-2 text-gray-400'}`}>
                                    <Icons.RefreshCcw className={`${actionIconClass} ${post.reposts?.length ? 'text-green-500' : ''}`} />
                                    <span className={actionCountClass}>{post.reposts?.length || 0}</span>
                                </div>

                                {/* LIKES (read-only) */}
                                <div className={`${compact ? 'flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2.5 py-2 text-gray-400' : 'flex items-center justify-center gap-2 px-4 py-2 text-gray-400'}`}>
                                    <Icons.Heart className={`${actionIconClass} ${post.likes?.length ? 'text-red-500' : ''}`} />
                                    <span className={actionCountClass}>{post.likes?.length || 0}</span>
                                </div>

                                {/* DISLIKES (read-only) */}
                                <div className={`${compact ? 'flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2.5 py-2 text-gray-400' : 'flex items-center justify-center gap-2 px-4 py-2 text-gray-400'}`}>
                                    <Icons.ThumbsDown className={`${actionIconClass} ${post.dislikes?.length ? 'text-blue-500' : ''}`} />
                                    <span className={actionCountClass}>{post.dislikes?.length || 0}</span>
                                </div>

                                {/* Filler to balance */}
                                <div className={compact ? 'hidden' : 'w-12'}></div>
                            </div>
                        )}

                        {showComments && !isReadOnly && (
                            <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-fade-in relative z-20">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 relative group shrink-0">
                                        <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-500"></div>
                                        <div className="absolute inset-[2.5px] rounded-full overflow-hidden">
                                            <ProfileAvatar user={user} />
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-3">
                                        <div className="relative">
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder={t('WRITE_COMMENT')}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base text-white outline-none focus:border-white/40 min-h-[100px] resize-none pb-12 transition-all"
                                            />
                                            <div className="absolute bottom-2 left-2 flex gap-2">
                                                <button onClick={toggleCommentRecording} className={`p-2 rounded-full transition-colors ${isRecordingComment ? 'bg-red-600 text-white ' : 'bg-transparent text-gray-500 hover:text-white hover:bg-white/10'}`}>
                                                    <Icons.Mic className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => { if (commentText.trim()) { onComment(post._id, commentText); setCommentText(''); } }} className="p-2 bg-white text-black rounded-full hover:brightness-90 transition-colors">
                                                    <Icons.Send className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        {commentAudio && (
                                            <div className="p-3 bg-white/10 border border-white/30 rounded-2xl flex items-center justify-between mt-3">
                                                <div className="flex items-center gap-3">
                                                    <Icons.Mic className="w-4 h-4 text-white" />
                                                    <span className="text-[10px] font-black text-white uppercase">VOICE READY</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setCommentAudio(null)} className="p-1.5 text-white rounded-full hover:bg-white/10 transition-colors"><Icons.Trash className="w-4 h-4" /></button>
                                                    <button onClick={() => { const fd = new FormData(); fd.append('file', commentAudio, 'voice.webm'); onComment(post._id, fd); setCommentAudio(null); }} className="px-4 py-1 bg-white text-black font-black text-[10px] rounded-full hover:brightness-90 transition-colors">SEND</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="border-t border-white/[0.06] mt-4">
                                    {(post.comments || []).slice().reverse().map(c => (
                                        <CommentItem key={c._id} comment={c} post={post} user={user} allUsers={allUsers} onEdit={onEditComment} onDelete={onDeleteComment} t={t} lang={lang} onViewProfile={onViewProfile} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
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

    const chatUser = React.useMemo(() => {
        if (!activeChat) return null;
        return allUsers.find(au => isSameId(au._id, activeChat._id)) || activeChat;
    }, [activeChat, allUsers]);

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
    const prevActiveChatIdRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            if (prevActiveChatIdRef.current) {
                axios.post('/messages/cleanup', { chatUserId: prevActiveChatIdRef.current }).catch(() => {});
                prevActiveChatIdRef.current = null;
            }
            hasInitializedRef.current = false;
            setActiveChat(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && activeChat?._id) {
            if (prevActiveChatIdRef.current && prevActiveChatIdRef.current !== activeChat._id) {
                axios.post('/messages/cleanup', { chatUserId: prevActiveChatIdRef.current }).catch(() => {});
            }
            prevActiveChatIdRef.current = activeChat._id;
        }
    }, [isOpen, activeChat?._id]);

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
                                    <div className="relative shrink-0"><div className="w-12 h-12 relative group"><div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-500"></div><div className="absolute inset-[3px] rounded-full overflow-hidden"><ProfileAvatar user={u} /></div></div><div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-black ${online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-gray-500'}`} /></div>
                                    <div className="min-w-0 flex-1"><div className="font-bold text-sm text-white flex items-center gap-1.5 truncate">{u?.username} <VerifiedBadge isFounder={u.role === 'Founder'} isUser={u.role !== 'Founder'} className="w-4 h-4 shrink-0" user={u} /> {getActiveStreak(u) > 0 && <span className="text-orange-500 font-bold text-[11px] shrink-0">🔥{getActiveStreak(u)}{isTopStreak(u) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}</div><div className={`text-[10px] font-bold ${online ? 'text-green-500/90' : 'text-gray-500'} uppercase tracking-wider`}>{online ? t('ONLINE') : t('OFFLINE')}</div></div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* CHAT WINDOW */}
                <div className={`flex-1 flex-col bg-[#050505] chat-shell absolute inset-0 sm:relative sm:inset-auto z-20 sm:z-0 transition-none overflow-hidden ${activeChat ? 'flex' : 'hidden sm:flex'}`}>
                    {/* Cosmic Background */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                        {/* Animated Stars */}
                        <div className="absolute inset-0">
                            {Array.from({ length: 50 }).map((_, i) => (
                                <div 
                                    key={i}
                                    className="absolute rounded-full bg-white"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        width: `${Math.random() * 2 + 1}px`,
                                        height: `${Math.random() * 2 + 1}px`,
                                        opacity: `${Math.random() * 0.6 + 0.2}`,
                                        animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite alternate`,
                                        animationDelay: `${Math.random() * 2}s`
                                    }}
                                />
                            ))}
                        </div>
                        {/* Nebula Effect */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(139,92,246,0.08)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.06)_0%,transparent_45%),radial-gradient(circle_at_40%_20%,rgba(249,115,22,0.05)_0%,transparent_40%)]" />
                    </div>
                    {activeChat ? (
                        <>
                            <div className="p-3 border-b border-white/10 flex items-center gap-3 bg-black/80 backdrop-blur-xl shrink-0 z-10">
                                <button
                                    onClick={() => { setActiveChat(null); }}
                                    className="sm:hidden p-2 -ml-2 text-gray-400"
                                >
                                    <Icons.Back className="w-6 h-6" />
                                </button>
                                <div className="w-10 h-10 relative group shrink-0">
                                    <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-500"></div>
                                    <div className="absolute inset-[2.5px] rounded-full overflow-hidden">
                                        <ProfileAvatar user={chatUser} />
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-sm text-white flex items-center gap-2 truncate">
                                        {chatUser?.username}
                                        {getActiveStreak(chatUser) > 0 && <span className="text-orange-500 font-bold text-xs shrink-0 flex items-center">🔥{getActiveStreak(chatUser)}{isTopStreak(chatUser) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}
                                        <VerifiedBadge isFounder={chatUser?.role === 'Founder'} isUser={chatUser?.role !== 'Founder'} className="w-4 h-4 shrink-0" user={chatUser} />
                                    </div>
                                    {(() => {
                                        const isChatUserOnline = isUserOnline(chatUser, user);
                                        return (
                                            <div className={`text-[10px] flex items-center gap-1.5 ${isChatUserOnline ? 'text-green-500/90 font-bold uppercase tracking-widest' : 'text-gray-500 uppercase tracking-tighter'}`}>
                                                <div className={`w-3.5 h-3.5 rounded-full border-[2.5px] border-black ${isChatUserOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-gray-600'}`} />
                                                {isChatUserOnline ? t('ONLINE') : t('OFFLINE')}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <button onClick={() => { onClose(); }} className="hidden sm:block p-2 text-gray-400"><Icons.X className="w-6 h-6" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                <>
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
                                            <div 
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
                                                    className={`max-w-[85%] px-4 py-2.5 sm:px-5 sm:py-3 rounded-[22px] text-[15px] shadow-xl relative border cursor-pointer select-none overflow-hidden ${isOwn ? 'bg-cyan-950/40 border-cyan-500/30 text-white rounded-br-sm shadow-[0_8px_32px_rgba(6,182,212,0.15)]' : 'bg-purple-950/30 border-purple-500/20 text-white rounded-bl-sm shadow-[0_8px_32px_rgba(147,51,234,0.1)]'} ${m.isLocked ? 'ring-2 ring-[var(--gold-primary)]/90 shadow-[0_0_25px_rgba(245,158,11,0.3)]' : ''} hover:scale-[1.02] transition-all duration-300`}
                                                >
                                                {/* Glass/Sparkle overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-white/[0.02] pointer-events-none rounded-[22px]" />
                                                {/* Animated glow border */}
                                                <div className="absolute inset-0 rounded-[22px] p-[1px] pointer-events-none overflow-hidden">
                                                    <div className="absolute inset-0 rounded-[22px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 animate-shimmer" />
                                                </div>
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
                                                            <div className="w-2 h-2 rounded-full  bg-[var(--gold-primary)]" />
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
                                            </div>
                                        );
                                    })}
                                </>
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
                                    <div className="flex-1 relative flex items-center bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-1 focus-within:border-[var(--gold-primary)]/50 focus-within:shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-all duration-300 group overflow-hidden">
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
                                        className={`w-full bg-transparent py-3 text-[14px] text-white outline-none placeholder-gray-500 font-bold ${isRecording ? ' text-red-500' : ''}`}
                                    />
                                    <div className="flex items-center gap-2 shrink-0">
                                        {isPhonetic && <span className="text-[10px] font-black text-[var(--gold-primary)]  border border-[var(--gold-primary)]/30 px-1.5 py-0.5 rounded-md bg-[var(--gold-primary)]/10">GREEK PH</span>}
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
                                                className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 ${isRecording ? 'bg-red-500 text-white ' : 'bg-white/5 text-gray-500'}`}
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

const PlatformLoadingPanel = ({ label, compact = false }) => (
    <div className={`flex flex-col items-center justify-center gap-6 ${compact ? 'py-10' : 'py-20'} relative animate-fade-in`}>
        <div className="relative flex items-center justify-center w-12 h-12">
            <Icons.Loader className="w-8 h-8 text-[var(--gold-primary)]" />
        </div>
        {label && (
            <div className="flex flex-col items-center gap-2">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold-primary)] relative z-10">
                    {label}
                </div>
            </div>
        )}
    </div>
);

const Toggle = ({ active, onToggle, color = 'gold' }) => {
    const trackActive = color === 'blue'
        ? 'bg-[#1D9BF0] border-[#1D9BF0]'
        : 'bg-white border-white';
    const knobActive = color === 'blue' ? 'bg-white' : 'bg-[#0a0a0a]';

    return (
        <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={() => { playCyberSFX('click'); onToggle(); }}
            className={`settings-toggle relative w-[58px] h-[34px] sm:w-[52px] sm:h-[30px] rounded-full border transition-all duration-300 ease-out shrink-0 touch-manipulation outline-none ${
                active ? trackActive : 'bg-white/[0.12] border-white/15'
            } cursor-pointer active:scale-[0.96]`}
        >
            <span
                className={`settings-toggle-knob absolute top-[3px] left-[3px] w-[26px] h-[26px] sm:w-[22px] sm:h-[22px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    active
                        ? `translate-x-[24px] sm:translate-x-[22px] ${knobActive} shadow-[0_2px_8px_rgba(0,0,0,0.35)]`
                        : 'translate-x-0 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
                }`}
            />
        </button>
    );
};

const ShareSettingLabel = ({ t }) => (
    <div className="flex items-center gap-2.5 min-w-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white/80 shrink-0">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span className="text-[16px] sm:text-[15px] font-normal text-white leading-snug">{t('SHARE_PROFILE_BUTTON', 'Share Button')}</span>
    </div>
);

const SectionHeader = ({ label }) => (
    <h3 className="settings-section-label text-[13px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">{label}</h3>
);

const SettingsGroup = ({ children, className = '' }) => (
    <div className={`settings-ios-group rounded-[14px] sm:rounded-2xl overflow-hidden bg-white/[0.06] border border-white/10 divide-y divide-white/10 ${className}`}>
        {children}
    </div>
);

const SettingRow = ({ label, desc, children }) => (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:py-3 min-h-[54px] sm:min-h-[48px]">
        <div className="flex-1 min-w-0 pr-2">
            {typeof label === 'string' ? <div className="text-[16px] sm:text-[15px] font-normal text-white leading-snug">{label}</div> : label}
            {desc && <div className="text-[13px] sm:text-[12px] text-gray-400 mt-1 leading-snug">{desc}</div>}
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
    const [showBadge, setShowBadge] = useState(user?.settings?.showBadge === true);
    const [badgeColor, setBadgeColor] = useState(user?.settings?.badgeColor || (user?.role === 'Founder' ? 'gold' : 'blue'));
    const [blur18Plus, setBlur18Plus] = useState(user?.settings?.blur18Plus !== false);
    const [is18PlusProfile, setIs18PlusProfile] = useState(user?.settings?.is18PlusProfile === true);
    const [profileDescriptor, setProfileDescriptor] = useState(user?.profileDescriptor || '');
    const [founderAffiliation, setFounderAffiliation] = useState(user?.founderAffiliation || '');
    const [matrixOverlay, setMatrixOverlay] = useState(user?.settings?.matrixOverlay === true || localStorage.getItem('matrixOverlay') === 'true');
    const [cyberSFX, setCyberSFX] = useState(user?.settings?.cyberSFX !== false && localStorage.getItem('cyberSFX') !== 'false');
    const [neuralNarrator, setNeuralNarrator] = useState(user?.settings?.neuralNarrator === true || localStorage.getItem('neuralNarrator') === 'true');
    const [showDanger, setShowDanger] = useState(false);
    const [themeCategory, setThemeCategory] = useState('primary');
    const pendingShareToggleRef = useRef(null);
    const latestUserRef = useRef(user);
    const normalizeLanguageCode = (value) => String(value || '').toLowerCase().split('-')[0];
    const activeLanguage = normalizeLanguageCode(lang || i18n.resolvedLanguage || i18n.language || user?.settings?.language || localStorage.getItem('language') || 'en');
    const [pendingLanguage, setPendingLanguage] = useState(activeLanguage);
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
            setShowBadge(user.settings?.showBadge === true);
            setBadgeColor(user.settings?.badgeColor || (user.role === 'Founder' ? 'gold' : 'blue'));
            setBlur18Plus(user.settings?.blur18Plus !== false);
            setIs18PlusProfile(user.settings?.is18PlusProfile === true);
            setProfileDescriptor(user.profileDescriptor || '');
            setFounderAffiliation(user.founderAffiliation || '');
            setMatrixOverlay(user.settings?.matrixOverlay === true || localStorage.getItem('matrixOverlay') === 'true');
            setCyberSFX(user.settings?.cyberSFX !== false && localStorage.getItem('cyberSFX') !== 'false');
            setNeuralNarrator(user.settings?.neuralNarrator === true || localStorage.getItem('neuralNarrator') === 'true');
        }
    }, [user, isOpen]);

    useEffect(() => {
        setPendingLanguage(activeLanguage);
    }, [activeLanguage]);

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
            if (key === 'profileDescriptor' || key === 'founderAffiliation') {
                const res = await axios.put(`/users/${user._id || user.userId}`, { [key]: val });
                onUpdateUser(res.data);
                if (key === 'profileDescriptor') setProfileDescriptor(val);
                if (key === 'founderAffiliation') setFounderAffiliation(val);
                setSaving(false);
                return;
            }
            let payload = { [key]: val };
            if (key === 'matrixOverlay') {
                localStorage.setItem('matrixOverlay', String(val));
                setMatrixOverlay(val);
                payload = { settings: { matrixOverlay: Boolean(val) } };
            }
            if (key === 'cyberSFX') {
                localStorage.setItem('cyberSFX', String(val));
                setCyberSFX(val);
                payload = { settings: { cyberSFX: Boolean(val) } };
            }
            if (key === 'neuralNarrator') {
                localStorage.setItem('neuralNarrator', String(val));
                setNeuralNarrator(val);
                payload = { settings: { neuralNarrator: Boolean(val) } };
            }
            if (key === 'language') payload = { settings: { language: val } };
            if (key === 'theme') payload = { settings: { theme: val } };
            if (key === 'background') {
                payload = { settings: { background: val } };
                applyBackground(val);
                onUpdateUser?.({
                    ...(latestUserRef.current || user || {}),
                    settings: {
                        ...((latestUserRef.current || user || {})?.settings || {}),
                        background: val
                    }
                });
            }
            if (key === 'displayMode') payload = { settings: { displayMode: val } };
            if (key === 'zoom') payload = { settings: { zoom: val } };
            if (key === 'showProfileShareButton') payload = { settings: { showProfileShareButton: Boolean(val) } };
            if (key === 'showBadge') payload = { settings: { showBadge: Boolean(val) } };
            if (key === 'badgeColor') payload = { settings: { badgeColor: String(val) } };
            if (key === 'blur18Plus') payload = { settings: { blur18Plus: Boolean(val) } };
            if (key === 'is18PlusProfile') payload = { settings: { is18PlusProfile: Boolean(val) } };
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
            if (key === 'showBadge') setShowBadge(Boolean(val));
            if (key === 'badgeColor') setBadgeColor(String(val));
            if (key === 'blur18Plus') setBlur18Plus(Boolean(val));
            if (key === 'is18PlusProfile') setIs18PlusProfile(Boolean(val));
            if (key === 'matrixOverlay') setMatrixOverlay(Boolean(val));
            if (key === 'cyberSFX') setCyberSFX(Boolean(val));
            if (key === 'neuralNarrator') setNeuralNarrator(Boolean(val));

        } catch (e) {
            console.error("Settings update failed", e);
            if (key === 'isPrivate') setIsPrivate(!val);
            if (key === 'isFollowersOnly') setIsFollowersOnly(!val);
            if (key === 'showProfileShareButton') setShowProfileShareButton(!Boolean(val));
            if (key === 'showBadge') setShowBadge(!Boolean(val));
            if (key === 'blur18Plus') setBlur18Plus(!Boolean(val));
            if (key === 'is18PlusProfile') setIs18PlusProfile(!Boolean(val));
            if (key === 'matrixOverlay') setMatrixOverlay(!Boolean(val));
            if (key === 'cyberSFX') setCyberSFX(!Boolean(val));
            if (key === 'neuralNarrator') setNeuralNarrator(!Boolean(val));
        } finally {
            if (key === 'showProfileShareButton') pendingShareToggleRef.current = null;
            setSaving(false);
        }
    };

    const handleLanguageSelect = async (nextLanguage) => {
        const normalizedLanguage = normalizeLanguageCode(nextLanguage);
        if (!normalizedLanguage || normalizedLanguage === pendingLanguage) return;

        localStorage.setItem('language', normalizedLanguage);
        setPendingLanguage(normalizedLanguage);

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

        try {
            if (normalizeLanguageCode(i18n.resolvedLanguage || i18n.language) !== normalizedLanguage) {
                await i18n.changeLanguage(normalizedLanguage);
            }
            await handleSave('language', normalizedLanguage);

} catch (error) {
            console.error("Language change error:", error);
            setPendingLanguage(activeLanguage);
        }
    };

    if (!isOpen) return null;
    const languageOptions = [
        { id: 'en', flag: '🇺🇸', labelKey: 'LANG_EN' },
        { id: 'el', flag: '🇬🇷', labelKey: 'LANG_EL' },
        { id: 'de', flag: '🇩🇪', labelKey: 'LANG_DE' },
        { id: 'ru', flag: '🇷🇺', labelKey: 'LANG_RU' },
        { id: 'cy', flag: '🇨🇾', labelKey: 'LANG_CY' },
        { id: 'es', flag: '🇪🇸', labelKey: 'LANG_ES' },
        { id: 'tr', flag: '🇹🇷', labelKey: 'LANG_TR' },
        { id: 'fr', flag: '🇫🇷', labelKey: 'LANG_FR' },
    ];
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4">
            <div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70" onClick={onClose}
            />

            <div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="relative w-[96%] max-w-[420px] sm:max-w-[440px] max-h-[88dvh] sm:max-h-[86vh] rounded-[24px] sm:rounded-2xl overflow-hidden flex flex-col settings-modal-glass"
            >
                {/* HEADER */}
                <div className="px-5 sm:px-5 py-4 sm:py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/20 backdrop-blur-xl">
                    <div className="flex items-center gap-3 min-w-0">
                        <Icons.Settings className="w-5 h-5 text-[#1D9BF0] shrink-0" />
                        <div className="min-w-0">
                            <h2 className="font-bold text-[20px] sm:text-[17px] text-white leading-tight">{t('SETTINGS')}</h2>
                            <div className="text-[13px] sm:text-[11px] text-gray-400 mt-0.5">{t('SETTINGS_SUBTITLE')}</div>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} aria-label={t('CLOSE')} className="group min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/[0.08] active:scale-95 transition-all touch-manipulation shrink-0">
                        <Icons.X className="w-5 h-5 text-red-500 group-hover:text-red-400 group-hover:rotate-90 transition-all duration-300 pointer-events-none" />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-5 py-4 sm:py-4 space-y-5 sm:space-y-4 relative z-10" style={{ maxHeight: '70vh', WebkitOverflowScrolling: 'touch' }}>

                    {/* ── PRIVACY ── */}
                    <section>
                        <SectionHeader label={t('PRIVACY')} />
                        <SettingsGroup>
                            <SettingRow label={t('PRIVATE_TITLE')} desc={t('PRIVATE_DESC_SHORT')}>
                                <Toggle active={isPrivate} onToggle={() => { const v = !isPrivate; setIsPrivate(v); handleSave('isPrivate', v); }} saving={saving} color="gold" />
                            </SettingRow>
                            <SettingRow label={t('GUARD_TITLE')} desc={t('GUARD_DESC_SHORT')}>
                                <Toggle active={isFollowersOnly} onToggle={() => { const v = !isFollowersOnly; setIsFollowersOnly(v); handleSave('isFollowersOnly', v); }} saving={saving} color="blue" />
                            </SettingRow>
                            <SettingRow label={<ShareSettingLabel t={t} />} desc={t('SHARE_PROFILE_DESC')}>
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
                        </SettingsGroup>
                    </section>

                    {/* ── AESTHETICS ── */}
                    <section>
                        <SectionHeader label={t('AESTHETICS')} />
                        <SettingsGroup className="mb-3">
                            <div className="px-4 py-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[16px] sm:text-[14px] font-normal text-white">{t('UI_ZOOM')}</span>
                                    <span className="text-[15px] sm:text-[13px] font-semibold text-[#1D9BF0] tabular-nums">{Math.round(zoomLevel * 100)}%</span>
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
                                    className="settings-range w-full h-2 accent-[#1D9BF0]"
                                    style={{
                                        '--progress-width': `${((zoomLevel - 0.95) / 0.05) * 100}%`
                                    }}
                                />
                            </div>
                        </SettingsGroup>
                        <div className="space-y-4">
                            <div>
                                <div className="settings-section-label text-[13px] font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">{t('THEME')}</div>
                                <div className="theme-swatch-grid settings-theme-grid">
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
                                                className="theme-swatch-btn settings-tile-btn flex flex-col items-center gap-2 py-2"
                                            >
                                                <span
                                                    className={`theme-swatch-dot block w-11 h-11 sm:w-9 sm:h-9 rounded-full border-[2.5px] transition-all duration-200 ${active ? 'border-white scale-105' : 'border-white/25'}`}
                                                    style={{ backgroundColor: value }}
                                                />
                                                <span className={`text-[12px] sm:text-[10px] font-medium text-center leading-tight px-1 ${active ? 'text-white' : 'text-gray-400'}`}>
                                                    {t(labelKey)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <div className="settings-section-label text-[13px] font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">{t('BACKGROUND')}</div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-2">
                                    {BACKGROUND_MODES.map(({ value, labelKey, color, className }) => {
                                        const active = getBackgroundMode(user) === value;
                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => handleSave('background', value)}
                                                className={`settings-tile-btn relative overflow-hidden flex flex-col rounded-[14px] border transition-all duration-200 min-h-[72px] sm:min-h-0 h-full ${
                                                    active ? 'border-[#1D9BF0] ring-1 ring-[#1D9BF0]/30' : 'border-white/10'
                                                }`}
                                            >
                                                <div className={`w-full h-12 sm:h-10 shrink-0 relative ${className}`} style={{ backgroundColor: color }} />
                                                <div className={`flex-1 flex items-center justify-center px-2 py-2.5 sm:py-2 text-center w-full ${active ? 'text-white' : 'text-gray-400'}`}>
                                                    <div className="text-[13px] sm:text-[10px] font-medium leading-snug">{t(labelKey)}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── BADGES & CONTENT ── */}
                    <section>
                        <SectionHeader label={t('BADGE_SETTINGS')} />
                        <SettingsGroup>
                            <SettingRow label={t('SHOW_BADGE')} desc={t('SHOW_BADGE_DESC')}>
                                <Toggle active={showBadge} onToggle={() => { const v = !showBadge; setShowBadge(v); handleSave('showBadge', v); }} saving={saving} color="blue" />
                            </SettingRow>
                            {showBadge && (
                                <div className="px-4 py-3.5 border-t border-white/5 text-left">
                                    <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">{t('BADGE_STYLE')}</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {user?.role === 'Founder' ? (
                                            <>
                                                {[
                                                    { id: 'gold', label: 'Gold', color: '#FFD700' },
                                                    { id: 'live-gold', label: 'Live Gold', color: '#F6E27A', isLive: true },
                                                    { id: 'crimson', label: 'Crimson', color: '#FF0033' },
                                                    { id: 'neon-purple', label: 'Purple', color: '#B026FF' },
                                                    { id: 'holographic', label: 'Holo', isHolo: true }
                                                ].map(b => (
                                                    <button
                                                        key={b.id}
                                                        type="button"
                                                        onClick={() => { setBadgeColor(b.id); handleSave('badgeColor', b.id); }}
                                                        className={`settings-tile-btn p-2 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                                                            badgeColor === b.id ? 'border-[#1D9BF0] bg-[#1D9BF0]/10' : 'border-white/10 bg-white/[0.02]'
                                                        }`}
                                                    >
                                                        {b.isLive ? (
                                                            <div className="w-3.5 h-3.5 rounded-full shrink-0 animate-spin" style={{ animationDuration: '4s', background: 'conic-gradient(from 0deg, #F6E27A, #CB9B51, #FFF7B0, #CB9B51, #F6E27A)' }} />
                                                        ) : b.isHolo ? (
                                                            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: 'linear-gradient(45deg, #ff007f, #7f00ff, #00f0ff, #00ff7f, #ff007f)' }} />
                                                        ) : (
                                                            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                                                        )}
                                                        <span className="text-[11px] text-white font-bold uppercase tracking-wider">{b.label}</span>
                                                    </button>
                                                ))}
                                            </>
                                        ) : (
                                            <>
                                                {[
                                                    { id: 'blue', label: 'Blue', color: '#1D9BF0' },
                                                    { id: 'metal-blue', label: t('BADGE_METAL_BLUE', 'Metal Blue'), color: '#0083B0' }
                                                ].map(b => (
                                                    <button
                                                        key={b.id}
                                                        type="button"
                                                        onClick={() => { setBadgeColor(b.id); handleSave('badgeColor', b.id); }}
                                                        className={`settings-tile-btn p-2 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                                                            badgeColor === b.id ? 'border-[#1D9BF0] bg-[#1D9BF0]/10' : 'border-white/10 bg-white/[0.02]'
                                                        }`}
                                                    >
                                                        <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                                                        <span className="text-[11px] text-white font-bold uppercase tracking-wider">{b.label}</span>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            <SettingRow label={t('BLUR_18_PLUS')} desc={t('BLUR_18_PLUS_DESC')}>
                                <Toggle active={blur18Plus} onToggle={() => { const v = !blur18Plus; setBlur18Plus(v); handleSave('blur18Plus', v); }} saving={saving} color="blue" />
                            </SettingRow>
                            <SettingRow label={t('IS_18_PLUS_PROFILE', '18+ Profile (NSFW)')} desc={t('IS_18_PLUS_PROFILE_DESC', 'Require age verification for visitors')}>
                                <Toggle active={is18PlusProfile} onToggle={() => { const v = !is18PlusProfile; setIs18PlusProfile(v); handleSave('is18PlusProfile', v); }} saving={saving} color="red" />
                            </SettingRow>
                            <div className="px-4 py-3.5 border-t border-white/5 text-left">
                                <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">{t('PROFILE_DESCRIPTOR', 'Identity Descriptor')}</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {PROFILE_DESCRIPTOR_OPTIONS.map((option) => {
                                        const isSelected = profileDescriptor === option.value;
                                        const OptionIcon = option.Icon;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    const val = isSelected ? '' : option.value;
                                                    setProfileDescriptor(val);
                                                    handleSave('profileDescriptor', val);
                                                }}
                                                className={`settings-tile-btn p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                                                    isSelected ? `${option.accentClass} border-current` : 'border-white/10 bg-white/[0.02] text-white/70'
                                                }`}
                                            >
                                                <OptionIcon className="w-4 h-4 shrink-0" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider truncate">{t(`DESC_${option.value.toUpperCase()}`, option.label)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {user?.role === 'Founder' && (
                                <div className="px-4 py-3.5 border-t border-white/5 text-left">
                                    <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">{t('FOUNDER_AFFILIATION', 'Founder Affiliation')}</div>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gold-primary)] font-black text-sm">@</div>
                                        <input
                                            type="text"
                                            value={founderAffiliation}
                                            onChange={(e) => setFounderAffiliation(sanitizeAffiliation(e.target.value))}
                                            onBlur={() => handleSave('founderAffiliation', founderAffiliation)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSave('founderAffiliation', founderAffiliation); }}
                                            placeholder="affiliated_username"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white text-sm font-bold placeholder:text-white/20 outline-none focus:border-[var(--gold-primary)] transition-colors"
                                        />
                                    </div>
                                    <div className="text-[9px] text-gray-500 mt-1.5 font-bold uppercase tracking-wide leading-relaxed pl-1">
                                        {t('FOUNDER_AFFILIATION_DESC', 'Links your profile to a founder page (shows founder badge next to username).')}
                                    </div>
                                </div>
                            )}
                        </SettingsGroup>
                    </section>

                    {/* ── NEURAL UPGRADES ── */}
                    <section>
                        <SectionHeader label={t('NEURAL_UPGRADES', 'NEURAL UPGRADES')} />
                        <SettingsGroup>
                            <SettingRow label={t('CYBER_SFX', 'INTERFACE AUDIO')} desc={t('CYBER_SFX_DESC', 'Synthesize real-time cybernetic sound effects on action')}>
                                <Toggle active={cyberSFX} onToggle={() => { const v = !cyberSFX; setCyberSFX(v); handleSave('cyberSFX', v); }} saving={saving} color="blue" />
                            </SettingRow>
                            <SettingRow label={t('NEURAL_NARRATOR', 'NEURAL NARRATOR')} desc={t('NEURAL_NARRATOR_DESC', 'Enable Text-To-Speech reader button next to translate button')}>
                                <Toggle active={neuralNarrator} onToggle={() => { const v = !neuralNarrator; setNeuralNarrator(v); handleSave('neuralNarrator', v); }} saving={saving} color="blue" />
                            </SettingRow>
                        </SettingsGroup>
                    </section>

                    {/* ── LANGUAGE ── */}
                    <section>
                        <SectionHeader label={t('COGNITION')} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-2">
                            {languageOptions.map(l => (
                                <button
                                    key={l.id}
                                    type="button"
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                    disabled={pendingLanguage === l.id}
                                    onClick={() => { void handleLanguageSelect(l.id); }}
                                    className={`settings-lang-btn settings-tile-btn min-h-[56px] sm:min-h-[52px] px-4 py-3.5 sm:py-3 rounded-[14px] border flex items-center gap-4 sm:gap-3 transition-all duration-200 cursor-pointer touch-manipulation ${
                                        pendingLanguage === l.id
                                            ? 'border-[#1D9BF0] bg-[#1D9BF0]/15'
                                            : 'border-white/10 bg-white/[0.04] active:bg-white/[0.08]'
                                    }`}
                                >
                                    <span className="text-[28px] sm:text-2xl leading-none shrink-0">{l.flag}</span>
                                    <span className={`text-[16px] sm:text-[14px] font-medium text-left leading-snug flex-1 ${pendingLanguage === l.id ? 'text-white' : 'text-gray-300'}`}>
                                        {t(l.labelKey)}
                                    </span>
                                    {pendingLanguage === l.id && (
                                        <Icons.Check className="w-5 h-5 text-[#1D9BF0] shrink-0" strokeWidth={3} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* ── OPERATIONS ── */}
                    <section className="pt-1 border-t border-white/10">
                        <SectionHeader label={t('OPERATIONS')} />
                        <div className="space-y-2.5">
                            {showDanger ? (
                                <div className="p-5 bg-red-950/25 rounded-[14px] border border-red-500/25 text-center">
                                    <div className="text-[14px] font-semibold text-red-400 mb-4">{t('DANGER_ZONE')}</div>
                                    <button onClick={async () => { if (confirm(t('DELETE_ACCOUNT_CONFIRM'))) { try { await axios.delete(`/users/${user._id}`); logout(); } catch (e) { } } }}
                                        className="w-full py-3.5 bg-red-600 text-white rounded-[14px] font-semibold text-[15px] active:scale-[0.98] transition-transform">
                                        {t('DELETE_FOREVER')}
                                    </button>
                                    <button onClick={() => setShowDanger(false)} className="mt-3 text-[14px] font-medium text-gray-400">{t('CANCEL')}</button>
                                </div>
                            ) : (
                                <button onClick={() => setShowDanger(true)} className="w-full py-4 rounded-[14px] border border-white/10 bg-white/[0.04] text-gray-400 text-[15px] font-medium active:scale-[0.98] transition-transform">
                                    {t('UNCOVER_RESTRICTED_OPS')}
                                </button>
                            )}

                            <button onClick={logout} className="settings-ios-group w-full flex items-center justify-between px-4 py-4 rounded-[14px] border border-white/10 bg-white/[0.06] group active:scale-[0.98] transition-transform min-h-[56px]">
                                <div className="flex items-center gap-3">
                                    <Icons.Logout className="w-5 h-5 text-red-400 shrink-0" />
                                    <span className="text-[16px] font-medium text-red-400">{t('LOGOUT')}</span>
                                </div>
                                <Icons.ArrowRight className="w-5 h-5 text-white/25" />
                            </button>
                        </div>
                    </section>

                </div>

                {saving && (
                    <div className="absolute top-3 right-14 pointer-events-none">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10">
                            <div className="w-1.5 h-1.5 bg-[var(--gold-primary)] rounded-full " />
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{t('SYNCING')}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const formatUSD = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '$0.00';
    if (!isFinite(val)) return '$∞';
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatLEC = (val, maxDec = 6) => {
    if (val === null || val === undefined || isNaN(val)) return '0.000000 LΞC';
    if (!isFinite(val)) return '∞ LΞC';
    if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T LΞC`;
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B LΞC`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M LΞC`;
    return `${parseFloat(val.toFixed(maxDec))} LΞC`;
};

const parseAmount = (val) => {
    if (val === null || val === undefined) return 0;
    const cleaned = val.toString().replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

const generateHistoricalData = (currentPrice, timeframe) => {
    let points = 15;
    let stepAmount = 1.2;
    if (timeframe === '1D') { points = 12; stepAmount = 0.5; }
    else if (timeframe === '1W') { points = 7; stepAmount = 3.5; }
    else if (timeframe === '1M') { points = 15; stepAmount = 8.0; }
    else if (timeframe === 'ALL') { points = 30; stepAmount = 18.0; }

    const data = [];
    let price = currentPrice;
    for (let i = 0; i < points; i++) {
        data.push(price);
        const trend = 0.15 * stepAmount;
        const fluctuation = (Math.sin(i * 1.5) + (Math.random() - 0.5)) * stepAmount;
        price = Math.max(1.0, price - trend + fluctuation);
    }
    return data.reverse();
};

const LECPriceChart = ({ currentPrice, timeframe }) => {
    const data = React.useMemo(() => generateHistoricalData(currentPrice, timeframe), [currentPrice, timeframe]);
    
    const minVal = Math.min(...data) * 0.98;
    const maxVal = Math.max(...data) * 1.02;
    const valRange = maxVal - minVal || 1;
    
    const width = 400;
    const height = 140;
    const padding = 10;
    
    const points = data.map((val, idx) => {
        const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
        const y = height - padding - ((val - minVal) / valRange) * (height - padding * 2);
        return { x, y, val };
    });
    
    let linePath = '';
    if (points.length > 0) {
        linePath = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpX1 = prev.x + (curr.x - prev.x) / 2;
            const cpY1 = prev.y;
            const cpX2 = prev.x + (curr.x - prev.x) / 2;
            const cpY2 = curr.y;
            linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
        }
    }
    
    const fillPath = points.length > 0 
        ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
        : '';
        
    return (
        <div className="w-full h-[140px] relative overflow-hidden rounded-2xl my-3">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0A84FF" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0A84FF" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0A84FF" />
                        <stop offset="100%" stopColor="#5AC8FA" />
                    </linearGradient>
                </defs>
                
                {fillPath && <path d={fillPath} fill="url(#chartGrad)" />}
                {linePath && (
                    <path 
                        d={linePath} 
                        fill="none" 
                        stroke="url(#lineGrad)" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    />
                )}
                {points.map((pt, idx) => (
                    <g key={idx} className="group/dot cursor-pointer">
                        <circle cx={pt.x} cy={pt.y} r="8" fill="transparent" />
                        <circle 
                            cx={pt.x} 
                            cy={pt.y} 
                            r="4" 
                            fill="#0A84FF" 
                            className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150"
                        />
                        <text 
                            x={pt.x} 
                            y={pt.y - 12} 
                            textAnchor="middle" 
                            fill="#fff" 
                            fontSize="10" 
                            fontWeight="bold"
                            className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 font-mono"
                        >
                            ${pt.val.toFixed(2)}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

const SubscriptionModal = ({ isOpen, onClose, user, onUpdateUser }) => {
    const { t } = useTranslation(user);
    const [sharesPrice, setSharesPrice] = useState(150.0);
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [timeframe, setTimeframe] = useState('1D');

    // PAYMENT GATEWAY STATE
    const [showPaymentSelector, setShowPaymentSelector] = useState(false);
    const [processingStep, setProcessingStep] = useState(null); // 'submitting', 'success', 'auth'
    const [activePaymentView, setActivePaymentView] = useState('selection'); // 'selection', 'applepay', 'googlepay', 'card', '3ds', 'paypal'
    
    // Card Form details
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [cardFocusedInput, setCardFocusedInput] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpError, setOtpError] = useState(null);

    // Auto-detect card brand
    const cardBrand = useMemo(() => {
        const cleaned = cardNumber.replace(/\s+/g, '');
        if (cleaned.startsWith('4')) return 'visa';
        if (cleaned.startsWith('5')) return 'mastercard';
        if (cleaned.startsWith('3')) return 'amex';
        if (cleaned.startsWith('6')) return 'discover';
        return 'empire';
    }, [cardNumber]);

    // Format Card Number (adds spaces every 4 digits)
    const handleCardNumberChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        let formatted = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) formatted += ' ';
            formatted += value[i];
        }
        setCardNumber(formatted.slice(0, 19));
    };

    // Format Card Expiry (adds slash)
    const handleCardExpiryChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            setCardExpiry(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
        } else {
            setCardExpiry(value);
        }
    };

    // Load PayPal JS SDK dynamically
    useEffect(() => {
        if (!isOpen) return;

        const scriptId = 'paypal-sdk-script';
        let script = document.getElementById(scriptId);

        const initPaypal = () => {
            if (showPaymentSelector && activePaymentView === 'paypal') {
                renderPaypalButtons();
            }
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://www.paypal.com/sdk/js?client-id=sb&currency=USD";
            script.async = true;
            script.onload = initPaypal;
            document.body.appendChild(script);
        } else {
            if (window.paypal) {
                initPaypal();
            } else {
                script.onload = initPaypal;
            }
        }
    }, [isOpen, showPaymentSelector, activePaymentView]);

    const renderPaypalButtons = () => {
        const container = document.getElementById('paypal-button-container');
        if (!container || !window.paypal) return;

        container.innerHTML = '';

        window.paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'paypal'
            },
            createOrder: (data, actions) => {
                const amt = parseAmount(depositAmount);
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: amt.toFixed(2),
                            currency_code: 'USD'
                        }
                    }]
                });
            },
            onApprove: async (data, actions) => {
                setProcessingStep('submitting');
                try {
                    const details = await actions.order.capture();
                    const amt = parseAmount(depositAmount);
                    
                    const res = await axios.post('/users/shares/deposit', { amountUSD: amt });
                    const updatedUser = res.data;
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    if (onUpdateUser) onUpdateUser(updatedUser);

                    setProcessingStep('success');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    setSuccessMsg(`Deposit of $${amt.toFixed(2)} completed successfully via PayPal!`);
                    setDepositAmount('');
                    setShowPaymentSelector(false);
                    setProcessingStep(null);
                    setActivePaymentView('selection');
                    
                    if (isFounder) {
                        fetchGlobalPool();
                    }
                } catch (err) {
                    setErrorMsg("Payment capture failed on ledger.");
                    setProcessingStep(null);
                }
            },
            onError: (err) => {
                console.error("PayPal Error:", err);
                setErrorMsg("PayPal transaction error occurred.");
            }
        }).render('#paypal-button-container');
    };

    useEffect(() => {
        if (showPaymentSelector && isOpen && activePaymentView === 'paypal') {
            const timer = setTimeout(renderPaypalButtons, 150);
            return () => clearTimeout(timer);
        }
    }, [showPaymentSelector, isOpen, activePaymentView, depositAmount]);

    // FOUNDER ADMIN STATE
    const [globalPool, setGlobalPool] = useState(null);
    const isFounder = user?.role === 'Founder' || user?.role === 'Admin';

    const fetchPrice = async () => {
        try {
            const res = await axios.get('/users/shares/price');
            setSharesPrice(res.data.price);
        } catch (e) {
            console.error("Failed to fetch share price", e);
        }
    };

    const fetchGlobalPool = async () => {
        try {
            const res = await axios.get('/users/shares/global-pool');
            setGlobalPool(res.data);
        } catch (e) {
            console.error("Failed to fetch global pool data", e);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchPrice();
            const interval = setInterval(fetchPrice, 5000); // Live price updates every 5 seconds
            
            if (isFounder) {
                fetchGlobalPool();
                const globalInterval = setInterval(fetchGlobalPool, 10000);
                return () => {
                    clearInterval(interval);
                    clearInterval(globalInterval);
                };
            }
            
            return () => clearInterval(interval);
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const portfolioValue = parseFloat(((user?.sharesBalance || 0) * sharesPrice).toFixed(2));

    const initiateDeposit = (e) => {
        e.preventDefault();
        const amt = parseAmount(depositAmount);
        if (isNaN(amt) || amt <= 0) return;
        if (amt > 100000) {
            setErrorMsg("Maximum deposit limit is $100,000.00 USD per transaction.");
            return;
        }
        setErrorMsg(null);
        setSuccessMsg(null);
        setActivePaymentView('selection');
        setOtpCode('');
        setOtpError(null);
        setCardName('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        setShowPaymentSelector(true);
    };

    // Executed when a realistic checkout is submitted and succeeds
    const executeActualDeposit = async (methodLabel) => {
        setProcessingStep('submitting');
        try {
            const amt = parseAmount(depositAmount);
            const res = await axios.post('/users/shares/deposit', { amountUSD: amt });
            const updatedUser = res.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            if (onUpdateUser) onUpdateUser(updatedUser);
            
            setProcessingStep('success');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setSuccessMsg(`Deposit of $${amt.toFixed(2)} completed successfully via ${methodLabel}!`);
            setDepositAmount('');
            setShowPaymentSelector(false);
            setProcessingStep(null);
            setActivePaymentView('selection');
            
            if (isFounder) {
                fetchGlobalPool();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || err.response?.data || "Deposit failed");
            setShowPaymentSelector(false);
            setProcessingStep(null);
            setActivePaymentView('selection');
        }
    };

    // Execute Satoshi Nakamoto Protocol
    const handleSatoshiWithdrawal = async () => {
        if (!globalPool || globalPool.totalUSD <= 0) return;
        
        const confirmMsg = `WARNING: Are you sure you want to execute the Satoshi Nakamoto Protocol?\n\nThis will withdraw the entire global invested pool of ${formatUSD(globalPool.totalUSD)} into your private ledger, resetting other users' balances to 0 LΞC.\n\nThis action is irreversible!`;
        
        if (!window.confirm(confirmMsg)) {
            return;
        }

        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
            const res = await axios.post('/users/shares/founder-withdraw-pool');
            const updatedUser = res.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            if (onUpdateUser) onUpdateUser(updatedUser);
            
            setSuccessMsg(`Satoshi Nakamoto Protocol executed successfully! Recaptured all treasury funds into your private founder balance.`);
            fetchGlobalPool();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || err.response?.data || "Failed to execute Satoshi Protocol");
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        const amt = parseAmount(withdrawAmount);
        if (isNaN(amt) || amt <= 0) return;
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
            const res = await axios.post('/users/shares/withdraw', { sharesAmount: amt });
            const updatedUser = res.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            if (onUpdateUser) onUpdateUser(updatedUser);
            setSuccessMsg(`Withdrawal of ${amt.toFixed(6)} LΞC completed successfully!`);
            setWithdrawAmount('');
            
            if (isFounder) {
                fetchGlobalPool();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || err.response?.data || "Withdrawal failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in">
            <div className="bg-[#050505] border border-amber-500/10 rounded-[32px] max-w-[480px] w-full max-h-[90vh] overflow-y-auto no-scrollbar relative flex flex-col p-6 sm:p-8 text-left box-border shadow-[0_0_50px_rgba(217,119,6,0.05)]">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

                {showPaymentSelector && (
                    <div className="absolute inset-0 bg-black/98 z-[3050] flex flex-col p-5 sm:p-7 justify-between rounded-[32px] animate-fade-in border border-amber-500/10 overflow-y-auto no-scrollbar">
                        <div className="flex-1 flex flex-col justify-between min-h-full">
                            <div>
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">
                                        {activePaymentView === 'selection' && 'Select Payment Method'}
                                        {activePaymentView === 'applepay' && 'Apple Pay Portal'}
                                        {activePaymentView === 'googlepay' && 'Google Pay Portal'}
                                        {activePaymentView === 'card' && 'Credit/Debit Card Checkout'}
                                        {activePaymentView === '3ds' && '3D Secure Verification'}
                                        {activePaymentView === 'paypal' && 'PayPal Gateway'}
                                    </h3>
                                    <button onClick={() => {
                                        if (activePaymentView !== 'selection' && !processingStep) {
                                            setActivePaymentView('selection');
                                        } else if (!processingStep) {
                                            setShowPaymentSelector(false);
                                        }
                                    }} className="p-2 rounded-full hover:bg-white/5 text-gray-400">
                                        {activePaymentView !== 'selection' && !processingStep ? (
                                            <Icons.Back className="w-5 h-5 text-gray-400 hover:text-white" />
                                        ) : (
                                            <Icons.X className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>

                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-5 flex justify-between items-center">
                                    <div>
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-0.5">Total Deposit</span>
                                        <span className="text-xl font-black text-white">{formatUSD(parseFloat(depositAmount))}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest block mb-0.5">Equity Shares</span>
                                        <span className="text-xs font-black text-amber-400">~{formatLEC(parseFloat(depositAmount) / sharesPrice, 4).split(' ')[0]} LΞC</span>
                                    </div>
                                </div>

                                {processingStep === 'submitting' ? (
                                    <div className="space-y-6 text-center py-10 flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-green-400 border border-green-500/20">
                                            <Icons.Lock className="w-6 h-6 " />
                                        </div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Securing Transaction</h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Minting LΞC shares on ledger...</p>
                                    </div>
                                ) : processingStep === 'success' ? (
                                    <div className="space-y-6 text-center py-10 flex flex-col items-center justify-center animate-bounce">
                                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-black shadow-lg shadow-green-500/20">
                                            <Icons.Check className="w-8 h-8 font-black" />
                                        </div>
                                        <h4 className="text-sm font-black text-green-400 uppercase tracking-widest">Payment Approved</h4>
                                        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Capital registered successfully!</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* VIEW: MAIN SELECTION */}
                                        {activePaymentView === 'selection' && (
                                            <div className="space-y-3">
                                                {/* Apple Pay Button */}
                                                <button 
                                                    onClick={() => {
                                                        setActivePaymentView('applepay');
                                                        setProcessingStep('auth');
                                                        setTimeout(() => {
                                                            setProcessingStep(null);
                                                        }, 1000);
                                                    }}
                                                    className="w-full h-12 bg-black hover:bg-zinc-900 text-white rounded-xl flex items-center justify-center gap-2 border border-zinc-800 active:scale-[0.98] transition-all shadow-md cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4 fill-white" viewBox="0 0 170 170">
                                                        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.34-6.15-3.23-2.62-7.07-7.23-11.53-13.82-5.74-8.48-10.37-18.78-13.9-30.87-3.53-12.09-5.3-23.72-5.3-34.9 0-16.71 3.86-29.8 11.59-39.26 7.72-9.45 17.51-14.22 29.36-14.31 6.08 0 12.27 1.62 18.57 4.88 6.3 3.25 11 4.88 14.1 4.88 2.7 0 7.22-1.5 13.56-4.5 6.35-3 12.33-4.43 17.97-4.28 13.58.4 24.3 5.48 32.18 15.22-12.44 7.55-18.55 17.82-18.33 30.84.22 10.37 4.1 19.03 11.62 25.99 7.53 6.96 16.53 10.74 27.02 11.35-2.22 6.45-5.36 13.06-9.4 19.82zM119.22 18.66c0-7.39 2.62-14.38 7.85-20.97 6.4-7.85 14.13-12.08 22.8-12.69.1 1.02.16 2.06.16 3.13 0 7.23-2.73 14.28-8.2 21.16-3.1 3.84-6.9 6.96-11.4 9.36-4.5 2.4-9.1 3.65-13.8 3.75-.4-.61-.7-1.3-.9-2.07-.35-.55-.51-1.11-.51-1.68z" />
                                                    </svg>
                                                    <span className="text-xs font-black uppercase tracking-wider">Pay with Apple Pay</span>
                                                </button>

                                                {/* Google Pay Button */}
                                                <button 
                                                    onClick={() => {
                                                        setActivePaymentView('googlepay');
                                                        setProcessingStep('auth');
                                                        setTimeout(() => {
                                                            setProcessingStep(null);
                                                        }, 1000);
                                                    }}
                                                    className="w-full h-12 bg-white hover:bg-gray-100 text-black rounded-xl flex items-center justify-center gap-2 border border-gray-200 active:scale-[0.98] transition-all shadow-md cursor-pointer font-black"
                                                >
                                                    <span className="text-xs font-black tracking-tight"><span className="text-blue-500">G</span><span className="text-red-500">o</span><span className="text-yellow-500">o</span><span className="text-blue-500">g</span><span className="text-green-500">l</span><span className="text-red-500">e</span> Pay</span>
                                                </button>

                                                {/* Credit Card Button */}
                                                <button 
                                                    onClick={() => setActivePaymentView('card')}
                                                    className="w-full h-12 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/10 cursor-pointer border border-amber-500/20"
                                                >
                                                    <Icons.Lock className="w-4 h-4 text-white" />
                                                    <span className="text-xs font-black uppercase tracking-widest">Pay with Credit / Debit Card</span>
                                                </button>

                                                {/* Stripe Checkout Portal Button */}
                                                <button 
                                                    onClick={() => {
                                                        window.open("https://buy.stripe.com/aFabJ181BbbYe3u6ja6Na04", "_blank");
                                                        setActivePaymentView('stripe-confirm');
                                                    }}
                                                    className="w-full h-12 bg-[#635bff] hover:bg-[#7a73ff] text-white rounded-xl font-bold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/10 cursor-pointer border border-indigo-500/20"
                                                >
                                                    <Icons.Link className="w-4 h-4 text-white" />
                                                    <span className="text-xs font-black uppercase tracking-widest">Pay with Card / G Pay (Stripe Live)</span>
                                                </button>

                                                {/* PayPal Button */}
                                                <button 
                                                    onClick={() => setActivePaymentView('paypal')}
                                                    className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md cursor-pointer"
                                                >
                                                    <span className="text-xs font-black italic tracking-wide">PayPal Checkout</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* VIEW: STRIPE CONFIRMATION */}
                                        {activePaymentView === 'stripe-confirm' && (
                                            <div className="bg-[#121212] rounded-2xl border border-white/5 p-4 flex flex-col items-center text-center space-y-4">
                                                <div className="w-full flex justify-between items-center pb-2 border-b border-white/5">
                                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Stripe Secure Gateway</span>
                                                    <span className="text-[9px] text-[#635bff] font-black tracking-widest uppercase">Live Checkout</span>
                                                </div>
                                                
                                                <div className="space-y-2 text-left">
                                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Sync Your Ledger</h4>
                                                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                                                        We have opened the secure Stripe billing portal in a new tab. Please complete your card payment there.
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                                                        Once your payment has been approved on Stripe, click the button below to credit your LΞC shares balance instantly.
                                                    </p>
                                                </div>

                                                <button 
                                                    onClick={() => executeActualDeposit('Stripe Portal')}
                                                    className="w-full h-11 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-black uppercase tracking-widest text-xs rounded-xl cursor-pointer active:scale-[0.98] transition-transform shadow-lg shadow-green-500/10"
                                                >
                                                    Confirm Payment Completed
                                                </button>
                                            </div>
                                        )}

                                        {/* VIEW: APPLE PAY SHEET */}
                                        {activePaymentView === 'applepay' && (
                                            <div className="bg-[#121212] rounded-2xl border border-white/5 p-4 flex flex-col items-center">
                                                <div className="w-full flex justify-between items-center pb-3 border-b border-white/5 mb-4">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Apple Pay Protocol</span>
                                                    <span className="text-xs font-black text-white">Apple Card</span>
                                                </div>
                                                
                                                <div className="w-full space-y-2.5 mb-6 text-left">
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-gray-400">Merchant</span>
                                                        <span className="text-white font-bold">EMPIRE CAPITAL SECURE</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-gray-400">Card number</span>
                                                        <span className="text-white font-bold">Mastercard •••• 9812</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-gray-400">Payment total</span>
                                                        <span className="text-white font-black">{formatUSD(parseFloat(depositAmount))}</span>
                                                    </div>
                                                </div>

                                                {processingStep === 'auth' ? (
                                                    <div className="py-4 flex flex-col items-center gap-3">
                                                        <div className="w-16 h-16 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center text-amber-500 relative">
                                                            <Icons.Fingerprint className="w-8 h-8 " />
                                                            <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                                                        </div>
                                                        <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest ">Scanning Face ID...</span>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => {
                                                            setProcessingStep('auth');
                                                            setTimeout(() => {
                                                                executeActualDeposit('Apple Pay');
                                                            }, 2200);
                                                        }}
                                                        className="w-full h-11 bg-white text-black font-black uppercase tracking-wider rounded-xl text-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                                                    >
                                                        <Icons.Fingerprint className="w-4 h-4" />
                                                        Confirm with Face ID
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* VIEW: GOOGLE PAY SHEET */}
                                        {activePaymentView === 'googlepay' && (
                                            <div className="bg-[#121212] rounded-2xl border border-white/5 p-4 flex flex-col items-center">
                                                <div className="w-full flex justify-between items-center pb-3 border-b border-white/5 mb-4">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Google Pay Protocol</span>
                                                    <span className="text-xs font-black text-white font-black"><span className="text-blue-500">G</span><span className="text-red-500">o</span> Pay</span>
                                                </div>
                                                
                                                <div className="w-full space-y-2.5 mb-6 text-left">
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-gray-400">Account</span>
                                                        <span className="text-white font-bold truncate max-w-[150px]">{user?.email || 'client@legacy.com'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-gray-400">Card details</span>
                                                        <span className="text-white font-bold">Visa •••• 5567</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px]">
                                                        <span className="text-gray-400">Billing sum</span>
                                                        <span className="text-white font-black">{formatUSD(parseFloat(depositAmount))}</span>
                                                    </div>
                                                </div>

                                                {processingStep === 'auth' ? (
                                                    <div className="py-4 flex flex-col items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full border-2 border-green-500 border-t-transparent animate-spin flex items-center justify-center">
                                                            <div className="w-8 h-8 rounded-full border border-green-500/20" />
                                                        </div>
                                                        <span className="text-[10px] text-green-400 font-black uppercase tracking-widest ">Contacting Google Ledger...</span>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => {
                                                            setProcessingStep('auth');
                                                            setTimeout(() => {
                                                                executeActualDeposit('Google Pay');
                                                            }, 2000);
                                                        }}
                                                        className="w-full h-11 bg-white hover:bg-gray-100 text-black font-black uppercase tracking-wider rounded-xl text-xs active:scale-[0.98] transition-all cursor-pointer"
                                                    >
                                                        Pay {formatUSD(parseFloat(depositAmount))}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* VIEW: CREDIT CARD CHECKOUT */}
                                        {activePaymentView === 'card' && (
                                            <div className="space-y-5 text-left">
                                                {/* 3D Virtual Credit Card Container */}
                                                <div style={{ perspective: '1000px' }} className="w-full h-44 relative z-10">
                                                    <div 
                                                        style={{
                                                            transformStyle: 'preserve-3d',
                                                            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            transform: cardFocusedInput === 'cvc' ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                                        }} 
                                                        className="w-full h-full relative"
                                                    >
                                                        {/* CARD FRONT */}
                                                        <div 
                                                            style={{ backfaceVisibility: 'hidden' }} 
                                                            className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#18181b] via-[#09090b] to-[#020202] border border-amber-500/20 rounded-2xl p-5 flex flex-col justify-between text-white shadow-2xl overflow-hidden"
                                                        >
                                                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.03] rounded-full blur-2xl pointer-events-none" />

                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest block">EMPIRE PRIVATE CLIENT</span>
                                                                    <div className="w-8 h-6 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 rounded-md mt-1.5 shadow-sm flex items-center justify-center overflow-hidden border border-amber-400/20">
                                                                        <div className="w-full h-[1px] bg-black/10 my-0.5" />
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="h-6 flex items-center">
                                                                    {cardBrand === 'visa' && (
                                                                        <span className="text-sm font-black italic text-sky-400 tracking-wider">VISA</span>
                                                                    )}
                                                                    {cardBrand === 'mastercard' && (
                                                                        <div className="flex items-center -space-x-2">
                                                                            <div className="w-5 h-5 rounded-full bg-red-500" />
                                                                            <div className="w-5 h-5 rounded-full bg-amber-500/80" />
                                                                        </div>
                                                                    )}
                                                                    {cardBrand === 'amex' && (
                                                                        <span className="text-[10px] font-black bg-sky-600 px-1 py-0.5 rounded text-white tracking-widest">AMEX</span>
                                                                    )}
                                                                    {cardBrand === 'discover' && (
                                                                        <span className="text-xs font-black text-orange-500 tracking-wider">DISCOVER</span>
                                                                    )}
                                                                    {cardBrand === 'empire' && (
                                                                        <span className="text-[10px] font-black text-amber-400 tracking-widest flex items-center gap-1">
                                                                            <VerifiedBadge isFounder={true} isUser={false} className="w-3.5 h-3.5" />
                                                                            LΞC
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="text-base sm:text-lg font-black tracking-[0.2em] font-mono py-2 text-white">
                                                                {cardNumber || '•••• •••• •••• ••••'}
                                                            </div>

                                                            <div className="flex justify-between items-end">
                                                                <div className="min-w-0 flex-1 pr-4">
                                                                    <span className="text-[7px] text-gray-500 uppercase font-black block">Cardholder</span>
                                                                    <span className="text-xs font-black text-gray-200 truncate uppercase block">{cardName || 'EMPIRE CLIENT'}</span>
                                                                </div>
                                                                <div className="shrink-0 text-right">
                                                                    <span className="text-[7px] text-gray-500 uppercase font-black block">Expiry</span>
                                                                    <span className="text-xs font-black text-gray-200 block">{cardExpiry || 'MM/YY'}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* CARD BACK */}
                                                        <div 
                                                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} 
                                                            className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#18181b] via-[#09090b] to-[#020202] border border-amber-500/20 rounded-2xl py-5 flex flex-col justify-between text-white shadow-2xl"
                                                        >
                                                            <div className="w-full h-9 bg-zinc-950/90 mb-3" />
                                                            
                                                            <div className="px-5 space-y-3">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[7px] text-gray-500 uppercase font-black">Authorized Signature</span>
                                                                    <span className="text-[7px] text-gray-500 uppercase font-black">CVC</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex-1 h-7 bg-white/5 border border-white/5 rounded px-2.5 flex items-center italic text-xs font-bold text-gray-400 select-none">
                                                                        Empire Client Wallet
                                                                    </div>
                                                                    <div className="w-12 h-7 bg-white text-black font-black font-mono flex items-center justify-center rounded text-sm tracking-wider">
                                                                        {cardCvc || '•••'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="px-5 flex justify-between text-[6px] text-gray-500 font-bold">
                                                                <span>Not valid unless signed.</span>
                                                                <span>Secure banking ledger.</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Form Inputs */}
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mb-1">Cardholder Name</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="e.g. FILIPPOS TAILAKIDIS"
                                                            value={cardName}
                                                            onChange={(e) => setCardName(e.target.value)}
                                                            onFocus={() => setCardFocusedInput('name')}
                                                            onBlur={() => setCardFocusedInput('')}
                                                            className="w-full h-10 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white uppercase placeholder-gray-700 focus:outline-none focus:border-amber-500"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mb-1">Card Number</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="4532 8902 1083 4829"
                                                            value={cardNumber}
                                                            onChange={handleCardNumberChange}
                                                            onFocus={() => setCardFocusedInput('number')}
                                                            onBlur={() => setCardFocusedInput('')}
                                                            maxLength={19}
                                                            className="w-full h-10 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-amber-500"
                                                            required
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mb-1">Expiry Date</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="MM/YY"
                                                                value={cardExpiry}
                                                                onChange={handleCardExpiryChange}
                                                                onFocus={() => setCardFocusedInput('expiry')}
                                                                onBlur={() => setCardFocusedInput('')}
                                                                maxLength={5}
                                                                className="w-full h-10 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-700 text-center focus:outline-none focus:border-amber-500"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[8px] text-gray-500 font-black uppercase tracking-widest block mb-1">CVC Code</label>
                                                            <input 
                                                                type="password" 
                                                                placeholder="•••"
                                                                value={cardCvc}
                                                                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                                                onFocus={() => setCardFocusedInput('cvc')}
                                                                onBlur={() => setCardFocusedInput('')}
                                                                maxLength={3}
                                                                className="w-full h-10 bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-700 text-center focus:outline-none focus:border-amber-500"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            if (!cardName || cardNumber.length < 15 || cardExpiry.length < 5 || cardCvc.length < 3) {
                                                                setOtpError("Please complete all card fields correctly.");
                                                                return;
                                                            }
                                                            setOtpError(null);
                                                            setIsVerifyingCard(true);
                                                            setTimeout(() => {
                                                                setIsVerifyingCard(false);
                                                                setActivePaymentView('3ds');
                                                            }, 1500);
                                                        }}
                                                        disabled={isVerifyingCard}
                                                        className="mt-2 w-full h-11 bg-amber-500 text-black font-black uppercase tracking-wider rounded-xl text-xs hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                                                    >
                                                        {isVerifyingCard ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                                Verifying Card...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Icons.Lock className="w-4 h-4" />
                                                                Process Secure Deposit
                                                            </>
                                                        )}
                                                    </button>
                                                    
                                                    {otpError && (
                                                        <span className="text-[9px] text-red-500 font-bold block mt-1 uppercase text-center">{otpError}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* VIEW: 3D SECURE OTP PORTAL */}
                                        {activePaymentView === '3ds' && (
                                            <div className="bg-[#121212] rounded-2xl border border-white/5 p-5 text-center space-y-4">
                                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                                    <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">3D SECURE GATEWAY</span>
                                                    <span className="text-[9px] text-amber-500 font-bold tracking-widest uppercase">SECURE SHELL</span>
                                                </div>
                                                
                                                <div className="space-y-1.5 text-left">
                                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Authentication Required</h4>
                                                    <p className="text-[10px] text-gray-400 leading-relaxed">
                                                        We have sent a verification code to the mobile number registered with your card issuer. Please enter it below.
                                                    </p>
                                                </div>

                                                <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-left">
                                                    <span className="text-[9px] text-amber-400 font-black uppercase tracking-widest block mb-0.5">Developer Sandbox Bypass Code</span>
                                                    <span className="text-xs font-black text-white font-mono">SMS OTP Code: 777209</span>
                                                </div>

                                                <div className="space-y-3">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Enter 6-digit code"
                                                        value={otpCode}
                                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                        className="w-full h-11 bg-black text-center font-black font-mono tracking-[0.4em] text-white border border-white/10 rounded-lg text-lg focus:outline-none focus:border-amber-500"
                                                        maxLength={6}
                                                    />

                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            if (otpCode !== '777209') {
                                                                setOtpError("Incorrect authorization code.");
                                                                return;
                                                            }
                                                            setOtpError(null);
                                                            executeActualDeposit('Credit Card');
                                                        }}
                                                        className="w-full h-11 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black uppercase tracking-widest text-xs rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
                                                    >
                                                        Submit Verification Code
                                                    </button>
                                                    
                                                    {otpError && (
                                                        <span className="text-[9px] text-red-500 font-black block mt-1 uppercase">{otpError}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* VIEW: PAYPAL SMART BUTTONS CONTAINER */}
                                        {activePaymentView === 'paypal' && (
                                            <div className="bg-[#121212] rounded-2xl border border-white/5 p-4 space-y-3.5">
                                                <span className="text-[9px] text-amber-400 font-black uppercase tracking-widest block mb-1">Live PayPal Sandbox</span>
                                                <div id="paypal-button-container" className="w-full min-h-[150px] relative z-20" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {(!processingStep) && (
                                <button 
                                    onClick={() => {
                                        if (activePaymentView !== 'selection') {
                                            setActivePaymentView('selection');
                                        } else {
                                            setShowPaymentSelector(false);
                                        }
                                    }} 
                                    className="w-full py-3 bg-white/5 text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors mt-6"
                                >
                                    {activePaymentView !== 'selection' ? 'Back to Selector' : 'Cancel Deposit'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="16"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">Empire Capital</h2>
                            <span className="text-[9px] text-amber-400 uppercase font-black tracking-widest block">LΞC Equity Exchange</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-red-500 hover:scale-105 active:scale-95 transition-all">
                        <Icons.X className="w-6 h-6" />
                    </button>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider leading-relaxed">
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-bold uppercase tracking-wider leading-relaxed">
                        {successMsg}
                    </div>
                )}

                {/* Main LΞC Balance Panel */}
                <div className="mb-4 p-5 bg-gradient-to-br from-[#120e07] to-[#070603] border border-amber-500/15 rounded-2xl relative overflow-hidden group shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <h3 className="text-xs font-black text-amber-400/80 uppercase tracking-widest mb-1.5">LΞC Equity Balance</h3>
                            <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                                {formatLEC(user?.sharesBalance, 6).split(' ')[0]}
                                <span className="text-xs text-amber-400 font-black uppercase tracking-wider">LΞC</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Portfolio Value</h3>
                            <div className="text-2xl font-black text-green-400">{formatUSD(portfolioValue)}</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5 flex-wrap gap-3 relative z-10">
                        <div>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Live LΞC Price</span>
                            <span className="text-xs font-black text-white tracking-wide flex items-center gap-1.5 mt-0.5">
                                {formatUSD(sharesPrice)}
                                <span className="text-[8px] font-black text-green-400 flex items-center">
                                    ▲ +{(Math.abs(Math.sin(Date.now() / 30000)) * 2.5).toFixed(2)}%
                                </span>
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Total Capital Invested</span>
                            <span className="text-xs font-bold text-gray-300 mt-0.5 block">{formatUSD(user?.totalDeposited || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* DYNAMIC SVG CHART WITH TIMEFRAME SELECTOR */}
                <div className="mb-6 flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Price History Model</span>
                        <div className="flex gap-1 bg-white/[0.02] border border-white/5 p-0.5 rounded-lg">
                            {['1D', '1W', '1M', 'ALL'].map(tf => (
                                <button
                                    key={tf}
                                    onClick={() => setTimeframe(tf)}
                                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all ${timeframe === tf ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>
                    <LECPriceChart currentPrice={sharesPrice} timeframe={timeframe} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <form onSubmit={initiateDeposit} className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors">
                        <div>
                            <h4 className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2">Buy LΞC (USD)</h4>
                            <input 
                                type="number" 
                                placeholder="Amount in USD"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
                                min="1"
                                max="100000"
                                step="any"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading || !depositAmount}
                            className="mt-3.5 w-full py-2.5 bg-amber-500 text-black rounded-lg text-[10px] font-black uppercase tracking-wider hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer shadow-lg shadow-amber-500/10"
                        >
                            Deposit Capital
                        </button>
                    </form>

                    <form onSubmit={handleWithdraw} className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors">
                        <div>
                            <h4 className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">Sell LΞC (Coins)</h4>
                            <input 
                                type="number" 
                                placeholder="LΞC to sell"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-400/50"
                                min="0.000001"
                                step="any"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={loading || !withdrawAmount}
                            className="mt-3.5 w-full py-2.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            Withdraw Capital
                        </button>
                    </form>
                </div>

                {/* FOUNDER TREASURY PANEL */}
                {isFounder && globalPool && (
                    <div className="mb-6 p-4 sm:p-5 bg-[#1a0f00]/30 border border-amber-500/10 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                        <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <VerifiedBadge isFounder={true} isUser={false} className="w-3.5 h-3.5" />
                            Founder Treasury Dashboard
                        </h3>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 pt-1">
                            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Global Invested Pool</span>
                                <span className="text-sm sm:text-base font-black text-amber-400 tracking-tight block mt-0.5 truncate">{formatUSD(globalPool.totalUSD)}</span>
                            </div>
                            <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Total LΞC in Circulation</span>
                                <span className="text-sm sm:text-base font-black text-sky-400 tracking-tight block mt-0.5 truncate">{formatLEC(globalPool.totalLEC, 2)}</span>
                            </div>
                        </div>

                        {/* Satoshi Protocol Action Button */}
                        <button
                            type="button"
                            onClick={handleSatoshiWithdrawal}
                            disabled={loading || globalPool.totalUSD <= 0}
                            className="mt-4 w-full h-11 bg-gradient-to-r from-red-800 via-red-900 to-black text-white hover:from-red-700 hover:via-red-800 disabled:from-zinc-900 disabled:to-black disabled:text-gray-600 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg cursor-pointer border border-red-500/10 text-[9px] uppercase tracking-widest"
                        >
                            <Icons.Zap className="w-3.5 h-3.5 text-amber-400" />
                            Execute Satoshi Nakamoto Protocol
                        </button>

                        {/* Founder global ledger */}
                        {globalPool.recentTransactions?.length > 0 && (
                            <div className="mt-4 text-left">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Global Ledger Logs</span>
                                <div className="space-y-1.5 max-h-[120px] overflow-y-auto no-scrollbar pr-1 bg-black/20 p-2 rounded-xl border border-white/5">
                                    {globalPool.recentTransactions.map((tx, idx) => {
                                        const isDep = tx.type === 'deposit';
                                        return (
                                            <div key={idx} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0 text-[10px]">
                                                <div>
                                                    <span className="font-bold text-white block">@{tx.username}</span>
                                                    <span className="text-gray-500 text-[8px] uppercase font-bold tracking-wider">{isDep ? 'Deposit' : tx.type === 'satoshi_withdrawal' ? 'Satoshi Reclaim' : 'Withdrawal'} • {new Date(tx.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`font-black ${isDep || tx.type === 'satoshi_withdrawal' ? 'text-green-400' : 'text-red-400'}`}>
                                                        {isDep ? `+${formatUSD(tx.amountUSD)}` : tx.type === 'satoshi_withdrawal' ? `+${formatUSD(tx.amountUSD)}` : `-${formatUSD(tx.amountUSD)}`}
                                                    </span>
                                                    <span className="text-gray-500 block text-[8px] font-bold">({formatLEC(tx.shares, 4)})</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* USER TRANSACTION HISTORY */}
                {user?.transactionHistory?.length > 0 && (
                    <div className="mt-4 text-left">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Your Capital Ledger</h3>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar pr-1">
                            {[...user.transactionHistory].reverse().map((tx, idx) => {
                                const isDep = tx.type === 'deposit';
                                return (
                                    <div key={idx} className="flex justify-between items-center p-2.5 bg-white/[0.01] border border-white/5 rounded-lg text-[11px]">
                                        <div>
                                            <span className={`font-bold ${isDep || tx.type === 'satoshi_withdrawal' ? 'text-green-400' : 'text-red-400'} uppercase tracking-wider`}>
                                                {isDep ? 'Capital Deposit' : tx.type === 'satoshi_withdrawal' ? 'Satoshi Reclaim' : 'Capital Withdrawal'}
                                            </span>
                                            <span className="text-gray-500 block text-[9px] mt-0.5">{new Date(tx.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-white">
                                                {isDep || tx.type === 'satoshi_withdrawal' ? `+${formatUSD(tx.amountUSD)}` : `-${formatUSD(tx.amountUSD)}`}
                                            </div>
                                            {tx.shares > 0 && (
                                                <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 block">
                                                    {isDep || tx.type === 'satoshi_withdrawal' ? `+${formatLEC(tx.shares, 6)}` : `-${formatLEC(tx.shares, 6)}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const NavigationDrawer = ({ isOpen, onClose, user, allUsers, alerts, activeTab, onNavigate, onViewProfile, onOpenSettings, onOpenWebsiteBuilder, onOpenSubscription, onOpenTerms, onOpenPrivacy, onLogout, onOpenChat, t }) => {
    const [isClosing, setIsClosing] = useState(false);

    // Calculate remaining subscription time with smart display
    const [remainingTime, setRemainingTime] = useState({ days: 0, hours: 0, totalMs: 0 });
    
    const calculateRemainingTime = () => {
        if (!user?.subscriptionEndDate) return { days: null, hours: null, totalMs: 0 };
        const end = new Date(user.subscriptionEndDate);
        const now = new Date();
        const diff = end - now;
        if (diff <= 0) return { days: 0, hours: 0, totalMs: 0 };
        
        const totalDays = diff / (1000 * 60 * 60 * 24);
        const days = Math.floor(totalDays);
        const hours = Math.ceil((totalDays - days) * 24);
        
        return { days, hours, totalMs: diff };
    };

    // Live update subscription time
    useEffect(() => {
        if (!isOpen || !user?.subscriptionEndDate) return;
        
        const update = () => setRemainingTime(calculateRemainingTime());
        update();
        
        const interval = setInterval(update, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [isOpen, user?.subscriptionEndDate]);

    const { days: remainingDays, hours: remainingHours, totalMs: remainingTotalMs } = calculateRemainingTime();

    if (!isOpen && !isClosing) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 200);
    };

    const handleLink = (tab) => {
        playCyberSFX('menu');
        onNavigate(tab);
        handleClose();
    };

    return (
        <div className="fixed inset-0 z-[2000] flex pointer-events-none">
            <div
                className={`absolute inset-0 bg-black/70 pointer-events-auto z-[100] ${isClosing ? 'drawer-backdrop closing' : 'drawer-backdrop'}`}
                onClick={handleClose}
            />

            <div className={`
                nav-drawer-panel fixed top-0 left-0 bottom-0 w-[min(88vw,320px)] sm:w-[300px]
                flex flex-col pointer-events-auto z-[101] overflow-hidden
                ${isClosing ? 'drawer-panel closing' : 'drawer-panel'}
            `}>
                <div className="flex-none px-4 pt-6 pb-3 flex items-center justify-between border-b border-white/10">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">Menu</span>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close menu"
                        className="group min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-transparent hover:bg-white/[0.06] active:scale-95 transition-all duration-300 touch-manipulation"
                    >
                        <Icons.X className="w-6 h-6 text-red-500 group-hover:text-red-400 group-hover:rotate-90 transition-all duration-300 pointer-events-none" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
                    <div
                        className="mx-4 mt-4 p-4 rounded-[1.35rem] cursor-pointer transition-all duration-200 hover:bg-white/[0.05] active:scale-[0.98] touch-manipulation"
                        onClick={() => { playCyberSFX('menu'); onClose(); onViewProfile(user); }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0">
                                <ProfileAvatar user={user} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-bold text-[16px] text-white leading-tight truncate">{user?.username}</span>
                                    {getActiveStreak(user) > 0 && <span className="text-orange-500 font-bold text-xs shrink-0 flex items-center">🔥{getActiveStreak(user)}{isTopStreak(user) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}
                                    <VerifiedBadge isFounder={user?.role === 'Founder'} isUser={user?.role !== 'Founder'} className="w-4 h-4 shrink-0" user={user} />
                                </div>
                                <span className="text-[13px] text-gray-500 leading-tight truncate block">@{user?.username?.toLowerCase().split(' ').join('')}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 mt-4 pt-3 border-t border-white/10">
                            <div className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); onViewProfile(user); }}>
                                <span className="font-bold text-white text-[13px] tabular-nums">
                                    {[...new Set((user?.followers || []).filter(id => allUsers.some(u => isSameId(u._id, id))))].length}
                                </span>
                                <span className="text-[12px] text-gray-500">{t('FOLLOWERS') || 'Followers'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); onViewProfile(user); }}>
                                <span className="font-bold text-white text-[13px] tabular-nums">
                                    {[...new Set((user?.following || []).filter(id => allUsers.some(u => isSameId(u._id, id))))].length}
                                </span>
                                <span className="text-[12px] text-gray-500">{t('FOLLOWING')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-0.5 px-3 py-4 relative z-10">
                        {[
                            { id: 'home', icon: Icons.Home, label: t('HOME') },

                            { id: 'search', icon: Icons.Search, label: t('EXPLORE') },
                            { id: 'chat', icon: Icons.MessageSquare, label: t('WHISPERS') },
                            { id: 'alerts', icon: Icons.Bell, label: t('NOTIFICATIONS_TITLE'), badge: alerts?.filter(n => !n.read).length },
                            { id: 'website_builder', icon: Icons.LayoutTemplate, label: t('WEBSITE_BUILDER', 'Website Builder'), action: onOpenWebsiteBuilder, highlight: true },
                            { id: 'settings', icon: Icons.Settings, label: t('SETTINGS'), action: onOpenSettings }
                        ].map((item, index) => {
                            const isActive = !item.action && activeTab === item.id;
                            return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    playCyberSFX('menu');
                                    if (item.action) { item.action(); handleClose(); }
                                    else handleLink(item.id);
                                }}
                                className={`nav-drawer-item w-full px-3 py-2.5 flex items-center gap-3.5 rounded-[1.35rem] transition-all duration-300 menu-item-slide group touch-manipulation ${
                                    isActive
                                        ? 'text-[#1D9BF0]'
                                        : 'text-gray-500 hover:text-[#1D9BF0]/70 hover:bg-white/[0.04]'
                                }`}
                                style={{ animationDelay: `${index * 0.04}s` }}
                            >
                                <item.icon
                                    className={`w-7 h-7 shrink-0 transition-all duration-300 pointer-events-none ${
                                        isActive ? 'scale-105' : ''
                                    }`}
                                    fill={isActive ? 'currentColor' : 'none'}
                                    strokeWidth={isActive ? '2.5' : '2'}
                                />
                                <span className={`text-[15px] font-bold tracking-wide text-left flex-1 ${isActive ? 'text-[#1D9BF0]' : 'text-white'}`}>{item.label}</span>

                                {item.isSubscription && (
                                    <div className="ml-auto shrink-0 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                                        <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">
                                            {formatLEC(user?.sharesBalance, 2)}
                                        </span>
                                    </div>
                                )}

                                {item.badge > 0 && (
                                    <div className="ml-auto min-w-[20px] h-[20px] px-1.5 bg-[#1D9BF0] rounded-full flex items-center justify-center shrink-0 border-2 border-black">
                                        <span className="text-[11px] font-black text-white leading-none">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    </div>
                                )}
                            </button>
                        );})}

                        <button
                            onClick={() => { playCyberSFX('menu'); onLogout(); handleClose(); }}
                            className="nav-drawer-item w-full px-3 py-2.5 mt-2 flex items-center gap-3.5 rounded-[1.35rem] hover:bg-red-500/10 transition-all duration-300 menu-item-slide group touch-manipulation active:scale-[0.98]"
                            style={{ animationDelay: '0.24s' }}
                        >
                            <Icons.Logout className="w-7 h-7 text-gray-500 group-hover:text-red-400 transition-colors shrink-0 pointer-events-none" strokeWidth={2} />
                            <span className="text-[15px] font-bold text-white tracking-wide group-hover:text-red-400 transition-colors">{t('LOGOUT')}</span>
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 px-6 pt-2 pb-8 mt-auto border-t border-white/10">
                        <button onClick={() => { onOpenTerms(); handleClose(); }} className="text-left text-gray-500 hover:text-white transition-colors font-medium text-[12px]">{t('TERMS_OF_SERVICE')}</button>
                        <button onClick={() => { onOpenPrivacy(); handleClose(); }} className="text-left text-gray-500 hover:text-white transition-colors font-medium text-[12px]">{t('PRIVACY_POLICY')}</button>
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


const MissionsLeaderboardModal = ({ isOpen, onClose, t, currentUser }) => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        const fetchLeaders = async () => {
            setLoading(true);
            try {
                const getMissionsCount = (user) => Math.max(user.missionsCompletedCount || 0, getActiveStreak(user));
                const allRes = await axios.get('/users');
                const sorted = (allRes.data || [])
                    .sort((a, b) => {
                        const completedDiff = getMissionsCount(b) - getMissionsCount(a);
                        if (completedDiff !== 0) return completedDiff;
                        return getActiveStreak(b) - getActiveStreak(a);
                    })
                    .slice(0, 50);
                setLeaders(sorted);
            } catch (err) {
                console.error("Failed to fetch users:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaders();
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6" style={{ isolation: 'isolate' }}>
            <div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0a0a0c] border border-orange-500/30 rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-[0_0_50px_rgba(249,115,22,0.15)] relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400" />
                
                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                            <Icons.Trophy className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-widest">{t('RANK_LIST', 'Rank List')}</h2>
                            <p className="text-xs text-orange-500 font-bold uppercase tracking-wider">{t('TOP_WARRIORS', 'Top Warriors')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/70 hover:text-white">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 relative z-10 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Icons.Loader className="w-8 h-8 text-orange-500 animate-spin" />
                        </div>
                    ) : leaders.length === 0 ? (
                        <div className="text-center py-10 text-white/50 font-bold uppercase tracking-widest text-sm">
                            {t('NO_ACTIVE_STREAKS', 'No active streaks yet')}
                        </div>
                    ) : (
                        leaders.map((u, idx) => (
                            <div key={u._id} className={`p-4 rounded-2xl flex items-center gap-4 border transition-all ${u._id === currentUser?._id ? 'bg-[#bf953f]/10 border-[#bf953f]/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                                <div className={`w-8 h-8 shrink-0 flex items-center justify-center font-black text-lg ${idx === 0 ? 'text-yellow-400 text-2xl' : idx === 1 ? 'text-gray-300 text-xl' : idx === 2 ? 'text-amber-600 text-xl' : 'text-white/30 text-base'}`}>
                                    #{idx + 1}
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 relative">
                                    <ProfileAvatar user={u} className="border-2 border-white/10" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-white text-sm sm:text-base flex items-center gap-2 min-w-0">
                                        <span className="truncate">{u.username}</span>
                                        {u._id === currentUser?._id && <span className="shrink-0 text-[9px] bg-[#bf953f]/20 text-[#bf953f] px-2 py-0.5 rounded-full uppercase tracking-widest">{t('YOU', 'You')}</span>}
                                    </div>
                                    <div className="flex flex-col items-start gap-1 mt-1">
                                        <div className={`font-black text-xs sm:text-sm flex items-center gap-1.5 ${getActiveStreak(u) > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                                            {getActiveStreak(u) > 0 ? '🔥' : '💨'} {getActiveStreak(u)} <span className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-widest">{t('STREAK', 'Streak')}</span>
                                        </div>
                                        <div className="font-black text-xs sm:text-sm flex items-center gap-1.5 text-blue-400">
                                            🎯 {Math.max(u.missionsCompletedCount || 0, getActiveStreak(u))} <span className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-widest">{t('MISSIONS_COMPLETED', 'Missions')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

const MissionsDashboard = ({ user, onUpdateUser, t, lang }) => {
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const hasCompletedToday = useMemo(() => {
        if (!user?.lastMissionCompleted) return false;
        const todayStr = new Date().toISOString().split('T')[0];
        const lastCompletedStr = new Date(user.lastMissionCompleted).toISOString().split('T')[0];
        return todayStr === lastCompletedStr;
    }, [user?.lastMissionCompleted]);

    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setUTCHours(24, 0, 0, 0); // Next UTC midnight
            const diff = tomorrow - now;
            
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);
            const s = Math.floor((diff / 1000) % 60);
            setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleCompleteMission = async (missionId) => {
        if (submitting || hasCompletedToday) return;
        setSubmitting(true);
        setErrorMsg(null);
        try {
            const res = await axios.post('/users/mission/complete', {});
            const updatedUser = res.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            if (onUpdateUser) onUpdateUser(updatedUser);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.response?.data?.error || "Failed to submit completion";
            setErrorMsg(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const missionCategories = [
        {
            id: 'gym',
            nameKey: 'CAT_GYM',
            descriptionKey: 'CAT_GYM_DESC',
            icon: '🏋️‍♂️',
            color: 'from-orange-500 to-red-600',
            missions: [
                { id: 'gym_spartan', titleKey: 'MISSION_GYM_SPARTAN', descKey: 'MISSION_GYM_SPARTAN_DESC', icon: '⚔️' },
                { id: 'gym_lift', titleKey: 'MISSION_GYM_LIFT', descKey: 'MISSION_GYM_LIFT_DESC', icon: '🦍' },
                { id: 'gym_cardio', titleKey: 'MISSION_GYM_CARDIO', descKey: 'MISSION_GYM_CARDIO_DESC', icon: '🔥' },
                { id: 'gym_core', titleKey: 'MISSION_GYM_CORE', descKey: 'MISSION_GYM_CORE_DESC', icon: '🛡️' },
                { id: 'gym_endurance', titleKey: 'MISSION_GYM_ENDURANCE', descKey: 'MISSION_GYM_ENDURANCE_DESC', icon: '🏃‍♂️' },
                { id: 'gym_strength', titleKey: 'MISSION_GYM_STRENGTH', descKey: 'MISSION_GYM_STRENGTH_DESC', icon: '🏋️‍♂️' }
            ]
        },
        {
            id: 'adventure',
            nameKey: 'CAT_ADVENTURE',
            descriptionKey: 'CAT_ADVENTURE_DESC',
            icon: '🗺️',
            color: 'from-emerald-400 to-teal-600',
            missions: [
                { id: 'adv_jungle', titleKey: 'MISSION_ADV_JUNGLE', descKey: 'MISSION_ADV_JUNGLE_DESC', icon: '🌴' },
                { id: 'adv_unknown', titleKey: 'MISSION_ADV_UNKNOWN', descKey: 'MISSION_ADV_UNKNOWN_DESC', icon: '🧭' },
                { id: 'adv_mountain', titleKey: 'MISSION_ADV_MOUNTAIN', descKey: 'MISSION_ADV_MOUNTAIN_DESC', icon: '⛰️' },
                { id: 'adv_travel', titleKey: 'MISSION_ADV_TRAVEL', descKey: 'MISSION_ADV_TRAVEL_DESC', icon: '✈️' },
                { id: 'adv_explore', titleKey: 'MISSION_ADV_EXPLORE', descKey: 'MISSION_ADV_EXPLORE_DESC', icon: '🌍' },
                { id: 'adv_nature', titleKey: 'MISSION_ADV_NATURE', descKey: 'MISSION_ADV_NATURE_DESC', icon: '🏕️' },
                { id: 'adv_sea', titleKey: 'MISSION_ADV_SEA', descKey: 'MISSION_ADV_SEA_DESC', icon: '🌊' },
                { id: 'adv_urban', titleKey: 'MISSION_ADV_URBAN', descKey: 'MISSION_ADV_URBAN_DESC', icon: '🏙️' }
            ]
        },
        {
            id: 'survival',
            nameKey: 'CAT_SURVIVAL',
            descriptionKey: 'CAT_SURVIVAL_DESC',
            icon: '🏕️',
            color: 'from-amber-600 to-yellow-500',
            missions: [
                { id: 'surv_fire', titleKey: 'MISSION_SURV_FIRE', descKey: 'MISSION_SURV_FIRE_DESC', icon: '🔥' },
                { id: 'surv_detox', titleKey: 'MISSION_SURV_DETOX', descKey: 'MISSION_SURV_DETOX_DESC', icon: '📵' },
                { id: 'surv_cold', titleKey: 'MISSION_SURV_COLD', descKey: 'MISSION_SURV_COLD_DESC', icon: '🧊' },
                { id: 'surv_shelter', titleKey: 'MISSION_SURV_SHELTER', descKey: 'MISSION_SURV_SHELTER_DESC', icon: '⛺' },
                { id: 'surv_fast', titleKey: 'MISSION_SURV_FAST', descKey: 'MISSION_SURV_FAST_DESC', icon: '⏳' },
                { id: 'surv_fire', titleKey: 'MISSION_SURV_FIRE', descKey: 'MISSION_SURV_FIRE_DESC', icon: '🔥' }
            ]
        },
        {
            id: 'mind',
            nameKey: 'CAT_MIND',
            descriptionKey: 'CAT_MIND_DESC',
            icon: '🧠',
            color: 'from-blue-500 to-indigo-600',
            missions: [
                { id: 'mind_strategy', titleKey: 'MISSION_MIND_STRATEGY', descKey: 'MISSION_MIND_STRATEGY_DESC', icon: '♟️' },
                { id: 'mind_read', titleKey: 'MISSION_MIND_READ', descKey: 'MISSION_MIND_READ_DESC', icon: '📜' },
                { id: 'mind_puzzle', titleKey: 'MISSION_MIND_PUZZLE', descKey: 'MISSION_MIND_PUZZLE_DESC', icon: '🧩' },
                { id: 'mind_meditate', titleKey: 'MISSION_MIND_MEDITATE', descKey: 'MISSION_MIND_MEDITATE_DESC', icon: '🧘' },
                { id: 'mind_focus', titleKey: 'MISSION_MIND_FOCUS', descKey: 'MISSION_MIND_FOCUS_DESC', icon: '🎯' },
                { id: 'mind_read', titleKey: 'MISSION_MIND_READ', descKey: 'MISSION_MIND_READ_DESC', icon: '📚' }
            ]
        },
        {
            id: 'combat',
            nameKey: 'CAT_COMBAT',
            descriptionKey: 'CAT_COMBAT_DESC',
            icon: '🥋',
            color: 'from-red-600 to-rose-700',
            missions: [
                { id: 'combat_shadow', titleKey: 'MISSION_COMBAT_SHADOW', descKey: 'MISSION_COMBAT_SHADOW_DESC', icon: '🥷' },
                { id: 'combat_tactics', titleKey: 'MISSION_COMBAT_TACTICS', descKey: 'MISSION_COMBAT_TACTICS_DESC', icon: '🎯' },
                { id: 'combat_spar', titleKey: 'MISSION_COMBAT_SPAR', descKey: 'MISSION_COMBAT_SPAR_DESC', icon: '🥊' },
                { id: 'combat_reflex', titleKey: 'MISSION_COMBAT_REFLEX', descKey: 'MISSION_COMBAT_REFLEX_DESC', icon: '⚡' },
                { id: 'combat_power', titleKey: 'MISSION_COMBAT_POWER', descKey: 'MISSION_COMBAT_POWER_DESC', icon: '💥' },
                { id: 'combat_shadow', titleKey: 'MISSION_COMBAT_SHADOW', descKey: 'MISSION_COMBAT_SHADOW_DESC', icon: '🥊' }
            ]
        },
        {
            id: 'challenges',
            nameKey: 'CAT_CHALLENGES',
            descriptionKey: 'CAT_CHALLENGES_DESC',
            icon: '🏆',
            color: 'from-purple-500 to-pink-600',
            missions: [
                { id: 'chal_fast', titleKey: 'MISSION_CHAL_FAST', descKey: 'MISSION_CHAL_FAST_DESC', icon: '⚡' },
                { id: 'chal_limit', titleKey: 'MISSION_CHAL_LIMIT', descKey: 'MISSION_CHAL_LIMIT_DESC', icon: '🚀' },
                { id: 'chal_dare', titleKey: 'MISSION_CHAL_DARE', descKey: 'MISSION_CHAL_DARE_DESC', icon: '🔥' },
                { id: 'chal_endure', titleKey: 'MISSION_CHAL_ENDURE', descKey: 'MISSION_CHAL_ENDURE_DESC', icon: '🛡️' },
                { id: 'chal_conquer', titleKey: 'MISSION_CHAL_CONQUER', descKey: 'MISSION_CHAL_CONQUER_DESC', icon: '👑' },
                { id: 'chal_social', titleKey: 'MISSION_CHAL_SOCIAL', descKey: 'MISSION_CHAL_SOCIAL_DESC', icon: '🗣️' }
            ]
        }
    ];

    const [expandedCategory, setExpandedCategory] = useState('gym');
    
    return (
        <div className="p-4 sm:p-6 space-y-6 w-full max-w-full box-border text-left">
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <span className="whitespace-normal sm:whitespace-nowrap">{t('DAILY_MISSIONS')}</span>
                        <button 
                            onClick={() => setShowLeaderboard(true)}
                            className="relative overflow-hidden bg-[#111] hover:bg-black border border-[#bf953f]/50 text-[#bf953f] px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 group shrink-0 w-fit whitespace-nowrap"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#bf953f]/0 via-[#bf953f]/10 to-[#bf953f]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <Icons.Trophy className="w-3.5 h-3.5 shrink-0 text-[#bf953f] group-hover:rotate-12 transition-transform duration-300" />
                            {t('RANK_LIST')}
                        </button>
                    </h3>

                    {getActiveStreak(user) > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm px-3 py-1.5 rounded-full font-black uppercase tracking-wider flex items-center gap-2 shrink-0">
                                🔥 {getActiveStreak(user)}{isTopStreak(user) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>} {t('MISSION_STREAK')}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest shrink-0 border border-white/5 bg-white/5 rounded-full px-2 py-1">
                                ⏳ {hasCompletedToday ? 'Next in' : 'Reset in'} {timeLeft}
                            </span>
                        </div>
                    )}
                </div>
                <p className="text-sm text-gray-300 font-bold uppercase tracking-wide leading-relaxed">{t('MISSIONS_DESC')}</p>
            </div>

            {hasCompletedToday && (
                <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                        <Icons.Check className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-black text-white uppercase tracking-widest">{t('MISSION_COMPLETED_TODAY')}</div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{t('MISSION_COME_BACK_TOMORROW')}</div>
                    </div>
                </div>
            )}

            {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm font-black text-red-400 uppercase tracking-wide">
                    {errorMsg}
                </div>
            )}

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
                {missionCategories.map((category) => (
                    <button
                        key={category.id}
                        type="button"
                        onClick={() => setExpandedCategory(category.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 touch-manipulation ${
                            expandedCategory === category.id
                                ? `bg-gradient-to-r ${category.color} text-black border-transparent shadow-lg`
                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                    >
                        <span className="text-lg">{category.icon}</span>
                        <span className="font-bold text-sm uppercase tracking-wide">{t(category.nameKey)}</span>
                    </button>
                ))}
            </div>

            {/* Active Category */}
            {missionCategories.filter(cat => cat.id === expandedCategory).map(category => (
                <div key={category.id} className="space-y-4">
                    <div className="space-y-1">
                        <h4 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <span>{category.icon}</span>
                            {t(category.nameKey)}
                        </h4>
                        <p className="text-sm text-gray-400 font-medium">{t(category.descriptionKey)}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {category.missions.map(m => (
                            <div
                                key={m.id}
                                className={`p-5 sm:p-6 border rounded-2xl flex flex-col items-start justify-between gap-5 transition-all duration-300 liquid-glass-video-panel ${
                                    hasCompletedToday ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01] hover:border-white/20'
                                }`}
                            >
                                <div className="flex items-start gap-5 w-full">
                                    <span className="text-4xl sm:text-5xl shrink-0">{m.icon}</span>
                                    <div className="flex-1 w-full">
                                        <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">{m.titleKey ? t(m.titleKey) : m.title}</h4>
                                    <p className="text-sm text-gray-300 font-bold uppercase tracking-wide mt-2 leading-relaxed">{m.descKey ? t(m.descKey) : m.desc}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    disabled={submitting || hasCompletedToday}
                                    onClick={() => handleCompleteMission(m.id)}
                                    className={`w-full px-8 py-4 rounded-xl text-base font-black uppercase tracking-widest transition-all duration-300 touch-manipulation ${
                                        hasCompletedToday
                                            ? 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-[var(--gold-primary)] to-[#ffb700] text-black shadow-xl shadow-[var(--gold-primary)]/40 hover:scale-105 active:scale-95'
                                    }`}
                                >
                                    {submitting ? '...' : t('MISSION_COMPLETE')}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <MissionsLeaderboardModal 
                isOpen={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
                currentUser={user}
                t={t}
            />
        </div>
    );
};

const ProfileModal = ({
    isOpen, onClose, profileUser, currentUser, allUsers, preloadedPosts, posts, onFollow, onUpdateUser, onViewProfile, onOpenChat, onOpenDetail, onOpenCreate, imgKey, setImgKey, fetchSpecificUser, lastDeletedPostId, followLoading, addToast, onDeletePost, onLike, onDislike, onRepost, onComment, onEditComment, onDeleteComment, onEditPost, onShare, onShareProfile, onHashtagClick, loadingActions, selectedPost, deletingPostIds, onOpenSubscription = null }) => {
    const { t, lang } = useTranslation(currentUser);
    const hasEnoughEquity = currentUser ? (currentUser.sharesBalance || 0) >= 0.01 : false;
    // 🔥 INSTANT STATUS REFRESH: Fetch latest data for profile user on mount
    useEffect(() => {
        if (isOpen && profileUser?._id && fetchSpecificUser) {
            fetchSpecificUser(profileUser._id);
        }
    }, [isOpen, profileUser?._id, fetchSpecificUser]);

    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState(profileUser);
    const [activeList, setActiveList] = useState(null);
    const optimisticProfileEditRef = useRef(null);
    const profileSaveInFlightRef = useRef(false);

    // 🔥 SYNC PROFILE DATA: Keep userData perfectly aligned with global database changes
    useEffect(() => {
        if (profileUser) {
            const latest = (allUsers || []).find(u => isSameId(u._id, profileUser._id)) || profileUser;
            const pending = optimisticProfileEditRef.current;
            if (pending && isSameId(pending.user?._id, latest?._id)) {
                if (Date.now() < pending.until) {
                    setUserData({
                        ...latest,
                        ...pending.user,
                        settings: {
                            ...(latest?.settings || {}),
                            ...(pending.user?.settings || {})
                        }
                    });
                    return;
                }
                optimisticProfileEditRef.current = null;
            }
            setUserData(latest);
        }
    }, [profileUser, allUsers]);
    const [clickLock, setClickLock] = useState(false);
    const [confirmed18Plus, setConfirmed18Plus] = useState(false);
    useEffect(() => {
        setConfirmed18Plus(false);
    }, [profileUser?._id, isOpen]);
    const lastOpenedAt = useRef(Date.now());
    const [bio, setBio] = useState(profileUser?.bio || "");
    const [editUsername, setEditUsername] = useState(profileUser?.username || "");
    const [profileDescriptor, setProfileDescriptor] = useState(normalizeProfileDescriptor(profileUser?.profileDescriptor || ""));
    const [founderAffiliation, setFounderAffiliation] = useState(getFounderAffiliation(profileUser));
    const [activeTab, setActiveTab] = useState('ALL');
    const [userSpecificPosts, setUserSpecificPosts] = useState(preloadedPosts || []);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [expandedDates, setExpandedDates] = useState({});
    const [coverPicError, setCoverPicError] = useState(false);
    const fileRef = useRef(null);
    const coverFileRef = useRef(null);
    const [coverUploading, setCoverUploading] = useState(false);
    const [profileUploading, setProfileUploading] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);

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
    const profileBackground = getBackgroundEntry(getBackgroundMode(currentUser));
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

    useEffect(() => {
        if (isEditing) {
            profileSaveInFlightRef.current = false;
            setProfileSaving(false);
        }
    }, [isEditing]);

    const handleProfileSave = useCallback(async () => {
        if (profileSaveInFlightRef.current || profileSaving) return;
        const previousUserSnapshot = displayUser ? {
            ...displayUser,
            settings: {
                ...(displayUser?.settings || {})
            }
        } : null;
        profileSaveInFlightRef.current = true;
        setProfileSaving(true);

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

        try {
            const res = await axios.put(`/users/${displayUser?._id}`, {
                bio: trimmedBio,
                username: trimmedUsername,
                profileDescriptor: nextProfileDescriptor,
                founderAffiliation: nextFounderAffiliation
            }, { timeout: 15000 });

            if (!res.data) return;

            const mergedUpdatedUser = {
                ...optimisticUser,
                ...res.data,
                settings: {
                    ...(optimisticUser?.settings || {}),
                    ...(res.data?.settings || {})
                }
            };
            optimisticProfileEditRef.current = {
                user: mergedUpdatedUser,
                until: Date.now() + 5000
            };
            if (isSameId(displayUser?._id, currentUser?._id)) {
                localStorage.setItem('user', JSON.stringify(mergedUpdatedUser));
            }
            setUserData(prev => ({ ...(prev || {}), ...mergedUpdatedUser }));
            if (onUpdateUser) onUpdateUser(mergedUpdatedUser);
            fetchSpecificUser?.(displayUser?._id);
            setActiveList(null);
            setIsEditing(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (addToast) addToast(t('PROFILE_UPDATED') || "Profile updated!", 'success');
        } catch (e) {
            console.error(e);
            optimisticProfileEditRef.current = null;
            if (displayUser) {
                setUserData(prev => ({ ...(prev || {}), ...(previousUserSnapshot || {}) }));
                if (isSameId(displayUser?._id, currentUser?._id) && previousUserSnapshot) {
                    onUpdateUser?.(previousUserSnapshot);
                }
            }
            if (addToast) addToast(e.response?.data?.message || e.response?.data || "Update failed.", 'error');
        } finally {
            profileSaveInFlightRef.current = false;
            setProfileSaving(false);
        }
    }, [
        addToast,
        bio,
        currentUser?._id,
        displayUser,
        editUsername,
        fetchSpecificUser,
        founderAffiliation,
        onUpdateUser,
        profileDescriptor,
        profileSaving,
        t
    ]);

    useEffect(() => { setCoverPicError(false); }, [displayUser?.coverPic]);

    const userStories = React.useMemo(() => (posts || []).filter(p => {
        const pId = String(p.author?._id || p.author);
        const uId = String(profileUser?._id || (typeof profileUser === 'string' ? profileUser : ''));
        return pId === uId && p.isStory;
    }), [posts, profileUser]);


    useEffect(() => {
        if (!isOpen || !profileUser?._id) {
            if (!isOpen) setLoadingPosts(false);
            return;
        }

        const targetUserId = profileUser._id;
        let cancelled = false;

        const hasPreloadedPosts = preloadedPosts?.length > 0;
        if (hasPreloadedPosts) {
            setUserSpecificPosts(preloadedPosts);
            setLoadingPosts(false);
        } else {
            setUserSpecificPosts([]);
            setLoadingPosts(true);
        }

        (async () => {
            try {
                const res = await axios.get(`/posts/user/${targetUserId}`, { timeout: 15000 });
                if (cancelled || String(profileUser?._id || '') !== String(targetUserId)) return;
                setUserSpecificPosts(Array.isArray(res.data) ? res.data : []);
            } catch (e) {
                console.error("Profile posts fetch error:", e);
                if (!cancelled && String(profileUser?._id || '') === String(targetUserId) && !(preloadedPosts?.length > 0)) {
                    setUserSpecificPosts([]);
                }
            } finally {
                if (!cancelled && String(profileUser?._id || '') === String(targetUserId)) {
                    setLoadingPosts(false);
                }
            }
        })();

        return () => { cancelled = true; };
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

        const handleReposted = ({ postId, reposts, newRepostPost, isReposting }) => {
            setUserSpecificPosts(prev => {
                let updated = prev.map(p => {
                    if (String(p._id) !== String(postId)) return p;
                    return { ...p, reposts };
                });
                
                if (isReposting && newRepostPost && String(newRepostPost.repostedBy?._id || newRepostPost.repostedBy) === profileUserId) {
                    // Add repost post to profile
                    updated = [newRepostPost, ...updated.filter(p => String(p._id) !== String(newRepostPost._id))];
                } else if (!isReposting) {
                    // Remove repost post from profile
                    updated = updated.filter(p => !(p.isRepost && String(p.originalPost) === String(postId) && String(p.repostedBy?._id || p.repostedBy) === profileUserId));
                }
                
                return updated;
            });
        };

        socket.on('post.reposted', handleReposted);
        return () => socket.off('post.reposted', handleReposted);
    }, [isOpen, profileUser?._id]);

    // 🔥 PERFORMANCE FIX: Efficiently sync and update local profile posts with any global changes
    useEffect(() => {
        if (!isOpen || !posts || !userSpecificPosts) return;

        // Use a Map for O(1) lookups during sync
        const globalPostMap = new Map(posts.map(p => [String(p._id), p]));

        let hasChanges = false;
        
        // First filter out posts that no longer exist globally (deleted)
        const validLocalPosts = userSpecificPosts.filter(localPost => globalPostMap.has(String(localPost._id)));
        if (validLocalPosts.length !== userSpecificPosts.length) hasChanges = true;

        const synced = validLocalPosts.map(localPost => {
            const globalPost = globalPostMap.get(String(localPost._id));

            // Deep array reference check is sufficient because App.jsx uses immutable state updates
            if (localPost.likes !== globalPost.likes ||
                localPost.comments !== globalPost.comments ||
                localPost.reposts !== globalPost.reposts) {
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
        const hasPhoto = p.image && !p.image.match(/\.(mp4|mov|webm)$/i);
        const hasMedia = p.image || p.videoUrl;
        const uid = safeId(profileUser);
        const isRepost = Array.isArray(p.reposts) && p.reposts.some(id => isSameId(id, uid)) && !isSameId(p.author, uid);

        if (activeTab === 'VIDEO') return isVideo;
        if (activeTab === 'PHOTOS') return hasPhoto;
        if (activeTab === 'POSTS') return !hasMedia;
        if (activeTab === 'REPOSTS') return isRepost;
        return true;
    }), [userSpecificPosts, activeTab, profileUser]);

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

        <div className="fixed inset-0 z-[2100] flex items-end sm:items-center justify-center overflow-x-hidden">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-2xl" onClick={onClose} />
            <div 
                initial={{ opacity: 0, y: "100%" }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: "100%" }} 
                transition={{ type: 'spring', stiffness: 350, damping: 40, mass: 0.8 }} 
                className={`profile-modal-shell relative w-full max-w-full sm:max-w-lg sm:mx-auto h-[100dvh] sm:h-[85vh] sm:rounded-[32px] overflow-hidden flex flex-col border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.85)] animate-zoom-in profile-shell-bg ${profileBackground.className}`}
                style={{ boxSizing: 'border-box', overflow: 'hidden', backgroundColor: profileBackground.color, '--app-bg': profileBackground.color }}>

                {/* Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--gold-primary)]/10 blur-[120px] rounded-full pointer-events-none z-0" />

                {displayUser?.coverPic && !coverPicError && (
                    <div className="absolute top-0 left-0 right-0 h-[220px] z-0 pointer-events-none animate-fade-in overflow-hidden">
                        {displayUser.coverPic.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) ? (
                            <video 
                                src={resolveMediaUrl(displayUser.coverPic, null, false, false, true)} 
                                autoPlay loop muted playsInline preload="metadata" 
                                disablePictureInPicture disableRemotePlayback 
                                className="w-full h-full object-cover opacity-60" 
                                onError={() => setCoverPicError(true)} 
                            />
                        ) : (
                            <img 
                                src={resolveMediaUrl(displayUser.coverPic, null, false, false, true)} 
                                className="w-full h-full object-cover opacity-60 blur-[1px]" 
                                alt="" 
                                onError={() => setCoverPicError(true)} 
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    </div>
                )}

                <div className={`flex-none px-6 py-4 flex items-center justify-between border-b border-white/5 z-20 relative bg-white/[0.01] backdrop-blur-xl`}>
                    <button onClick={() => {
                        if (activeList) setActiveList(null);
                        else if (isEditing) setIsEditing(false);
                        else onClose();
                    }} className="p-2.5 -ml-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 text-white transition-all duration-300 flex items-center justify-center">
                        <Icons.Back className="w-5 h-5 text-white" />
                    </button>
                    <div className="font-black text-white text-[11px] uppercase tracking-[0.25em] leading-none flex items-center gap-1 justify-center">{activeList ? (activeList === 'followers' ? t('FOLLOWERS') : t('FOLLOWING')) : (isEditing ? t('EDIT_PROFILE') : <>{displayUser?.username}{getActiveStreak(displayUser) > 0 && <span className="text-orange-500 font-bold ml-1">🔥 {getActiveStreak(displayUser)}{isTopStreak(displayUser) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}</>)}</div>
                    {!activeList && !isEditing && canShowProfileShareButton ? (
                        <button
                            onClick={async () => {
                                if (onShareProfile) onShareProfile(displayUser);
                            }}
                            className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 text-white transition-all duration-300 flex items-center justify-center"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                        </button>
                    ) : (
                        <div className="w-10" />
                    )}
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative overscroll-y-contain pb-20 z-10 bg-transparent w-full box-border app-main-scroll">
                    {activeList ? (
                        <div className="p-4 space-y-4 w-full max-w-full box-border">
                            {getListUsers().length === 0 && !clickLock && <div className="p-10 text-center text-gray-500 font-bold uppercase tracking-widest text-xs opacity-50">{t('NO_AGENTS_FOUND')}</div>}
                            {getListUsers().map(u => (
                                <div key={u._id} onClick={() => {
                                    onViewProfile(u);
                                    setActiveList(null);
                                }} className="flex items-center gap-3 p-3  rounded-none cursor-pointer   border border-transparent w-full max-w-full">
                                      <div className="w-11 h-11 relative group shrink-0">
                                          <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-500"></div>
                                          <div className="absolute inset-[2.5px] rounded-full overflow-hidden">
                                              <ProfileAvatar user={u} />
                                          </div>
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <div className="font-bold text-white text-sm break-words min-w-0">{u?.username}</div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase min-w-0">@{u?.username?.toLowerCase()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : isEditing ? (
                        <div className="p-6 space-y-8 animate-fade-in w-full max-w-full box-border profile-edit-form pb-32">
                            <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-full bg-gray-800 overflow-hidden border border-[#0a0a0a] relative shadow-none">
                                {profileUploading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <div className="w-8 h-8 text-white/50">
                                            <Icons.Loader />
                                        </div>
                                    </div>
                                ) : (
                                    <ProfileAvatar user={displayUser} size="large" key={imgKey} cacheKey={imgKey} />
                                )}
                            </div>
                            <input type="file" id="profile-pic-input" ref={fileRef} hidden accept="image/*" onChange={async (e) => {
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

                            <div className="flex gap-3 w-full">
                                <label
                                    htmlFor="profile-pic-input"
                                    className={`profile-upload-label${profileUploading ? ' disabled' : ''}`}
                                    style={{ pointerEvents: profileUploading ? 'none' : 'auto' }}
                                >
                                    {profileUploading ? (
                                        <>
                                            <Icons.Loader className="w-4 h-4" />
                                            {t('UPLOADING') || 'UPLOADING...'}
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                                                <circle cx="12" cy="13" r="3"></circle>
                                            </svg>
                                            {t('CHANGE_PROFILE_PIC') || 'CHANGE PROFILE PICTURE'}
                                        </>
                                    )}
                                </label>
                                {displayUser?.profilePic && (
                                    <button onClick={async (e) => {
                                        e.preventDefault();
                                        setProfileUploading(true);
                                        
                                        if (currentUser && displayUser && isSameId(currentUser._id, displayUser._id)) {
                                            setUserData(prev => ({ ...prev, profilePic: null }));
                                        }
                                        
                                        try {
                                            const res = await axios.put(`/users/${displayUser?._id}`, { profilePic: "" });
                                            const updatedUser = res.data;
                                            if (updatedUser.profilePic) updatedUser.profilePic = "";
                                            
                                            try { await axios.delete('/users/profile-pic'); } catch (e) {}

                                            localStorage.setItem('user', JSON.stringify(updatedUser));
                                            if (onUpdateUser) onUpdateUser(updatedUser);
                                            if (addToast) addToast('Profile picture removed', 'success');
                                        } catch (err) { 
                                            console.error(err);
                                            alert("Failed to remove profile picture."); 
                                        }
                                        finally { setProfileUploading(false); }
                                    }} disabled={profileUploading}
                                        className="w-[56px] h-[56px] shrink-0 bg-transparent text-gray-400 flex items-center justify-center duration-300 disabled:opacity-50 hover:bg-red-500/20 hover:text-red-400">
                                        <Icons.X className="w-6 h-6" />
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-3 w-full mt-4">
                                <label
                                    htmlFor="cover-pic-input"
                                    className={`profile-upload-label${coverUploading ? ' disabled' : ''}`}
                                    style={{ pointerEvents: coverUploading ? 'none' : 'auto' }}
                                >
                                    {coverUploading ? (
                                        <>
                                            <Icons.Loader className="w-4 h-4" />
                                            {t('UPLOADING') || 'UPLOADING...'}
                                        </>
                                    ) : (
                                        <>
                                            <Icons.Image className="w-4 h-4" />
                                            {t('CHANGE_COVER') || 'CHANGE BACKGROUND'}
                                        </>
                                    )}
                                </label>
                                {displayUser?.coverPic && (
                                    <button onClick={async (e) => {
                                        e.preventDefault();
                                        setCoverUploading(true);
                                        
                                        if (currentUser && displayUser && isSameId(currentUser._id, displayUser._id)) {
                                            setUserData(prev => ({ ...prev, coverPic: null }));
                                        }
                                        
                                        try {
                                            const res = await axios.put(`/users/${displayUser?._id}`, { coverPic: "" });
                                            const updatedUser = res.data;
                                            if (updatedUser.coverPic) updatedUser.coverPic = "";
                                            
                                            try { await axios.delete('/users/cover-pic'); } catch (e) {}

                                            localStorage.setItem('user', JSON.stringify(updatedUser));
                                            if (onUpdateUser) onUpdateUser(updatedUser);
                                            if (addToast) addToast('Background removed', 'success');
                                        } catch (err) { 
                                            console.error(err);
                                            alert("Failed to remove background."); 
                                        }
                                        finally { setCoverUploading(false); }
                                    }} disabled={coverUploading}
                                        className="w-[56px] h-[56px] shrink-0 bg-transparent text-gray-400 flex items-center justify-center duration-300 disabled:opacity-50 hover:bg-red-500/20 hover:text-red-400">
                                        <Icons.X className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                            <input type="file" id="cover-pic-input" ref={coverFileRef} hidden accept="image/*, video/*" onChange={async (e) => {
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

                            <div className="space-y-2 text-left w-full max-w-full box-border">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">{t('USERNAME')}</label>
                                <input type="text" id="edit-username" name="username" aria-label="Username" value={editUsername} maxLength={19} autoComplete="off" autoCorrect="off" spellCheck={false} inputMode="text" onChange={e => setEditUsername(e.target.value.substring(0, 19))} className="profile-edit-field w-full block box-border border border-white/10 rounded-2xl text-white font-bold outline-none transition-colors duration-200 touch-manipulation" placeholder={t('USERNAME_PH')} />
                            </div>

                            <div className="space-y-2 text-left w-full max-w-full box-border">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">{t('DESCRIPTION')}</label>
                                <div className="w-full max-w-full box-border space-y-1.5">
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        maxLength={500}
                                        spellCheck={false}
                                        className="profile-edit-field w-full block box-border border border-white/10 rounded-2xl text-white leading-relaxed outline-none resize-none transition-colors duration-200 whitespace-pre-wrap touch-manipulation"
                                        placeholder={t('BIO_PH')}
                                    />
                                    <div className="text-right text-[10px] font-black text-white/20 uppercase tracking-widest pr-1">{bio?.length || 0} / 500</div>
                                </div>
                            </div>

                            <div className="space-y-3 text-left">
                                <div className="flex items-start sm:items-center justify-between gap-3 pl-1">
                                    <label className="flex-1 min-w-0 whitespace-normal text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">{t('WHAT_BEST_DESCRIBES_YOU', 'WHAT BEST DESCRIBES YOU?')}</label>
                                    {profileDescriptor && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setProfileDescriptor('');
                                            }}
                                            className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/55 hover:text-white hover:bg-white/[0.08] cursor-pointer touch-manipulation px-3 py-2 transition-all duration-200 active:scale-[0.97]"
                                        >
                                            {t('CLEAR', 'Clear')}
                                        </button>
                                    )}
                                </div>
                                <div className="profile-descriptor-group">
                                    {PROFILE_DESCRIPTOR_OPTIONS.map((option) => {
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
                                                className={`profile-descriptor-btn w-full text-left px-4 py-4 relative z-10 flex items-center gap-3 min-h-[56px] border ${isSelected ? `profile-descriptor-btn-selected ${option.accentClass}` : 'bg-transparent text-white border-transparent'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${option.accentClass} ${isSelected ? 'ring-1 ring-current/25' : 'opacity-75'}`}>
                                                    <OptionIcon className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-semibold text-[15px] leading-tight truncate">{t(`DESC_${option.value.toUpperCase()}`, option.label)}</div>
                                                    <div className={`text-[13px] leading-snug mt-0.5 opacity-80 whitespace-normal line-clamp-2`}>{t(`DESC_${option.value.toUpperCase()}_SUB`, option.description)}</div>
                                                </div>
                                                {isSelected && (
                                                    <Icons.Check className="w-5 h-5 shrink-0 opacity-90" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {isFounderProfile && (
                                    <div className="profile-link-glass profile-affiliation-card mt-4 rounded-3xl p-4">
                                        <div className="relative z-10 flex items-start sm:items-center justify-between gap-3 mb-3">
                                            <label className="flex-1 min-w-0 whitespace-normal text-[10px] font-black text-[var(--gold-primary)] uppercase tracking-widest leading-relaxed">FOUNDER AFFILIATION</label>
                                            {founderAffiliation && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFounderAffiliation('');
                                                    }}
                                                    className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] text-[9px] font-black uppercase tracking-widest text-white/55 hover:text-white hover:bg-white/[0.08] transition-all duration-200 px-3 py-2 active:scale-[0.97]"
                                                >
                                                    {t('CLEAR', 'Clear')}
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative z-10">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl bg-white/8 border border-white/10 text-[var(--gold-primary)] font-black flex items-center justify-center">@</div>
                                            <input 
                                                type="text" 
                                                value={founderAffiliation}
                                                onChange={(e) => {
                                                    setFounderAffiliation(sanitizeAffiliation(e.target.value));
                                                }}
                                                placeholder="affiliated_username"
                                                className="profile-edit-field w-full bg-black/25 border border-white/10 rounded-2xl py-3.5 pl-14 pr-4 text-white text-sm font-black tracking-wide placeholder:text-white/22 outline-none transition-colors duration-200"
                                            />
                                        </div>
                                        <div className="relative z-10 mt-3 flex items-start gap-2 text-[9px] text-white/42 font-bold uppercase tracking-wider">
                                            <Icons.Link className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />
                                            <span className="leading-relaxed whitespace-normal">Links to another profile, brand, or company page.</span>
                                        </div>
                                    </div>
                                )}
                            </div>


                        </div>
                    ) : (
                        <div className={`p-4 sm:p-6 pb-20 flex flex-col items-stretch ${displayUser?.coverPic ? 'pt-14 sm:pt-20 mt-0' : 'mt-2 sm:mt-4'}`}>
                            <div className="flex items-center justify-center mb-3 sm:mb-4 w-full">
                                <div className={`relative z-20 ${displayUser?.coverPic ? '-mt-14 sm:-mt-20' : ''}`}>
                                    <div className="w-32 h-32 sm:w-40 sm:h-40 relative group shrink-0">
                                        <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-500"></div>
                                        <div className="absolute inset-[4px] rounded-full overflow-hidden">
                                            <ProfileAvatar user={displayUser} size="large" key={imgKey} cacheKey={imgKey} className="opacity-90 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6 px-2 w-full flex flex-col items-center text-center">
                                <div className="flex flex-col mb-4 items-center w-full max-w-full">
                                    <div className="flex items-center justify-center gap-2 leading-none uppercase tracking-[0.1em] flex-wrap w-full max-w-full">
                                        <span className="profile-headline font-black text-white text-lg sm:text-xl break-words min-w-0">{displayUser?.username || "Unknown Agent"}</span>
                                        {getActiveStreak(displayUser) > 0 && <span className="text-orange-500 font-bold text-base sm:text-lg shrink-0">🔥 {getActiveStreak(displayUser)}{isTopStreak(displayUser) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}
                                        <VerifiedBadge isFounder={isFounderProfile} isUser={!isFounderProfile} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 flex-shrink-0" user={displayUser} />
                                    </div>
                                    {selectedProfileDescriptor && SelectedProfileDescriptorIcon && (
                                        <div className="mt-3 flex justify-center">
                                            <div className={`profile-descriptor-badge inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-xl transition-all duration-300 ${selectedProfileDescriptor.accentClass.replace(/rounded-none/g, '')}`}>
                                                <SelectedProfileDescriptorIcon className="w-3.5 h-3.5 shrink-0" />
                                                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">{t(`DESC_${displayUser.profileDescriptor?.toUpperCase()}`, selectedProfileDescriptor.label)}</span>
                                            </div>
                                        </div>
                                    )}
                                    {displayFounderAffiliation && (
                                        <div className="mt-2">
                                            <FounderAffiliationBadge username={displayFounderAffiliation} size="sm" maxTextWidth="max-w-none" className="max-w-full" />
                                        </div>
                                    )}
                                    <div className="profile-handle-row text-gray-400 text-sm font-bold mt-1.5 flex items-center gap-2">
                                        @{displayUser?.username?.toLowerCase().replace(/\s+/g, '')}
                                        <div className={`w-3.5 h-3.5 rounded-full border-[2.5px] border-black ${isUserOnline(displayUser, currentUser) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-gray-600'}`} title={isUserOnline(displayUser, currentUser) ? t('ONLINE') : t('OFFLINE')} />
                                    </div>
                                </div>

                                <div className="profile-copy-block mb-6 backdrop-blur-xl text-left sm:text-center shadow-lg relative group transition-all duration-300 hover:bg-white/[0.05] hover:border-sky-300/25">
                                    <p className="profile-copy-text text-[var(--app-text)] opacity-90 font-medium select-text italic">
                                        {parseText(
                                            displayUser?.bio && displayUser.bio.trim() !== "" ? displayUser.bio : t("DEFAULT_BIO"),
                                            (tag) => onHashtagClick?.(tag),
                                            (username) => {
                                                const u = allUsers?.find(user => String(user.username).toLowerCase() === String(username).toLowerCase());
                                                if (u && onViewProfile) onViewProfile(u);
                                            }
                                        )}
                                    </p>
                                </div>

                                {/* STATS GRID — 4 equal columns, no scroll */}
                                <div className="grid grid-cols-4 gap-2 w-full">

                                    {/* POSTS */}
                                    <div className="flex flex-col items-center justify-center gap-1 py-3.5 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 hover:scale-[1.03]">
                                        <span className="font-black text-white text-base leading-none tabular-nums">{(userPosts || []).length}</span>
                                        <Icons.Grid className="w-3.5 h-3.5 text-gray-400" />
                                    </div>

                                    {/* REPOSTS */}
                                    <div className="flex flex-col items-center justify-center gap-1 py-3.5 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 hover:scale-[1.03]">
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
                                    }} className="flex flex-col items-center justify-center gap-1 py-3.5 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-white/10 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-10 touch-manipulation select-none">
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
                                    }} className="flex flex-col items-center justify-center gap-1 py-3.5 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-white/10 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-10 touch-manipulation select-none">
                                        <span className="font-black text-white text-base leading-none tabular-nums">
                                            {[...new Set((displayUser?.following || []).filter(id => (allUsers || []).some(u => isSameId(u._id, id))))].length}
                                        </span>
                                        <span className="text-gray-400 text-[7.5px] font-black uppercase tracking-wider mt-0.5 truncate w-full text-center px-1">{t('FOLLOWING')}</span>
                                    </div>

                                </div>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="px-2 mb-6 space-y-3 mt-4 w-full">
                                <div className="flex items-center gap-3">
                                    {isMe ? (
                                        <button onClick={() => setIsEditing(true)} className="profile-edit-btn flex-1 py-2.5 rounded-full border border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer">
                                            <Icons.Settings className="w-4 h-4" />
                                            {t('EDIT_PROFILE')}
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                disabled={followLoading[displayUser?._id]}
                                                onClick={() => onFollow(displayUser)}
                                                className={`flex-1 relative py-2.5 rounded-full text-[14px] font-bold transition-colors active:scale-[0.97] flex items-center justify-center touch-manipulation select-none cursor-pointer ${isFollowing ? 'bg-transparent border border-white/30 text-white active:border-red-500/50 active:text-red-500 active:bg-red-500/5 md:hover:border-red-500/50 md:hover:text-red-500 md:hover:bg-red-500/5' : 'bg-white border border-transparent text-black active:bg-neutral-200 md:hover:bg-neutral-200'}`}
                                            >
                                                <span className="relative z-10 flex items-center justify-center">
                                                    {isFollowing ? t('UNFOLLOW') : (hasRequested ? t('REQUESTED') : t('FOLLOW'))}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    setTimeout(() => onOpenChat(displayUser), 50);
                                                }}
                                                title={t('DM_SAFE_DESC')}
                                                className="relative py-2.5 px-6 rounded-full text-[14px] font-bold transition-colors active:scale-[0.97] flex items-center justify-center bg-transparent border border-white/30 text-white active:bg-white/10 md:hover:bg-white/10 shrink-0 touch-manipulation select-none cursor-pointer"
                                            >
                                                <span className="relative z-10 flex items-center justify-center gap-2">
                                                    <Icons.MessageSquare className="w-4 h-4" />
                                                    {t('WHISPERS')}
                                                </span>
                                            </button>
                                        </>
                                    )}
                                </div>
                                {!isMe && currentUser?.role === 'Founder' && (
                                    <div className="flex flex-col gap-3">
                                        <select 
                                            onChange={(e) => {
                                                if (e.target.value === 'forever') {
                                                    if (window.confirm(t('CONFIRM_BAN_FOREVER') || 'Are you sure you want to permanently delete this user? This action is irreversible!')) {
                                                        axios.delete(`/users/${displayUser?._id}`);
                                                    }
                                                } else {
                                                    if (window.confirm(t('CONFIRM_BAN') || 'Confirm ban?')) {
                                                        axios.post(`/users/${displayUser?._id}/ban`, { days: parseInt(e.target.value) });
                                                    }
                                                }
                                            }}
                                            defaultValue=""
                                            className="w-full px-4 py-4 bg-gradient-to-br from-red-900/40 to-red-950/60 backdrop-blur-xl border-2 border-red-500/30 rounded-2xl hover:border-red-500/60 hover:from-red-900/60 hover:to-red-950/80 transition-all duration-300 text-white font-black text-[11px] uppercase tracking-[0.15em] appearance-none cursor-pointer relative shadow-[0_0_20px_rgba(239,68,68,0.15)] focus:outline-none focus:border-red-400 focus:shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                                        >
                                            <option value="" disabled className="bg-gray-900 text-white">{t('BAN_DAYS') || 'BAN DAYS'}</option>
                                            <option value="1" className="bg-gray-900 text-white">{t('BAN_1_DAY') || 'BAN 1 DAY'}</option>
                                            <option value="3" className="bg-gray-900 text-white">{t('BAN_3_DAYS') || 'BAN 3 DAYS'}</option>
                                            <option value="7" className="bg-gray-900 text-white">{t('BAN_7_DAYS') || 'BAN 7 DAYS'}</option>
                                            <option value="30" className="bg-gray-900 text-white">{t('BAN_30_DAYS') || 'BAN 30 DAYS'}</option>
                                            <option value="forever" className="bg-gray-900 text-red-400">{t('BAN_FOREVER') || '🚫 BAN FOREVER (DELETE USER)'}</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex border-b border-white/10 w-full mb-6 mt-4 relative">
                                {(isMe ? ['ALL', 'POSTS', 'PHOTOS', 'VIDEO', 'REPOSTS', 'MISSIONS'] : ['ALL', 'POSTS', 'PHOTOS', 'VIDEO', 'REPOSTS']).map((tab, index) => {
                                    const isActive = activeTab === tab;
                                    const renderIcon = (isActive) => {
                                        const iconClass = `w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-all duration-200 ${isActive ? 'text-white scale-105' : 'text-gray-400'}`;
                                        if (tab === 'ALL') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconClass}><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>;
                                        if (tab === 'POSTS') return <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" className={iconClass}><path d="M 20 9 L 20 16 C 20 18.209 18.209 20 16 20 L 8 20 C 5.791 20 4 18.209 4 16 L 4 8 C 4 5.791 5.791 4 8 4 L 15 4" strokeWidth="1.5" /><line strokeLinecap="round" x1="10" y1="14" x2="18.5" y2="5.5" strokeWidth="2.25" /><line strokeLinecap="round" x1="20.5" y1="3.5" x2="21" y2="3" strokeWidth="2.25" /></svg>;
                                        if (tab === 'PHOTOS') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconClass}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
                                        if (tab === 'VIDEO') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${iconClass} fill-current`}><polygon points="5 3 19 12 5 21 5 3" /></svg>;
                                        if (tab === 'REPOSTS') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconClass}><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>;
                                        if (tab === 'MISSIONS') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconClass}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
                                        return null;
                                    };
                                    
                                    const tabLabel = t('TAB_' + tab, tab);
                                    const isLongTabLabel = tabLabel.length >= 10;
                                    return (
                                        <EnhancedButton
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            scaleDown={0.94}
                                            duration={120}
                                            className={`profile-tab-btn flex-1 min-w-0 min-h-[48px] sm:min-h-[52px] px-1 py-2 font-black uppercase flex flex-col items-center justify-center gap-1.5 transition-all duration-200 relative select-none appearance-none focus:outline-none cursor-pointer overflow-hidden group touch-manipulation bg-transparent ${isActive
                                                ? 'text-white font-extrabold z-10'
                                                : 'text-white/50 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <div className="relative z-10 flex flex-col items-center justify-center gap-1 w-full pb-1">
                                                {renderIcon(isActive)}
                                                <span
                                                    className={`max-w-full text-center leading-none transition-all duration-200 whitespace-nowrap ${isLongTabLabel
                                                        ? 'text-[7px] sm:text-[8px] tracking-[0.03em]'
                                                        : 'text-[8px] sm:text-[9px] tracking-[0.08em]'
                                                        } ${isActive ? 'text-white font-extrabold' : 'text-gray-400'} font-black`}
                                                >
                                                    {tabLabel}
                                                </span>
                                            </div>
                                            {isActive && (
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-[3px] bg-[var(--gold-primary)] rounded-full animate-fade-in" />
                                            )}
                                        </EnhancedButton>
                                    );
                                })}
                            </div>

                            {/* 18+ WARNING LOCK SCREEN */}
                            {displayUser?.settings?.is18PlusProfile && !isMe && !confirmed18Plus ? (
                                <div className="p-12 text-center space-y-6 bg-red-950/20 border border-red-500/20 rounded-3xl mt-4 animate-fade-in group mx-2">
                                    {!hasEnoughEquity ? (
                                        <>
                                            <div className="w-20 h-20 mx-auto bg-black/40 rounded-full flex items-center justify-center border border-red-500/30 text-red-500 relative overflow-hidden">
                                                <Icons.Lock className="w-10 h-10 text-red-500" />
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="font-black text-red-500 text-xl uppercase tracking-[0.2em]">NSFW PROFILE LOCKED</h3>
                                                <div className="h-0.5 w-12 bg-red-500 mx-auto opacity-50" />
                                                <p className="text-gray-300 text-[12px] uppercase tracking-widest leading-relaxed mx-auto max-w-[280px] font-bold">
                                                    This profile is NSFW. A minimum equity holding of 0.01 LΞC shares (~$8.90 USD) is required to verify age and unlock NSFW profiles.
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-3 justify-center pt-2">
                                                <button 
                                                    onClick={() => onOpenSubscription?.()}
                                                    className="px-8 py-3 bg-gradient-to-r from-[var(--gold-primary)] to-[#ffb700] hover:opacity-90 text-black rounded-xl text-[10px] font-black tracking-[0.2em] hover:scale-105 active:scale-95 uppercase shadow-lg shadow-[var(--gold-primary)]/20 transition-all"
                                                >
                                                    Purchase LΞC Shares
                                                </button>
                                                <button 
                                                    onClick={onClose} 
                                                    className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-xl text-[10px] font-black tracking-[0.2em] hover:scale-105 active:scale-95 uppercase transition-all"
                                                >
                                                    No, go back
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 mx-auto bg-black/40 rounded-full flex items-center justify-center border border-red-500/30 group-hover:text-red-400 relative overflow-hidden">
                                                <Icons.AlertCircle className="w-10 h-10 text-red-500 group-hover:text-red-400 relative z-10" />
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="font-black text-red-500 text-xl uppercase tracking-[0.2em]">18+ WARNING</h3>
                                                <div className="h-0.5 w-12 bg-red-500 mx-auto opacity-50" />
                                                <p className="text-gray-300 text-[12px] uppercase tracking-widest leading-relaxed mx-auto max-w-[280px] font-bold">
                                                    This profile contains 18+ (NSFW) content. You must be 18 years of age or older to view this profile.
                                                </p>
                                                <p className="text-gray-400 text-[11px] font-medium leading-relaxed mx-auto max-w-[280px]">
                                                    Are you 18 years or older?
                                                </p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                                                <button 
                                                    onClick={() => setConfirmed18Plus(true)} 
                                                    className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black tracking-[0.2em] hover:scale-105 active:scale-95 uppercase shadow-lg shadow-red-950/45 transition-all"
                                                >
                                                    Yes, I am 18+
                                                </button>
                                                <button 
                                                    onClick={onClose} 
                                                    className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-xl text-[10px] font-black tracking-[0.2em] hover:scale-105 active:scale-95 uppercase transition-all"
                                                >
                                                    No, go back
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : displayUser?.isPrivate && !isMe && !isFollowing ? (
                                <div className="p-12 text-center space-y-6 bg-white/[0.02] border border-white/5 rounded-3xl mt-4 animate-fade-in group mx-2">
                                    <div className="w-20 h-20 mx-auto bg-black/40 rounded-full flex items-center justify-center border border-white/5 group-hover:text-white relative overflow-hidden">
                                        <Icons.Shield className="w-10 h-10 text-gray-500 group-hover:text-white relative z-10" />
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
                                    {activeTab !== 'MISSIONS' && (isMe || userStories.length > 0) && (
                                        <div className="mb-6">
                                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 pl-1">{t('HIGHLIGHTS')}</h3>
                                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                                                {isMe && (
                                                    <div onClick={() => onOpenCreate?.()} className="shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
                                                        <div className="w-[68px] h-[68px] sm:w-[72px] sm:h-[72px] rounded-full relative group border-2 border-dashed border-white/25 bg-white/[0.03]">
                                                            <div className="absolute inset-[3px] rounded-full overflow-hidden bg-[#050505]">
                                                                <ProfileAvatar user={currentUser} className="object-cover w-full h-full" />
                                                                <div className="absolute inset-0 bg-black/30" />
                                                            </div>
                                                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 group-active:scale-95 transition-all duration-300">
                                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest mt-1">{t('ADD_STORY')}</span>
                                                    </div>
                                                )}
                                                {userStories.map(s => {
                                                    const isYT = isYouTubeUrl(s.videoUrl);
                                                    const isNativeVideo = (!isYT) && ((s.videoUrl && s.videoUrl.match(/\.(mp4|mov|webm|avi|m4v)$/i)) || (s.image && s.image.match(/\.(mp4|mov|webm|avi|m4v)$/i)));
                                                    const hasMedia = postHasMedia(s);
                                                    let ytThumb = null;
                                                    if (isYT) {
                                                        const yid = getYouTubeId(s.videoUrl);
                                                        if (yid) ytThumb = `https://img.youtube.com/vi/${yid}/hqdefault.jpg`;
                                                    }
                                                    return (
                                                        <div key={s._id} onClick={() => onOpenDetail(s)} className="shrink-0 flex flex-col items-center gap-2 group cursor-pointer">
                                                            <div className="w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-full p-[2.5px] bg-gradient-to-tr from-[#1D9BF0]/90 via-[#1D9BF0]/40 to-white/30 relative transition-transform duration-300 group-hover:scale-105 group-active:scale-95 transform-gpu cursor-pointer">
                                                                <div className="w-full h-full rounded-full overflow-hidden border border-black bg-black relative">
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
                                                                        <span className="text-[6px] text-gray-300 font-medium text-center leading-tight line-clamp-3 break-words">
                                                                            {getPostTextPreview(s.desc, 40)}
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

                                    <div className="w-full self-stretch space-y-6 pb-20">
                                        {activeTab === 'MISSIONS' && isMe ? (
                                            <MissionsDashboard user={currentUser} onUpdateUser={onUpdateUser} t={t} lang={lang} />
                                        ) : loadingPosts ? (
                                            <PlatformLoadingPanel label={t('DECRYPTING_FEED')} compact />
                                        ) : userPosts.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-2">
                                                    <Icons.Folder className="w-6 h-6 text-gray-600" />
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{t('NO_INTEL') || 'SECURED AREA. NO INTEL FOUND.'}</div>
                                            </div>
                                        ) : (
                                            <div className="profile-feed-shell w-full">
                                                {Object.entries(groupedUserPosts).map(([dateLabel, groupPosts]) => (
                                                    <div key={dateLabel} className="animate-fade-in group mb-8 w-full">
                                                        <div className="space-y-4">
                                                            <>
                                                                {groupPosts.map(p => (
                                                                    <div
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
                                                                            onShareProfile={onShareProfile}
                                                                            onHashtagClick={onHashtagClick}
                                                                            loadingActions={loadingActions}
                                                                            forcePause={false}
                                                                            isDeleting={deletingPostIds?.has(p._id)}
                                                                            cacheKey={imgKey}
                                                                            onOpenSubscription={onOpenSubscription}
                                                                            openCommentsInModal={true}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                {isEditing && !activeList && (
                    <div className="flex-none p-4 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/5 z-30 w-full box-border">
                        <button
                            type="button"
                            disabled={profileSaving}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleProfileSave();
                            }}
                            className="profile-save-btn"
                        >
                            {profileSaving ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Icons.Loader className="w-4 h-4 text-black" />
                                    {t('SAVING') || 'SAVING...'}
                                </div>
                            ) : (
                                <>
                                    <Icons.Check className="w-4 h-4" />
                                    {t('SAVE') || 'SAVE'}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
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
    const [is18Plus, setIs18Plus] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDesc('');
            setIsStory(forceStory);
            setIs18Plus(false);
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
    const handleSubmit = async () => {
        if (isSubmitting) return;
        const file = fileRef.current?.files?.[0];
        if (!desc && !file) return;

        setIsSubmitting(true);
        const fd = new FormData();
        fd.append('desc', desc);
        if (file) fd.append('image', file);
        fd.append('isStory', isStory);
        fd.append('is18Plus', is18Plus);

        await onCreatePost(fd, preview, isStory);

        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
        setIsStory(false);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[3200] flex items-stretch sm:items-center justify-center p-0 sm:p-4">
            <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/65 backdrop-blur-xl" onClick={onClose} />
            <div 
                initial={{ scale: 0.95, y: 100 }} 
                animate={{ scale: 1, y: 0 }} 
                className="relative w-full max-w-full sm:max-w-md glass-panel p-5 sm:p-6 rounded-none sm:rounded-3xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex-none flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                    <button onClick={onClose} className="sm:hidden text-sm font-semibold text-gray-400 hover:text-white transition-colors duration-200">
                        {t('CANCEL')}
                    </button>
                    <h2 className="text-lg sm:text-xl font-black italic text-white uppercase tracking-tighter">{t('UPLOAD_TITLE')}</h2>
                    <button 
                        disabled={isSubmitting} 
                        onClick={handleSubmit} 
                        className="sm:hidden px-2.5 py-1.5 bg-[var(--gold-primary)] hover:opacity-90 disabled:opacity-50 text-black font-black text-[10px] uppercase tracking-normal rounded-full shadow-md transition-all duration-200 whitespace-nowrap shrink-0"
                    >
                        {isSubmitting ? '...' : (isStory ? t('POST_STORY') : t('POST'))}
                    </button>
                    <button onClick={onClose} className="hidden sm:flex p-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors duration-200">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                          <div className="w-10 h-10 relative group shrink-0">
                              <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-500"></div>
                              <div className="absolute inset-[2.5px] rounded-full overflow-hidden">
                                  <ProfileAvatar user={user} />
                              </div>
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
                                className="relative w-full bg-black/50 border border-white/10 rounded-[1.5rem] px-5 py-4 text-[15px] text-white outline-none min-h-[120px] resize-none placeholder-gray-600 focus:border-[var(--gold-primary)]/50 focus:ring-1 focus:ring-[var(--gold-primary)]/25 transition-all duration-300 custom-scrollbar font-bold break-words whitespace-pre-wrap"
                            />
                            <div className="absolute bottom-3 right-4 text-[10px] font-black text-gray-500 uppercase tracking-widest pointer-events-none">
                                {desc.length} / 300
                            </div>
                        </div>
                    </div>

                    <div onClick={() => fileRef.current.click()} className="cursor-pointer mb-2 group mt-2">
                        {preview ? (
                            <div className="w-full min-h-[170px] sm:min-h-[220px] rounded-[1.8rem] overflow-hidden relative bg-gradient-to-br from-amber-950/20 via-slate-950/90 to-slate-900 border border-[var(--gold-primary)]/20 shadow-[0_10px_40px_rgba(212,175,55,0.06)] flex items-center justify-center transition-all duration-400 hover:border-[var(--gold-primary)]/40 hover:shadow-[0_15px_50px_rgba(212,175,55,0.1)] hover:-translate-y-0.5">
                                {isVideo ? (
                                    <video src={preview} className="w-full h-full object-contain max-h-[220px]" controls playsInline />
                                ) : (
                                    <img src={preview} className="w-full h-full object-contain max-h-[220px]" alt="Preview" />
                                )}
                                <button onClick={(e) => { e.stopPropagation(); setPreview(null); setIsVideo(false); if (fileRef.current) fileRef.current.value = ''; }} className="absolute top-2.5 right-2.5 p-2 bg-slate-950/85 hover:bg-slate-900 rounded-full backdrop-blur-xl border border-[var(--gold-primary)]/20 transition-all duration-250 hover:scale-110 shadow-[0_3px_10px_rgba(0,0,0,0.25)]">
                                    <Icons.X className="w-4 h-4 text-slate-100" />
                                </button>
                            </div>
                        ) : (
                            <div className="w-full py-10 sm:py-12 border-2 border-dashed border-[var(--gold-primary)]/20 bg-gradient-to-br from-[var(--gold-primary)]/8 via-amber-500/3 to-transparent rounded-[1.8rem] flex flex-col items-center justify-center gap-4 text-[var(--gold-primary)]/80 cursor-pointer transition-all duration-400 hover:border-[var(--gold-primary)]/50 hover:bg-gradient-to-br hover:from-[var(--gold-primary)]/15 hover:via-amber-500/6 hover:to-transparent hover:text-[var(--gold-primary)] hover:-translate-y-0.5 shadow-[0_10px_40px_rgba(212,175,55,0.04)]">
                                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-[var(--gold-primary)]/20 via-amber-400/10 to-transparent flex items-center justify-center border border-[var(--gold-primary)]/30 shadow-[0_5px_20px_rgba(212,175,55,0.1)] transition-transform duration-400 group-hover:scale-110">
                                    <Icons.Upload className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--gold-primary)]" />
                                </div>
                                <div className="flex flex-col items-center text-center gap-1">
                                    <span className="text-sm sm:text-base font-bold uppercase tracking-widest text-white/90">{t('UPLOAD_MEDIA')}</span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Image or Video</span>
                                </div>
                            </div>
                        )}
                        <input type="file" ref={fileRef} accept="image/*, video/*" hidden onChange={handleFileChange} />
                    </div>

                    <div className="flex flex-wrap gap-2.5 mb-2">
                        <div onClick={() => setIsStory(!isStory)} className={`flex-1 flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-2xl border ${isStory ? 'bg-[var(--gold-primary)]/10 border-[var(--gold-primary)]/50 shadow-lg shadow-[var(--gold-primary)]/10' : 'bg-white/5 border-white/10'}`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isStory ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)] scale-110' : 'border-gray-500'}`}>
                                {isStory && <Icons.Check className="w-3.5 h-3.5 text-black font-black" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isStory ? 'text-[var(--gold-primary)]' : 'text-gray-400'} truncate`}>{t('ADD_STORY')}</span>
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider mt-0.5 truncate">{t('STORY_DURATION')}</span>
                            </div>
                        </div>
                        <div onClick={() => setIs18Plus(!is18Plus)} className={`flex-1 flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-2xl border ${is18Plus ? 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10' : 'bg-white/5 border-white/10'}`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${is18Plus ? 'border-red-500 bg-red-500 scale-110' : 'border-gray-500'}`}>
                                {is18Plus && <Icons.Check className="w-3.5 h-3.5 text-white font-black" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${is18Plus ? 'text-red-500' : 'text-gray-400'} truncate`}>{t('NSFW_18_PLUS') || '18+ NSFW'}</span>
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider mt-0.5 truncate">{t('NSFW_18_PLUS_DESC') || 'SENSITIVE CONTENT'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons (Desktop only) */}
                <div className="hidden sm:flex flex-none gap-4 pt-4 border-t border-white/5 mt-auto">
                    <button onClick={onClose} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs text-white uppercase tracking-widest transition-colors duration-200">{t('CANCEL')}</button>
                    <button disabled={isSubmitting} onClick={handleSubmit} className="flex-1 py-3.5 bg-[var(--gold-primary)] hover:opacity-90 rounded-xl text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-[var(--gold-primary)]/20 disabled:opacity-50 transition-all duration-200">
                        {isSubmitting ? (isStory ? t('UPLOADING') || '...' : '...') : (isStory ? t('POST_STORY') : t('POST'))}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditPostModal = ({ isOpen, onClose, onSuccess, post, user }) => {
    const { t } = useTranslation(user);
    const [desc, setDesc] = useState(post?.desc || '');
    const [preview, setPreview] = useState(post?.image ? resolveMediaUrl(post.image) : null);
    const [isVideo, setIsVideo] = useState(false);
    const [isAudio, setIsAudio] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [is18Plus, setIs18Plus] = useState(post?.is18Plus || false);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef(null);
    const [audioName, setAudioName] = useState('');

    useEffect(() => {
        if (post) {
            setDesc(post.desc || '');
            setPreview(post.image ? resolveMediaUrl(post.image) : (post.thumbnailUrl ? resolveMediaUrl(post.thumbnailUrl) : null));
            const isYT = isYouTubeUrl(post.videoUrl);
            const isVid = isYT ? false : (post.videoUrl ? true : (post.image?.match(/\.(mp4|mov|webm)$/i) ? true : false));
            const isAud = post.image?.match(/\.(mp3|wav|ogg|webm|m4a)$/i) || false;
            setIsVideo(isVid);
            setIsAudio(isAud);
            setYoutubeUrl(isYT ? post.videoUrl : '');
            setIs18Plus(post.is18Plus || false);
            if (post.image) {
                const url = new URL(resolveMediaUrl(post.image));
                setAudioName(url.pathname.split('/').pop() || '');
            }
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

    const handleSave = async () => {
        if (saving) return;
        const fd = new FormData();
        fd.append('desc', desc);
        fd.append('is18Plus', is18Plus);
        const file = fileRef.current?.files[0];

        if (file) {
            fd.append('image', file);
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
        <div className="fixed inset-0 z-[3200] flex items-stretch sm:items-center justify-center p-0 sm:p-4">
            <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/65 backdrop-blur-xl" onClick={onClose} />
            <div 
                initial={{ scale: 0.95, y: 100 }} 
                animate={{ scale: 1, y: 0 }} 
                className="relative w-full max-w-full sm:max-w-md glass-panel p-5 sm:p-6 rounded-none sm:rounded-3xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex-none flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                    <button onClick={onClose} className="sm:hidden text-sm font-semibold text-gray-400 hover:text-white transition-colors duration-200">
                        {t('CANCEL')}
                    </button>
                    <h2 className="text-lg sm:text-xl font-black italic text-white uppercase tracking-tighter">{t('EDIT_INTEL')}</h2>
                    <button 
                        disabled={saving} 
                        onClick={handleSave} 
                        className="sm:hidden px-2.5 py-1.5 bg-[var(--gold-primary)] hover:opacity-90 disabled:opacity-50 text-black font-black text-[10px] uppercase tracking-normal rounded-full shadow-md transition-all duration-200 whitespace-nowrap shrink-0"
                    >
                        {saving ? '...' : t('PUBLISH')}
                    </button>
                    <button onClick={onClose} className="hidden sm:flex p-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors duration-200">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
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
                                className="relative w-full bg-black/50 border border-white/10 rounded-[1.5rem] px-5 py-4 text-[15px] text-white outline-none min-h-[120px] resize-none placeholder-gray-600 focus:border-[var(--gold-primary)]/50 focus:ring-1 focus:ring-[var(--gold-primary)]/25 transition-all duration-300 custom-scrollbar font-bold break-words whitespace-pre-wrap"
                            />
                            <div className="absolute bottom-3 right-4 text-[10px] font-black text-gray-500 uppercase tracking-widest pointer-events-none">
                                {desc.length} / 300
                            </div>
                        </div>
                    </div>

                    {/* Media Upload & Preview */}
                    <div onClick={() => fileRef.current.click()} className="cursor-pointer mb-2 group mt-2">
                        {preview ? (
                            <div className="w-full min-h-[170px] sm:min-h-[220px] rounded-[1.8rem] overflow-hidden relative bg-gradient-to-br from-amber-950/20 via-slate-950/90 to-slate-900 border border-[var(--gold-primary)]/20 shadow-[0_10px_40px_rgba(212,175,55,0.06)] flex items-center justify-center transition-all duration-400 hover:border-[var(--gold-primary)]/40 hover:shadow-[0_15px_50px_rgba(212,175,55,0.1)] hover:-translate-y-0.5">
                                {isVideo ? (
                                    <video src={preview} className="w-full h-full object-contain max-h-[220px]" controls playsInline />
                                ) : (
                                    <img src={preview} className="w-full h-full object-contain max-h-[220px]" alt="Preview" />
                                )}
                                <button onClick={(e) => { e.stopPropagation(); setPreview(null); setIsVideo(false); if (fileRef.current) fileRef.current.value = ''; }} className="absolute top-2.5 right-2.5 p-2 bg-slate-950/85 hover:bg-slate-900 rounded-full backdrop-blur-xl border border-[var(--gold-primary)]/20 transition-all duration-250 hover:scale-110 shadow-[0_3px_10px_rgba(0,0,0,0.25)]">
                                    <Icons.X className="w-4 h-4 text-slate-100" />
                                </button>
                            </div>
                        ) : (
                            <div className="w-full py-10 sm:py-12 border-2 border-dashed border-[var(--gold-primary)]/20 bg-gradient-to-br from-[var(--gold-primary)]/8 via-amber-500/3 to-transparent rounded-[1.8rem] flex flex-col items-center justify-center gap-4 text-[var(--gold-primary)]/80 cursor-pointer transition-all duration-400 hover:border-[var(--gold-primary)]/50 hover:bg-gradient-to-br hover:from-[var(--gold-primary)]/15 hover:via-amber-500/6 hover:to-transparent hover:text-[var(--gold-primary)] hover:-translate-y-0.5 shadow-[0_10px_40px_rgba(212,175,55,0.04)]">
                                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-[var(--gold-primary)]/20 via-amber-400/10 to-transparent flex items-center justify-center border border-[var(--gold-primary)]/30 shadow-[0_5px_20px_rgba(212,175,55,0.1)] transition-transform duration-400 group-hover:scale-110">
                                    <Icons.Upload className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--gold-primary)]" />
                                </div>
                                <div className="flex flex-col items-center text-center gap-1">
                                    <span className="text-sm sm:text-base font-bold uppercase tracking-widest text-white/90">{t('UPLOAD_MEDIA')}</span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Image or Video</span>
                                </div>
                            </div>
                        )}
                        <input type="file" ref={fileRef} accept="image/*, video/*" hidden onChange={handleFileChange} />
                    </div>
                </div>

                {/* Footer Buttons (Desktop only) */}
                <div className="hidden sm:flex flex-none gap-4 pt-4 border-t border-white/5 mt-auto">
                    <button onClick={onClose} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs text-white uppercase tracking-widest transition-colors duration-200">{t('CANCEL')}</button>
                    <button disabled={saving} onClick={handleSave} className={`flex-1 py-3.5 ${saving ? 'bg-[var(--gold-primary)]/50 cursor-wait' : 'bg-[var(--gold-primary)] hover:opacity-90'} rounded-xl text-black font-black text-xs uppercase tracking-widest shadow-lg shadow-[var(--gold-primary)]/20 transition-all duration-200`}>
                        {saving ? '...' : t('PUBLISH')}
                    </button>
                </div>
            </div>
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

const applyBackground = (mode) => {
    const entry = getBackgroundEntry(mode);
    document.body.classList.remove(...BACKGROUND_MODES.map((item) => item.className));
    document.body.classList.add(entry.className);
    document.documentElement.style.setProperty('--app-bg', entry.color);
    localStorage.setItem('backgroundMode', entry.value);
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

    document.body.classList.remove('dark-mode', 'blue-dark-mode');
    if (isBlueDark) document.body.classList.add('blue-dark-mode');
    else document.body.classList.add('dark-mode');

    localStorage.setItem('displayMode', mode);
};

const applyZoom = (zoom) => {
    const appContent = document.getElementById('zoomable-content');
    const z = Math.max(0.95, Math.min(1, Number(zoom) || 1));
    if (appContent) {
        appContent.style.transformOrigin = 'top center';
        appContent.style.transform = `scale(${z})`;
        // No adjustments needed since we're only scaling content
    }
    localStorage.setItem('uiZoom', String(z));
};

const PublicProfileSkeleton = () => (
    <div className="min-h-screen bg-black w-full flex flex-col relative overflow-hidden" style={{ '--gold-primary': '#D4AF37' }}>
        <div className="w-full h-[25vh] sm:h-[30vh] bg-[#111] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#222] to-[#111] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        </div>
        <div className="w-full flex justify-center -mt-16 sm:-mt-20 relative z-10">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#111] border-4 border-black relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#222] to-[#111] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
            </div>
        </div>
        <div className="w-full max-w-2xl mx-auto px-4 mt-6 flex flex-col items-center gap-4">
            <div className="w-48 h-8 bg-[#111] rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#222] to-[#111] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
            </div>
            <div className="w-32 h-4 bg-[#111] rounded-full relative overflow-hidden mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#222] to-[#111] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
            </div>
            <div className="w-full flex flex-col gap-4 mt-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-full h-16 bg-[#111] rounded-[1.5rem] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#222] to-[#111] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const PublicProfileLinktree = ({ username, publicUser, publicPosts, loadingUser, loadingPosts, postsReady = false, onClose, onNavigateProfile, onOpenPost, t }) => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlLangParam = searchParams.get('lang');
    const urlThemeParam = searchParams.get('theme');
    const themeColor = publicUser?.settings?.theme || urlThemeParam || localStorage.getItem('themeColor') || '#ffd700';
    const [zoomImage, setZoomImage] = useState(null);
    const profileScrollRef = useRef(null);

    useEffect(() => {
        const scrollY = window.scrollY;
        const prevHtmlOverflow = document.documentElement.style.overflow;
        const prevBodyOverflow = document.body.style.overflow;
        const prevBodyPosition = document.body.style.position;
        const prevBodyTop = document.body.style.top;
        const prevBodyLeft = document.body.style.left;
        const prevBodyRight = document.body.style.right;
        const prevBodyWidth = document.body.style.width;

        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';

        return () => {
            document.documentElement.style.overflow = prevHtmlOverflow;
            document.body.style.overflow = prevBodyOverflow;
            document.body.style.position = prevBodyPosition;
            document.body.style.top = prevBodyTop;
            document.body.style.left = prevBodyLeft;
            document.body.style.right = prevBodyRight;
            document.body.style.width = prevBodyWidth;
            window.scrollTo(0, scrollY);
        };
    }, []);

    useEffect(() => {
        if (!publicUser) return;
        const frame = requestAnimationFrame(() => {
            profileScrollRef.current?.focus({ preventScroll: true });
        });
        return () => cancelAnimationFrame(frame);
    }, [publicUser?._id]);

    const groupedPublicPosts = React.useMemo(() => {
        const groups = {};
        const langCode = urlLangParam || localStorage.getItem('language') || 'el';
        publicPosts.forEach(p => {
            const date = new Date(p.createdAt);
            const locale = langCode === 'el' ? 'el-GR' : langCode === 'de' ? 'de-DE' : 'en-US';
            const key = date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });
        return groups;
    }, [publicPosts, urlLangParam]);

    if (loadingUser && !publicUser) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ '--gold-primary': themeColor }}>
                <PlatformLoadingPanel label="GATHERING INTEL..." />
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
    const publicBackground = getBackgroundEntry(getBackgroundMode(publicUser));

    return (
        <div
            ref={profileScrollRef}
            tabIndex={-1}
            className={`profile-page-scroll app-main-scroll custom-scrollbar fixed inset-0 text-white flex flex-col items-center select-text profile-page-bg ${publicBackground.className}`}
            style={{ '--gold-primary': themeColor, backgroundColor: publicBackground.color, '--app-bg': publicBackground.color }}
        >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--gold-primary)]/10 blur-[120px] rounded-full pointer-events-none z-0" />

            {resolvedPublicCoverPic && (
                <div className="absolute top-0 left-0 right-0 h-[220px] z-0 overflow-hidden pointer-events-none">
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

            <div className="profile-page-inner relative z-10 w-full max-w-lg flex flex-col items-center px-4 pt-20 pb-24">
                {/* LOGOUT / BACK TO PORTAL FLOATING BUTTON */}
                <button onClick={onClose} className="absolute top-4 left-4 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center shadow-lg z-50">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                </button>

                {/* SIGN UP CALL TO ACTION (Removed floating button) */}

                {/* AVATAR & IDENTITY */}
                <div className="relative mt-8 mb-4">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-black/40 p-1.5 backdrop-blur-md border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.55)] relative group transition-all duration-500">
                        {resolvedPublicProfilePic ? (
                            <img 
                                src={resolvedPublicProfilePic} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer rounded-full" 
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

                    <div className="text-center space-y-1 w-full">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <h1 className="profile-headline text-lg sm:text-xl font-black text-white tracking-[0.1em]">{publicUser.username}</h1>
                        {getActiveStreak(publicUser) > 0 && <span className="text-orange-500 font-bold text-base sm:text-lg shrink-0">🔥 {getActiveStreak(publicUser)}{isTopStreak(publicUser) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}
                        <VerifiedBadge isFounder={isFounder} isUser={!isFounder} className="w-5 h-5 shrink-0" user={publicUser} />
                        {publicUser.profileDescriptor && PROFILE_DESCRIPTOR_MAP[publicUser.profileDescriptor] && (
                            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-102 ${PROFILE_DESCRIPTOR_MAP[publicUser.profileDescriptor].accentClass.replace(/rounded-none/g, '')}`}>
                                {React.createElement(PROFILE_DESCRIPTOR_MAP[publicUser.profileDescriptor].Icon, { className: "w-3.5 h-3.5" })}
                                <span className="text-[10px] font-black uppercase tracking-[0.18em]">{t(`DESC_${publicUser.profileDescriptor.toUpperCase()}`, PROFILE_DESCRIPTOR_MAP[publicUser.profileDescriptor].label)}</span>
                            </div>
                        )}
                    </div>
                    <span className="profile-headline text-xs text-gray-500 font-bold tracking-widest mt-1">@{publicUser.username?.toLowerCase().replace(/\s+/g, '')}</span>
                    {publicFounderAffiliation && (
                        <div className="mt-2 flex justify-center">
                            <FounderAffiliationBadge username={publicFounderAffiliation} size="sm" maxTextWidth="max-w-none" />
                        </div>
                    )}
                </div>
 
                {/* BIO CARD */}
                {publicUser.bio && (
                    <div className="profile-copy-block mt-6 p-5 backdrop-blur-2xl text-left sm:text-center shadow-lg relative group transition-all duration-300 hover:bg-white/[0.05] hover:border-sky-300/25">
                        <p className="profile-copy-text text-xs sm:text-sm text-[var(--app-text)] opacity-90 font-medium italic select-text whitespace-pre-wrap break-words">
                            {parseText(publicUser.bio, null, (mention) => onNavigateProfile?.(mention))}
                        </p>
                    </div>
                )}
 
                {/* STATS GRID — 4 equal columns */}
                <div className="grid grid-cols-4 gap-2 w-full mt-6">
                    {/* POSTS */}
                    <div className="flex flex-col items-center justify-center gap-1.5 py-3.5 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 hover:scale-[1.03]">
                        <span className="font-black text-white text-base leading-none tabular-nums">
                            {(() => {
                                const uid = safeId(publicUser);
                                return (publicPosts || []).filter(p =>
                                    isSameId(p.author, uid) && !p.isRepost
                                ).length;
                            })()}
                        </span>
                        <Icons.Grid className="w-3.5 h-3.5 text-gray-400" />
                    </div>
 
                    {/* REPOSTS */}
                    <div className="flex flex-col items-center justify-center gap-1.5 py-3.5 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 hover:scale-[1.03]">
                        <span className="font-black text-white text-base leading-none tabular-nums">
                            {(() => {
                                const uid = safeId(publicUser);
                                return (publicPosts || []).filter(p =>
                                    p.isRepost && isSameId(p.repostedBy, uid)
                                ).length;
                            })()}
                        </span>
                        <Icons.RefreshCcw className="w-3.5 h-3.5 text-gray-400" />
                    </div>
 
                    {/* FOLLOWERS */}
                    <div className="flex flex-col items-center justify-center gap-1.5 py-3.5 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 hover:scale-[1.03]">
                        <span className="font-black text-white text-base leading-none tabular-nums">
                            {publicUser.followers?.length || 0}
                        </span>
                        <span className="text-gray-400 text-[7.5px] font-black uppercase tracking-wider mt-0.5 truncate w-full text-center px-1">
                            {t('FOLLOWERS') || 'FOLLOWERS'}
                        </span>
                    </div>
 
                    {/* FOLLOWING */}
                    <div className="flex flex-col items-center justify-center gap-1.5 py-3.5 bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl shadow-lg transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 hover:scale-[1.03]">
                        <span className="font-black text-white text-base leading-none tabular-nums">
                            {publicUser.following?.length || 0}
                        </span>
                        <span className="text-gray-400 text-[7.5px] font-black uppercase tracking-wider mt-0.5 truncate w-full text-center px-1">{t('FOLLOWING')}</span>
                    </div>
                </div>
 
                {/* LINKTREE STYLE INVITATION CARD */}
                <div className="w-full mt-6 p-[1px] bg-gradient-to-br from-[var(--gold-primary)]/40 via-transparent to-[var(--gold-primary)]/20 rounded-[1.5rem] group shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="w-full h-full bg-[#080808] rounded-[1.4rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10 overflow-hidden">
                        <div className="space-y-2.5 text-center sm:text-left min-w-0 flex-1 w-full">
                            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded border border-[var(--gold-primary)]/30 text-[9px] font-black uppercase tracking-[0.3em] text-[var(--gold-primary)]">
                                    {t('MEMBERSHIP', 'MEMBERSHIP')}
                                </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-white leading-tight">
                                {t('JOIN_ELITE', 'ENTER THE LEGACY ACADEMY')}
                            </h3>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                                {t('JOIN_ELITE_MEMBERSHIP', 'MEMBERSHIP • 49€ / MONTH')}
                            </p>
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); window.location.href = '/?paywall=true'; }} className="w-full sm:w-auto mt-2 sm:mt-0 px-6 py-3 rounded-xl bg-white/10 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/20 cursor-pointer">
                            {t('UNLOCK_ACCESS', 'UNLOCK ACCESS')}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </div>
                    </div>
                </div>

                {/* POST SHOWCASE SECTION TITLE */}
                <div className="w-full flex items-center gap-3 mt-10 mb-6">
                    <div className="w-1 h-5 bg-[var(--gold-primary)] rounded-full shrink-0" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.25em]">{t('INTELLIGENCE_BRIEFINGS', 'INTELLIGENCE BRIEFINGS')}</span>
                    <div className="h-[1px] flex-1 bg-white/20" />
                </div>

                {/* Posts with same style as regular profile */}
                <div className="w-full space-y-6 pb-20">
                    {loadingPosts || !postsReady ? (
                        <div className="border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                            <PlatformLoadingPanel label={t('LOADING_ARCHIVES', 'LOADING ARCHIVES...')} compact />
                        </div>
                    ) : (() => {
                        const uid = safeId(publicUser);
                        const displayPosts = publicPosts.filter(p => {
                            if (p.isStory === true || String(p.isStory) === 'true') return false;
                            return isSameId(p.author, uid) || (p.isRepost && isSameId(p.repostedBy, uid));
                        });
                        return displayPosts.length === 0 ? (
                            <div className="p-12 text-center text-xs text-gray-600 font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                                {t('NO_ARCHIVES_DISPATCHED_YET', 'NO ARCHIVES DISPATCHED YET')}
                            </div>
                        ) : (
                            <div className="flex flex-col w-full">
                                {displayPosts.map(p => (
                                    <PostCard 
                                        key={p._id} 
                                        post={p} 
                                        user={null} 
                                        allUsers={[]}
                                        forcePause={false} 
                                        onHashtagClick={() => {}} 
                                        onLike={() => {}} 
                                        onDislike={() => {}} 
                                        onRepost={() => {}} 
                                        onComment={() => {}} 
                                        onDelete={() => {}} 
                                        onViewProfile={(author) => {
                                            if (author?.username) {
                                                onNavigateProfile?.(author.username);
                                            }
                                        }} 
                                        onOpenDetail={() => {}} 
                                        onOpenChat={() => {}} 
                                        onEditComment={() => {}} 
                                        onDeleteComment={() => {}} 
                                        onEditPost={() => {}} 
                                        onShare={() => {}} 
                                        onMediaClick={(post) => {
                                            const mediaUrl = resolveMediaUrl(post.image || post.thumbnailUrl || post.videoUrl, null, false, true);
                                            if (mediaUrl) setZoomImage(mediaUrl);
                                        }}
                                        isReadOnly={true}
                                    />
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* FULL SCREEN IMAGE ZOOM MODAL */}
            {zoomImage && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setZoomImage(null)}
                >
                    <button 
                        onClick={() => setZoomImage(null)} 
                        className="absolute top-4 right-4 p-3 bg-transparent hover:bg-white/10 hover:scale-105 active:scale-95 rounded-full transition-all duration-300 z-50 group"
                    >
                        <Icons.X className="w-6 h-6 text-red-500 group-hover:text-red-400 group-hover:rotate-90 transition-all duration-300" />
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


const StreakLeaderboardModal = ({ users, onClose, currentUser }) => {
    const { t } = useLanguage();
    const sortedUsers = [...(users || [])]
        .filter(u => !u.isPrivate && getActiveStreak(u) > 0)
        .sort((a, b) => getActiveStreak(b) - getActiveStreak(a))
        .slice(0, 50);

    return (
        <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f0f13] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(249,115,22,0.1)]">
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                            <Icons.Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-white text-lg uppercase tracking-widest">Top Streaks</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global Rank List</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative">
                    {sortedUsers.length === 0 ? (
                        <div className="text-center text-gray-500 py-12 text-sm font-bold uppercase tracking-wider">No active streaks found.</div>
                    ) : sortedUsers.map((u, i) => (
                        <div key={u._id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${u._id === currentUser?._id ? 'bg-orange-500/10 border-orange-500/30 scale-[1.02]' : 'bg-black/40 border-white/5 hover:bg-white/[0.02]'}`}>
                            <div className="w-8 font-black text-gray-500 text-center text-xs tracking-widest">#{i + 1}</div>
                            <img src={u.profilePic || 'https://via.placeholder.com/150'} alt={u.username} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                <div className="font-bold text-white text-base truncate">{u.username}</div>
                                {isTopStreak(u) && <span className="px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none shrink-0 flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                                <span className="text-orange-500 text-sm leading-none">🔥</span>
                                <span className="font-black text-orange-400 leading-none">{getActiveStreak(u)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlLang = searchParams.get('lang');
    const urlTheme = searchParams.get('theme');
    
    // Lock screen orientation to portrait
    useEffect(() => {
        const lockOrientation = async () => {
            try {
                if (screen.orientation && screen.orientation.lock) {
                    await screen.orientation.lock('portrait');
                }
            } catch (e) {
                // Ignore errors if orientation lock not supported
            }
        };
        lockOrientation();
    }, []);
    
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

    // Parse pathname for clean URLs (e.g. /@username or /@username/site/1)
    let initialPathProfile = null;
    let initialPathSite = null;
    let initialPathIndex = 0;
    
    if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.startsWith('/@')) {
            const parts = path.substring(2).split('/');
            if (parts[0]) {
                if (parts[1] === 'site') {
                    initialPathSite = parts[0];
                    initialPathIndex = parts[2] ? parseInt(parts[2]) : 0;
                } else {
                    initialPathProfile = parts[0];
                }
            }
        }
    }

    const [publicProfileUsername, setPublicProfileUsername] = useState(searchParams.get('profile') || initialPathProfile);
    const [publicUser, setPublicUser] = useState(null);
    const [publicPosts, setPublicPosts] = useState([]);
    const [publicUserLoading, setPublicUserLoading] = useState(false);
    const [publicPostsLoading, setPublicPostsLoading] = useState(false);
    const [publicPostsReady, setPublicPostsReady] = useState(false);
    const [viewPostId, setViewPostId] = useState(searchParams.get('postId'));
    
    // Public Website Viewer state
    const [publicSiteUsername, setPublicSiteUsername] = useState(searchParams.get('site') || initialPathSite);
    const [publicSiteIndex, setPublicSiteIndex] = useState(searchParams.get('index') || initialPathIndex);

    const syncUrlState = useCallback(() => {
        const params = new URLSearchParams(window.location.search);
        let pProfile = params.get('profile');
        let pSite = params.get('site');
        let pIndex = params.get('index') || 0;
        
        const path = window.location.pathname;
        if (path.startsWith('/@')) {
            const parts = path.substring(2).split('/');
            if (parts[0]) {
                if (parts[1] === 'site') {
                    pSite = parts[0];
                    pIndex = parts[2] ? parseInt(parts[2]) : 0;
                } else {
                    pProfile = parts[0];
                }
            }
        }
        
        setPublicProfileUsername(pProfile);
        setViewPostId(params.get('postId'));
        setPublicSiteUsername(pSite);
        setPublicSiteIndex(pIndex);
    }, []);

    const navigatePublicProfile = useCallback((username) => {
        const params = new URLSearchParams(window.location.search);
        params.delete('postId');
        params.delete('profile'); // Remove profile from search since we will use path
        params.delete('site');
        params.delete('index');
        const savedLang = params.get('lang') || localStorage.getItem('language') || 'en';
        const savedTheme = params.get('theme') || localStorage.getItem('themeColor') || '#ffd700';
        params.set('lang', savedLang);
        params.set('theme', savedTheme);
        const searchString = params.toString();
        const nextUrl = `/@${username}${searchString ? `?${searchString}` : ''}`;
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
        const targetUsername = publicProfileUsername || publicSiteUsername;
        if (!targetUsername) return;

        let isActive = true;
        let decoded = '';
        try { decoded = decodeURIComponent(String(targetUsername || '')); } catch(e) { decoded = String(targetUsername || ''); }
        const normalizedUsername = decoded.trim().replace(/^@+/, '');

        const loadPublicProfile = async () => {
            const cachedProfile = readPublicProfileCache(normalizedUsername);
            let latestUser = cachedProfile?.user || null;
            let latestPosts = Array.isArray(cachedProfile?.posts) ? cachedProfile.posts : [];
            const syncCachedProfile = () => {
                if (!latestUser && !latestPosts.length) return;
                writePublicProfileCache(normalizedUsername, {
                    user: latestUser,
                    posts: latestPosts,
                });
            };
            setPublicUserLoading(true);
            setPublicPostsLoading(true);
            setPublicPostsReady(false);

            if (latestUser) setPublicUser(latestUser);
            else setPublicUser(null);

            if (latestPosts.length) {
                setPublicPosts(latestPosts);
                setPublicPostsReady(true);
            } else {
                setPublicPosts([]);
            }

            const loadUser = async () => {
                let retries = 3;
                let lastError = null;

                while (retries > 0 && isActive) {
                    try {
                        const res = await axios.get(`/users/username/${encodeURIComponent(normalizedUsername)}?t=${Date.now()}`, { timeout: 12000 });
                        latestUser = res?.data || null;
                        if (!isActive) return;
                        setPublicUser(latestUser);
                        syncCachedProfile();
                        break;
                    } catch (error) {
                        lastError = error;
                        retries -= 1;
                        if (retries > 0) await new Promise(r => setTimeout(r, 1200));
                    }
                }

                if (isActive && !latestUser && lastError) {
                    console.error("Failed to load public profile:", lastError);
                    setPublicUser(null);
                }

                if (isActive) setPublicUserLoading(false);
            };

            const loadPosts = async () => {
                for (let attempt = 0; attempt <= 2 && isActive; attempt += 1) {
                    try {
                        const res = await axios.get(`/users/public/posts/${encodeURIComponent(normalizedUsername)}?t=${Date.now()}`, { timeout: 15000 });
                        if (!isActive) return;
                        const nextPosts = Array.isArray(res?.data)
                            ? res.data.filter(p => p.isStory !== true && String(p.isStory) !== 'true')
                            : [];
                        latestPosts = nextPosts;
                        setPublicPosts(nextPosts);
                        syncCachedProfile();
                        break;
                    } catch (error) {
                        if (attempt === 2) {
                            if (isActive) {
                                console.error("Failed to load public posts:", error);
                                if (!latestPosts.length) setPublicPosts([]);
                            }
                        } else {
                            await new Promise(r => setTimeout(r, 900));
                        }
                    }
                }

                if (isActive) {
                    setPublicPostsLoading(false);
                    setPublicPostsReady(true);
                }
            };

            await Promise.allSettled([loadUser(), loadPosts()]);
        };

        loadPublicProfile();

        return () => {
            isActive = false;
        };
    }, [publicProfileUsername, publicSiteUsername]);

    const isPublicExperience = Boolean(publicProfileUsername || viewPostId || publicSiteUsername);
    const [user, setUser] = useState(null);
    const [matrixOverlay, setMatrixOverlay] = useState(() => localStorage.getItem('matrixOverlay') === 'true');
    const [imgKey, setImgKey] = useState(Date.now());
    const { t, i18n, lang } = useTranslation();

    useEffect(() => {
        let title = 'Legacy Academy Intel';
        if (publicProfileUsername) {
            title = `${publicUser?.username || String(publicProfileUsername).replace(/^@+/, '')} | Legacy Academy Intel`;
        } else if (publicSiteUsername) {
            title = `${publicUser?.settings?.businessWebsites?.[publicSiteIndex]?.businessName || 'Business Website'} | Legacy Academy Intel`;
        } else if (viewPostId) {
            title = `Post | Legacy Academy Intel`;
        }
        document.title = title;
    }, [publicProfileUsername, publicSiteUsername, publicSiteIndex, publicUser?.username, publicUser?.settings, viewPostId]);

    useEffect(() => {
        if (urlLang && ['en', 'el', 'de', 'ru', 'es', 'tr', 'fr', 'cy'].includes(urlLang)) {
            i18n.changeLanguage(urlLang);
        }
    }, [urlLang, i18n]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.screen && window.screen.orientation && window.screen.orientation.lock) {
            try {
                window.screen.orientation.lock("portrait").catch(e => {
                    console.log("Screen orientation lock not fully supported", e);
                });
            } catch (e) {
                console.log("Screen orientation lock failed", e);
            }
        }
    }, []);

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
    const [deletingPostIds, setDeletingPostIds] = useState(new Set());
    const [lastDeletedPostId, setLastDeletedPostId] = useState(null);
    const [users, setUsers] = useState([]);
    const [isLoadingFeed, setIsLoadingFeed] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [feedSortOrder, setFeedSortOrder] = useState('newest');
    const [isFeedSortMenuOpen, setIsFeedSortMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [createModeStory, setCreateModeStory] = useState(false);
    const [postToEdit, setPostToEdit] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isWebsiteBuilderOpen, setIsWebsiteBuilderOpen] = useState(false);
    const [selectedWebsiteTemplate, setSelectedWebsiteTemplate] = useState(null);
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
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
    const [showPaywall, setShowPaywall] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('paywall') === 'true';
        }
        return false;
    });
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
    
    // Empire Capital
    const [walletBalances, setWalletBalances] = useState({
        BTC: 0,
        ETH: 0,
        USDT: 10000,
        SOL: 0,
        XRP: 0
    });
    const [cryptoPrices, setCryptoPrices] = useState({
        BTC: 68000,
        ETH: 3500,
        SOL: 140,
        XRP: 0.55,
        USDT: 1
    });
    const [selectedCrypto, setSelectedCrypto] = useState('BTC');
    const [tradeType, setTradeType] = useState('buy');
    const [tradeAmount, setTradeAmount] = useState('');
    const [is18PlusVerified, setIs18PlusVerified] = useState(false);
    const [showAgeModal, setShowAgeModal] = useState(false);

    const lastScrollTime = useRef(0);
    const handleScroll = (e) => {
        const now = Date.now();
        if (now - lastScrollTime.current < 48) return;
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
            try { window.sessionStorage.removeItem(`public-profile-cache-v3:${updatedUser.username}`); } catch (e) {}
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
        const savedBackground = userSettings?.settings?.background || localStorage.getItem('backgroundMode') || 'dark-blue';
        applyBackground(savedBackground);
        applyDisplayMode('dark');
        const savedZoom = userSettings?.settings?.zoom || parseFloat(localStorage.getItem('uiZoom') || '1') || 1;
        applyZoom(savedZoom);

        // SYNC USER DATA & THEME LIVE ACROSS TABS
        const handleStorageChange = (e) => {
            if (e.key === 'themeColor' && e.newValue) {
                applyTheme(e.newValue);
            }
            if (e.key === 'backgroundMode' && e.newValue) {
                applyBackground(e.newValue);
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

    // Sync background when user object updates (e.g. from backend)
    useEffect(() => {
        if (user?.settings?.background) {
            applyBackground(user.settings.background);
        }
    }, [user?.settings?.background]);

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

    useEffect(() => {
        if (user?.settings) {
            setMatrixOverlay(user.settings.matrixOverlay === true);
        }
    }, [user?.settings?.matrixOverlay]);

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

            // Trigger browser notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    new Notification("Legacy Academy Alert", {
                        body: toastMsg,
                        icon: '/favicon.ico'
                    });
                } catch (e) {
                    console.error("Browser notification fail", e);
                }
            }

            fetchNotifications(true); // silent = true to ensure DB is perfectly synced
        };

        const onMessageRecv = (msg) => {
            // Only play sound if the message is for US and from someone else
            if (user && String(msg.recipient) === String(user._id) && String(msg.sender) !== String(user._id)) {
                console.log("📨 [SOCKET] Live message sound trigger");
                
                const messageText = `${t('NOTIF_MESSAGE', 'New message from')} ${msg.senderName || 'Agent'}`;
                // Show a toast if chat window is not open
                if (!isChatOpen) {
                    addToast(messageText, 'info');
                }

                // Trigger browser notification
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                        new Notification("Legacy Academy Chat", {
                            body: msg.text || messageText,
                            icon: '/favicon.ico'
                        });
                    } catch (e) {
                        console.error("Browser chat notification fail", e);
                    }
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
    }, [user, selectedPost?._id, isPublicExperience, isChatOpen]);


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
        if (feedSortOrder === 'hashtags') {
            const hashtagPosts = filteredPosts.filter(p => p.text?.includes('#') || p.title?.includes('#'));
            const sorted = [...hashtagPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return [{ key: 'Hashtags', posts: sorted, dateVal: Date.now() }];
        }

        if (feedSortOrder === 'popular') {
            const sorted = [...filteredPosts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
            return [{ key: 'Δημοφιλέστερα', posts: sorted, dateVal: Date.now() }];
        }
        
        let sortedFilteredPosts = [...filteredPosts];
        if (feedSortOrder === 'oldest') {
            sortedFilteredPosts = sortedFilteredPosts.reverse();
        }
        
        const groups = {};
        const lang = user?.settings?.language || 'en';
        const locale = getLocaleForLang(lang);
        sortedFilteredPosts.forEach(p => {
            const date = new Date(p.createdAt);
            const key = date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = { key, posts: [], dateVal: date.setHours(0, 0, 0, 0) };
            groups[key].posts.push(p);
        });
        
        return Object.values(groups).sort((a, b) => {
            if (feedSortOrder === 'oldest') return a.dateVal - b.dateVal;
            return b.dateVal - a.dateVal;
        });
    }, [filteredPosts, user, feedSortOrder]);

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
            if (elapsed < 180) {
                await new Promise(resolve => setTimeout(resolve, 180 - elapsed));
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
        if (publicProfileUsername || viewPostId || publicSiteUsername) return;
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
    }, [isAnyModalOpen, publicProfileUsername, viewPostId]);

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
            const { reposts, newRepostPost, isReposting, originalPostId } = res.data;
            if (Array.isArray(reposts)) {
                // Update original post's repost count
                setPosts(prev => prev.map(p => String(p._id) === safeId ? { ...p, reposts } : p));
                if (selectedPost && String(selectedPost._id) === safeId) {
                    setSelectedPost(prev => ({ ...prev, reposts }));
                }

                if (isReposting && newRepostPost) {
                    // Add new repost post to the beginning of posts list
                    setPosts(prev => [newRepostPost, ...prev.filter(p => String(p._id) !== String(newRepostPost._id))]);
                    // Also update userSpecificPosts if needed
                    if (userSpecificPosts) {
                        setUserSpecificPosts(prev => [newRepostPost, ...(prev || []).filter(p => String(p._id) !== String(newRepostPost._id))]);
                    }
                } else if (!isReposting) {
                    // Remove repost post
                    setPosts(prev => prev.filter(p => !(p.isRepost && String(p.originalPost) === originalPostId && String(p.repostedBy) === userId)));
                    if (userSpecificPosts) {
                        setUserSpecificPosts(prev => (prev || []).filter(p => !(p.isRepost && String(p.originalPost) === originalPostId && String(p.repostedBy) === userId)));
                    }
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
            isStory: isStory,
            is18Plus: formData.get('is18Plus') === 'true'
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
        // First mark as deleting for animation
        setDeletingPostIds(prev => new Set([...prev, postId]));
        // Wait for animation (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
        // Now remove from state
        setPosts(prev => prev.filter(p => p._id !== postId));
        setLastDeletedPostId(postId); // Propagate to modals
        // Remove from deleting set
        setDeletingPostIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
        });
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

    // AUTO-REQUEST NOTIFICATIONS ON FIRST CLICK REMOVED (User request: too spammy)
    


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
        if (!profileUser?._id) return [];
        const targetId = String(profileUser._id);
        return posts.filter(p => {
            if (p.isStory === true || String(p.isStory) === 'true') return false;
            const authorId = String(p.author?._id || p.author || '');
            const reposterId = String(p.repostedBy?._id || p.repostedBy || '');
            return authorId === targetId || (p.isRepost && reposterId === targetId);
        });
    }, [posts, profileUser?._id]);

    // IF DIRECT LINK TO PUBLIC WEBSITE VIEWER
    if (publicSiteUsername) {
        if (publicUserLoading) {
            return <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center">
                <PlatformLoadingPanel label={t('LOADING_EXPERIENCE', 'LOCATING PLATFORM...')} compact />
            </div>;
        }

        if (!publicUser || !publicUser.settings) {
            return <div className="min-h-screen w-full bg-[#09090b] flex items-center justify-center text-white font-bold">
                Website not found.
            </div>;
        }
        
        let websites = [];
        if (publicUser.settings.businessWebsites && Array.isArray(publicUser.settings.businessWebsites)) {
            // DO NOT filter by isDraft here, because the publicSiteIndex corresponds to the original array index!
            websites = publicUser.settings.businessWebsites;
        } else if (publicUser.settings.businessWebsite) {
            websites = [publicUser.settings.businessWebsite];
        }

        const siteConfig = websites[parseInt(publicSiteIndex) || 0];
        const isOwner = user && publicUser && (user._id === publicUser._id || user.username === publicUser.username || String(user._id) === String(publicUser._id));

        if (!siteConfig) {
            return <div className="min-h-screen w-full bg-[#09090b] flex flex-col items-center justify-center text-center gap-4 p-6">
                <Icons.Globe className="w-16 h-16 text-white/10" />
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Website Unavailable</h2>
                <p className="text-sm text-gray-500 max-w-sm leading-relaxed">This website configuration was not found. Please ensure the link is correct.</p>
            </div>;
        }

        if (siteConfig.isDraft && !isOwner) {
            return <div className="min-h-screen w-full bg-[#09090b] flex flex-col items-center justify-center text-center gap-4 p-6">
                <Icons.Globe className="w-16 h-16 text-white/10" />
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Under Construction</h2>
                <p className="text-sm text-gray-500 max-w-sm leading-relaxed">This website is currently marked as a draft and is only visible to its creator.</p>
            </div>;
        }

        return <PublicWebsiteViewer config={siteConfig} />;
    }

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
                postsReady={publicPostsReady}
                user={user}
                onClose={() => {
                    const params = new URLSearchParams(window.location.search);
                    params.delete('profile');
                    const nextSearch = params.toString();
                    // Clear /@username if present
                    let nextPath = window.location.pathname;
                    if (nextPath.startsWith('/@')) {
                        nextPath = '/';
                    }
                    window.history.pushState({}, '', `${nextPath}${nextSearch ? `?${nextSearch}` : ''}`);
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
                            className="absolute inset-0 w-full h-full object-cover object-top opacity-70"
                            style={{ 
                                animation: 'kenburns 40s infinite alternate ease-in-out',
                                transformOrigin: 'top center'
                            }}
                            alt="Ancient Greece Background"
                        />
                        {/* Light overlays so the image is fully visible but text is readable */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
                        
                        {/* Animated Orbs for magical ancient vibe */}
                        <div className="login-greek-orb top-[-10%] left-[-5%] w-[400px] h-[400px] bg-[var(--gold-primary)]/30" style={{ animationDuration: '8s' }} />
                        <div className="login-greek-orb bottom-[-15%] right-[-5%] w-[500px] h-[500px] bg-[var(--gold-primary)]/20" style={{ animationDuration: '12s', animationDelay: '3s' }} />
                    </div>

                    {/* MAIN GLASS CARD */}
                    <div className="relative w-[92%] sm:w-full max-w-[420px] mx-auto z-10 mt-safe-top pt-8 pb-12">
                        <div className="relative bg-black/40 backdrop-blur-[40px] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            <div className="absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-[var(--gold-primary)]/5 to-transparent pointer-events-none" />

                            <div className="relative p-8 pb-10 overflow-y-auto max-h-[90dvh] no-scrollbar">
                                {/* LOGO */}
                                <div className="flex flex-col items-center mb-8 relative">
                                    <div className="relative flex justify-center items-center w-full mb-2 transition-transform duration-300 hover:scale-105">
                                        <img
                                            src={ASSET_PATHS.logo}
                                            alt="Legacy Academy"
                                            className={`h-24 sm:h-28 md:h-32 w-auto object-contain ${authLoading ? 'opacity-50 ' : 'opacity-100'}`}
                                            decoding="async"
                                            fetchPriority="high"
                                            loading="eager"
                                        />
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
                                                <input type="email" placeholder="Email address" id="l-email" name="l-email" aria-label="Email address" value={formData.email} onChange={handleAuthInputChange} className="relative w-full bg-transparent py-4 pl-11 pr-4 text-white text-sm font-medium outline-none placeholder:text-white/20 z-10" />
                                            </div>
                                            <div className="relative group mb-3">
                                                <div className="absolute inset-0 rounded-2xl bg-white/[0.03] group-focus-within:bg-white/[0.06] transition-colors duration-300" />
                                                <div className="absolute inset-0 rounded-2xl border border-white/[0.08] group-focus-within:border-[var(--gold-primary)]/40 transition-colors duration-300" />
                                                <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-[var(--gold-primary)]/60 transition-colors duration-300 z-10" />
                                                <input type={showPassword ? "text" : "password"} placeholder="Password" id="l-password" name="l-password" aria-label="Password" value={formData.password} onChange={handleAuthInputChange} className="relative w-full bg-transparent py-4 pl-11 pr-11 text-white text-sm font-medium outline-none placeholder:text-white/20 z-10" />
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
                                        </form>
                                    )}
                                    {authMode === 'register' && (
                                        <>
                                            <div onClick={() => registerFileRef.current.click()} className="w-20 h-20 mx-auto rounded-full bg-white/5 overflow-hidden cursor-pointer relative group mb-2 flex items-center justify-center border border-white/10 hover:border-white/20 transition-colors">
                                                {registerPreview ? <img src={registerPreview} className="w-full h-full object-cover rounded-full" /> : (
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
                                                    <input type={f.type} placeholder={f.ph} id={f.id} name={f.id} aria-label={f.ph} value={f.val} maxLength={f.max} onChange={(e) => { if (!f.max || e.target.value.length <= f.max) handleAuthInputChange(e); }} className="relative w-full bg-transparent py-3.5 pl-11 pr-4 text-white text-sm font-medium outline-none placeholder:text-white/20 z-10" />
                                                </div>
                                            ))}
                                            <div className="relative group">
                                                <div className="absolute inset-0 rounded-2xl bg-white/[0.03] group-focus-within:bg-white/[0.06] transition-colors duration-300" />
                                                <div className="absolute inset-0 rounded-2xl border border-white/[0.08] group-focus-within:border-[var(--gold-primary)]/40 transition-colors duration-300" />
                                                <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-[var(--gold-primary)]/60 transition-colors duration-300 z-10" />
                                                <input type={showPassword ? "text" : "password"} placeholder="Password" id="r-password" name="r-password" aria-label="Password" value={formData.password} onChange={handleAuthInputChange} className="relative w-full bg-transparent py-3.5 pl-11 pr-11 text-white text-sm font-medium outline-none placeholder:text-white/20 z-10" />
                                                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 z-10">{showPassword ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}</button>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute inset-0 rounded-2xl bg-white/[0.03] group-focus-within:bg-white/[0.06] transition-colors duration-300" />
                                                <div className="absolute inset-0 rounded-2xl border border-white/[0.08] group-focus-within:border-[var(--gold-primary)]/40 transition-colors duration-300" />
                                                <textarea placeholder="Bio (Optional)" id="r-bio" name="r-bio" aria-label="Bio" value={formData.bio || ''} onChange={handleAuthInputChange} maxLength={500} className="relative w-full bg-transparent py-3.5 px-4 text-white text-sm font-medium outline-none placeholder:text-white/20 resize-none h-20 z-10" />
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
                                                <input type="email" placeholder="Email Address" id="f-email" name="f-email" aria-label="Email Address" value={formData.email} onChange={handleAuthInputChange} className="relative w-full bg-transparent py-4 pl-11 pr-4 text-white text-sm font-medium outline-none placeholder:text-white/20 z-10" />
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
                                                <input type={showPassword ? "text" : "password"} placeholder="New Password" id="r-password" name="r-password" aria-label="New Password" value={formData.password} onChange={handleAuthInputChange} className="relative w-full bg-transparent py-4 pl-11 pr-11 text-white text-sm font-medium outline-none placeholder:text-white/20 z-10" />
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
                    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-xl">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-[24px] max-w-[420px] w-full overflow-y-auto no-scrollbar max-h-[95dvh] relative shadow-[0_10px_50px_rgba(0,0,0,0.8)]">
                            {/* Decorative Top Line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--gold-primary)] to-[#ffb700]" />
                            
                            <div className="p-4 sm:p-8 text-center flex flex-col items-center">
                                <div className="w-10 h-10 sm:w-16 sm:h-16 bg-[var(--gold-primary)]/10 rounded-full flex items-center justify-center mb-2 sm:mb-4 border border-[var(--gold-primary)]/20 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                                    <Icons.Lock className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--gold-primary)]" />
                                </div>
                                
                                <h2 className="text-base sm:text-[22px] font-black text-white uppercase tracking-[0.2em] mb-0.5 sm:mb-1">Exclusive Network</h2>
                                <div className="text-[8px] sm:text-[10px] text-[var(--gold-primary)] uppercase tracking-[0.3em] font-bold mb-4 sm:mb-6">Legacy Academy Membership</div>
                                
                                <div className="w-full bg-[#111] border border-white/5 rounded-[16px] p-3 sm:p-5 mb-4 sm:mb-6 text-left space-y-2 sm:space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5"><Icons.Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--gold-primary)]" strokeWidth={3} /></div>
                                        <div>
                                            <div className="text-[10px] sm:text-xs text-white font-bold tracking-wide uppercase">Private Members Network</div>
                                            <div className="text-[8px] sm:text-[10px] text-white/40 leading-tight">An elite social ecosystem designed strictly for verified individuals.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5"><Icons.Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--gold-primary)]" strokeWidth={3} /></div>
                                        <div>
                                            <div className="text-[10px] sm:text-xs text-white font-bold tracking-wide uppercase">Strategic Insights</div>
                                            <div className="text-[8px] sm:text-[10px] text-white/40 leading-tight">Curated knowledge and high-value strategies reserved for the inner circle.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5"><Icons.Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--gold-primary)]" strokeWidth={3} /></div>
                                        <div>
                                            <div className="text-[10px] sm:text-xs text-white font-bold tracking-wide uppercase">Daily Missions & Rankings</div>
                                            <div className="text-[8px] sm:text-[10px] text-white/40 leading-tight">Complete strategic missions to build your streak and rank up.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5"><Icons.Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--gold-primary)]" strokeWidth={3} /></div>
                                        <div>
                                            <div className="text-[10px] sm:text-xs text-white font-bold tracking-wide uppercase">Website Builder</div>
                                            <div className="text-[8px] sm:text-[10px] text-white/40 leading-tight">Entrepreneurs can launch their own high-end custom websites.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5"><Icons.Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--gold-primary)]" strokeWidth={3} /></div>
                                        <div>
                                            <div className="text-[10px] sm:text-xs text-white font-bold tracking-wide uppercase">Encrypted P2P Comms</div>
                                            <div className="text-[8px] sm:text-[10px] text-white/40 leading-tight">Secure chat, blue verified badge, and elite inner circle access.</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white/5 rounded-xl p-2.5 sm:p-4 w-full mb-3 sm:mb-6 border border-white/10">
                                    <div className="text-xl sm:text-3xl font-black text-white flex items-center justify-center gap-1">49€ <span className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest mt-1">/ MONTH</span></div>
                                </div>
                                
                                <button onClick={() => window.location.href = "https://buy.stripe.com/aFaaEX81B2Fs1gI36Y6Na07"} className="w-full py-3 sm:py-4 bg-white/10 border border-white/10 text-white font-black uppercase tracking-[0.25em] rounded-xl hover:bg-white/20 hover:border-white/20 active:scale-95 transition-all duration-300 mb-3 sm:mb-5 text-[9px] sm:text-[11px]">
                                    Unlock Access
                                </button>
                                
                                <button onClick={() => setShowPaywall(false)} className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold hover:text-white transition-colors underline decoration-white/20 underline-offset-4 pb-1">
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
                    <div id="app-content" className="flex-1 overflow-hidden relative">
                        <main ref={mainScrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar app-main-scroll p-0 relative z-10 overscroll-y-none h-full">
                        <header className="relative w-full z-[20] bg-[var(--app-bg)] text-[#ffffff] border-b border-white/10 shrink-0">
                            <div className="w-full px-3 sm:px-6 py-6 sm:py-4 flex items-center justify-between">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <EnhancedButton
                                        onClick={() => { playCyberSFX('click'); setIsDrawerOpen(true); }}
                                        className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-transparent active:scale-95 transition-all duration-300 z-50 p-2.5 -ml-2 group touch-manipulation"
                                        aria-label="Open menu"
                                        scaleDown={0.95}
                                        duration={150}
                                    >
                                        <svg fill="none" width="28" viewBox="0 0 24 24" height="28" className="text-gray-300 group-hover:text-[#ffffff] transition-colors duration-300 pointer-events-none">
                                            <path fill="currentColor" stroke="none" strokeWidth="0" strokeLinecap="butt" strokeLinejoin="miter" fillRule="evenodd" clipRule="evenodd" d="M2 6a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm0 6a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm0 6a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Z"></path>
                                        </svg>
                                    </EnhancedButton>
                                </div>
                                <div className="flex-1 flex justify-center py-2">
                                    <div className="relative flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]">
                                        <img
                                            src={ASSET_PATHS.logo}
                                            alt="Legacy Academy"
                                            className="h-24 sm:h-28 md:h-32 w-auto object-contain"
                                            decoding="sync"
                                            loading="eager"
                                            fetchPriority="high"
                                        />
                                    </div>
                                </div>
                                <div className="w-10"></div> {/* Spacer for symmetry */}
                            </div>
                        </header>
                        <div id="zoomable-content" className="pt-0 sm:pt-4 max-w-2xl sm:max-w-xl md:max-w-2xl mx-auto pb-[158px]">
                            {activeTab === 'exchange' ? (
                                <div className="animate-fade-in p-4 sm:p-8">
                                    <div className="mb-6 px-2">
                                        <h2 className="text-xl font-black text-white uppercase tracking-widest">Empire Capital</h2>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Crypto Exchange</div>
                                    </div>

                                    {/* Wallet Balances */}
                                    <div className="mb-6 p-4 sm:p-6 rounded-[24px] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-lg">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Portfolio Balance</div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(walletBalances).map(([coin, balance]) => (
                                                <div key={coin} className="p-3 rounded-xl bg-black/40 border border-white/10">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{coin}</div>
                                                    <div className="text-lg font-black text-white">
                                                        {balance.toFixed(4)} <span className="text-xs text-gray-400 font-bold">({coin !== 'USDT' ? `$${(balance * cryptoPrices[coin]).toFixed(2)}` : ''})</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Trade Section */}
                                    <div className="mb-6 p-4 sm:p-6 rounded-[24px] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-lg">
                                        <div className="flex gap-2 mb-4">
                                            <button
                                                onClick={() => setTradeType('buy')}
                                                className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tradeType === 'buy' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                                            >
                                                Buy
                                            </button>
                                            <button
                                                onClick={() => setTradeType('sell')}
                                                className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tradeType === 'sell' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                                            >
                                                Sell
                                            </button>
                                        </div>

                                        <div className="mb-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Select Coin</div>
                                            <div className="flex gap-2">
                                                {['BTC', 'ETH', 'SOL', 'XRP'].map((coin) => (
                                                    <button
                                                        key={coin}
                                                        onClick={() => setSelectedCrypto(coin)}
                                                        className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${selectedCrypto === coin ? 'bg-gradient-to-r from-[#1D9BF0] to-[#60A5FA] text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                                                    >
                                                        {coin}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Amount</div>
                                            <input
                                                type="number"
                                                value={tradeAmount}
                                                onChange={(e) => setTradeAmount(e.target.value)}
                                                placeholder="0.0000"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-[#1D9BF0] transition-all"
                                            />
                                        </div>

                                        <div className="mb-4 p-3 rounded-xl bg-black/40 border border-white/10">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400">Price</span>
                                                <span className="text-white font-bold">${cryptoPrices[selectedCrypto].toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs mt-1">
                                                <span className="text-gray-400">Total</span>
                                                <span className="text-white font-bold">${(parseFloat(tradeAmount) || 0) * cryptoPrices[selectedCrypto].toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                const amount = parseFloat(tradeAmount) || 0;
                                                if (amount <= 0) return;
                                                if (tradeType === 'buy') {
                                                    const cost = amount * cryptoPrices[selectedCrypto];
                                                    if (walletBalances.USDT < cost) {
                                                        addToast('Insufficient USDT balance', 'error');
                                                        return;
                                                    }
                                                    setWalletBalances(prev => ({
                                                        ...prev,
                                                        USDT: prev.USDT - cost,
                                                        [selectedCrypto]: prev[selectedCrypto] + amount
                                                    }));
                                                    addToast(`Bought ${amount} ${selectedCrypto}`, 'success');
                                                } else {
                                                    if (walletBalances[selectedCrypto] < amount) {
                                                        addToast(`Insufficient ${selectedCrypto} balance`, 'error');
                                                        return;
                                                    }
                                                    setWalletBalances(prev => ({
                                                        ...prev,
                                                        [selectedCrypto]: prev[selectedCrypto] - amount,
                                                        USDT: prev.USDT + amount * cryptoPrices[selectedCrypto]
                                                    }));
                                                    addToast(`Sold ${amount} ${selectedCrypto}`, 'success');
                                                }
                                                setTradeAmount('');
                                            }}
                                            className="w-full py-3 rounded-[16px] bg-gradient-to-r from-[#1D9BF0] to-[#60A5FA] text-black font-black uppercase tracking-widest text-sm hover:scale-105 transition-all active:scale-95 shadow-lg"
                                        >
                                            {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedCrypto}
                                        </button>
                                    </div>
                                </div>
                            ) : activeTab === 'alerts' ? (
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
                                        alerts.map((n, i) => {
                                            const resolvedSender = users?.find(u => isSameId(u._id, n.from)) || n.sender;
                                            const enrichedNote = { ...n, sender: resolvedSender };
                                            return (
                                                <NotificationItem
                                                    key={n._id || i}
                                                    note={enrichedNote}
                                                    onViewProfile={viewProfile}
                                                    onOpenChat={handleOpenChat}
                                                    onAcceptRequest={handleAcceptRequest}
                                                    onRejectRequest={handleRejectRequest}
                                                    onOpenPost={(id) => { const p = posts.find(p => p._id === id); if (p) setSelectedPost(p); }}
                                                    t={t}
                                                    lang={lang}
                                                />
                                            );
                                        })
                                    )}
                                </div>
                            ) : (
                                <>
                                    
                                    {/* Feed Sort Tabs */}
                                    {activeTab !== 'search' && (
                                        <div className="flex items-center justify-between w-full px-3 sm:px-4 pt-3 pb-1.5 border-b border-white/5 bg-transparent relative z-[45]">
                                            
                                            {/* Mobile Dropdown Button */}
                                            <div className="sm:hidden relative w-full flex items-center justify-between">
                                                <button 
                                                    onClick={() => setIsFeedSortMenuOpen(!isFeedSortMenuOpen)}
                                                    className="flex items-center gap-2 pb-2.5 font-black text-[11px] uppercase tracking-wider text-white"
                                                >
                                                    {feedSortOrder === 'newest' && <><Icons.Sparkles className="w-3.5 h-3.5" /> Νεότερα</>}
                                                    {feedSortOrder === 'hashtags' && <><Icons.Hash className="w-3.5 h-3.5" strokeWidth={2.5} /> Hashtags</>}
                                                    {feedSortOrder === 'popular' && <><Icons.TrendingUp className="w-3.5 h-3.5" /> Δημοφιλή</>}
                                                    {feedSortOrder === 'oldest' && <><Icons.Clock className="w-3.5 h-3.5" /> Παλαιότερα</>}
                                                    <Icons.ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isFeedSortMenuOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                {/* Mobile Dropdown Menu */}
                                                <AnimatePresence>
                                                    {isFeedSortMenuOpen && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -5 }}
                                                            className="absolute top-10 left-0 w-48 bg-[#111113] border border-white/10 rounded-xl shadow-2xl flex flex-col p-1 z-[50]"
                                                        >
                                                            {[
                                                                { id: 'newest', label: 'Νεότερα', Icon: Icons.Sparkles },
                                                                { id: 'hashtags', label: 'Hashtags', Icon: Icons.Hash },
                                                                { id: 'popular', label: 'Δημοφιλή', Icon: Icons.TrendingUp },
                                                                { id: 'oldest', label: 'Παλαιότερα', Icon: Icons.Clock }
                                                            ].map(opt => (
                                                                <button
                                                                    key={opt.id}
                                                                    onClick={() => { setFeedSortOrder(opt.id); setIsFeedSortMenuOpen(false); }}
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${feedSortOrder === opt.id ? 'bg-[var(--gold-primary)] text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                                                >
                                                                    <opt.Icon className="w-3.5 h-3.5" />
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Desktop Tabs */}
                                            <div className="hidden sm:flex items-center gap-5 pr-4">
                                                <button 
                                                    onClick={() => setFeedSortOrder('newest')}
                                                    className={`flex items-center gap-1.5 pb-2.5 font-black text-[12px] uppercase tracking-wider transition-all relative ${feedSortOrder === 'newest' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    <Icons.Sparkles className="w-4 h-4" />
                                                    <span>Νεότερα</span>
                                                </button>
                                                
                                                <button 
                                                    onClick={() => setFeedSortOrder('hashtags')}
                                                    className={`flex items-center gap-1 pb-2.5 font-black text-[12px] uppercase tracking-wider transition-all relative ${feedSortOrder === 'hashtags' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    <Icons.Hash className="w-4 h-4" strokeWidth={2.5} />
                                                    <span>Hashtags</span>
                                                </button>

                                                <button 
                                                    onClick={() => setFeedSortOrder('popular')}
                                                    className={`flex items-center gap-1.5 pb-2.5 font-black text-[12px] uppercase tracking-wider transition-all relative ${feedSortOrder === 'popular' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    <Icons.TrendingUp className="w-4 h-4" />
                                                    <span>Δημοφιλή</span>
                                                </button>

                                                <button 
                                                    onClick={() => setFeedSortOrder('oldest')}
                                                    className={`flex items-center gap-1.5 pb-2.5 font-black text-[12px] uppercase tracking-wider transition-all relative ${feedSortOrder === 'oldest' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    <Icons.Clock className="w-4 h-4" />
                                                    <span>Παλαιότερα</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab !== 'search' && <StoriesBar stories={stories} user={user} imgKey={imgKey} key={imgKey || 'stories'} onAddStory={() => { setCreateModeStory(true); setIsCreateOpen(true); }} onViewStory={(s) => setSelectedPost(s)} />}
                                    <div className="px-2 py-4 sm:p-8">
                                        {activeTab === 'search' && (
                                            <div className="mb-8 space-y-4 animate-fade-in">
                                                <div className="relative">
                                                    <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white z-10 pointer-events-none drop-shadow-[0_1px_6px_rgba(255,255,255,0.18)]" />
                                                    <input id="main-search" name="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('SEARCH_PH')} className="w-full bg-[linear-gradient(180deg,rgba(12,12,12,0.96),rgba(5,5,5,0.9))] backdrop-blur-2xl rounded-2xl py-4 pl-12 pr-4 font-semibold tracking-[0.01em] outline-none focus:border-white/25 focus:bg-black/90 border border-white/12 text-white placeholder:text-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_14px_32px_rgba(0,0,0,0.4)] transition-all duration-300 touch-manipulation" />
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center justify-between px-1">
                                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--app-text)] flex items-center gap-2">
                                                            <div className="w-1 h-3 bg-[var(--app-text)] rounded-none" />
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
                                                                    {postHasMedia(post) ? (
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
                                                                        <div className="w-full h-full bg-gradient-to-br from-black via-[#0a0a0a] to-black flex items-center justify-center p-5 text-center">
                                                                            <span className="font-semibold text-white/90 text-sm sm:text-base leading-snug line-clamp-6 break-words">{getPostTextPreview(post.content || post.desc)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                                                                    
                                                                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 z-10">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <div className="w-6 h-6 rounded-full overflow-hidden ">
                                                                                <ProfileAvatar user={post.author} />
                                                                            </div>
                                                                            <span className="text-[11px] font-bold text-white uppercase tracking-wider truncate shadow-sm">
                                                                                {post.author?.username || 'Agent'}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-white/90 font-medium line-clamp-2 leading-snug drop-shadow-md break-words">{getPostTextPreview(post.content || post.desc, 90)}</p>
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
                                                <PlatformLoadingPanel label={t('DECRYPTING_FEED')} />
                                            ) : activeTab === 'search' && searchQuery && (
                                                <div className="space-y-2">
                                                    {users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()) && u._id !== user._id).slice(0, 5).map(u => (
                                                        <div key={u._id} onClick={() => viewProfile(u)} className="flex items-center gap-3 p-3 bg-black rounded-none  cursor-pointer hover:border-white transition-colors">
                                                            <div className="w-10 h-10 relative group shrink-0">
                                                                <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-500"></div>
                                                                <div className="absolute inset-[2.5px] rounded-full overflow-hidden">
                                                                    <ProfileAvatar user={u} cacheKey={imgKey} />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="font-bold text-white text-xs sm:text-sm">
                                                                        {u.username}
                                                                    </div>
                                                                    {getActiveStreak(u) > 0 && <span className="text-orange-500 font-bold text-xs shrink-0 flex items-center">🔥{getActiveStreak(u)}{isTopStreak(u) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}
                                                                    <VerifiedBadge isFounder={u.role === 'Founder'} isUser={u.role !== 'Founder'} className="w-3.5 h-3.5 shrink-0" user={u} />
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{[...new Set((u.followers || []).filter(id => users.some(us => isSameId(us._id, id))))].length} {t('FOLLOWERS_COUNT')}</div>
                                                            </div>
                                                            <button className="px-3 py-1.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest">{t('VIEW')}</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="space-y-4">

                                                {(activeTab === 'home' || (activeTab === 'search' && searchQuery)) && groupedPosts.map(group => {
                                                    const dateKey = group.key;
                                                    return (
                                                        <div key={dateKey} className="animate-fade-in group mb-12">
                                                            <div className="space-y-8">
                                                                <>
                                                                    {group.posts.map(p => (
                                                                        <div
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
                                                                            <PostCard post={p} user={user} allUsers={users} onLike={handleLike} onDislike={handleDislike} onRepost={handleRepost} onComment={handleComment} onDelete={handleDeletePost} onViewProfile={viewProfile} onOpenDetail={setSelectedPost} onOpenChat={handleOpenChat} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onEditPost={(post) => { setPostToEdit(post); setIsEditOpen(true); }} onShare={handleShare} onHashtagClick={handleHashtagClick} loadingActions={loadingActions} forcePause={isAnyModalOpen} isDeleting={deletingPostIds.has(p._id)} cacheKey={imgKey} onOpenSubscription={() => setIsSubscriptionOpen(true)} />
                                                                        </div>
                                                                    ))}
                                                                </>
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
                    </div>

                    {showScrollTop && !isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost && (
                        <button
                            onClick={scrollToTop}
                            className="fixed bottom-[calc(158px+env(safe-area-inset-bottom))] right-20 sm:right-32 z-[950] w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ffffff]/10 shrink-0 flex-none flex items-center justify-center text-[var(--gold-primary)] backdrop-blur-2xl border border-[#ffffff]/20 hover:scale-105 active:scale-95 transition-all duration-500 ease-out"
                        >
                            <Icons.ArrowUp className="w-8 h-8 sm:w-10 sm:h-10" />
                        </button>
                    )}

                    {/* CREATE FAB (Bluesky Style) */}
                    {(!isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost) && (
                        <button
                            onClick={() => { setIsCreateOpen(true); }}
                            className="fixed bottom-[calc(158px+env(safe-area-inset-bottom))] right-4 sm:right-10 z-[1000] w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ffffff]/10 shrink-0 flex-none backdrop-blur-2xl border border-[#ffffff]/20 flex items-center justify-center text-[#ffffff] hover:scale-105 active:scale-95 transition-all duration-500 ease-out"
                        >
                            <Icons.Compose className="w-8 h-8 sm:w-10 sm:h-10" />
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
                        deletingPostIds={deletingPostIds}
                        onOpenSubscription={() => setIsSubscriptionOpen(true)}
                    />
                    <ChatModal isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); setChatTarget(null); }} user={user} allUsers={users} initialChatUser={chatTarget} addToast={addToast} fetchSpecificUser={fetchUsers} />

                    <BottomNavbar
                        activeTab={activeTab}
                        onTabChange={(tab) => {
                            if (tab === 'exchange' && !is18PlusVerified) {
                                setShowAgeModal(true);
                            } else if (tab === 'profile') {
                                if (user) viewProfile(user);
                            } else {
                                setActiveTab(tab);
                            }
                        }}
                        alerts={alerts}
                        user={user}
                        onCreate={() => setIsCreateOpen(true)}
                        onProfile={() => user && viewProfile(user)}
                        ProfileAvatar={ProfileAvatar}
                        isProfileActive={isProfileOpen && profileUser && user && isSameId(profileUser._id, user._id)}
                    />

                    <NavigationDrawer
                        isOpen={isDrawerOpen}
                        onClose={() => setIsDrawerOpen(false)}
                        user={user}
                        allUsers={users}
                        alerts={alerts}
                        activeTab={activeTab}
                        onNavigate={(tab) => {
                            if (tab === 'chat') {
                                setTimeout(() => setIsChatOpen(true), 150);
                            } else {
                                setActiveTab(tab);
                            }
                        }}
                        onViewProfile={viewProfile}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onOpenWebsiteBuilder={() => setIsWebsiteBuilderOpen(true)}
                        onOpenSubscription={() => setIsSubscriptionOpen(true)}
                        onOpenTerms={() => setIsTermsOpen(true)}
                        onOpenPrivacy={() => setIsPrivacyOpen(true)}
                        onLogout={logout}
                        onOpenChat={handleOpenChat}
                        t={t}
                    />
                    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} logout={logout} user={user} onUpdateUser={handleUpdateUser} />
                    <SubscriptionModal isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} user={user} onUpdateUser={handleUpdateUser} />

                    <>
                        {isWebsiteBuilderOpen && (
                            <WebsiteManager 
                                user={user}
                                onUpdateUser={handleUpdateUser}
                                onBack={() => setIsWebsiteBuilderOpen(false)}
                            />
                        )}
                    </>

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
                            onHashtagClick={(tag) => {
                                setSelectedPost(null);
                                handleHashtagClick(tag);
                            }}
                        />
                    )}
                </div>
            )}
            
            {shareModalPost && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <button onClick={() => setShareModalPost(null)} className="absolute top-4 right-4 p-3 bg-transparent hover:bg-white/10 hover:scale-105 active:scale-95 rounded-full transition-all duration-300 group">
                        <Icons.X className="w-6 h-6 text-red-500 group-hover:text-red-400 group-hover:rotate-90 transition-all duration-300" />
                    </button>
                    
                    <div className="bg-black  rounded-[20px] max-w-[400px] w-full overflow-hidden shadow-2xl">
                        <div id="share-card-content" className="bg-[#0a0a0a] p-6 pb-8 relative overflow-hidden flex flex-col items-center text-center">
                            {/* Watermark */}
                            <div className="absolute top-4 right-6 opacity-10 font-black italic text-2xl tracking-tighter text-white">LEGACY</div>
                            
                            {/* Author */}
                            <div className="flex items-center gap-3 mb-4 w-full justify-center">
                                <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden shrink-0">
                                    <ProfileAvatar user={shareModalPost.author} />
                                </div>
                                <div className="flex flex-col items-start text-left max-w-[calc(100%-60px)]">
                                    <div className="font-bold text-white text-base flex flex-wrap items-center gap-1.5 leading-none w-full">
                                        <span className="truncate">{shareModalPost.author?.username}</span>
                                        <VerifiedBadge isFounder={shareModalPost.author?.role === 'Founder'} isUser={shareModalPost.author?.role !== 'Founder'} className="w-4 h-4 shrink-0" user={shareModalPost.author} />
                                        {shareModalPost.author?.profileDescriptor && PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor] && (
                                            <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 backdrop-blur-xl text-[9px] font-black uppercase tracking-wider shrink-0 ${PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor].accentClass.replace(/rounded-none/g, '')}`}>
                                                {React.createElement(PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor].Icon, { className: "w-2.5 h-2.5 shrink-0" })}
                                                <span className="text-[9px] font-black uppercase tracking-[0.12em]">{t(`DESC_${shareModalPost.author.profileDescriptor.toUpperCase()}`, PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor].label)}</span>
                                            </div>
                                        )}
                                        {getActiveStreak(shareModalPost?.author) > 0 && <span className="text-orange-500 font-bold text-xs shrink-0 flex items-center">🔥{getActiveStreak(shareModalPost?.author)}{isTopStreak(shareModalPost?.author) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 shrink-0 text-gray-400 text-xs">
                                        <div className="truncate">{formatUserHandle(shareModalPost.author?.username)}</div>
                                        <span className="opacity-50 mx-1 shrink-0">•</span>
                                        <CyberDate date={shareModalPost.createdAt} t={t} lang={currentLanguage} />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Text */}
                            {shareModalPost.desc && (
                                <div className="text-white text-base leading-relaxed mb-4 whitespace-pre-wrap break-words overflow-wrap-readable text-left w-full">
                                    {parseText(shareModalPost.desc, handleHashtagClick, (username) => {
                                        const u = users?.find(user => String(user.username).toLowerCase() === String(username).toLowerCase());
                                        if (u) viewProfile(u);
                                    })}
                                </div>
                            )}
                            
                            {/* Media - FULL COVER/CONTAIN */}
                            {postHasMedia(shareModalPost) && (
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
                    <button onClick={() => setShareModalProfile(null)} className="absolute top-4 right-4 p-3 bg-transparent hover:bg-white/10 hover:scale-105 active:scale-95 rounded-full transition-all duration-300 group">
                        <Icons.X className="w-6 h-6 text-red-500 group-hover:text-red-400 group-hover:rotate-90 transition-all duration-300" />
                    </button>
                    
                    <div className="bg-black  rounded-[20px] max-w-[360px] w-full overflow-hidden shadow-2xl">
                        <div id="share-card-content" className="bg-[#0a0a0a] relative overflow-hidden flex flex-col items-center pt-10 pb-8 px-6 text-center">
                            {/* Watermark */}
                            <div className="absolute top-4 right-6 opacity-10 font-black italic text-xl tracking-tighter text-white">LEGACY</div>
                            
                            {/* Profile Image */}
                              <div className="w-24 h-24 rounded-full bg-black overflow-hidden  shrink-0 mb-4">
                                  <ProfileAvatar user={shareModalProfile} size="large" />
                              </div>
                            
                            {/* Profile Name & Badge */}
                            <div className="flex flex-col items-center justify-center gap-2 mb-1">
                                <div className="font-black text-white text-2xl flex items-center justify-center gap-2 leading-none">
                                    {shareModalProfile.username}
                                    {getActiveStreak(shareModalProfile) > 0 && <span className="text-orange-500 font-bold text-lg shrink-0">🔥{getActiveStreak(shareModalProfile)}{isTopStreak(shareModalProfile) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}
                                    <VerifiedBadge isFounder={shareModalProfile.role === 'Founder'} isUser={shareModalProfile.role !== 'Founder'} className="w-6 h-6 shrink-0" user={shareModalProfile} />
                                </div>
                                {shareModalProfile.profileDescriptor && PROFILE_DESCRIPTOR_MAP[shareModalProfile.profileDescriptor] && (
                                    <div className={`profile-descriptor-badge inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-xl transition-all duration-300 ${PROFILE_DESCRIPTOR_MAP[shareModalProfile.profileDescriptor].accentClass}`}>
                                        {React.createElement(PROFILE_DESCRIPTOR_MAP[shareModalProfile.profileDescriptor].Icon, { className: "w-3.5 h-3.5 shrink-0" })}
                                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">{t(`DESC_${shareModalProfile.profileDescriptor.toUpperCase()}`, PROFILE_DESCRIPTOR_MAP[shareModalProfile.profileDescriptor].label)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mb-4" />
                            {getFounderAffiliation(shareModalProfile) && (
                                <FounderAffiliationBadge username={getFounderAffiliation(shareModalProfile)} size="sm" maxTextWidth="max-w-none" className="mb-4" />
                            )}
                            
                            {/* Bio */}
                            {shareModalProfile.bio && (
                                <p className="text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap">{shareModalProfile.bio}</p>
                            )}
                            
                            {/* Stats */}
                            <div className="flex items-center justify-center gap-8 w-full border-t border-white/10 pt-6">
                                <div className="flex flex-col items-center">
                                    <div className="font-black text-white text-xl">{[...new Set((shareModalProfile.followers || []).filter(id => (users || []).some(u => isSameId(u._id, id))))].length}</div>
                                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Followers</div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="font-black text-white text-xl">{[...new Set((shareModalProfile.following || []).filter(id => (users || []).some(u => isSameId(u._id, id))))].length}</div>
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

            {/* Age Verification Modal */}
            {showAgeModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                    <div className="bg-black rounded-[24px] max-w-[400px] w-full overflow-hidden shadow-2xl border border-white/10">
                        <div className="p-8 text-center">
                            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">WARNING</h2>
                            <p className="text-gray-400 text-sm mb-6">You must be 18 years or older to access Empire Capital.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAgeModal(false)}
                                    className="flex-1 py-3 rounded-[14px] bg-white/5 border border-white/10 text-white font-bold text-sm uppercase tracking-wide hover:bg-white/10 transition-all active:scale-95"
                                >
                                    I'm Under 18
                                </button>
                                <button
                                    onClick={() => {
                                        setIs18PlusVerified(true);
                                        setShowAgeModal(false);
                                    }}
                                    className="flex-1 py-3 rounded-[14px] bg-gradient-to-r from-[#1D9BF0] to-[#60A5FA] text-black font-black text-sm uppercase tracking-wide hover:scale-105 transition-all active:scale-95 shadow-lg"
                                >
                                    I'm 18+
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;








