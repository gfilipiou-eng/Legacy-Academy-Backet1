import React, { memo, useMemo } from 'react';
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
    // Made the base buttons slightly taller and wider
    const navItemBaseClass = 'flex-1 max-w-[112px] sm:max-w-[120px] h-[76px] sm:h-[84px] flex items-center justify-center transition-all duration-400 ease-out';
    
    // Active state: Added a subtle inner glow/shadow and slightly more lift (-translate-y-4)
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'rounded-none -translate-y-4 sm:-translate-y-5 bg-white text-black shadow-[inset_0_-4px_10px_rgba(0,0,0,0.1),0_10px_20px_rgba(255,255,255,0.1)] will-change-transform scale-105' : 'bg-transparent text-white/50 hover:text-white/90 hover:-translate-y-1 will-change-transform'}`;
    
    // Significantly increased icon sizes
    const iconClass = (isActive) => isActive ? 'w-10 h-10 sm:w-11 sm:h-11 opacity-100 drop-shadow-md' : 'w-8 h-8 sm:w-9 sm:h-9 opacity-70 hover:opacity-100 transition-opacity';

    return (
        <nav className="fixed bottom-0 left-0 right-0 w-full z-[99] pointer-events-none bg-black">
            <div className="flex justify-center px-3 sm:px-4 pt-6 sm:pt-7 pb-[calc(12px+env(safe-area-inset-bottom))] bg-black">
                <div className="w-full bottom-nav-glass rounded-none px-2.5 sm:px-3 py-3 sm:py-3.5 pointer-events-auto flex items-center justify-between relative gap-2">
                <button
                    type="button"
                    onClick={() => onTabChange('home')}
                    className="flex flex-col items-center justify-center flex-1 group"
                >
                    <div className={navItemClass(activeTab === 'home')}>
                        <Icons.Home className={iconClass(activeTab === 'home')} fill={activeTab === 'home' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'home' ? '2.5' : '1.8'} />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('alerts')}
                    className="flex flex-col items-center justify-center relative flex-1 group"
                >
                    <div className={navItemClass(activeTab === 'alerts')}>
                        <Icons.Bell className={iconClass(activeTab === 'alerts')} fill={activeTab === 'alerts' ? 'currentColor' : 'none'} strokeWidth={activeTab === 'alerts' ? '2.5' : '1.8'} />
                    </div>
                    {unreadCount > 0 && (
                        <div className="absolute top-0 right-2 sm:right-3.5 min-w-[22px] h-[22px] bg-red-600 rounded-full flex items-center justify-center border-2 border-black shadow-[0_0_10px_rgba(220,38,38,0.6)] z-10 animate-pulse">
                            <span className="text-[11px] font-black text-white leading-none tracking-tighter">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </div>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onCreate}
                    className="flex flex-col items-center justify-center group"
                >
                    <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] flex items-center justify-center rounded-none -translate-y-4 sm:-translate-y-5 bg-white text-black will-change-transform shadow-[0_10px_30px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-all duration-400 ease-out">
                        <Icons.Plus className="w-11 h-11 sm:w-12 sm:h-12 font-black stroke-[3]" shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('search')}
                    className="flex flex-col items-center justify-center flex-1 group"
                >
                    <div className={navItemClass(activeTab === 'search')}>
                        <Icons.Search className={iconClass(activeTab === 'search')} fill="none" strokeWidth={activeTab === 'search' ? '3' : '1.8'} />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={onProfile}
                    className="flex flex-col items-center justify-center flex-1 group"
                >
                    <div className={navItemClass(activeTab === 'profile')}>
                        <div className={`overflow-hidden bg-black transition-all duration-400 ${activeTab === 'profile' ? 'w-11 h-11 sm:w-12 sm:h-12 rounded-none border border-black/20 drop-shadow-md' : 'w-9 h-9 sm:w-10 sm:h-10 rounded-none border border-white/30 shadow-none group-hover:border-white/60'}`}>
                            <ProfileAvatar user={user} className="w-full h-full object-cover" priority />
                        </div>
                    </div>
                </button>
                </div>
            </div>
        </nav>
    );
});

BottomNavbar.displayName = 'BottomNavbar';

export default BottomNavbar;
