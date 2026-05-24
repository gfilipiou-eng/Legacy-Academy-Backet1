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
    const navItemBaseClass = 'flex-1 max-w-[100px] sm:max-w-[108px] h-[68px] sm:h-[76px] flex items-center justify-center rounded-[18px] sm:rounded-[20px]';
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'bg-white text-black' : 'bg-transparent text-white/78'}`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 w-full z-[99] pointer-events-none bg-black">
            <div className="flex justify-center px-3 sm:px-4 pt-5 sm:pt-6 pb-[calc(8px+env(safe-area-inset-bottom))] bg-black">
                <div className="w-full bottom-nav-glass rounded-none px-1.5 py-1.5 sm:py-2 pointer-events-auto flex items-center justify-between relative gap-1">
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
                    <div className="w-[64px] h-[64px] sm:w-[74px] sm:h-[74px] flex items-center justify-center rounded-full bg-white text-black">
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
                    <div className={navItemClass(false)}>
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 ${user?.role === 'Founder' ? 'rounded-[4px]' : 'rounded-full'} overflow-hidden border border-white/15 bg-black`}>
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
