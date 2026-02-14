import React, { useState, useEffect, useRef } from 'react';
import axios from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './components/Icons';
import { useTranslation } from './translations';
import { playSound } from './utils/sounds';

const BASE_URL = axios.defaults.baseURL.replace('/api', '');

const resolveMediaUrl = (path, width = null, isAvatar = false) => {
    if (!path) return '';
    let url = path;
    if (!path.startsWith('http') && !path.startsWith('blob:')) {
        url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    }

    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
        const parts = url.split('/upload/');
        if (!parts[1].startsWith('c_') && !parts[1].startsWith('w_')) {
            const isVideo = url.includes('/video/upload/');
            let transform = '';

            if (isAvatar && isVideo) {
                transform = `w_250,h_250,c_fill,so_0,eo_3,q_auto:best,f_webp,fl_animated`;
                parts[1] = parts[1].replace(/\.(mp4|mov|webm|m4v)$/i, '.webp');
            } else if (isAvatar) {
                transform = `w_400,h_400,c_fill,g_face,q_auto:best,f_auto`;
            } else if (width) {
                transform = `w_${width},c_fill,g_face,q_auto:best,f_auto`;
            } else {
                transform = `c_limit,w_1920,q_auto:best,f_auto`;
            }
            url = `${parts[0]}/upload/${transform}/${parts[1]}`;
        }
    }
    return url;
};

const ProfileAvatar = ({ user }) => {
    if (!user) return <div className="w-full h-full bg-gray-800" />;
    const url = user.profilePic;
    const rawIsVideo = url && (url.match(/\.(mp4|mov|webm)($|\?)/i) || url.includes('/video/upload/'));
    const mediaUrl = url ? resolveMediaUrl(url, 150, true) : null;
    if (rawIsVideo && mediaUrl) {
        return (
            <video
                src={mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
            />
        );
    }
    return (
        <img
            src={mediaUrl || `https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff`}
            className="w-full h-full object-cover"
            alt={user.username || ''}
        />
    );
};

const CommentView = ({ postId, user: currentUser, onClose }) => {
    const { t, lang } = useTranslation();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editText, setEditText] = useState('');
    const scrollRef = useRef(null);

    const fetchPost = async () => {
        try {
            const res = await axios.get(`/posts/${postId}`);
            setPost(res.data);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch post for comments", e);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPost();
        const interval = setInterval(fetchPost, 5000);
        return () => clearInterval(interval);
    }, [postId]);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!commentText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await axios.post(`/posts/${postId}/comment`, { text: commentText });
            setCommentText('');
            fetchPost();
            playSound('pop');
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (e) {
            alert(t('ERROR_POSTING') || "Connectivity failure.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = async (commentId, newText) => {
        try {
            await axios.put(`/posts/${postId}/comment/${commentId}`, { text: newText });
            setEditingCommentId(null);
            fetchPost();
            playSound('pop');
        } catch (e) {
            alert(t('ERROR_UPDATING') || "Update failed.");
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm(t('CONFIRM_DELETE') || "Delete this intel?")) return;
        try {
            await axios.delete(`/posts/${postId}/comment/${commentId}`);
            fetchPost();
            playSound('premium_delete');
        } catch (e) {
            alert(t('ERROR_DELETING') || "Deletion failed.");
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center space-y-4 z-[9999]">
                <div className="w-12 h-12 border-4 border-[var(--gold-primary)] border-t-transparent rounded-full animate-spin" />
                <div className="text-[var(--gold-primary)] font-black text-xs uppercase tracking-[0.3em] animate-pulse">Establishing Secure Link...</div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 text-center z-[9999]">
                <Icons.XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-white font-black text-xl mb-2 italic">INTEL NODE DISCONNECTED</h2>
                <p className="text-gray-500 text-sm">{t('POST_NOT_FOUND') || "The target intelligence packet has been purged or is inaccessible."}</p>
                <button onClick={onClose} className="mt-8 gold-btn">{t('BACK_TO_HQ') || "BACK TO HQ"}</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#050505] z-[9999] flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="shrink-0 h-16 border-b border-white/10 bg-black/80 backdrop-blur-3xl flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-90">
                        <Icons.Back className="w-6 h-6 text-white" />
                    </button>
                    <div>
                        <h1 className="text-sm font-black italic text-white uppercase tracking-widest">{t('COMMENTS')}</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter line-clamp-1">{post.authorName || 'Target Intel'}</p>
                    </div>
                </div>
                <div className="w-10" />
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 custom-scrollbar">
                {/* Post Summary */}
                <div className="p-4 bg-white/[0.03] rounded-3xl border border-white/5 shadow-inner">
                    <p className="text-white text-sm font-medium leading-relaxed italic">
                        {post.desc || post.text || 'No description provided.'}
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] pl-1">{post.comments?.length || 0} {t('INTEL_LOGS') || "INTEL LOGS"}</h3>

                    {post.comments?.length === 0 ? (
                        <div className="py-20 text-center">
                            <Icons.MessageCircle className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-50" />
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">{t('ZERO_COMMENTS') || "No intel reported yet."}</p>
                        </div>
                    ) : (
                        post.comments.map((c, i) => {
                            const isCommentAuthor = String(c.user?._id || c.userId || c.authorId) === String(currentUser?._id);
                            const isFounder = currentUser?.role === 'Founder';
                            const canEdit = isCommentAuthor || isFounder;
                            const canDelete = isCommentAuthor || isFounder;

                            return (
                                <div key={i} className="flex gap-3 group animate-slide-down">
                                    <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden border border-white/10 shadow-lg">
                                        <ProfileAvatar user={{ username: c.authorName, profilePic: c.authorProfilePic }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-black text-white hover:text-[var(--gold-primary)] transition-colors cursor-pointer uppercase tracking-tight">{c.authorName}</span>
                                                {(c.user?.role === 'Founder') && (
                                                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-[var(--gold-primary)]/20 to-[var(--gold-primary)]/5 px-2.5 py-0.5 rounded-lg border border-[var(--gold-primary)]/40 shadow-[0_0_10px_rgba(255,215,0,0.2)] ml-1">
                                                        <div className="relative flex items-center justify-center w-3 h-3 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]">
                                                            <Icons.Crown className="w-full h-full text-[var(--gold-primary)] animate-pulse" />
                                                        </div>
                                                        <span className="text-[8px] sm:text-[9px] text-[var(--gold-primary)] uppercase font-black tracking-widest drop-shadow-sm">LEGACY {lang === 'el' ? 'ΙΔΡΥΤΗΣ' : 'FOUNDER'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[9px] text-gray-600 font-bold uppercase">{new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="bg-white/[0.05] rounded-2xl rounded-tl-none p-3 border border-white/5 shadow-sm group-hover:border-white/10 transition-all">
                                            {editingCommentId === c._id ? (
                                                <div className="flex flex-col gap-2">
                                                    <textarea
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--gold-primary)]/50 min-h-[60px] resize-none"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleEdit(c._id, editText)} className="bg-[var(--gold-primary)] px-3 py-1 rounded-lg text-[9px] font-black text-black hover:opacity-90 transition-colors uppercase">{t('SAVE') || "SAVE"}</button>
                                                        <button onClick={() => setEditingCommentId(null)} className="bg-white/5 px-3 py-1 rounded-lg text-[9px] font-black text-gray-400 hover:bg-white/10 transition-colors uppercase">{t('CANCEL') || "CANCEL"}</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {c.text && <p className="text-white text-sm leading-snug break-words whitespace-pre-wrap">{c.text}</p>}
                                                    {c.audioUrl && (
                                                        <div className="mt-2 flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
                                                            <Icons.Mic className="w-4 h-4 text-[var(--gold-primary)]" />
                                                            <audio src={resolveMediaUrl(c.audioUrl)} controls className="h-8 max-w-full" />
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {canEdit && (
                                                            <button
                                                                onClick={() => { setEditingCommentId(c._id); setEditText(c.text || ''); }}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-[9px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all active:scale-95"
                                                            >
                                                                <Icons.Edit className="w-3 h-3" /> <span className="hidden sm:inline">{t('EDIT') || "EDIT"}</span>
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button
                                                                onClick={() => handleDelete(c._id)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-[9px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(220,38,38,0.5)] hover:shadow-[0_0_15px_rgba(220,38,38,0.8)] transition-all active:scale-95"
                                                            >
                                                                <Icons.Trash className="w-3 h-3" /> <span className="hidden sm:inline">{t('DELETE') || "DELETE"}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={scrollRef} />
                </div>
            </div>

            {/* Sticky Input Field - higher on mobile so it sits above navbar */}
            <div className="shrink-0 p-4 pb-[max(8rem,calc(env(safe-area-inset-bottom,20px)+90px))] sm:pb-12 bg-transparent">
                <form onSubmit={handleSubmit} className="relative flex items-center bg-black/80 backdrop-blur-3xl border border-white/20 rounded-2xl p-1.5 focus-within:border-[var(--gold-primary)] transition-all group shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
                    <textarea
                        rows="1"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={t('ENGAGE') || "Add Intel..."}
                        className="flex-1 min-w-0 bg-transparent py-4 px-4 text-sm text-white outline-none resize-none placeholder-gray-600 min-h-14 h-14 sm:h-12 sm:min-h-12 sm:py-3 flex items-center"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!commentText.trim() || isSubmitting}
                        className="w-12 h-12 bg-[var(--gold-primary)] text-black rounded-xl flex items-center justify-center shadow-lg shadow-glow-gold/40 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <Icons.Send className="w-5 h-5 fill-black" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CommentView;
