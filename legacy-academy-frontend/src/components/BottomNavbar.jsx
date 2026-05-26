import React, { memo, useMemo, useRef, useEffect } from 'react';
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
    const navRef = useRef(null);

    // React's synthetic onWheel is passive by default in modern browsers,
    // so preventDefault() is ignored. We attach a native non-passive listener instead.
    useEffect(() => {
        const el = navRef.current;
        if (!el) return;
        const blockWheel = (e) => e.preventDefault();
        el.addEventListener('wheel', blockWheel, { passive: false });
        return () => el.removeEventListener('wheel', blockWheel);
    }, []);

    // Futuristic base: flat, sharp, no bounce, geometric.
    const navItemBaseClass = 'flex-1 max-w-[112px] sm:max-w-[120px] h-[76px] sm:h-[84px] flex items-center justify-center transition-all duration-300 ease-in-out';
    
    // Active state: Sharp white background, no scale, no Y-translation. Just a solid block with a subtle neon-like white glow.
    const navItemClass = (isActive) => `${navItemBaseClass} ${isActive ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] rounded-none' : 'bg-transparent text-white/40 hover:text-white/80 hover:bg-white/[0.02]'}`;
    
    // Icons: Always maintain the same size. NEVER change fill (which causes the "changing shapes" issue). Only change stroke thickness and glow.
    const iconClass = (isActive) => `transition-all duration-300 w-9 h-9 sm:w-10 sm:h-10 ${isActive ? 'opacity-100 drop-shadow-md' : 'opacity-80'}`;

    return (
        <nav 
            ref={navRef}
            className="w-full z-[99] bg-black shrink-0 relative mt-auto border-t border-white/10"
            onTouchMove={(e) => e.preventDefault()}
        >
            <div className="flex justify-center px-3 sm:px-4 pt-4 pb-[calc(12px+env(safe-area-inset-bottom))] bg-black">
                <div className="w-full bottom-nav-glass rounded-none px-2.5 sm:px-3 py-3 flex items-center justify-between relative gap-2">
                <button
                    type="button"
                    onClick={() => onTabChange('home')}
                    className="flex flex-col items-center justify-center flex-1"
                >
                    <div className={navItemClass(activeTab === 'home')}>        
                        <Icons.Home className={iconClass(activeTab === 'home')} fill="none" strokeWidth={activeTab === 'home' ? '2.5' : '1.5'} shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('alerts')}
                    className="flex flex-col items-center justify-center relative flex-1"
                >
                    <div className={navItemClass(activeTab === 'alerts')}>      
                        <Icons.Bell className={iconClass(activeTab === 'alerts')} fill="none" strokeWidth={activeTab === 'alerts' ? '2.5' : '1.5'} shapeRendering="geometricPrecision" />
                    </div>
                    {unreadCount > 0 && (
                        <div className="absolute top-1 right-2 sm:right-3 min-w-[20px] h-[20px] bg-red-600 rounded-none flex items-center justify-center border border-black shadow-[0_0_10px_rgba(220,38,38,0.8)] z-10">     
                            <span className="text-[10px] font-black text-white leading-none tracking-tighter">
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
                    <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] flex items-center justify-center rounded-none bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-gray-100 transition-colors duration-300">
                        <Icons.Plus className="w-11 h-11 sm:w-12 sm:h-12 font-black stroke-[2.5]" shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('search')}
                    className="flex flex-col items-center justify-center flex-1"
                >
                    <div className={navItemClass(activeTab === 'search')}>      
                        <Icons.Search className={iconClass(activeTab === 'search')} fill="none" strokeWidth={activeTab === 'search' ? '2.5' : '1.5'} shapeRendering="geometricPrecision" />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={onProfile}
                    className="flex flex-col items-center justify-center flex-1"
                >
                    <div className={navItemClass(activeTab === 'profile')}>     
                        <div className={`overflow-hidden bg-black transition-all duration-300 ${activeTab === 'profile' ? 'w-10 h-10 sm:w-11 sm:h-11 rounded-none border-2 border-black drop-shadow-md' : 'w-10 h-10 sm:w-11 sm:h-11 rounded-none border border-black shadow-none'}`}>
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
