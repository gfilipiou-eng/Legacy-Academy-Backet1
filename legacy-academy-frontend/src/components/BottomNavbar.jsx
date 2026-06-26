import React, { memo, useMemo, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { motion } from 'framer-motion';

let globalAudioCtx = null;

const playCyberSFX = (type = 'click') => {
    if (localStorage.getItem('cyberSFX') === 'false') return;
    try {
        if (!globalAudioCtx) {
            globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (globalAudioCtx.state === 'suspended') {
            globalAudioCtx.resume();
        }
        const ctx = globalAudioCtx;
        
        if (type === 'click' || type === 'menu') {
            // Cyber liquid glass sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            
            // Watery / Liquid base
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
            
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
            
            // Glassy cyber ping overlay
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(2500, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(3500, ctx.currentTime + 0.03);
            
            gain2.gain.setValueAtTime(0, ctx.currentTime);
            gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            
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

const BottomNavbar = memo(({
    activeTab,
    onTabChange,
    alerts,
    user,
    onCreate,
    onProfile,
    ProfileAvatar,
    isProfileActive = false,
}) => {
    const unreadCount = useMemo(
        () => (alerts || []).filter((n) => !n.read).length,
        [alerts]
    );
    const navRef = useRef(null);

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const minSwipeDistance = 40; // minimum distance in px to trigger swipe

    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e) => {
        if (e.cancelable) e.preventDefault();
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        const tabs = ['home', 'search', 'alerts', 'profile'];
        const currentIndex = tabs.indexOf(activeTab);

        if (currentIndex !== -1) {
            if (isLeftSwipe && currentIndex < tabs.length - 1) {
                playCyberSFX('menu');
                onTabChange(tabs[currentIndex + 1]);
            } else if (isRightSwipe && currentIndex > 0) {
                playCyberSFX('menu');
                onTabChange(tabs[currentIndex - 1]);
            }
        }
    };

    useEffect(() => {
        const el = navRef.current;
        if (!el) return;
        const blockWheel = (e) => e.preventDefault();
        el.addEventListener('wheel', blockWheel, { passive: false });
        return () => el.removeEventListener('wheel', blockWheel);
    }, []);

    const navItemBaseClass = 'relative h-[64px] sm:h-[66px] w-full max-w-[104px] sm:max-w-[116px] flex items-center justify-center rounded-[1.35rem] overflow-hidden transition-colors duration-300';
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'text-[#1D9BF0]' : 'text-gray-500 hover:text-[#1D9BF0]/70'}`;
    const iconClass = (isActive) => `relative z-10 transition-all duration-300 w-8 h-8 sm:w-9 sm:h-9 ${isActive ? 'scale-105' : ''}`;

    return (
        <nav 
            ref={navRef}
            className="fixed bottom-[calc(158px-7rem+env(safe-area-inset-bottom))] left-0 right-0 z-[100] pointer-events-none px-2 sm:px-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className="bottom-nav-glass w-full max-w-[680px] mx-auto rounded-full pointer-events-auto px-3 sm:px-4 py-2.5 flex items-center justify-between relative gap-2 sm:gap-2.5">
                
                {/* Tab: Home */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onTabChange('home'); }}
                    aria-label="Home"
                    className="flex items-center justify-center flex-1 min-w-0 group active:scale-95 transition-transform duration-200"
                >
                    <div className={navItemClass(activeTab === 'home')}>
                        {activeTab === 'home' && (
                            <motion.div 
                                key="navActive-home"
                                layoutId="navActive-home"
                                className="absolute inset-0 bottom-nav-item-active pointer-events-none"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                            />
                        )}
                        <Icons.Home className={iconClass(activeTab === 'home')} fill={activeTab === 'home' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'home' ? '2.5' : '2'} shapeRendering="geometricPrecision" />
                    </div>
                </button>

                {/* Tab: Search */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onTabChange('search'); }}
                    aria-label="Search"
                    className="flex items-center justify-center flex-1 min-w-0 group active:scale-95 transition-transform duration-200"
                >
                    <div className={navItemClass(activeTab === 'search')}>
                        {activeTab === 'search' && (
                            <motion.div 
                                key="navActive-search"
                                layoutId="navActive-search"
                                className="absolute inset-0 bottom-nav-item-active pointer-events-none"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                            />
                        )}
                        <Icons.Search className={iconClass(activeTab === 'search')} fill={activeTab === 'search' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'search' ? '2.5' : '2'} shapeRendering="geometricPrecision" />
                    </div>
                </button>

                {/* Tab: Create */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onCreate(); }}
                    aria-label="Create"
                    className="flex items-center justify-center relative z-20 flex-1 min-w-0 group"
                >
                    <div className="w-[50px] h-[50px] sm:w-[52px] sm:h-[52px] bg-[#1D9BF0] flex items-center justify-center rounded-full text-white hover:scale-105 active:scale-95 transition-all duration-300 ring-2 ring-black">
                        <Icons.Plus className="w-7 h-7 sm:w-7 sm:h-7 stroke-[3]" shapeRendering="geometricPrecision" />
                    </div>
                </button>

                {/* Tab: Alerts */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onTabChange('alerts'); }}
                    aria-label="Alerts"
                    className="flex items-center justify-center relative flex-1 min-w-0 group active:scale-95 transition-transform duration-200"
                >
                    <div className={navItemClass(activeTab === 'alerts')}>
                        {activeTab === 'alerts' && (
                            <motion.div 
                                key="navActive-alerts"
                                layoutId="navActive-alerts"
                                className="absolute inset-0 bottom-nav-item-active pointer-events-none"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                            />
                        )}
                        <Icons.Bell className={iconClass(activeTab === 'alerts')} fill={activeTab === 'alerts' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'alerts' ? '2.5' : '2'} shapeRendering="geometricPrecision" />
                        {unreadCount > 0 && (
                            <div className="absolute top-[12px] right-[24%] sm:right-[28%] min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center border border-black/40 shadow-[0_0_8px_rgba(239,68,68,0.5)] z-20">
                                <span className="text-[9px] font-black text-white leading-none tracking-tighter">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                                <span className="absolute -inset-0.5 rounded-full bg-red-500/30 animate-ping pointer-events-none z-[-1]" />
                            </div>
                        )}
                    </div>
                </button>

                {/* Tab: Profile */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onProfile(); }}
                    aria-label="Profile"
                    className="flex items-center justify-center flex-1 min-w-0 group active:scale-95 transition-transform duration-200"
                >
                    <div className={navItemClass(isProfileActive)}>
                        {isProfileActive && (
                            <motion.div 
                                key="navActive-profile"
                                layoutId="navActive-profile"
                                className="absolute inset-0 bottom-nav-item-active pointer-events-none"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                            />
                        )}
                        <div className={`relative z-10 overflow-hidden bg-black transition-all duration-300 w-9 h-9 sm:w-10 sm:h-10 rounded-full ${isProfileActive ? 'ring-2 ring-[#1D9BF0] ring-offset-2 ring-offset-black scale-105' : 'ring-1 ring-white/20'}`}>
                            <ProfileAvatar user={user} className="w-full h-full object-cover" priority />
                        </div>
                    </div>
                </button>
            </div>
        </nav>
    );
});

BottomNavbar.displayName = 'BottomNavbar';

export default BottomNavbar;
