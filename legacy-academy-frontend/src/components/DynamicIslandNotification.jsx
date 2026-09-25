import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';

/**
 * Futuristic In-App Notification System
 * Clean, sharp glass aesthetic without glow effects.
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

    // Resolve color, icon, and title based on type - PURE FLAT COLORS
    const getNotificationMeta = (item) => {
        const type = item.type || 'info';
        
        switch (type) {
            case 'follow':
                return {
                    title: item.title || 'NEW FOLLOWER',
                    accent: item.accent || '#1D9BF0',
                    icon: Icons.Users || Icons.User,
                    defaultText: 'started following you'
                };
            case 'message':
            case 'whisper':
                return {
                    title: item.title || 'NEW MESSAGE',
                    accent: item.accent || '#00E5FF',
                    icon: Icons.MessageSquare || Icons.MessageCircle,
                    defaultText: 'sent you a private message'
                };
            case 'like':
                return {
                    title: item.title || 'LIKE',
                    accent: item.accent || '#F43F5E',
                    icon: Icons.Heart,
                    defaultText: 'liked your post'
                };
            case 'comment':
                return {
                    title: item.title || 'COMMENT',
                    accent: item.accent || '#A855F7',
                    icon: Icons.Comment,
                    defaultText: 'commented on your post'
                };
            case 'repost':
                return {
                    title: item.title || 'REPOST',
                    accent: item.accent || '#10B981',
                    icon: Icons.Repost || Icons.RefreshCcw || Icons.Zap,
                    defaultText: 'reposted your archive'
                };
            case 'streak':
                return {
                    title: item.title || 'STREAK',
                    accent: item.accent || '#F59E0B',
                    icon: Icons.Streak || Icons.Zap,
                    defaultText: 'Streak maintained!'
                };
            case 'success':
                return {
                    title: item.title || 'SUCCESS',
                    accent: item.accent || '#22C55E',
                    icon: Icons.Check || Icons.CheckCircle,
                    defaultText: item.text || 'Action completed successfully'
                };
            case 'error':
                return {
                    title: item.title || 'ALERT',
                    accent: item.accent || '#EF4444',
                    icon: Icons.AlertCircle || Icons.AlertTriangle,
                    defaultText: item.text || 'Something went wrong'
                };
            case 'info':
            default:
                return {
                    title: item.title || 'SYSTEM',
                    accent: item.accent || '#ffffff',
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
                        y: -40,
                        opacity: 0,
                    }}
                    animate={{
                        y: 0,
                        opacity: 1,
                        transition: {
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                            mass: 0.8,
                        }
                    }}
                    exit={{
                        y: -20,
                        opacity: 0,
                        transition: {
                            type: 'spring',
                            stiffness: 500,
                            damping: 35,
                            duration: 0.2,
                        }
                    }}
                    drag="y"
                    dragConstraints={{ top: -60, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_, info) => {
                        if (info.offset.y < -20 || info.velocity.y < -150) {
                            if (onDismiss) onDismiss(activeNotification.id);
                        }
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={handleClick}
                    className={`pointer-events-auto relative max-w-[400px] w-full group overflow-hidden transition-all duration-300 ${
                        isClickable ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'
                    }`}
                    style={{
                        background: '#0d0d0f',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderLeft: `4px solid ${meta.accent}`,
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
                    }}
                >
                    <div className="relative z-10 px-4 py-3 flex items-start gap-3.5">
                        {/* LEFT: Sharp Avatar / Icon (No glow) */}
                        <div className="relative shrink-0 mt-0.5">
                            {activeNotification.avatar ? (
                                <div className="relative w-10 h-10 rounded-[10px] overflow-hidden border border-white/10 bg-neutral-900">
                                    <img 
                                        src={activeNotification.avatar} 
                                        alt="" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            ) : (
                                <div 
                                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white border"
                                    style={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <IconComponent 
                                        className="w-5 h-5 transition-transform group-hover:scale-110" 
                                        style={{ color: meta.accent }}
                                    />
                                </div>
                            )}

                            {/* Solid status square instead of glowing dot */}
                            <div 
                                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-[4px] border-[2px] border-[#0d0d0f]"
                                style={{ backgroundColor: meta.accent }}
                            />
                        </div>

                        {/* CENTER: Body & Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                                <span 
                                    className="text-[10px] font-bold uppercase tracking-[0.15em] truncate"
                                    style={{ color: meta.accent }}
                                >
                                    {meta.title}
                                </span>
                                <span className="text-white/20 text-[10px]">/</span>
                                <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">
                                    NOW
                                </span>
                            </div>

                            <p className="text-[13px] font-medium text-white/90 leading-snug line-clamp-2 break-words">
                                {activeNotification.text || activeNotification.message || meta.defaultText}
                            </p>
                        </div>

                        {/* RIGHT: Quick Close */}
                        <div className="shrink-0 flex items-center gap-2 pl-1">
                            {notifications.length > 1 && (
                                <span className="text-[10px] font-bold text-white/50 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
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
                                className="w-7 h-7 rounded-[8px] bg-transparent hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
                                aria-label="Dismiss notification"
                            >
                                <Icons.X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Progress countdown bar */}
                    {activeNotification.duration !== null && (
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-transparent overflow-hidden">
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
