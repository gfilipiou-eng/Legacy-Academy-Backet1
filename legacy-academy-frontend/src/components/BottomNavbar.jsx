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
        <nav className="bottom-nav-shell fixed bottom-0 left-0 w-full z-[99] pointer-events-none">
            <div className="w-full bottom-nav-glass pointer-events-auto pb-[env(safe-area-inset-bottom)]">
                <div className="max-w-2xl mx-auto">
                    <div className="relative flex items-center justify-around py-3">
                        <button
                            type="button"
                            onClick={() => onTabChange('home')}
                            className={`nav-btn-glow flex flex-col items-center justify-center gap-1 px-3 py-1.5 transition-[color,transform] duration-200 active:scale-95 ${activeTab === 'home' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <div className={`w-16 h-10 flex items-center justify-center rounded-full transition-colors duration-200 ${activeTab === 'home' ? 'bg-white/10' : ''}`}>
                                <Icons.Home className="w-7 h-7" />
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => onTabChange('alerts')}
                            className={`nav-btn-glow flex flex-col items-center justify-center gap-1 px-3 py-1.5 transition-[color,transform] duration-200 relative active:scale-95 ${activeTab === 'alerts' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <div className={`w-16 h-10 flex items-center justify-center rounded-full transition-colors duration-200 ${activeTab === 'alerts' ? 'bg-white/10' : ''}`}>
                                <Icons.Bell className="w-7 h-7" />
                            </div>
                            {unreadCount > 0 && (
                                <div className="absolute top-1 right-2 min-w-[18px] h-[18px] bg-red-600 rounded-full flex items-center justify-center">
                                    <span className="text-[10px] font-black text-white leading-none">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                </div>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={onCreate}
                            className="nav-btn-glow flex flex-col items-center justify-center gap-1 px-2 py-1 transition-transform duration-200 active:scale-90"
                        >
                            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-[var(--gold-primary)] text-black shadow-lg shadow-black/40">
                                <Icons.Plus className="w-8 h-8 font-black" />
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => onTabChange('search')}
                            className={`nav-btn-glow flex flex-col items-center justify-center gap-1 px-3 py-1.5 transition-[color,transform] duration-200 active:scale-95 ${activeTab === 'search' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <div className={`w-16 h-10 flex items-center justify-center rounded-full transition-colors duration-200 ${activeTab === 'search' ? 'bg-white/10' : ''}`}>
                                <Icons.Search className="w-7 h-7" />
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={onProfile}
                            className="nav-btn-glow flex flex-col items-center justify-center gap-1 px-3 py-1.5 transition-[color,transform] duration-200 text-gray-400 hover:text-white active:scale-95"
                        >
                            <div className={`w-10 h-10 ${user?.role === 'Founder' ? 'rounded-[12px]' : 'rounded-full'} overflow-hidden border border-white/15 bg-black/40`}>
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
