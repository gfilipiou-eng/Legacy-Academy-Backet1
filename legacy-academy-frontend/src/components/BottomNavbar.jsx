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
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'bottom-nav-item-active text-[#1D9BF0]' : 'bottom-nav-item text-gray-500 hover:text-[#1D9BF0]/70'}`;
    const iconClass = (isActive) => `relative z-10 transition-all duration-300 w-7 h-7 sm:w-8 sm:h-8 ${isActive ? 'scale-105 drop-shadow-[0_4px_12px_rgba(29,155,240,0.4)]' : ''}`;

    return (
        <nav 
            ref={navRef}
            className="fixed bottom-[calc(26px+env(safe-area-inset-bottom))] left-0 right-0 z-[100] pointer-events-none px-2.5 sm:px-4"
            onTouchMove={(e) => e.preventDefault()}
        >
            <div className="bottom-nav-glass w-full max-w-[620px] mx-auto rounded-full pointer-events-auto px-2.5 sm:px-4 py-2 flex items-center justify-between relative gap-1.5 sm:gap-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-white/10 bg-black/80 backdrop-blur-xl">
                <button
                    type="button"
                    onClick={() => onTabChange('home')}
                    aria-label="Home"
                    className="flex items-center justify-center flex-1 min-w-0 group"
                >
                    <div className={navItemClass(activeTab === 'home')}>        
                        <Icons.Home className={iconClass(activeTab === 'home')} fill={activeTab === 'home' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'home' ? '2.5' : '2'} shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('search')}
                    aria-label="Search"
                    className="flex items-center justify-center flex-1 min-w-0 group"
                >
                    <div className={navItemClass(activeTab === 'search')}>      
                        <Icons.Search className={iconClass(activeTab === 'search')} fill={activeTab === 'search' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'search' ? '2.5' : '2'} shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={onCreate}
                    aria-label="Create"
                    className="flex items-center justify-center relative z-20 flex-1 min-w-0 group"
                >
                    <div className="w-[42px] h-[42px] sm:w-[48px] sm:h-[48px] bg-[#1D9BF0] flex items-center justify-center rounded-full text-white shadow-[0_4px_12px_rgba(29,155,240,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 ring-2 ring-black">
                        <Icons.Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('alerts')}
                    aria-label="Alerts"
                    className="flex items-center justify-center relative flex-1 min-w-0 group"
                >
                    <div className={navItemClass(activeTab === 'alerts')}>      
                        <Icons.Bell className={iconClass(activeTab === 'alerts')} fill={activeTab === 'alerts' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'alerts' ? '2.5' : '2'} shapeRendering="geometricPrecision" />
                    </div>
                    {unreadCount > 0 && (
                        <div className="absolute top-2 right-[20%] sm:right-[25%] min-w-[18px] h-[18px] px-1 bg-[#1D9BF0] rounded-full flex items-center justify-center border-2 border-black shadow-[0_0_10px_rgba(29,155,240,0.5)] z-20">
                            <span className="text-[9px] font-black text-white leading-none tracking-tighter">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </div>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onProfile}
                    aria-label="Profile"
                    className="flex items-center justify-center flex-1 min-w-0 group"
                >
                    <div className={navItemClass(activeTab === 'profile')}>     
                        <div className={`relative z-10 overflow-hidden bg-black transition-all duration-300 w-8 h-8 sm:w-9 sm:h-9 rounded-full ${activeTab === 'profile' ? 'ring-2 ring-[#1D9BF0] ring-offset-2 ring-offset-black scale-105' : 'ring-1 ring-white/20'}`}>
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

