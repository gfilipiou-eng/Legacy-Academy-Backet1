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

    return (
        <nav className="fixed bottom-[calc(14px+env(safe-area-inset-bottom))] left-0 right-0 w-full z-[99] flex justify-center pointer-events-none px-3">
            <div className="w-full max-w-xl bottom-nav-glass rounded-[28px] sm:rounded-[36px] px-3 py-2.5 sm:py-3 pointer-events-auto flex items-center justify-around relative">
                <button
                    type="button"
                    onClick={() => onTabChange('home')}
                    className="nav-btn-glow flex flex-col items-center justify-center transition-all duration-200 active:scale-95"
                >
                    <div className={`w-[17vw] max-w-[80px] sm:w-22 h-14 sm:h-16 flex items-center justify-center rounded-[22px] sm:rounded-[26px] transition-all duration-300 ${activeTab === 'home' ? 'liquid-droplet-active text-[var(--gold-primary)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <Icons.Home className="w-8 sm:w-9 h-8 sm:h-9" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('alerts')}
                    className="nav-btn-glow flex flex-col items-center justify-center relative transition-all duration-200 active:scale-95"
                >
                    <div className={`w-[17vw] max-w-[80px] sm:w-22 h-14 sm:h-16 flex items-center justify-center rounded-[22px] sm:rounded-[26px] transition-all duration-300 ${activeTab === 'alerts' ? 'liquid-droplet-active text-[var(--gold-primary)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
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
                    className="flex flex-col items-center justify-center transition-transform duration-200 active:scale-90"
                >
                    <div className="w-[62px] h-[62px] sm:w-[72px] sm:h-[72px] flex items-center justify-center rounded-full liquid-gold-btn text-black shadow-lg shadow-black/50">
                        <Icons.Plus className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 font-black" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('search')}
                    className="nav-btn-glow flex flex-col items-center justify-center transition-all duration-200 active:scale-95"
                >
                    <div className={`w-[17vw] max-w-[80px] sm:w-22 h-14 sm:h-16 flex items-center justify-center rounded-[22px] sm:rounded-[26px] transition-all duration-300 ${activeTab === 'search' ? 'liquid-droplet-active text-[var(--gold-primary)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <Icons.Search className="w-8 sm:w-9 h-8 sm:h-9" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={onProfile}
                    className="nav-btn-glow flex flex-col items-center justify-center transition-all duration-200 active:scale-95"
                >
                    <div className="w-[17vw] max-w-[80px] sm:w-22 h-14 sm:h-16 flex items-center justify-center rounded-[22px] sm:rounded-[26px] transition-all duration-300 hover:bg-white/5">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 ${user?.role === 'Founder' ? 'rounded-[10px]' : 'rounded-full'} overflow-hidden border border-white/15 bg-black/40`}>
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
