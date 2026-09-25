import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';

/**
 * Dynamic Island In-App Notification System for Web
 * Inspired by iPhone Dynamic Island & expo-dynamic-notifications
 */
export default function DynamicIslandNotification({
    notifications = [],
    onDismiss,
    onNavigate,
}) {
    // Current visible notification (top of the queue)
    const activeNotification = notifications && notifications.length > 0 ? notifications[0] : null;
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef(null);

    // Auto-dismiss countdown
    useEffect(() => {
        if (!activeNotification) return;

        const duration = activeNotification.duration !== undefined 
            ? activeNotification.duration 
            : (activeNotification.type === 'error' ? 5000 : 3800);

        if (duration === null || duration === 0) return; // Persistent until dismissed

        if (isHovered) {
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        timerRef.current = setTimeout(() => {
            if (onDismiss) onDismiss(activeNotification.id);
        }, duration);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [activeNotification, isHovered, onDismiss]);

    if (!activeNotification) return null;

    // Resolve color, icon, and title based on type
    const getNotificationMeta = (item) => {
        const type = item.type || 'info';
        
        switch (type) {
            case 'follow':
                return {
                    title: item.title || 'NEW FOLLOWER',
                    accent: item.accent || '#1D9BF0',
                    gradient: 'from-[#1D9BF0]/30 via-sky-500/10 to-transparent',
                    glow: 'rgba(29, 155, 240, 0.35)',
                    icon: Icons.Users || Icons.User,
                    defaultText: 'started following you'
                };
            case 'message':
            case 'whisper':
                return {
                    title: item.title || 'NEW WHISPER',
                    accent: item.accent || '#00E5FF',
                    gradient: 'from-cyan-500/30 via-blue-500/10 to-transparent',
                    glow: 'rgba(0, 229, 255, 0.4)',
                    icon: Icons.MessageSquare || Icons.MessageCircle,
                    defaultText: 'sent you a private message'
                };
            case 'like':
                return {
                    title: item.title || 'POST LIKED',
                    accent: item.accent || '#F43F5E',
                    gradient: 'from-rose-500/30 via-pink-500/10 to-transparent',
                    glow: 'rgba(244, 63, 94, 0.4)',
                    icon: Icons.Heart,
                    defaultText: 'liked your post'
                };
            case 'comment':
                return {
                    title: item.title || 'NEW COMMENT',
                    accent: item.accent || '#A855F7',
                    gradient: 'from-purple-500/30 via-fuchsia-500/10 to-transparent',
                    glow: 'rgba(168, 85, 247, 0.4)',
                    icon: Icons.Comment,
                    defaultText: 'commented on your post'
                };
            case 'repost':
                return {
                    title: item.title || 'REPOSTED',
                    accent: item.accent || '#10B981',
                    gradient: 'from-emerald-500/30 via-teal-500/10 to-transparent',
                    glow: 'rgba(16, 185, 129, 0.4)',
                    icon: Icons.Repost || Icons.RefreshCcw || Icons.Zap,
                    defaultText: 'reposted your archive'
                };
            case 'streak':
                return {
                    title: item.title || 'STREAK LEVEL UP',
                    accent: item.accent || '#F59E0B',
                    gradient: 'from-amber-500/30 via-orange-500/10 to-transparent',
                    glow: 'rgba(245, 158, 11, 0.45)',
                    icon: Icons.Streak || Icons.Zap,
                    defaultText: 'Streak maintained!'
                };
            case 'success':
                return {
                    title: item.title || 'SUCCESS',
                    accent: item.accent || '#22C55E',
                    gradient: 'from-green-500/30 via-emerald-500/10 to-transparent',
                    glow: 'rgba(34, 197, 94, 0.35)',
                    icon: Icons.Check || Icons.CheckCircle,
                    defaultText: item.text || 'Action completed successfully'
                };
            case 'error':
                return {
                    title: item.title || 'ALERT',
                    accent: item.accent || '#EF4444',
                    gradient: 'from-red-500/35 via-rose-500/15 to-transparent',
                    glow: 'rgba(239, 68, 68, 0.45)',
                    icon: Icons.AlertCircle || Icons.AlertTriangle,
                    defaultText: item.text || 'Something went wrong'
                };
            case 'info':
            default:
                return {
                    title: item.title || 'LEGACY SYSTEM',
                    accent: item.accent || '#D4AF37',
                    gradient: 'from-[#D4AF37]/30 via-amber-500/10 to-transparent',
                    glow: 'rgba(212, 175, 55, 0.35)',
                    icon: Icons.Bell,
                    defaultText: item.text || 'Notification received'
                };
        }
    };

    const meta = getNotificationMeta(activeNotification);
    const IconComponent = meta.icon;
    const isClickable = Boolean(activeNotification.onClick || activeNotification.action || onNavigate);

    const handleClick = (e) => {
        if (e.target.closest('[data-island-close]')) return;
        if (activeNotification.onClick) {
            activeNotification.onClick(activeNotification);
        } else if (activeNotification.action && onNavigate) {
            onNavigate(activeNotification.action);
        }
        if (onDismiss) onDismiss(activeNotification.id);
    };

    return (
        <div className="fixed top-2 sm:top-4 left-0 right-0 z-[99999] pointer-events-none flex flex-col items-center justify-start px-3 select-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeNotification.id}
                    layout
                    initial={{
                        y: -50,
                        scale: 0.7,
                        opacity: 0,
                        filter: 'blur(8px)',
                    }}
                    animate={{
                        y: 0,
                        scale: 1,
                        opacity: 1,
                        filter: 'blur(0px)',
                        transition: {
                            type: 'spring',
                            stiffness: 450,
                            damping: 28,
                            mass: 0.8,
                        }
                    }}
                    exit={{
                        y: -40,
                        scale: 0.75,
                        opacity: 0,
                        filter: 'blur(6px)',
                        transition: {
                            type: 'spring',
                            stiffness: 450,
                            damping: 35,
                            duration: 0.22,
                        }
                    }}
                    drag="y"
                    dragConstraints={{ top: -60, bottom: 0 }}
                    dragElastic={0.25}
                    onDragEnd={(_, info) => {
                        if (info.offset.y < -20 || info.velocity.y < -150) {
                            if (onDismiss) onDismiss(activeNotification.id);
                        }
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={handleClick}
                    className={`pointer-events-auto relative max-w-[420px] w-full group overflow-hidden rounded-[26px] sm:rounded-[28px] border transition-all duration-300 ${
                        isClickable ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
                    }`}
                    style={{
                        background: 'rgba(5, 5, 8, 0.88)',
                        backdropFilter: 'blur(28px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
                        borderColor: 'rgba(255, 255, 255, 0.14)',
                        boxShadow: `0 16px 40px -10px rgba(0, 0, 0, 0.7), 0 0 28px -4px ${meta.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.15)`
                    }}
                >
                    {/* Ambient dynamic radial fluid glow */}
                    <div 
                        className={`absolute inset-0 bg-gradient-to-r ${meta.gradient} opacity-70 pointer-events-none transition-opacity duration-300`} 
                    />

                    {/* Subtle top glare reflection */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                    <div className="relative z-10 px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3">
                        {/* LEFT: Dynamic Island Leading Avatar / Symbol */}
                        <div className="relative shrink-0 flex items-center justify-center">
                            {activeNotification.avatar ? (
                                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/20 shadow-md">
                                    <img 
                                        src={activeNotification.avatar} 
                                        alt="" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    {/* Sub-badge icon */}
                                    <div 
                                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-black border border-black shadow-sm"
                                        style={{ backgroundColor: meta.accent }}
                                    >
                                        <IconComponent className="w-2.5 h-2.5" />
                                    </div>
                                </div>
                            ) : (
                                <motion.div 
                                    initial={{ scale: 0.6, rotate: -15 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-white border shadow-md relative"
                                    style={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.07)',
                                        borderColor: 'rgba(255, 255, 255, 0.15)',
                                        boxShadow: `0 0 16px ${meta.glow}`
                                    }}
                                >
                                    <IconComponent 
                                        className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-sm transition-transform group-hover:scale-110" 
                                        style={{ color: meta.accent }}
                                    />
                                </motion.div>
                            )}

                            {/* Live pulsing dot indicator */}
                            <span className="absolute -top-0.5 -left-0.5 flex h-2 w-2">
                                <span 
                                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                    style={{ backgroundColor: meta.accent }}
                                />
                                <span 
                                    className="relative inline-flex rounded-full h-2 w-2"
                                    style={{ backgroundColor: meta.accent }}
                                />
                            </span>
                        </div>

                        {/* CENTER: Body & Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span 
                                    className="text-[9px] sm:text-[9.5px] font-black uppercase tracking-[0.2em] truncate"
                                    style={{ color: meta.accent }}
                                >
                                    {meta.title}
                                </span>
                                <span className="text-white/30 text-[8px]">•</span>
                                <span className="text-white/45 text-[8.5px] font-bold uppercase tracking-wider">
                                    NOW
                                </span>
                            </div>

                            <p className="text-[12px] sm:text-[13px] font-bold text-white/95 leading-snug line-clamp-2 break-words">
                                {activeNotification.text || activeNotification.message || meta.defaultText}
                            </p>
                        </div>

                        {/* RIGHT: Quick Close / Trailing Action */}
                        <div className="shrink-0 flex items-center gap-1 pl-1">
                            {notifications.length > 1 && (
                                <span className="text-[9px] font-black text-white/40 px-1.5 py-0.5 rounded-full bg-white/10 border border-white/10">
                                    +{notifications.length - 1}
                                </span>
                            )}
                            <button
                                data-island-close="true"
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onDismiss) onDismiss(activeNotification.id);
                                }}
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer active:scale-90"
                                aria-label="Dismiss notification"
                            >
                                <Icons.X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Progress countdown bar (if duration exists) */}
                    {activeNotification.duration !== null && (
                        <div className="w-full h-[2px] bg-white/5 overflow-hidden">
                            <motion.div
                                initial={{ width: '100%' }}
                                animate={{ width: isHovered ? '100%' : '0%' }}
                                transition={{
                                    duration: isHovered ? 0 : (activeNotification.duration || 3800) / 1000,
                                    ease: 'linear'
                                }}
                                className="h-full"
                                style={{ backgroundColor: meta.accent }}
                            />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
