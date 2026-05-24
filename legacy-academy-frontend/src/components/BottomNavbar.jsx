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
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'rounded-[14px] sm:rounded-[16px] -translate-y-3 sm:-translate-y-4 bg-white text-black will-change-transform' : 'bg-transparent text-white/50 hover:text-white/90 will-change-transform'}`;
    const iconClass = (isActive) => isActive ? 'w-10 h-10 sm:w-11 sm:h-11 opacity-100' : 'w-9 h-9 sm:w-10 sm:h-10 opacity-80';

    // 2026 Style Icons - Bold, Thick Strokes like the Plus Icon
    const HomeIcon = ({ isActive }) => (
        <svg viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive ? "0" : "2.5"} strokeLinecap="round" strokeLinejoin="round" className={iconClass(isActive)} shapeRendering="geometricPrecision">
            {isActive ? (
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            ) : (
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            )}
            {!isActive && <polyline points="9 22 9 12 15 12 15 22" />}
        </svg>
    );

    const BellIcon = ({ isActive }) => (
        <svg viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive ? "0" : "2.5"} strokeLinecap="round" strokeLinejoin="round" className={iconClass(isActive)} shapeRendering="geometricPrecision">
            {isActive ? (
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            ) : (
                <>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </>
            )}
        </svg>
    );

    const SearchIcon = ({ isActive }) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "3.5" : "2.5"} strokeLinecap="round" strokeLinejoin="round" className={iconClass(isActive)} shapeRendering="geometricPrecision">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16" y2="16" />
        </svg>
    );

    return (
        <nav className="fixed bottom-0 left-0 right-0 w-full z-[99] pointer-events-none bg-black">
            <div className="flex justify-center px-3 sm:px-4 pt-6 sm:pt-7 pb-[calc(10px+env(safe-area-inset-bottom))] bg-black">
                <div className="w-full bottom-nav-glass rounded-none px-2.5 sm:px-3 py-3 sm:py-3.5 pointer-events-auto flex items-center justify-between relative gap-2">
                <button
                    type="button"
                    onClick={() => onTabChange('home')}
                    className="flex flex-col items-center justify-center flex-1"
                >
                    <div className={navItemClass(activeTab === 'home')}>
                        <HomeIcon isActive={activeTab === 'home'} />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('alerts')}
                    className="flex flex-col items-center justify-center relative flex-1"
                >
                    <div className={navItemClass(activeTab === 'alerts')}>
                        <BellIcon isActive={activeTab === 'alerts'} />
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
                    <div className="w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] flex items-center justify-center rounded-[14px] sm:rounded-[16px] -translate-y-3 sm:-translate-y-4 bg-white text-black will-change-transform">
                        <Icons.Plus className="w-10 h-10 sm:w-11 sm:h-11 font-black stroke-[2.7]" shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('search')}
                    className="flex flex-col items-center justify-center flex-1"
                >
                    <div className={navItemClass(activeTab === 'search')}>
                        <SearchIcon isActive={activeTab === 'search'} />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={onProfile}
                    className="flex flex-col items-center justify-center flex-1"
                >
                    <div className={navItemClass(activeTab === 'profile')}>
                        <div className={`overflow-hidden bg-black ${activeTab === 'profile' ? 'w-12 h-12 sm:w-14 sm:h-14 rounded-[14px] sm:rounded-[16px] border border-black/10' : 'w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] border border-white/20 shadow-md'}`}>
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
