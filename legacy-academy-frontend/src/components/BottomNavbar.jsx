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
    const navItemBaseClass = 'flex-1 max-w-[108px] sm:max-w-[116px] h-[72px] sm:h-[80px] flex items-center justify-center transition-all duration-300';
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'rounded-[14px] sm:rounded-[16px] -translate-y-3 sm:-translate-y-4 bg-white text-black shadow-[0_10px_40px_rgba(255,255,255,0.15)]' : 'bg-transparent text-white/50 hover:text-white/90'}`;
    const iconClass = (isActive) => isActive ? 'w-9 h-9 sm:w-10 sm:h-10 opacity-100' : 'w-8 h-8 sm:w-9 sm:h-9 opacity-80';

    return (
        <nav className="fixed bottom-0 left-0 right-0 w-full z-[99] pointer-events-none bg-black">
            <div className="flex justify-center px-3 sm:px-4 pt-6 sm:pt-7 pb-[calc(10px+env(safe-area-inset-bottom))] bg-black">
                <div className="w-full bottom-nav-glass rounded-none px-2.5 sm:px-3 py-3 sm:py-3.5 pointer-events-auto flex items-end justify-between relative gap-2">
                <button
                    type="button"
                    onClick={() => onTabChange('home')}
                    className="flex flex-col items-center justify-end flex-1 pb-0.5 sm:pb-1"
                >
                    <div className={navItemClass(activeTab === 'home')}>
                        <Icons.Home className={iconClass(activeTab === 'home')} strokeWidth={activeTab === 'home' ? 1.9 : 1.75} />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('alerts')}
                    className="flex flex-col items-center justify-end relative flex-1 pb-0.5 sm:pb-1"
                >
                    <div className={navItemClass(activeTab === 'alerts')}>
                        <Icons.Bell className={iconClass(activeTab === 'alerts')} strokeWidth={activeTab === 'alerts' ? 1.9 : 1.75} />
                    </div>
                    {unreadCount > 0 && (
                        <div className="absolute top-1 right-1 sm:right-2.5 min-w-[20px] h-[20px] bg-red-600 rounded-full flex items-center justify-center border-2 border-[#12121a] shadow-lg z-10 animate-pulse">
                            <span className="text-[10px] font-black text-white leading-none">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </div>
                    )}
                </button>

                <button
                    type="button"
                    onClick={onCreate}
                    className="flex flex-col items-center justify-end pb-1.5 sm:pb-2"
                >
                    <div className="w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] flex items-center justify-center rounded-[14px] sm:rounded-[16px] -translate-y-3 sm:-translate-y-4 bg-white text-black shadow-[0_10px_40px_rgba(255,255,255,0.15)]">
                        <Icons.Plus className="w-9 h-9 sm:w-10 sm:h-10 font-black stroke-[2.7]" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('search')}
                    className="flex flex-col items-center justify-end flex-1 pb-0.5 sm:pb-1"
                >
                    <div className={navItemClass(activeTab === 'search')}>
                        <Icons.Search className={iconClass(activeTab === 'search')} strokeWidth={activeTab === 'search' ? 1.9 : 1.75} />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={onProfile}
                    className="flex flex-col items-center justify-end flex-1 pb-0.5 sm:pb-1"
                >
                    <div className={navItemClass(activeTab === 'profile')}>
                        <div className={`overflow-hidden bg-black ${activeTab === 'profile' ? 'w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[16px] border border-black/10' : 'w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[14px] border border-white/20 shadow-md'}`}>
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
