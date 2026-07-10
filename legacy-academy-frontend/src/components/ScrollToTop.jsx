import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const ScrollToTop = ({ mainScrollRef, onScrollToTop }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const el = mainScrollRef?.current;
        if (!el) return;

        let lastScrollTime = 0;
        const handleScroll = (e) => {
            const now = Date.now();
            if (now - lastScrollTime < 48) return;
            lastScrollTime = now;

            setShow(e.target.scrollTop > 500);
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [mainScrollRef]);

    if (!show) return null;

    return (
        <button
            onClick={() => {
                if (mainScrollRef?.current) {
                    mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
                if (onScrollToTop) onScrollToTop();
            }}
            className="fixed bottom-[calc(158px+env(safe-area-inset-bottom))] right-20 sm:right-32 z-[950] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#ffffff]/10 shrink-0 flex-none backdrop-blur-2xl border border-[#ffffff]/20 flex items-center justify-center text-[#ffffff] hover:scale-105 active:scale-95 transition-all duration-500 ease-out"
            aria-label="Scroll to top"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 sm:w-10 sm:h-10 text-red-500">
                <path d="M12 19V5"></path>
                <path d="m5 12 7-7 7 7"></path>
            </svg>
        </button>
    );
};

export default ScrollToTop;

