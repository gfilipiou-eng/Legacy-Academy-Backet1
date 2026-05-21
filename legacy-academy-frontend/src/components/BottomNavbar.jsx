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
        <nav className="bottom-nav-shell fixed bottom-0 left-0 w-full z-[99] px-3 pt-3 pointer-events-none">
            <div className="max-w-2xl sm:max-w-xl md:max-w-2xl mx-auto pointer-events-auto">
                <div className="bottom-nav-glass rounded-[24px]">
                    <div className="relative flex items-center justify-around py-3.5">
                        <button
                            type="button"
                            onClick={() => onTabChange('home')}
                            className={`flex flex-col items-center justify-center gap-1 px-2 py-1 transition-[color,transform] duration-200 active:scale-95 ${activeTab === 'home' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <div className={`w-14 h-9 flex items-center justify-center rounded-full transition-colors duration-200 ${activeTab === 'home' ? 'bg-white/10' : ''}`}>
                                <Icons.Home className="w-6 h-6" />
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => onTabChange('alerts')}
                            className={`flex flex-col items-center justify-center gap-1 px-2 py-1 transition-[color,transform] duration-200 relative active:scale-95 ${activeTab === 'alerts' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <div className={`w-14 h-9 flex items-center justify-center rounded-full transition-colors duration-200 ${activeTab === 'alerts' ? 'bg-white/10' : ''}`}>
                                <Icons.Bell className="w-6 h-6" />
                            </div>
                            {unreadCount > 0 && (
                                <div className="absolute top-1 right-2 min-w-[16px] h-[16px] bg-red-600 rounded-full flex items-center justify-center">
                                    <span className="text-[9px] font-black text-white leading-none">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                </div>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={onCreate}
                            className="flex flex-col items-center justify-center gap-1 px-2 py-1 transition-transform duration-200 active:scale-90"
                        >
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--gold-primary)] text-black shadow-lg shadow-black/40">
                                <Icons.Plus className="w-7 h-7 font-black" />
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => onTabChange('search')}
                            className={`flex flex-col items-center justify-center gap-1 px-2 py-1 transition-[color,transform] duration-200 active:scale-95 ${activeTab === 'search' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <div className={`w-14 h-9 flex items-center justify-center rounded-full transition-colors duration-200 ${activeTab === 'search' ? 'bg-white/10' : ''}`}>
                                <Icons.Search className="w-6 h-6" />
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={onProfile}
                            className="flex flex-col items-center justify-center gap-1 px-2 py-1 transition-[color,transform] duration-200 text-gray-400 hover:text-white active:scale-95"
                        >
                            <div className={`w-9 h-9 ${user?.role === 'Founder' ? 'rounded-[10px]' : 'rounded-full'} overflow-hidden border border-white/15 bg-black/40`}>
                                <ProfileAvatar user={user} className="w-full h-full object-cover" priority />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
});

BottomNavbar.displayName = 'BottomNavbar';

export default BottomNavbar;
