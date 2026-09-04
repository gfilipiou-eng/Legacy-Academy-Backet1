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
            // Futuristic Tap
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.02);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.05);
        } else if (type === 'notification') {
            // Futuristic Notification Double Chirp
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            
            gain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
            
            // Add a sine pad under it
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(600, ctx.currentTime);
            gain2.gain.setValueAtTime(0, ctx.currentTime);
            gain2.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.4);
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
    onOpenBubbles,
}) => {
    const unreadCount = useMemo(
        () => (alerts || []).filter((n) => !n.read).length,
        [alerts]
    );
    const navRef = useRef(null);

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const touchStartY = useRef(0);
    const touchEndY = useRef(0);
    const minSwipeDistance = 40; // minimum distance in px to trigger swipe

    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchEndX.current = e.targetTouches[0].clientX;
        if (e.type === 'touchstart') {
            touchStartY.current = e.targetTouches[0].clientY;
            touchEndY.current = e.targetTouches[0].clientY;
        } else {
            touchEndY.current = e.targetTouches[0].clientY;
        }
    };

    const handleTouchMove = (e) => {
        // removed preventDefault to allow vertical scroll
        touchEndX.current = e.targetTouches[0].clientX;
        if (e.type === 'touchstart') {
            touchStartY.current = e.targetTouches[0].clientY;
            touchEndY.current = e.targetTouches[0].clientY;
        } else {
            touchEndY.current = e.targetTouches[0].clientY;
        }
    };

    const handleTouchEnd = () => {
        const distance = touchStartX.current - touchEndX.current;
        const yDistance = Math.abs(touchStartY.current - touchEndY.current);
        if (yDistance > 30) return;
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

    const navItemBaseClass = 'relative h-[48px] sm:h-[52px] w-full max-w-[80px] sm:max-w-[92px] flex items-center justify-center rounded-2xl overflow-hidden transition-all duration-200 select-none cursor-pointer';
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'text-[var(--gold-primary,#1D9BF0)] bg-[var(--app-hover)]' : 'text-[var(--app-secondary,#71767b)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover)]'}`;
    const iconClass = (isActive) => `relative z-10 transition-transform duration-200 w-6 h-6 sm:w-[26px] sm:h-[26px] ${isActive ? 'scale-105 text-[var(--gold-primary,#1D9BF0)]' : 'text-[var(--app-secondary,#71767b)] group-hover:text-[var(--app-text)]'}`;

    return (
        <nav 
            ref={navRef}
            className="fixed bottom-0 pb-[calc(20px+env(safe-area-inset-bottom))] sm:pb-[calc(28px+env(safe-area-inset-bottom))] left-0 right-0 z-[100] pointer-events-none px-3 sm:px-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className="bottom-nav-glass w-full max-w-[540px] mx-auto rounded-full pointer-events-auto px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between relative gap-1 sm:gap-2">
                
                {/* Tab: Home */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onTabChange('home'); }}
                    aria-label="Home"
                    className="flex items-center justify-center flex-1 min-w-0 group active:scale-95 transition-transform duration-150"
                >
                    <div className={navItemClass(activeTab === 'home')}>
                        <Icons.Home className={iconClass(activeTab === 'home')} fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'home' ? '2.5' : '2.2'} shapeRendering="geometricPrecision" />
                    </div>
                </button>

                {/* Tab: Search */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onTabChange('search'); }}
                    aria-label="Search"
                    className="flex items-center justify-center flex-1 min-w-0 group active:scale-95 transition-transform duration-150"
                >
                    <div className={navItemClass(activeTab === 'search')}>
                        <Icons.Search className={iconClass(activeTab === 'search')} fill="none" stroke="currentColor" strokeWidth={activeTab === 'search' ? '2.8' : '2.2'} shapeRendering="geometricPrecision" />
                    </div>
                </button>

                {/* Tab: Create */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onCreate(); }}
                    aria-label="Create"
                    className="flex items-center justify-center relative z-20 flex-1 min-w-0 group cursor-pointer"
                >
                    <div 
                        className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-black hover:scale-105 active:scale-95 transition-all duration-200 shadow-md ring-2 ring-[var(--app-bg)]"
                        style={{ background: 'linear-gradient(135deg, var(--gold-primary, #1D9BF0), var(--gold-secondary, #1a8cd8))' }}
                    >
                        <Icons.Plus className="w-6 h-6 sm:w-6 sm:h-6 stroke-[3] text-black" stroke="currentColor" shapeRendering="geometricPrecision" />
                    </div>
                </button>

                {/* Tab: Alerts */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onTabChange('alerts'); }}
                    aria-label="Alerts"
                    className="flex items-center justify-center relative flex-1 min-w-0 group active:scale-95 transition-transform duration-150"
                >
                    <div className={navItemClass(activeTab === 'alerts')}>
                        <Icons.Bell className={iconClass(activeTab === 'alerts')} fill={activeTab === 'alerts' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'alerts' ? '2.5' : '2.2'} shapeRendering="geometricPrecision" />
                        {unreadCount > 0 && (
                            <div className="absolute top-[8px] right-[20%] sm:right-[24%] min-w-[17px] h-[17px] px-1 bg-[#F91880] rounded-full flex items-center justify-center border border-[var(--app-bg)] shadow-sm z-20">
                                <span className="text-[9px] font-extrabold text-white leading-none">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </div>
                        )}
                    </div>
                </button>

                {/* Tab: Profile */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onProfile(); }}
                    aria-label="Profile"
                    className="flex items-center justify-center flex-1 min-w-0 group active:scale-95 transition-transform duration-150"
                >
                    <div className={navItemClass(isProfileActive)}>
                        <div className={`relative z-10 overflow-hidden bg-neutral-800 transition-all duration-200 w-7 h-7 sm:w-8 sm:h-8 rounded-full ${isProfileActive ? 'ring-2 ring-[var(--gold-primary,#1D9BF0)] ring-offset-2 ring-offset-[var(--app-bg)] scale-105' : 'border border-[var(--app-border)]'}`}>
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
