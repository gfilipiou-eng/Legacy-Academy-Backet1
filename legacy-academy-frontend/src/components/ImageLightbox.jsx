import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './Icons';

export const ImageLightbox = ({ src, onClose, alt = 'Image' }) => {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!src) return undefined;
        setLoaded(false);
        setFailed(false);

        const scrollY = window.scrollY;
        const prevOverflow = document.body.style.overflow;
        const prevPosition = document.body.style.position;
        const prevTop = document.body.style.top;
        const prevLeft = document.body.style.left;
        const prevRight = document.body.style.right;
        const prevWidth = document.body.style.width;

        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';

        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = prevOverflow;
            document.body.style.position = prevPosition;
            document.body.style.top = prevTop;
            document.body.style.left = prevLeft;
            document.body.style.right = prevRight;
            document.body.style.width = prevWidth;
            window.scrollTo(0, scrollY);
        };
    }, [src, onClose]);

    if (!src) return null;

    return createPortal(
        <div
            className="image-lightbox fixed inset-0 z-[20000] flex items-center justify-center bg-black touch-manipulation"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
        >
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose?.();
                }}
                className="image-lightbox__close absolute z-20 group inline-flex items-center justify-center w-12 h-12 bg-white/5 hover:bg-white/10 backdrop-blur-[24px] border border-white/10 rounded-full shadow-sm transition-all duration-300 cursor-pointer select-none overflow-hidden touch-manipulation text-white active:scale-95"
                style={{ top: 'max(1rem, env(safe-area-inset-top))', right: 'max(1rem, env(safe-area-inset-right))' }}
                aria-label="Close"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 relative z-10 drop-shadow-md">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
            </button>

            {!loaded && !failed && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icons.Loader className="w-10 h-10 text-white/60 animate-spin" />
                </div>
            )}

            {failed ? (
                <div className="text-center px-6 text-white/70">
                    <Icons.Image className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-bold uppercase tracking-widest">Image unavailable</p>
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className={`max-w-full max-h-[100dvh] w-auto h-auto object-contain px-4 py-20 transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    onClick={(e) => e.stopPropagation()}
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                    draggable={false}
                />
            )}
        </div>,
        document.body
    );
};

export default ImageLightbox;
