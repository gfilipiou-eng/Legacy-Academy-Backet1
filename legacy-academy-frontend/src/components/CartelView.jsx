import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import axios from '../api';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Shared Cartel Post Modal (used for both Create and Edit) ─────────────── */
const CartelPostModal = ({ cartel, user, t, onClose, onPosted, editPost = null }) => {
    const isEdit = !!editPost;
    const [desc, setDesc] = useState(editPost?.desc || '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(editPost?.image || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileRef = useRef(null);

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (isSubmitting || (!desc.trim() && !imageFile && !imagePreview)) return;
        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('desc', desc);
            if (!isEdit) fd.append('cartelId', cartel._id);
            if (imageFile) fd.append('image', imageFile);

            let res;
            if (isEdit) {
                res = await axios.put(`/posts/${editPost._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                res = await axios.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            onPosted(res.data, isEdit);
            onClose();
        } catch (e) {
            console.error(e);
            alert(t('POST_FAILED', 'Transmission Failed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return ReactDOM.createPortal(
      (
        <div className="fixed inset-0 z-[99999] flex items-stretch sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.95, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 100 }}
                className="relative w-full max-w-full sm:max-w-md bg-[#0a0a0a] sm:bg-[#111] border-0 sm:border border-white/10 shadow-2xl px-5 sm:px-6 rounded-none sm:rounded-3xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden"
                style={{ paddingTop: 'max(1.25rem, calc(env(safe-area-inset-top, 0px) + 8px))', paddingBottom: '1.25rem' }}
            >
                {/* Header */}
                <div className="flex-none flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                    <button type="button" onClick={onClose} className="sm:hidden text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                        {t('CANCEL', 'Cancel')}
                    </button>
                    <h2 className="text-lg sm:text-xl font-black italic text-white uppercase tracking-tighter">
                        {isEdit ? t('EDIT_POST', 'Edit') : t('UPLOAD_TITLE', 'Post Intel')}
                    </h2>
                    <button
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                        className="sm:hidden px-2.5 py-1.5 bg-[var(--gold-primary)] hover:opacity-90 disabled:opacity-50 text-black font-black text-[10px] uppercase tracking-normal rounded-full shadow-md transition-all whitespace-nowrap shrink-0"
                    >
                        {isSubmitting ? '...' : (isEdit ? t('SAVE', 'Save') : t('POST', 'Post'))}
                    </button>
                    <button onClick={onClose} className="hidden sm:flex p-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-28 sm:pb-4 flex flex-col gap-4">
                    {/* User row */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative shrink-0 rounded-full overflow-hidden bg-white/5">
                            {user?.profilePic
                                ? <img src={user.profilePic} className="w-full h-full object-cover" alt="" />
                                : <Icons.User className="w-5 h-5 m-2.5 text-gray-500" />}
                        </div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{user?.username}</span>
                    </div>

                    {/* Textarea */}
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" /> {t('DESCRIPTION', 'Description')}
                        </div>
                        <div className="relative">
                            <textarea
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                maxLength={300}
                                placeholder={t('DECRYPT_PH', 'Decrypt your thoughts...')}
                                className="w-full bg-black/50 border border-white/10 rounded-[1.5rem] px-5 py-4 text-[15px] text-white outline-none min-h-[140px] resize-none placeholder-gray-600 transition-all duration-300 custom-scrollbar font-bold break-words whitespace-pre-wrap focus:border-[var(--gold-primary)]"
                            />
                            <div className="absolute bottom-3 right-4 text-[10px] font-black text-gray-500 uppercase tracking-widest pointer-events-none">
                                {desc.length} / 300
                            </div>
                        </div>
                    </div>

                    {/* Image preview */}
                    {imagePreview && (
                        <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/10">
                            <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" alt="" />
                            <img src={imagePreview} className="relative z-10 w-full max-h-72 object-contain" alt="preview" />
                            <button
                                type="button"
                                onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                                className="absolute top-2 right-2 z-20 p-2 bg-black/80 rounded-full hover:bg-red-500 transition-colors"
                            >
                                <Icons.X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    )}

                    {/* Upload button */}
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold-primary)]" /> {t('ADD_MEDIA', 'Add Media')}
                        </div>
                        <input type="file" accept="image/*,video/*" ref={fileRef} onChange={handleFile} className="hidden" />
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="w-full bg-black/50 border border-dashed border-white/20 rounded-2xl p-4 text-white hover:bg-white/5 hover:border-[var(--gold-primary)] transition-all text-sm flex justify-center items-center gap-2 font-bold"
                        >
                            <Icons.Image className="w-5 h-5 text-[var(--gold-primary)]" />
                            {imageFile ? imageFile.name : t('UPLOAD_MEDIA', 'Upload Image / Video')}
                        </button>
                    </div>
                </div>

                {/* Desktop submit */}
                <div className="hidden sm:block flex-none pt-4 border-t border-white/5 mt-2">
                    <button
                        disabled={isSubmitting || (!desc.trim() && !imageFile && !imagePreview)}
                        onClick={handleSubmit}
                        className="w-full bg-[var(--gold-primary)] text-black font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-transform disabled:opacity-40"
                    >
                        {isSubmitting ? '...' : (isEdit ? t('SAVE', 'Save Changes') : t('POST', 'Post Intel'))}
                    </button>
                </div>
            </motion.div>
        </div>
      ), document.body
    );
};

/* ─── Edit Cartel Modal ────────────────────────────────────────────────────── */
const EditCartelModal = ({ onClose, onUpdated, cartel, t }) => {
    const [name, setName] = useState(cartel.name || '');
    const [desc, setDesc] = useState(cartel.description || '');
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState(cartel.image || '');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!name.trim()) return;
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', desc);
            if (imageFile) {
                formData.append('image', imageFile);
            } else if (imageUrl) {
                formData.append('image', imageUrl);
            }
            if (pin.trim()) formData.append('pin', pin);
            const res = await axios.put(`/cartels/${cartel._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            onUpdated(res.data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data || 'Error updating cartel');
        } finally {
            setLoading(false);
        }
    };

    const previewSrc = imageFile ? URL.createObjectURL(imageFile) : imageUrl;

    return ReactDOM.createPortal(
      (
        <div className="fixed inset-0 z-[99999] flex items-stretch sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.95, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 100 }}
                className="relative w-full max-w-full sm:max-w-md bg-[#0a0a0a] sm:bg-[#111] border-0 sm:border border-white/10 shadow-2xl px-5 sm:px-6 rounded-none sm:rounded-3xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden"
                style={{ paddingTop: 'max(1.25rem, calc(env(safe-area-inset-top, 0px) + 8px))', paddingBottom: '1.25rem' }}
            >
                <div className="flex-none flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                    <button type="button" onClick={onClose} className="sm:hidden text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                        {t('CANCEL', 'Cancel')}
                    </button>
                    <h2 className="text-lg sm:text-xl font-black italic text-white uppercase tracking-tighter">{t('CARTELS_EDIT', 'Edit Cartel')}</h2>
                    <button type="button" disabled={loading} onClick={handleSubmit} className="sm:hidden px-3 py-1.5 bg-[var(--gold-primary)] hover:opacity-90 disabled:opacity-50 text-black font-black text-xs uppercase tracking-normal rounded-full shadow-md transition-all whitespace-nowrap shrink-0">
                        {loading ? '...' : t('CARTELS_SAVE', 'Save')}
                    </button>
                    <button type="button" onClick={onClose} className="hidden sm:flex p-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-28 sm:pb-4 flex flex-col gap-4">
                    <form onSubmit={handleSubmit} id="editCartelForm" className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{t('CARTELS_NAME', 'Cartel Name')}</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none" placeholder="e.g. The Syndicate" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{t('CARTELS_DESC', 'Description')}</label>
                            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-[1.5rem] p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none min-h-[100px] resize-none custom-scrollbar" placeholder="What is this cartel about?" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{t('CARTELS_IMAGE', 'Cover Image')}</label>
                            {previewSrc && (
                                <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/10 mb-2">
                                    <img src={previewSrc} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" alt="" />
                                    <img src={previewSrc} className="relative z-10 w-full max-h-56 object-contain" alt="preview" />
                                    <button type="button" onClick={() => { setImageFile(null); setImageUrl(''); }} className="absolute top-2 right-2 z-20 p-2 bg-black/80 rounded-full hover:bg-red-500 transition-colors">
                                        <Icons.X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={e => { if (e.target.files[0]) { setImageFile(e.target.files[0]); setImageUrl(''); } }} className="hidden" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-black/50 border border-dashed border-white/20 rounded-2xl p-4 text-white hover:bg-white/5 hover:border-[var(--gold-primary)] transition-all text-sm flex justify-center items-center gap-2 font-bold">
                                    <Icons.Image className="w-5 h-5 text-[var(--gold-primary)]" />
                                    {imageFile ? imageFile.name : t('CARTELS_UPLOAD_IMG', 'Upload Image')}
                                </button>
                            </div>
                            {!imageFile && (
                                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none" placeholder="Or paste image URL..." />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                {t('CARTELS_PIN', 'Secret PIN')}
                                {cartel.isPrivate && (
                                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-[9px] font-black tracking-widest">
                                        ● PIN SET
                                    </span>
                                )}
                            </label>
                            <input
                                type={cartel.isPrivate && pin === '' ? "password" : "text"}
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none"
                                placeholder={cartel.isPrivate ? '•••••••• (Type to change PIN)' : 'Set a secret PIN...'}
                            />
                            {cartel.isPrivate && pin === '' && (
                                <p className="text-[10px] text-amber-400/70 font-bold pl-1">⚠ Leave blank to keep existing PIN</p>
                            )}
                        </div>
                        <div className="mt-4">
                            <button disabled={loading} type="submit" form="editCartelForm" className="w-full bg-[var(--gold-primary)] text-black font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-transform disabled:opacity-50">
                                {loading ? '...' : t('CARTELS_SAVE', 'Save Changes')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
      ), document.body
    );
};

/* ─── GTA-Style Mission Board Post Card ─────────────────────────────────── */
const CartelPostCard = ({ post, user, onEdit, onDelete, t }) => {
    const author = post.author || {};
    const isMe = String(author._id || author) === String(user?._id);
    const [showMenu, setShowMenu] = useState(false);

    // Military-style timestamp
    const d = new Date(post.createdAt);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();

    return (
        <div className="w-full px-3 sm:px-4 mb-4">
            {/* GTA Mission Board Card */}
            <div className={`relative rounded-2xl overflow-hidden border ${
                isMe
                    ? 'border-[var(--gold-primary)]/40 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                    : 'border-white/8'
            } bg-[#0d0d0d]`}>

                {/* Top accent stripe */}
                <div className={`h-[3px] w-full ${
                    isMe
                        ? 'bg-gradient-to-r from-[var(--gold-primary)] to-amber-500'
                        : 'bg-gradient-to-r from-red-700 to-red-900'
                }`} />

                {/* Card body */}
                <div className="p-4">
                    {/* Header row: avatar + name + timestamp + menu */}
                    <div className="flex items-start gap-3 mb-3">
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/10">
                                {author.profilePic
                                    ? <img src={author.profilePic} className="w-full h-full object-cover" alt="" />
                                    : <Icons.User className="w-5 h-5 m-2.5 text-gray-500" />}
                            </div>
                            {/* Online indicator dot */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0d0d0d]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[11px] font-black tracking-widest uppercase ${
                                    isMe ? 'text-[var(--gold-primary)]' : 'text-white'
                                }`}>
                                    {author.username || 'AGENT'}
                                </span>
                                {isMe && (
                                    <span className="px-1.5 py-0.5 bg-[var(--gold-primary)]/15 border border-[var(--gold-primary)]/30 rounded text-[8px] font-black text-[var(--gold-primary)] tracking-widest">YOU</span>
                                )}
                                {author.role && author.role !== 'user' && (
                                    <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[8px] font-black text-red-400 tracking-widest uppercase">{author.role}</span>
                                )}
                            </div>
                            <div className="text-[9px] text-white/25 font-bold tracking-widest mt-0.5">
                                {timeStr} · {dateStr}
                            </div>
                        </div>
                        {/* Edit/Delete menu */}
                        {isMe && (
                            <div className="relative shrink-0">
                                <button
                                    onClick={() => setShowMenu(v => !v)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition"
                                >
                                    <Icons.MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                                {showMenu && (
                                    <div className="absolute top-8 right-0 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[130px] z-20">
                                        <button
                                            onClick={() => { setShowMenu(false); onEdit(post); }}
                                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-white hover:bg-white/10 transition font-bold"
                                        >
                                            <Icons.Edit className="w-4 h-4 text-[var(--gold-primary)]" />
                                            {t('EDIT_POST', 'Edit')}
                                        </button>
                                        <button
                                            onClick={() => { setShowMenu(false); onDelete(post._id); }}
                                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition font-bold"
                                        >
                                            <Icons.Trash className="w-4 h-4" />
                                            {t('DELETE', 'Delete')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Media */}
                    {(post.image || post.videoUrl) && (
                        <div className="relative w-full rounded-xl overflow-hidden bg-black mb-3 border border-white/5">
                            <img className="absolute inset-0 w-full h-full object-cover opacity-10 blur-sm scale-110" src={post.image} alt="" aria-hidden />
                            {post.videoUrl
                                ? <video src={post.videoUrl} className="relative z-10 w-full max-h-72 object-contain" controls />
                                : <img src={post.image} className="relative z-10 w-full max-h-72 object-contain" alt="" />}
                        </div>
                    )}

                    {/* Text content */}
                    {post.desc && (
                        <p className="text-[14px] text-white/90 font-medium whitespace-pre-wrap leading-relaxed break-words">{post.desc}</p>
                    )}

                    {/* Bottom classified bar */}
                    <div className={`mt-3 pt-2.5 border-t flex items-center justify-between ${
                        isMe ? 'border-[var(--gold-primary)]/15' : 'border-white/5'
                    }`}>
                        <span className={`text-[8px] font-black tracking-[0.2em] uppercase opacity-40 ${
                            isMe ? 'text-[var(--gold-primary)]' : 'text-red-500'
                        }`}>
                            {isMe ? '◆ INTEL TRANSMITTED' : '◆ CLASSIFIED INTEL'}
                        </span>
                        <div className="flex gap-1">
                            {[1,2,3].map(i => <div key={i} className={`w-1 h-1 rounded-full opacity-30 ${ isMe ? 'bg-[var(--gold-primary)]' : 'bg-red-500'}`} />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── Main CartelView ─────────────────────────────────────────────────────── */
export const CartelView = ({ cartel, user, onBack, t }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [memberCount, setMemberCount] = useState(0);
    const [isEditCartelOpen, setIsEditCartelOpen] = useState(false);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const isCreator = user && cartel.creator && (user._id === cartel.creator._id || user._id === cartel.creator);

    useEffect(() => {
        if (!cartel) return;
        setIsMember(cartel.members?.includes(user._id));
        setMemberCount(cartel.members?.length || 0);
        fetchPosts();
    }, [cartel, user]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/cartels/${cartel._id}/posts`);
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePostSaved = (savedPost, isEdit) => {
        if (isEdit) {
            setPosts(prev => prev.map(p => p._id === savedPost._id ? savedPost : p));
        } else {
            setPosts(prev => [savedPost, ...prev]);
        }
        setEditingPost(null);
    };

    const handleDeletePost = async (postId) => {
        // removed confirmation prompt
        try {
            await axios.delete(`/posts/${postId}`);
            setPosts(prev => prev.filter(p => p._id !== postId));
        } catch (err) {
            console.error(err);
            alert('Error deleting post');
        }
    };

    const handleDeleteCartel = async () => {
        try {
            await axios.delete(`/cartels/${cartel._id}`);
            onBack();
        } catch (err) {
            console.error(err);
            alert('Error deleting cartel');
        }
    };

    const handleJoin = async () => {
        let enteredPin = '';
        if (!isMember && cartel.isPrivate) {
            enteredPin = prompt(t('CARTELS_ENTER_PIN', 'This cartel is private. Please enter the PIN to join:'));
            if (enteredPin === null) return;
        }
        const previousIsMember = isMember;
        if (isMember || !cartel.isPrivate) {
            setIsMember(!isMember);
            setMemberCount(prev => !isMember ? prev + 1 : prev - 1);
        }
        try {
            await axios.post(`/cartels/${cartel._id}/join`, { pin: enteredPin });
            if (!isMember && cartel.isPrivate) {
                setIsMember(true);
                setMemberCount(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
            if (isMember || !cartel.isPrivate) {
                setIsMember(previousIsMember);
                setMemberCount(prev => previousIsMember ? prev + 1 : prev - 1);
            }
            alert(err.response?.data || 'Error joining/leaving cartel');
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#050505] z-[2000] fixed inset-0 overflow-y-auto pb-24">
            {/* Background overlays */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595590424283-b8f1784cb2c2?q=80&w=1080&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]" />

            <div className="relative z-10 flex-1 flex flex-col">
                {/* Cover Banner */}
                <div className="relative w-full h-48 sm:h-64 bg-black shrink-0">
                    {cartel.coverImage
                        ? <img src={cartel.coverImage} alt="Cover" className="w-full h-full object-cover opacity-50" />
                        : <div className="w-full h-full bg-gradient-to-br from-[#111] to-[#222]" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />

                    {/* Back button */}
                    <button onClick={onBack} className="absolute top-4 sm:top-6 left-4 sm:left-6 mt-[env(safe-area-inset-top)] z-50 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/10 transition border border-white/20 shadow-xl">
                        <Icons.ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* Creator controls */}
                    {isCreator && (
                        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 mt-[env(safe-area-inset-top)] z-50 flex gap-2">
                            <button onClick={() => setIsEditCartelOpen(true)} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 text-white text-xs font-bold tracking-widest hover:bg-white/20 transition">
                                {t('CARTELS_EDIT', 'Edit')}
                            </button>
                            <button onClick={handleDeleteCartel} className="bg-red-600/80 backdrop-blur-md rounded-xl px-3 py-2 text-white text-xs font-bold tracking-widest hover:bg-red-500 transition">
                                {t('CARTELS_DELETE', 'Delete')}
                            </button>
                        </div>
                    )}

                    {/* Avatar + info */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black border-2 border-[var(--gold-primary)] overflow-hidden shrink-0 shadow-xl">
                            {cartel.image
                                ? <img src={cartel.image} alt={cartel.name} className="w-full h-full object-cover" />
                                : <Icons.Users className="w-10 h-10 m-5 text-[var(--gold-primary)]" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                            <h1 className="text-xl sm:text-3xl font-black text-white tracking-widest truncate drop-shadow-md flex items-center gap-2">
                                {cartel.name}
                                {cartel.isPrivate && <Icons.Lock className="w-5 h-5 text-red-500" />}
                            </h1>
                            <p className="text-[var(--gold-primary)] font-bold text-sm tracking-wider drop-shadow-md">
                                {memberCount} {t('CARTELS_MEMBERS', 'Members')}
                            </p>
                        </div>
                        <button
                            onClick={handleJoin}
                            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black tracking-widest text-xs transition-all ${isMember ? 'bg-white/10 text-white border border-white/20' : 'bg-[var(--gold-primary)] text-black shadow-lg hover:scale-105'}`}
                        >
                            {isMember ? t('CARTELS_LEAVE', 'Leave') : t('CARTELS_JOIN', 'Join')}
                        </button>
                    </div>
                </div>

                {/* Description */}
                <div className="px-4 py-4">
                    <p className="text-white/70 text-sm font-medium leading-relaxed">{cartel.description || t('CARTELS_WELCOME_DESC', 'Welcome to the cartel.')}</p>
                </div>

                {/* Non-member lock */}
                {!isMember && (
                    <div className="px-4 py-6 text-center border-t border-white/5 mt-4">
                        <Icons.Lock className="w-8 h-8 text-white/20 mx-auto mb-3" />
                        <p className="text-white/50 font-bold tracking-widest text-xs">{t('CARTELS_JOIN_TO_VIEW', 'Join cartel to view and post intel')}</p>
                    </div>
                )}

                {/* Compose bar */}
                {isMember && (
                    <div
                        className="mx-4 mt-4 mb-2 px-4 py-3 flex items-center gap-3 bg-[#111] border border-white/8 rounded-2xl cursor-pointer hover:bg-white/5 transition active:scale-[0.98]"
                        onClick={() => setIsCreatePostOpen(true)}
                    >
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {user?.profilePic
                                ? <img src={user.profilePic} className="w-full h-full object-cover" alt="" />
                                : <Icons.User className="w-5 h-5 text-gray-500" />}
                        </div>
                        <div className="text-gray-500 font-bold uppercase tracking-widest text-xs flex-1 text-left">
                            {t('DECRYPT_PH', 'Decrypt your thoughts...')}
                        </div>
                        <Icons.Image className="w-5 h-5 text-[var(--gold-primary)]" />
                    </div>
                )}

                {/* Posts */}
                {isMember && (
                    <div className="flex-1 pt-4">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Icons.Loader className="w-8 h-8 text-[var(--gold-primary)] animate-spin" />
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-white/40 font-bold tracking-widest text-xs">{t('CARTELS_NO_INTEL', 'No intel posted yet.')}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col py-2">
                                {posts.map(post => (
                                    <CartelPostCard
                                        key={post._id}
                                        post={post}
                                        user={user}
                                        onEdit={(p) => setEditingPost(p)}
                                        onDelete={handleDeletePost}
                                        t={t}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isCreatePostOpen && (
                    <CartelPostModal
                        key="create"
                        cartel={cartel}
                        user={user}
                        t={t}
                        onClose={() => setIsCreatePostOpen(false)}
                        onPosted={(p) => handlePostSaved(p, false)}
                    />
                )}
                {editingPost && (
                    <CartelPostModal
                        key="edit"
                        cartel={cartel}
                        user={user}
                        t={t}
                        editPost={editingPost}
                        onClose={() => setEditingPost(null)}
                        onPosted={(p) => handlePostSaved(p, true)}
                    />
                )}
                {isEditCartelOpen && (
                    <EditCartelModal
                        key="editCartel"
                        t={t}
                        cartel={cartel}
                        onClose={() => setIsEditCartelOpen(false)}
                        onUpdated={(updatedCartel) => { 
                            setCartel(updatedCartel); 
                            setIsEditCartelOpen(false); 
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};