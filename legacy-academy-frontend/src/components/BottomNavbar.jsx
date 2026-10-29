import React, { memo, useMemo, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { motion } from 'framer-motion';

const playCyberSFX = () => {}; // Sound effects disabled

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
    const minSwipeDistance = 45;

    const handleTouchStart = (e) => {
        if (!e.targetTouches || e.targetTouches.length === 0) return;
        touchStartX.current = e.targetTouches[0].clientX;
        touchEndX.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
        touchEndY.current = e.targetTouches[0].clientY;
    };

    const handleTouchMove = (e) => {
        if (!e.targetTouches || e.targetTouches.length === 0) return;
        touchEndX.current = e.targetTouches[0].clientX;
        touchEndY.current = e.targetTouches[0].clientY;
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

    const navItemBaseClass = 'relative h-[48px] xs:h-[50px] sm:h-[52px] w-full max-w-[72px] sm:max-w-[88px] flex items-center justify-center rounded-2xl overflow-hidden transition-all duration-200 select-none cursor-pointer';
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'text-[var(--gold-primary,#1D9BF0)] bg-[var(--app-hover,rgba(255,255,255,0.08))] shadow-sm' : 'text-[var(--app-secondary,#71767b)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover,rgba(255,255,255,0.04))]'}`;
    const iconClass = (isActive) => `relative z-10 transition-transform duration-200 w-[26px] h-[26px] xs:w-7 xs:h-7 sm:w-[28px] sm:h-[28px] ${isActive ? 'scale-105 text-[var(--gold-primary,#1D9BF0)]' : 'text-[var(--app-secondary,#71767b)] group-hover:text-[var(--app-text)]'}`;

    return (
        <nav 
            ref={navRef}
            className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none px-2 xs:px-3 sm:px-4 pb-[max(8px,env(safe-area-inset-bottom,8px))] sm:pb-6 transition-all duration-300"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            aria-label="Bottom Navigation"
        >
            <div className="bottom-nav-glass w-full max-w-[480px] mx-auto rounded-full pointer-events-auto px-1.5 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 flex items-center justify-between relative gap-0.5 xs:gap-1 sm:gap-2">
                
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
                    aria-label="Create post"
                    className="flex items-center justify-center relative z-20 flex-1 min-w-0 group cursor-pointer"
                >
                    <div 
                        className="w-11 h-11 xs:w-12 xs:h-12 flex items-center justify-center rounded-full text-black hover:scale-105 active:scale-95 transition-all duration-200 shadow-md ring-2 ring-[var(--app-bg,#000000)]"
                        style={{ background: 'linear-gradient(135deg, var(--gold-primary, #1D9BF0), var(--gold-secondary, #1a8cd8))' }}
                    >
                        <Icons.Plus className="w-6 h-6 xs:w-7 xs:h-7 stroke-[3] text-black" stroke="currentColor" shapeRendering="geometricPrecision" />
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
                            <div className="absolute top-[4px] xs:top-[6px] right-[14%] sm:right-[20%] min-w-[18px] h-[18px] px-1 bg-[#F91880] rounded-full flex items-center justify-center border border-[var(--app-bg,#000000)] shadow-sm z-20">
                                <span className="text-[10px] font-extrabold text-white leading-none">
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
                        <div className={`relative z-10 overflow-hidden bg-neutral-900 transition-all duration-200 w-8 h-8 xs:w-9 xs:h-9 sm:w-[36px] sm:h-[36px] rounded-full ${isProfileActive ? 'ring-2 ring-[var(--gold-primary,#1D9BF0)] ring-offset-2 ring-offset-[var(--app-bg,#000000)] scale-105' : 'border border-[var(--app-border,#2f3336)]'}`}>
                            {ProfileAvatar ? (
                                <ProfileAvatar user={user} className="w-full h-full object-cover" priority cacheKey={user?.updatedAt || user?._id} />
                            ) : (
                                <Icons.User className="w-full h-full p-1 text-white/80" />
                            )}
                        </div>
                    </div>
                </button>
            </div>
        </nav>
    );
});

BottomNavbar.displayName = 'BottomNavbar';

export default BottomNavbar;
