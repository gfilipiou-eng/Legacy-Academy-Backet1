import React, { memo, useMemo, useRef, useEffect, useState } from 'react';
import { Icons } from './Icons';

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
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

    // Mobile scroll-lock & keyboard visibility tracking to prevent navbar from floating or leaving black gaps
    useEffect(() => {
        const resetWindowScroll = () => {
            if (window.scrollY !== 0 || document.documentElement.scrollTop !== 0 || document.body.scrollTop !== 0) {
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            }
        };

        const checkKeyboard = () => {
            resetWindowScroll();
            if (window.visualViewport) {
                const isKb = (window.innerHeight - window.visualViewport.height) > 130;
                setIsKeyboardVisible(isKb);
            }
        };

        const handleFocusIn = (e) => {
            const tag = e.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) {
                setIsKeyboardVisible(true);
            }
        };

        const handleFocusOut = () => {
            setTimeout(() => {
                resetWindowScroll();
                const activeTag = document.activeElement?.tagName;
                if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
                    return;
                }
                if (window.visualViewport) {
                    const isKb = (window.innerHeight - window.visualViewport.height) > 130;
                    setIsKeyboardVisible(isKb);
                } else {
                    setIsKeyboardVisible(false);
                }
            }, 100);
        };

        window.addEventListener('scroll', resetWindowScroll, { passive: true });
        window.addEventListener('focusin', handleFocusIn, { passive: true });
        window.addEventListener('focusout', handleFocusOut, { passive: true });
        window.addEventListener('orientationchange', resetWindowScroll, { passive: true });

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', checkKeyboard);
            window.visualViewport.addEventListener('scroll', resetWindowScroll);
        }

        const el = navRef.current;
        if (el) {
            const blockWheel = (e) => e.preventDefault();
            el.addEventListener('wheel', blockWheel, { passive: false });
        }

        return () => {
            window.removeEventListener('scroll', resetWindowScroll);
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
            window.removeEventListener('orientationchange', resetWindowScroll);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', checkKeyboard);
                window.visualViewport.removeEventListener('scroll', resetWindowScroll);
            }
        };
    }, []);

    const navItemBaseClass = 'relative h-[48px] xs:h-[50px] sm:h-[52px] w-full max-w-[72px] sm:max-w-[88px] flex flex-col items-center justify-center rounded-2xl overflow-hidden select-none cursor-pointer active:scale-95 transition-all duration-150';
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'text-[var(--gold-primary,#1D9BF0)] bg-[var(--gold-primary,#1D9BF0)]/[0.12] border border-[var(--gold-primary,#1D9BF0)]/25 shadow-sm' : 'text-white/65 hover:text-white hover:bg-white/[0.05] border border-transparent'}`;
    const iconClass = (isActive) => `relative z-10 transition-transform duration-200 w-[24px] h-[24px] xs:w-[26px] xs:h-[26px] sm:w-[27px] sm:h-[27px] ${isActive ? 'scale-105 text-[var(--gold-primary,#1D9BF0)]' : 'text-white/65 group-hover:text-white'}`;

    return (
        <nav 
            ref={navRef}
            className={`fixed bottom-0 left-0 right-0 z-[100] pointer-events-none px-2 xs:px-3 sm:px-4 pb-[max(6px,env(safe-area-inset-bottom,6px))] sm:pb-5 transition-transform transition-opacity duration-200 ${
                isKeyboardVisible ? 'translate-y-28 opacity-0' : 'translate-y-0 opacity-100'
            }`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            aria-label="Bottom Navigation"
        >
            {/* Ambient soft glow beneath the floating pill for seamless transition on mobile */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/25 to-transparent -z-10" />

            <div className="bottom-nav-glass w-full max-w-[480px] mx-auto rounded-full pointer-events-auto px-1.5 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 flex items-center justify-between relative gap-0.5 xs:gap-1 sm:gap-2">
                
                {/* Tab: Home */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onTabChange('home'); }}
                    aria-label="Home"
                    className="flex items-center justify-center flex-1 min-w-0 group"
                >
                    <div className={navItemClass(activeTab === 'home')}>
                        <Icons.Home className={iconClass(activeTab === 'home')} fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'home' ? '2.5' : '2.2'} shapeRendering="geometricPrecision" />
                        {activeTab === 'home' && (
                            <span className="w-1 h-1 rounded-full bg-[var(--gold-primary,#1D9BF0)] mt-0.5 shadow-[0_0_6px_var(--gold-primary,#1D9BF0)]" />
                        )}
                    </div>
                </button>

                {/* Tab: Search */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onTabChange('search'); }}
                    aria-label="Search"
                    className="flex items-center justify-center flex-1 min-w-0 group"
                >
                    <div className={navItemClass(activeTab === 'search')}>
                        <Icons.Search className={iconClass(activeTab === 'search')} fill="none" stroke="currentColor" strokeWidth={activeTab === 'search' ? '2.8' : '2.2'} shapeRendering="geometricPrecision" />
                        {activeTab === 'search' && (
                            <span className="w-1 h-1 rounded-full bg-[var(--gold-primary,#1D9BF0)] mt-0.5 shadow-[0_0_6px_var(--gold-primary,#1D9BF0)]" />
                        )}
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
                        className="w-11 h-11 xs:w-12 xs:h-12 flex items-center justify-center rounded-full text-black hover:scale-105 active:scale-90 transition-all duration-150 shadow-[0_2px_14px_rgba(29,155,240,0.4)] ring-2 ring-black/70"
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
                    className="flex items-center justify-center relative flex-1 min-w-0 group"
                >
                    <div className={navItemClass(activeTab === 'alerts')}>
                        <Icons.Bell className={iconClass(activeTab === 'alerts')} fill={activeTab === 'alerts' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={activeTab === 'alerts' ? '2.5' : '2.2'} shapeRendering="geometricPrecision" />
                        {unreadCount > 0 && (
                            <div className="absolute top-[3px] xs:top-[5px] right-[14%] sm:right-[20%] min-w-[18px] h-[18px] px-1 bg-[#F91880] rounded-full flex items-center justify-center border border-black/80 shadow-sm z-20">
                                <span className="text-[10px] font-black text-white leading-none">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </div>
                        )}
                        {activeTab === 'alerts' && (
                            <span className="w-1 h-1 rounded-full bg-[var(--gold-primary,#1D9BF0)] mt-0.5 shadow-[0_0_6px_var(--gold-primary,#1D9BF0)]" />
                        )}
                    </div>
                </button>

                {/* Tab: Profile */}
                <button
                    type="button"
                    onClick={() => { playCyberSFX('menu'); onProfile(); }}
                    aria-label="Profile"
                    className="flex items-center justify-center flex-1 min-w-0 group"
                >
                    <div className={navItemClass(isProfileActive)}>
                        <div className={`relative z-10 overflow-hidden bg-neutral-900 transition-all duration-200 w-7 h-7 xs:w-8 xs:h-8 sm:w-[34px] sm:h-[34px] rounded-full ${isProfileActive ? 'ring-2 ring-[var(--gold-primary,#1D9BF0)] ring-offset-2 ring-offset-black scale-105 shadow-[0_0_10px_var(--gold-primary,#1D9BF0)]' : 'border border-white/20'}`}>
                            {ProfileAvatar ? (
                                <ProfileAvatar user={user} className="w-full h-full object-cover" priority cacheKey={user?.updatedAt || user?._id} />
                            ) : (
                                <Icons.User className="w-full h-full p-1 text-white/80" />
                            )}
                        </div>
                        {isProfileActive && (
                            <span className="w-1 h-1 rounded-full bg-[var(--gold-primary,#1D9BF0)] mt-0.5 shadow-[0_0_6px_var(--gold-primary,#1D9BF0)]" />
                        )}
                    </div>
                </button>
            </div>
        </nav>
    );
});

BottomNavbar.displayName = 'BottomNavbar';

export default BottomNavbar;
