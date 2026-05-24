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
    const navItemBaseClass = 'flex-1 max-w-[88px] sm:max-w-[96px] h-[58px] sm:h-[66px] flex items-center justify-center rounded-[4px] border';
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'border-white bg-white text-black' : 'border-white/10 bg-black text-white/80'}`;

    return (
        <nav className="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-0 right-0 w-full z-[99] flex justify-center pointer-events-none px-2 sm:px-3">
            <div className="w-full bottom-nav-glass rounded-none px-2 py-2 sm:py-2.5 pointer-events-auto flex items-center justify-between relative gap-2">
                <button
                    type="button"
                    onClick={() => onTabChange('home')}
                    className="flex flex-col items-center justify-center"
                >
                    <div className={navItemClass(activeTab === 'home')}>
                        <Icons.Home className="w-8 sm:w-9 h-8 sm:h-9" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('alerts')}
                    className="flex flex-col items-center justify-center relative"
                >
                    <div className={navItemClass(activeTab === 'alerts')}>
                        <Icons.Bell className="w-8 sm:w-9 h-8 sm:h-9" />
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
                    className="flex flex-col items-center justify-center"
                >
                    <div className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] flex items-center justify-center rounded-[4px] border border-white bg-white text-black">
                        <Icons.Plus className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 font-black" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('search')}
                    className="flex flex-col items-center justify-center"
                >
                    <div className={navItemClass(activeTab === 'search')}>
                        <Icons.Search className="w-8 sm:w-9 h-8 sm:h-9" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={onProfile}
                    className="flex flex-col items-center justify-center"
                >
                    <div className={`${navItemBaseClass} border-white/10 bg-black text-white/80`}>
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[4px] overflow-hidden border border-white/15 bg-black">
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
