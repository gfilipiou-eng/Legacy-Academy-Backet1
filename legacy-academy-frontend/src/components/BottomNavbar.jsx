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
        <nav className="bottom-nav-shell fixed bottom-[calc(14px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-xl z-[99] pointer-events-none transition-all duration-300">
            <div className="w-full bottom-nav-glass pointer-events-auto rounded-[24px] sm:rounded-[30px] px-2 py-1.5 sm:py-2">
                <div className="relative flex items-center justify-around">
                    <button
                        type="button"
                        onClick={() => onTabChange('home')}
                        className="nav-btn-glow flex flex-col items-center justify-center transition-all duration-200 active:scale-95"
                    >
                        <div className={`w-[15vw] max-w-[64px] sm:w-16 h-10 flex items-center justify-center rounded-[18px] sm:rounded-[22px] transition-all duration-300 ${activeTab === 'home' ? 'liquid-droplet-active text-[var(--gold-primary)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            <Icons.Home className="w-6 sm:w-7 h-6 sm:h-7" />
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => onTabChange('alerts')}
                        className="nav-btn-glow flex flex-col items-center justify-center relative transition-all duration-200 active:scale-95"
                    >
                        <div className={`w-[15vw] max-w-[64px] sm:w-16 h-10 flex items-center justify-center rounded-[18px] sm:rounded-[22px] transition-all duration-300 ${activeTab === 'alerts' ? 'liquid-droplet-active text-[var(--gold-primary)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            <Icons.Bell className="w-6 sm:w-7 h-6 sm:h-7" />
                        </div>
                        {unreadCount > 0 && (
                            <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-600 rounded-full flex items-center justify-center border border-black/50 shadow-md z-10">
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
                        <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full liquid-gold-btn text-black shadow-lg shadow-black/40">
                            <Icons.Plus className="w-6.5 h-6.5 sm:w-8 sm:h-8 font-black" />
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => onTabChange('search')}
                        className="nav-btn-glow flex flex-col items-center justify-center transition-all duration-200 active:scale-95"
                    >
                        <div className={`w-[15vw] max-w-[64px] sm:w-16 h-10 flex items-center justify-center rounded-[18px] sm:rounded-[22px] transition-all duration-300 ${activeTab === 'search' ? 'liquid-droplet-active text-[var(--gold-primary)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            <Icons.Search className="w-6 sm:w-7 h-6 sm:h-7" />
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={onProfile}
                        className="nav-btn-glow flex flex-col items-center justify-center transition-all duration-200 active:scale-95"
                    >
                        <div className="w-[15vw] max-w-[64px] sm:w-16 h-10 flex items-center justify-center rounded-[18px] sm:rounded-[22px] transition-all duration-300 hover:bg-white/5">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 ${user?.role === 'Founder' ? 'rounded-[10px]' : 'rounded-full'} overflow-hidden border border-white/15 bg-black/40`}>
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
