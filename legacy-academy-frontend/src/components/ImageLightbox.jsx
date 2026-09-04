import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from './Icons';
import { playSound } from '../utils/sounds';

const isSameId = (a, b) => {
    if (!a || !b) return false;
    const idA = typeof a === 'object' ? a._id || a.id : a;
    const idB = typeof b === 'object' ? b._id || b.id : b;
    return String(idA) === String(idB);
};

export const ImageLightbox = ({
    src,
    onClose,
    alt = 'Image',
    post = null,
    user = null,
    onLike = null,
    onRepost = null,
    onComment = null,
    onShare = null
}) => {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const [localLikes, setLocalLikes] = useState(post?.likes || []);
    const [localReposts, setLocalReposts] = useState(post?.reposts || []);
    const [likePop, setLikePop] = useState(0);
    const [repostPop, setRepostPop] = useState(0);
    const imgRef = useRef(null);

    useEffect(() => {
        if (post?.likes) setLocalLikes(post.likes);
        if (post?.reposts) setLocalReposts(post.reposts);
    }, [post]);

    useEffect(() => {
        if (!src) return undefined;
        setLoaded(false);
        setFailed(false);

        if (imgRef.current && imgRef.current.complete) {
            setLoaded(true);
        }

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

    const isLiked = localLikes.some(id => isSameId(id, user?._id));
    const isReposted = localReposts.some(id => isSameId(id, user?._id));

    const handleLikeClick = (e) => {
        e.stopPropagation();
        if (!post?._id || !onLike) return;
        playSound(isLiked ? 'cyber_unlike' : 'cyber_like');
        setLikePop(v => v + 1);
        if (isLiked) {
            setLocalLikes(prev => prev.filter(id => !isSameId(id, user?._id)));
        } else {
            setLocalLikes(prev => [...prev, user?._id || 'me']);
        }
        onLike(post._id);
    };

    const handleRepostClick = (e) => {
        e.stopPropagation();
        if (!post?._id || !onRepost) return;
        setRepostPop(v => v + 1);
        if (isReposted) {
            setLocalReposts(prev => prev.filter(id => !isSameId(id, user?._id)));
        } else {
            setLocalReposts(prev => [...prev, user?._id || 'me']);
        }
        onRepost(post._id);
    };

    const authorName = post?.author?.username || (typeof post?.author === 'string' ? post.author : 'Author');
    const authorHandle = `@${String(authorName).toLowerCase().replace(/\s+/g, '')}`;

    return createPortal(
        <div
            className="image-lightbox fixed inset-0 z-[20000] flex flex-col items-center justify-between bg-black/95 backdrop-blur-md touch-manipulation select-none"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
        >
            {/* TOP BAR */}
            <div 
                className="w-full flex items-center justify-between px-4 py-3 z-50 bg-gradient-to-b from-black/80 to-transparent"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 hover:bg-white/10 active:scale-95 text-white transition-all cursor-pointer"
                        aria-label="Close"
                    >
                        <Icons.X className="w-5 h-5 text-white" />
                    </button>

                    {post && (
                        <div className="flex items-center gap-2.5">
                            {post.author?.profilePic && (
                                <img 
                                    src={post.author.profilePic} 
                                    alt="" 
                                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                                />
                            )}
                            <div className="flex flex-col text-left">
                                <span className="font-bold text-[14px] text-white leading-tight truncate max-w-[180px] sm:max-w-xs">
                                    {authorName}
                                </span>
                                <span className="text-[12px] text-gray-400 leading-tight">
                                    {authorHandle}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="hidden sm:flex px-4 py-1.5 rounded-full text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                    Esc
                </button>
            </div>

            {/* CENTER IMAGE */}
            <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden px-2 sm:px-4">
                {!loaded && !failed && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Icons.Loader className="w-10 h-10 text-white/60 animate-spin" />
                    </div>
                )}

                {failed ? (
                    <div className="text-center px-6 text-white/70">
                        <Icons.Image className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-bold uppercase tracking-widest">Media unavailable</p>
                    </div>
                ) : (post?.videoUrl && !post?.image) || (typeof src === 'string' && (src.includes('.mp4') || src.includes('.webm') || src.includes('.mov') || src.includes('/video/upload/'))) ? (
                    <video
                        src={src}
                        controls
                        autoPlay
                        playsInline
                        className={`max-w-full max-h-[78vh] sm:max-h-[82vh] w-auto h-auto object-contain rounded-lg transition-all duration-300 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-98'}`}
                        onClick={(e) => e.stopPropagation()}
                        onLoadedData={() => setLoaded(true)}
                        onError={() => setFailed(true)}
                    />
                ) : (
                    <img
                        ref={imgRef}
                        src={src}
                        alt={alt}
                        className={`max-w-full max-h-[78vh] sm:max-h-[82vh] w-auto h-auto object-contain transition-all duration-300 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-98'}`}
                        onClick={(e) => e.stopPropagation()}
                        onLoad={() => setLoaded(true)}
                        onError={() => setFailed(true)}
                        draggable={false}
                    />
                )}
            </div>

            {/* BOTTOM BAR / ACTIONS */}
            <div 
                className="w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-6 pb-6 px-4 z-50 flex flex-col items-center pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Optional Post Caption */}
                {post?.desc && (
                    <p className="w-full max-w-xl text-center text-[14px] sm:text-[15px] text-white/90 leading-snug line-clamp-2 mb-3 select-text px-2">
                        {post.desc}
                    </p>
                )}

                {/* Twitter Action Bar */}
                {post ? (
                    <div className="flex items-center justify-between w-full max-w-md px-4 py-1 text-gray-400">
                        {/* REPLY */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onComment ? onComment(post) : onClose();
                            }}
                            className="group flex items-center gap-2 text-[14px] font-medium text-gray-400 hover:text-[#1D9BF0] transition-colors cursor-pointer"
                            title="Reply"
                        >
                            <div className="p-2.5 rounded-full group-hover:bg-[#1D9BF0]/15 transition-colors">
                                <Icons.MessageSquare className="w-5 h-5 text-gray-400 group-hover:text-[#1D9BF0]" />
                            </div>
                            <span className="tabular-nums">{post.comments?.length || 0}</span>
                        </button>

                        {/* REPOST */}
                        <button
                            type="button"
                            onClick={handleRepostClick}
                            className={`group flex items-center gap-2 text-[14px] font-medium transition-colors cursor-pointer ${isReposted ? 'text-[#00BA7C]' : 'text-gray-400 hover:text-[#00BA7C]'}`}
                            title="Repost"
                        >
                            <div className="p-2.5 rounded-full group-hover:bg-[#00BA7C]/15 transition-colors">
                                <Icons.RefreshCcw key={`rp-pop-${repostPop}`} className={`w-5 h-5 ${isReposted ? 'text-[#00BA7C] fill-current' : 'text-gray-400 group-hover:text-[#00BA7C]'}`} />
                            </div>
                            <span className="tabular-nums">{localReposts.length}</span>
                        </button>

                        {/* LIKE */}
                        <button
                            type="button"
                            onClick={handleLikeClick}
                            className={`group flex items-center gap-2 text-[14px] font-medium transition-colors cursor-pointer ${isLiked ? 'text-[#F91880]' : 'text-gray-400 hover:text-[#F91880]'}`}
                            title="Like"
                        >
                            <div className="p-2.5 rounded-full group-hover:bg-[#F91880]/15 transition-colors">
                                <Icons.Heart key={`lk-pop-${likePop}`} className={`w-5 h-5 ${isLiked ? 'text-[#F91880] fill-current animate-pulse' : 'text-gray-400 group-hover:text-[#F91880]'}`} />
                            </div>
                            <span className="tabular-nums">{localLikes.length}</span>
                        </button>

                        {/* SHARE */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShare && onShare(post);
                            }}
                            className="group flex items-center gap-2 text-[14px] font-medium text-gray-400 hover:text-[#1D9BF0] transition-colors cursor-pointer"
                            title="Share"
                        >
                            <div className="p-2.5 rounded-full group-hover:bg-[#1D9BF0]/15 transition-colors">
                                <Icons.Share className="w-5 h-5 text-gray-400 group-hover:text-[#1D9BF0]" />
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="py-2"></div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default ImageLightbox;
