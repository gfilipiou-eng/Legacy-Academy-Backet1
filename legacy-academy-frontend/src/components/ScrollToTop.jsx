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
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+70px)] sm:bottom-24 right-4 sm:right-8 z-50 p-3 sm:p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-300 group"
            aria-label="Scroll to top"
        >
            <Icons.ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:-translate-y-1 transition-transform" />
        </button>
    );
};

export default ScrollToTop;
