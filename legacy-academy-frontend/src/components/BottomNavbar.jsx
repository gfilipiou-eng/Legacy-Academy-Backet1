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

    useEffect(() => {
        const el = navRef.current;
        if (!el) return;
        const blockWheel = (e) => e.preventDefault();
        el.addEventListener('wheel', blockWheel, { passive: false });
        return () => el.removeEventListener('wheel', blockWheel);
    }, []);

    const navItemBaseClass = 'relative h-[64px] sm:h-[66px] w-full max-w-[104px] sm:max-w-[116px] flex items-center justify-center rounded-[1.35rem] transition-all duration-300 ease-out overflow-hidden';
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'bottom-nav-item-active text-[#1D9BF0]' : 'bottom-nav-item text-gray-500 hover:text-[#1D9BF0]/70'}`;
    const iconClass = (isActive) => `relative z-10 transition-all duration-300 w-8 h-8 sm:w-9 sm:h-9 ${isActive ? 'scale-105' : ''}`;

    return (
        <nav 
            ref={navRef}
            className="fixed bottom-[calc(158px-7rem+env(safe-area-inset-bottom))] left-0 right-0 z-[100] pointer-events-none px-2 sm:px-4"
            onTouchMove={(e) => e.preventDefault()}
        >
            <div className="bottom-nav-glass w-full max-w-[680px] mx-auto rounded-full pointer-events-auto px-3 sm:px-4 py-2.5 flex items-center justify-between relative gap-2 sm:gap-2.5 border border-white/10 bg-black/85 backdrop-blur-xl">
                <button
                    type="button"
                    onClick={() => onTabChange('home')}
                    aria-label="Home"
                    className="flex items-center justify-center flex-1 min-w-0 group active:scale-95 transition-transform duration-200"
                >
                    <div className={navItemClass(activeTab === 'home')}>        
                        <Icons.Home className={iconClass(activeTab === 'home')} fill={activeTab === 'home' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'home' ? '2.5' : '2'} shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('search')}
                    aria-label="Search"
                    className="flex items-center justify-center flex-1 min-w-0 group active:scale-95 transition-transform duration-200"
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
                    <div className="w-[50px] h-[50px] sm:w-[52px] sm:h-[52px] bg-[#1D9BF0] flex items-center justify-center rounded-full text-white hover:scale-105 active:scale-95 transition-all duration-300 ring-2 ring-black">
                        <Icons.Plus className="w-7 h-7 sm:w-7 sm:h-7 stroke-[3]" shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('alerts')}
                    aria-label="Alerts"
                    className="flex items-center justify-center relative flex-1 min-w-0 group active:scale-95 transition-transform duration-200"
                >
                    <div className={navItemClass(activeTab === 'alerts')}>      
                        <Icons.Bell className={iconClass(activeTab === 'alerts')} fill={activeTab === 'alerts' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'alerts' ? '2.5' : '2'} shapeRendering="geometricPrecision" />
                    </div>
                    {unreadCount > 0 && (
                        <div className="absolute top-1.5 right-[18%] sm:right-[22%] min-w-[20px] h-[20px] px-1 bg-[#1D9BF0] rounded-full flex items-center justify-center border-2 border-black z-20">
                            <span className="text-[10px] font-black text-white leading-none tracking-tighter">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </div>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onProfile}
                    aria-label="Profile"
                    className="flex items-center justify-center flex-1 min-w-0 group active:scale-95 transition-transform duration-200"
                >
                    <div className={navItemClass(activeTab === 'profile')}>     
                        <div className={`relative z-10 overflow-hidden bg-black transition-all duration-300 w-9 h-9 sm:w-10 sm:h-10 rounded-full ${activeTab === 'profile' ? 'ring-2 ring-[#1D9BF0] ring-offset-2 ring-offset-black scale-105' : 'ring-1 ring-white/20'}`}>
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
