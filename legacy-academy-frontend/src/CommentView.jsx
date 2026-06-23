import React, { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import axios from './api';
import socket from './socket';
import { Icons } from './components/Icons';
import { VoiceNotePlayer } from './components/VoiceNotePlayer';
import { useTranslation } from './translations';
import ImageLightbox from './components/ImageLightbox';

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
      } else if (width && !isNaN(width)) {
        transform = `w_${width},c_limit,q_auto:best,f_auto`;
      } else {
        transform = `c_limit,w_1920,q_auto:best,f_auto`;
      }
      url = `${parts[0]}/upload/${transform}/${parts[1]}`;
    }
  }
  return url;
};

const formatDate = (dateString, t, lang) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    const isGreek = lang === 'el';

    if (diffInSeconds < 60) return isGreek ? 'Μόλις τώρα' : 'Just now';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      if (isGreek) return `${diffInMinutes} λεπτά`;
      return diffInMinutes === 1 ? '1 min' : `${diffInMinutes} mins`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      if (isGreek) return `${diffInHours} ώρες`;
      return diffInHours === 1 ? '1 hour' : `${diffInHours} hours`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      if (isGreek) return `${diffInDays} μέρες`;
      return diffInDays === 1 ? '1 day' : `${diffInDays} days`;
    }

    const locale = (lang === 'el') ? 'el-GR' : (lang === 'de') ? 'de-DE' : 'en-US';
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  } catch (e) { return ''; }
};

const ProfileAvatarBase = ({ user }) => {
  if (!user) return <div className="w-full h-full rounded-full bg-gray-800" />;
  const url = user.profilePic || user.authorProfilePic;
  const name = user.username || user.authorName || 'Agent';
  const timestamp = Date.now();
  
  const rawIsVideo = url && (url.match(/\.(mp4|mov|webm)($|\?)/i) || url.includes('/video/upload/'));
  let mediaUrl = url ? resolveMediaUrl(url, 150, true) : null;
  
  if (mediaUrl && !mediaUrl.startsWith('blob:') && !mediaUrl.includes('t=')) {
    const sep = mediaUrl.includes('?') ? '&' : '?';
    mediaUrl += `${sep}t=${timestamp}`;
  }

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
      src={mediaUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`}
      className="w-full h-full object-cover"
      alt={name}
      onError={(e) => {
        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=333&color=fff`;
      }}
    />
  );
};

const ProfileAvatar = memo(ProfileAvatarBase);

const CommentView = ({ postId, user: currentUser, onClose, onViewProfile }) => {
  const { t, lang } = useTranslation();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const scrollRef = useRef(null);

  const fetchPost = async () => {
    try {
      setErrorMsg(null);
      const res = await axios.get(`/posts/find/${postId}`);
      setPost(res.data);
    } catch (e) {
      console.error("Failed to fetch post for comments", e);
      setErrorMsg(t('POST_NOT_FOUND') || 'Post unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!postId) return undefined;
    setLoading(true);
    setPost(null);
    fetchPost();

    socket.emit('join', postId);

    const handleCommentAdded = (data) => {
      if (String(data.postId) === String(postId)) {
        setPost(prev => prev ? { ...prev, comments: data.comments } : null);
      }
    };

    const handleCommentUpdated = (data) => {
      if (String(data.postId) === String(postId)) {
        setPost(prev => prev ? { ...prev, comments: data.comments } : null);
      }
    };

    const handleCommentDeleted = (data) => {
      if (String(data.postId) === String(postId)) {
        setPost(prev => prev ? { ...prev, comments: data.comments } : null);
      }
    };

    socket.on('comment.added', handleCommentAdded);
    socket.on('comment.updated', handleCommentUpdated);
    socket.on('comment.deleted', handleCommentDeleted);

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

    return () => {
      socket.off('comment.added', handleCommentAdded);
      socket.off('comment.updated', handleCommentUpdated);
      socket.off('comment.deleted', handleCommentDeleted);

      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.left = prevLeft;
      document.body.style.right = prevRight;
      document.body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [postId]);

  const handleEdit = async (commentId, newText) => {
    try {
      await axios.put(`/posts/${postId}/comment/${commentId}`, { text: newText });
      setEditingCommentId(null);
      fetchPost();
    } catch (e) {
      alert(t('ERROR_UPDATING') || "Update failed.");
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm(t('CONFIRM_DELETE') || "Delete this intel?")) return;
    try {
      await axios.delete(`/posts/${postId}/comment/${commentId}`);
      fetchPost();
    } catch (e) {
      alert(t('ERROR_DELETING') || "Deletion failed.");
    }
  };


  const handleEdit = async (commentId, newText) => {
    <div className="comment-view fixed inset-0 z-[9999] flex flex-col bg-[#0a0a0a] text-white touch-manipulation" style={{ isolation: 'isolate', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {content}
      <ImageLightbox src={zoomImage} onClose={() => setZoomImage(null)} alt="Post media" />
    </div>,
    document.body
  );

  if (loading) {
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
        <Icons.Loader className="w-10 h-10 text-[var(--gold-primary)] animate-spin" />
        <div className="text-[var(--gold-primary)] font-black text-xs uppercase tracking-[0.3em]">{t('LOADING', 'Loading...')}</div>
      </div>
    );
  }

  if (!post) {
    return shell(
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Icons.XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-white font-black text-xl mb-2">{t('POST_NOT_FOUND', 'Post not found')}</h2>
        <p className="text-gray-500 text-sm max-w-xs">{errorMsg || t('POST_NOT_FOUND')}</p>
        <button type="button" onClick={onClose} className="mt-8 px-6 py-3 rounded-full bg-white text-black font-black uppercase tracking-widest text-sm touch-manipulation">{t('BACK_TO_HQ', 'Back')}</button>
      </div>
    );
  }

  return shell(
    <>
      <header className="shrink-0 border-b border-white/10 bg-[#0a0a0a]/95 flex items-center justify-between px-3 sm:px-4 py-3 z-50">
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={onClose} className="p-2.5 rounded-full hover:bg-white/10 active:scale-95 transition-all touch-manipulation" aria-label="Back">
            <Icons.Back className="w-6 h-6 text-white" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white uppercase tracking-widest">{t('COMMENTS')}</h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-tighter truncate">{post.authorName || post.author?.username || 'Post'}</p>
          </div>
        </div>
        <div className="text-[11px] font-bold text-gray-400 tabular-nums shrink-0">{post.comments?.length || 0}</div>
      </header>

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 5rem))' }}
      >
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex gap-3">
            <button
              type="button"
              className="w-11 h-11 shrink-0 rounded-full overflow-hidden border border-white/15"
              onClick={() => onViewProfile && onViewProfile(post.author || { username: post.authorName, profilePic: post.authorProfilePic })}
            >
              <ProfileAvatar user={post.author || { username: post.authorName, profilePic: post.authorProfilePic }} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mb-2">
                <button
                  type="button"
                  className="font-bold text-white text-[15px] text-left hover:underline touch-manipulation"
                  onClick={() => onViewProfile && onViewProfile(post.author || { username: post.authorName, profilePic: post.authorProfilePic })}
                >
                  {post.author?.username || post.authorName}
                </button>
                <span className="text-gray-500 text-[13px] break-all">{`@${String(post.author?.username || post.authorName || 'agent').toLowerCase().replace(/\s+/g, '')}`}</span>
                <span className="text-gray-600 text-[13px]">·</span>
                <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{formatDate(post.createdAt, t, lang)}</span>
              </div>
              <p className="text-white text-[15px] font-medium leading-relaxed whitespace-pre-wrap break-words">
                {post.desc || post.text || 'No description provided.'}
              </p>
              {(post.image || post.videoUrl) && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-[#050505]">
                  {post.videoUrl ? (
                    <video src={resolveMediaUrl(post.videoUrl)} controls playsInline className="w-full h-auto bg-black" />
                  ) : (
                    <button
                      type="button"
                      className="w-full touch-manipulation"
                      onClick={() => setZoomImage(resolveMediaUrl(post.image))}
                    >
                      <img src={resolveMediaUrl(post.image)} alt="Post media" className="w-full h-auto max-h-[50vh] object-contain bg-[#050505]" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-2 sm:px-4">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] py-3 px-2">{post.comments?.length || 0} {t('INTEL_LOGS') || 'Comments'}</h3>

          {post.comments?.length === 0 ? (
            <div className="py-16 text-center px-4">
              <Icons.MessageCircle className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">{t('ZERO_COMMENTS') || 'No comments yet'}</p>
            </div>
          ) : (
            post.comments.map((c, i) => {
              const isCommentAuthor = String(c.user?._id || c.userId || c.authorId) === String(currentUser?._id);
              const isFounder = currentUser?.role === 'Founder';
              const canEdit = isCommentAuthor || isFounder;
              const canDelete = isCommentAuthor || isFounder;

              return (
                <div key={c._id || i} className={`comment-view__item py-4 px-2 flex gap-3 relative border-b border-white/[0.06] ${activeMenuId === c._id ? 'z-20' : ''}`}>
                  <button
                    type="button"
                    className="shrink-0 w-10 h-10 rounded-full overflow-hidden touch-manipulation"
                    onClick={() => onViewProfile && onViewProfile(c.author || { username: c.authorName, profilePic: c.authorProfilePic })}
                  >
                    <ProfileAvatar user={c.author || { username: c.authorName, profilePic: c.authorProfilePic }} />
                  </button>

                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mb-1">
                      <button
                        type="button"
                        className="font-bold text-[15px] text-white truncate max-w-[45vw] touch-manipulation"
                        onClick={() => onViewProfile && onViewProfile(c.author || { username: c.authorName, profilePic: c.authorProfilePic })}
                      >
                        {c.authorName}
                      </button>
                      <span className="text-[13px] text-gray-500 truncate max-w-[30vw]">
                        {`@${String(c.author?.username || c.authorName || 'user').toLowerCase().replace(/\s+/g, '')}`}
                      </span>
                      <span className="text-gray-500">·</span>
                      <span className="text-[12px] text-gray-500">{formatDate(c.createdAt, t, lang)}</span>
                    </div>

                    {editingCommentId === c._id ? (
                      <div className="mt-2 flex flex-col gap-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-[16px] text-white outline-none focus:border-white/35 min-h-[88px] resize-none leading-relaxed"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditingCommentId(null)} className="px-4 py-2 rounded-full border border-white/15 text-[12px] font-bold text-white/70 touch-manipulation">{t('CANCEL') || 'Cancel'}</button>
                          <button type="button" onClick={() => handleEdit(c._id, editText)} className="px-4 py-2 rounded-full bg-white text-[12px] font-bold text-black touch-manipulation">{t('SAVE') || 'Save'}</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {c.text && <p className="text-[15px] leading-relaxed text-white/90 whitespace-pre-wrap break-words mb-2">{c.text}</p>}
                        {c.audioUrl && (
                          <div className="mb-2 w-full max-w-sm">
                            <VoiceNotePlayer src={resolveMediaUrl(c.audioUrl)} t={t} />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {(canEdit || canDelete) && editingCommentId !== c._id && (
                    <div className="absolute right-1 top-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === c._id ? null : c._id);
                        }}
                        className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 touch-manipulation"
                        aria-label="Comment actions"
                      >
                        <Icons.MoreHorizontal className="w-5 h-5" />
                      </button>

                      {activeMenuId === c._id && createPortal(
                        <>
                          <div
                            className="fixed inset-0 z-[30000] bg-black/70 touch-manipulation"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="fixed bottom-0 left-0 right-0 z-[30001] bg-[#121212] border-t border-white/10 rounded-t-3xl py-4 shadow-2xl" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
                            <div className="w-12 h-1 bg-white/25 rounded-full mx-auto mb-4" />
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setEditingCommentId(c._id);
                                  setEditText(c.text || '');
                                }}
                                className="w-full px-5 py-3.5 text-left text-base font-bold text-white active:bg-white/10 flex items-center gap-3 touch-manipulation"
                              >
                                <Icons.Edit className="w-5 h-5 text-white/70" />
                                <span>{t('EDIT') || 'Edit'}</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleDelete(c._id);
                                }}
                                className="w-full px-5 py-3.5 text-left text-base font-bold text-red-500 active:bg-red-500/10 flex items-center gap-3 border-t border-white/[0.06] touch-manipulation"
                              >
                                <Icons.Trash className="w-5 h-5" />
                                <span>{t('DELETE') || 'Delete'}</span>
                              </button>
                            )}
                          </div>
                        </>,
                        document.body
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <div
        className="shrink-0 px-4 py-4 border-t border-white/10 bg-[#0a0a0a]/95 text-center"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 bg-white/5 py-3 px-4 border border-white/10 rounded-xl">
          {t('COMMENTS_DISABLED', 'Comments are read-only for shared links')}
        </div>
      </div>
    </>
  );
};

export default CommentView;
