import React, { useState, useEffect, useRef, memo } from 'react';
import axios from './api';
import socket from './socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './components/Icons';
import { VoiceNotePlayer } from './components/VoiceNotePlayer';
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
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const scrollRef = useRef(null);

  const fetchPost = async () => {
    try {
      const res = await axios.get(`/posts/find/${postId}`);
      setPost(res.data);
      setLoading(false);
    } catch (e) {
      console.error("Failed to fetch post for comments", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!postId) return;
    fetchPost();

    // Join room for this post
    socket.emit('join', postId);

    const handleCommentAdded = (data) => {
      if (String(data.postId) === String(postId)) {
        console.log("📡 [SOCKET] New comment added");
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

    return () => {
      socket.off('comment.added', handleCommentAdded);
      socket.off('comment.updated', handleCommentUpdated);
      socket.off('comment.deleted', handleCommentDeleted);
    };
  }, [postId]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await axios.post(`/posts/${postId}/comment`, { text: commentText });
      setCommentText('');
      fetchPost();
      
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center space-y-4 z-[9999]">
        <div className="w-12 h-12 text-[var(--gold-primary)] animate-spin" style={{ animationDuration: '4s' }}>
            <Icons.Loader />
        </div>
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[9999] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-16 border-b border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-full transition-all ">
            <Icons.Back className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-sm font-black italic text-white uppercase tracking-widest">{t('COMMENTS')}</h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-tighter line-clamp-1">{post.authorName || 'Target Intel'}</p>
          </div>
        </div>
        <div className="w-10" />
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 custom-scrollbar">
        {/* Post Summary (Bluesky Style) */}
        <div className="px-4 py-2 border-b border-white/10 mb-2">
          <div className="flex gap-3 sm:gap-4">
            <div className="shrink-0 flex flex-col items-center">
              <div 
                className="w-12 h-12 relative group cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onViewProfile && onViewProfile(post.author || { username: post.authorName, profilePic: post.authorProfilePic })}
              >
                <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-500"></div>
                <div className="absolute inset-[3px] rounded-full overflow-hidden">
                    <ProfileAvatar user={post.author || { username: post.authorName, profilePic: post.authorProfilePic }} />
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mb-2 min-w-0">
                <span 
                  className="font-bold text-white text-[13px] sm:text-[15px] break-words leading-tight cursor-pointer hover:underline"
                  onClick={() => onViewProfile && onViewProfile(post.author || { username: post.authorName, profilePic: post.authorProfilePic })}
                >
                  {post.author?.username || post.authorName}
                </span>
                {post.author?.role === 'Founder' ? (
                  <>
                    <svg viewBox="0 0 22 22" className="w-4 h-4 shrink-0 text-[#FFD700] fill-current" style={{ overflow: 'visible' }}><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" /></svg>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 -ml-0.5" fill="none"><polygon points="12,1 15,4 19,4 20,8 24,12 20,16 19,20 15,20 12,23 9,20 5,20 4,16 0,12 4,8 5,4 9,4" fill="#F5C32C" /><path d="M16 8.5L10.5 14L8 11.5" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </>
                ) : (
                  <svg viewBox="0 0 22 22" className="w-4 h-4 shrink-0 text-[#1D9BF0] fill-current" style={{ overflow: 'visible' }}><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" /></svg>
                )}
                <span className="text-gray-500 text-[13px] break-all">{`@${String(post.author?.username || post.authorName || 'agent').toLowerCase().replace(/\s+/g, '')}`}</span>
                <span className="text-gray-600 text-[13px] shrink-0">·</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{formatDate(post.createdAt, t, lang)}</span>
                </div>
              </div>
              <p className="text-white text-[15px] sm:text-[16px] font-medium leading-relaxed whitespace-pre-wrap break-words pr-2">
                {post.desc || post.text || 'No description provided.'}
              </p>
              {(post.image || post.videoUrl) && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-white/10">
                  {post.videoUrl ? (
                    <video src={resolveMediaUrl(post.videoUrl)} controls className="w-full h-auto bg-black" />
                  ) : (
                    <img src={resolveMediaUrl(post.image)} alt="Post media" className="w-full h-auto max-h-[400px] object-contain bg-[#050505]" />
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 w-full border-t border-white/10 pt-4 px-2">
                <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-all duration-150 hover:bg-white/10 border border-transparent hover:border-white/10 text-gray-400 hover:text-white sturdy-active touch-manipulation">
                  <Icons.MessageSquare className="w-5 h-5" />
                  <span className="text-[12px] font-bold tabular-nums tracking-wide">{post.comments?.length || 0}</span>
                </button>
                <button className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-all duration-150 hover:bg-white/10 border border-transparent hover:border-white/10 ${post.reposts?.includes(currentUser?._id) ? 'text-white bg-white/10 border-white/20' : 'text-gray-400 hover:text-white'} sturdy-active touch-manipulation`} onClick={async () => {
                  try {
                    await axios.put(`/posts/${post._id}/repost`);
                    fetchPost();
                  } catch (e) { }
                }}>
                  <Icons.RefreshCcw className={`w-5 h-5 transition-transform ${post.reposts?.includes(currentUser?._id) ? 'scale-110' : ''}`} />
                  <span className="text-[12px] font-bold tabular-nums tracking-wide">{post.reposts?.length || 0}</span>
                </button>
                <button className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-all duration-150 hover:bg-white/10 border border-transparent hover:border-white/10 ${post.likes?.includes(currentUser?._id) ? 'text-white bg-white/10 border-white/20' : 'text-gray-400 hover:text-white'} sturdy-active touch-manipulation`} onClick={async () => {
                  try {
                    await axios.put(`/posts/${post._id}/like`);
                    fetchPost();
                  } catch (e) { }
                }}>
                  <Icons.Heart className={`w-5 h-5 transition-transform ${post.likes?.includes(currentUser?._id) ? 'fill-current scale-110' : ''}`} />
                  <span className="text-[12px] font-bold tabular-nums tracking-wide">{post.likes?.length || 0}</span>
                </button>
                <button className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-all duration-150 hover:bg-white/10 border border-transparent hover:border-white/10 ${post.dislikes?.includes(currentUser?._id) ? 'text-white bg-white/10 border-white/20' : 'text-gray-400 hover:text-white'} sturdy-active touch-manipulation`} onClick={async () => {
                  try {
                    await axios.put(`/posts/${post._id}/dislike`);
                    fetchPost();
                  } catch (e) { }
                }}>
                  <Icons.ThumbsDown className={`w-5 h-5 transition-transform ${post.dislikes?.includes(currentUser?._id) ? 'fill-current scale-110' : ''}`} />
                  <span className="text-[12px] font-bold tabular-nums tracking-wide">{post.dislikes?.length || 0}</span>
                </button>
              </div>
            </div>
          </div>
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
                  <div className="shrink-0 w-10 h-10 relative group cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onViewProfile && onViewProfile(c.author || { username: c.authorName, profilePic: c.authorProfilePic })}>
                    <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] transition-all duration-500"></div>
                    <div className="absolute inset-[2.5px] rounded-full overflow-hidden">
                        <ProfileAvatar user={{ username: c.authorName, profilePic: c.authorProfilePic }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-white transition-colors cursor-pointer tracking-tight hover:underline" onClick={() => onViewProfile && onViewProfile(c.author || { username: c.authorName, profilePic: c.authorProfilePic })}>{c.authorName}</span>
                        {(c.user?.role === 'Founder') ? (
                          <>
                            <svg viewBox="0 0 22 22" className="w-3.5 h-3.5 shrink-0 text-[#FFD700] fill-current -ml-0.5" style={{ overflow: 'visible' }}><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" /></svg>
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 -ml-0.5" fill="none"><polygon points="12,1 15,4 19,4 20,8 24,12 20,16 19,20 15,20 12,23 9,20 5,20 4,16 0,12 4,8 5,4 9,4" fill="#F5C32C" /><path d="M16 8.5L10.5 14L8 11.5" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </>
                        ) : (
                          <svg viewBox="0 0 22 22" className="w-3.5 h-3.5 shrink-0 text-[#1D9BF0] fill-current -ml-0.5" style={{ overflow: 'visible' }}><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" /></svg>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{formatDate(c.createdAt, t, lang)}</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.03] backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all group/comment">
                      {editingCommentId === c._id ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            id={`edit-comment-${c._id}`}
                            name="edit-comment"
                            aria-label="Edit comment"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--gold-primary)]/50 min-h-[60px] resize-none"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(c._id, editText)} className="bg-[var(--gold-primary)] px-3 py-1 rounded-lg text-[9px] font-black text-black transition-colors uppercase">{t('SAVE') || "SAVE"}</button>
                            <button onClick={() => setEditingCommentId(null)} className="bg-white/5 px-3 py-1 rounded-lg text-[9px] font-black text-gray-400 transition-colors uppercase">{t('CANCEL') || "CANCEL"}</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {c.text && <p className="text-white text-sm leading-snug break-words whitespace-pre-wrap">{c.text}</p>}
                          {c.audioUrl && (
                            <div className="mt-2 flex items-center justify-start max-w-[280px]">
                              <VoiceNotePlayer src={resolveMediaUrl(c.audioUrl)} t={t} />
                            </div>
                          )}

                          <div className="flex gap-3 mt-3 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                            {canEdit && (
                              <button
                                onClick={() => { setEditingCommentId(c._id); setEditText(c.text || ''); }}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-[0_4px_15px_rgba(59,130,246,0.4)] transition-all hover:scale-105 active:scale-95"
                              >
                                <Icons.Edit className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">{t('EDIT') || "EDIT"}</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(c._id)}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-[0_4px_15px_rgba(220,38,38,0.4)] transition-all hover:scale-105 active:scale-95"
                              >
                                <Icons.Trash className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">{t('DELETE') || "DELETE"}</span>
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

      {/* Sticky Input Field - DISABLED PER FOUNDER REQUEST FOR SHARED LINKS */}
      <div className="shrink-0 p-4 pb-[max(8rem,calc(env(safe-area-inset-bottom,20px)+90px))] sm:pb-12 bg-transparent text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 bg-black/40 py-4 px-4 border border-white/10 rounded-xl">
              {t('COMMENTS_DISABLED', 'INTEL LOGS ARE READ-ONLY FOR SHARED LINKS')}
          </div>
      </div>
    </div>
  );
};

export default CommentView;



