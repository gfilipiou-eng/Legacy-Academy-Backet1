import React, { memo, useMemo, useRef, useEffect } from 'react';
import { Icons } from './Icons';

const BottomNavbar = memo(({
    activeTab,
    onTabChange,
    alerts,
    user,
    onCreate,
    onProfile,
    ProfileAvatar,
}) => {
    const unreadCount = useMemo(
        () => (alerts || []).filter((n) => !n.read).length,
        [alerts]
    );
    const navRef = useRef(null);

    // React's synthetic onWheel is passive by default in modern browsers,
    // so preventDefault() is ignored. We attach a native non-passive listener instead.
    useEffect(() => {
        const el = navRef.current;
        if (!el) return;
        const blockWheel = (e) => e.preventDefault();
        el.addEventListener('wheel', blockWheel, { passive: false });
        return () => el.removeEventListener('wheel', blockWheel);
    }, []);

    const navItemBaseClass = 'relative h-[56px] sm:h-[62px] w-full max-w-[92px] sm:max-w-[108px] flex items-center justify-center rounded-[1.35rem] transition-all duration-300 ease-out overflow-hidden';
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'bottom-nav-item-active text-white' : 'bottom-nav-item text-white/52 hover:text-white/82'}`;
    const iconClass = (isActive) => `relative z-10 transition-all duration-300 w-7 h-7 sm:w-8 sm:h-8 ${isActive ? 'scale-105 drop-shadow-[0_0_10px_rgba(var(--gold-primary-rgb),0.35)]' : ''}`;

    return (
        <nav 
            ref={navRef}
            className="fixed bottom-[calc(26px+env(safe-area-inset-bottom))] left-0 right-0 z-[100] pointer-events-none px-2.5 sm:px-4"
            onTouchMove={(e) => e.preventDefault()}
        >
            <div className="bottom-nav-glass w-full max-w-[620px] mx-auto rounded-[2rem] sm:rounded-[2.25rem] pointer-events-auto px-2.5 sm:px-3 py-2.5 flex items-center justify-between relative gap-1.5 sm:gap-2.5">
                <button
                    type="button"
                    onClick={() => onTabChange('home')}
                    aria-label="Home"
                    className="flex items-center justify-center flex-1 min-w-0"
                >
                    <div className={navItemClass(activeTab === 'home')}>        
                        <Icons.Home className={iconClass(activeTab === 'home')} fill="none" strokeWidth={activeTab === 'home' ? '2.5' : '1.5'} shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('alerts')}
                    aria-label="Alerts"
                    className="flex items-center justify-center relative flex-1 min-w-0"
                >
                    <div className={navItemClass(activeTab === 'alerts')}>      
                        <Icons.Bell className={iconClass(activeTab === 'alerts')} fill="none" strokeWidth={activeTab === 'alerts' ? '2.5' : '1.5'} shapeRendering="geometricPrecision" />
                    </div>
                    {unreadCount > 0 && (
                        <div className="absolute top-1 right-[16%] sm:right-[18%] min-w-[19px] h-[19px] px-1 bg-red-500 rounded-full flex items-center justify-center border border-white/70 shadow-[0_8px_18px_rgba(239,68,68,0.35)] z-20">
                            <span className="text-[10px] font-black text-white leading-none tracking-tighter">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </div>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onCreate}
                    aria-label="Create"
                    className="flex items-center justify-center relative z-20 px-1"
                >
                    <div className="bottom-nav-create w-[62px] h-[62px] sm:w-[70px] sm:h-[70px] flex items-center justify-center rounded-full text-black hover:scale-105 active:scale-95 transition-all duration-300">
                        <Icons.Plus className="w-8 h-8 sm:w-9 sm:h-9 font-black stroke-[3.2]" shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('search')}
                    aria-label="Search"
                    className="flex items-center justify-center flex-1 min-w-0"
                >
                    <div className={navItemClass(activeTab === 'search')}>      
                        <Icons.Search className={iconClass(activeTab === 'search')} fill="none" strokeWidth={activeTab === 'search' ? '2.5' : '1.5'} shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={onProfile}
                    aria-label="Profile"
                    className="flex items-center justify-center flex-1 min-w-0"
                >
                    <div className={navItemClass(activeTab === 'profile')}>     
                        <div className={`relative z-10 overflow-hidden bg-black transition-all duration-300 w-9 h-9 sm:w-10 sm:h-10 rounded-full ${activeTab === 'profile' ? 'profile-nav-avatar-active' : 'profile-nav-avatar'}`}>
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
