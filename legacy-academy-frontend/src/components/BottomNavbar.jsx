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
    const navItemBaseClass = 'flex-1 max-w-[106px] sm:max-w-[114px] h-[70px] sm:h-[78px] flex items-center justify-center rounded-[18px] sm:rounded-[20px]';
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.08)]' : 'bg-[#050505] text-white/78'}`;

    return (
        <nav className="fixed bottom-0 left-0 right-0 w-full z-[99] pointer-events-none bg-black">
            <div className="flex justify-center px-3 sm:px-4 pt-6 sm:pt-7 pb-[calc(10px+env(safe-area-inset-bottom))] bg-black">
                <div className="w-full bottom-nav-glass rounded-none px-2.5 sm:px-3 py-3 sm:py-3.5 pointer-events-auto flex items-end justify-between relative gap-2">
                <button
                    type="button"
                    onClick={() => onTabChange('home')}
                    className="flex flex-col items-center justify-end flex-1 pb-1.5 sm:pb-2"
                >
                    <div className={navItemClass(activeTab === 'home')}>
                        <Icons.Home className="w-8 sm:w-9 h-8 sm:h-9" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('alerts')}
                    className="flex flex-col items-center justify-end relative flex-1 pb-1.5 sm:pb-2"
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
                    className="flex flex-col items-center justify-end pb-2 sm:pb-2.5"
                >
                    <div className="w-[72px] h-[72px] sm:w-[78px] sm:h-[78px] flex items-center justify-center rounded-[22px] sm:rounded-[24px] bg-white text-black shadow-[0_12px_34px_rgba(255,255,255,0.09)]">
                        <Icons.Plus className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 font-black" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('search')}
                    className="flex flex-col items-center justify-end flex-1 pb-1.5 sm:pb-2"
                >
                    <div className={navItemClass(activeTab === 'search')}>
                        <Icons.Search className="w-8 sm:w-9 h-8 sm:h-9" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={onProfile}
                    className="flex flex-col items-center justify-end flex-1 pb-1.5 sm:pb-2"
                >
                    <div className={navItemClass(activeTab === 'profile')}>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-white/15 bg-black">
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
