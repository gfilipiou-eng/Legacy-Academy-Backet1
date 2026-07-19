import React, { useState, useEffect } from 'react';
import axios from '../api';
import { Icons } from './Icons';

export const CartelView = ({ cartel, user, onBack, t, onCreatePost, PostCard }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [memberCount, setMemberCount] = useState(0);
    const [isEditOpen, setIsEditOpen] = useState(false);
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

    
    const handleDeleteCartel = async () => {
        if (!window.confirm("Are you sure you want to completely delete this Cartel? All posts will be lost forever.")) return;
        try {
            await axios.delete(`/cartels/${cartel._id}`);
            onBack(); // Go back to cartels list
            window.location.reload(); // Quick refresh to clear it from list
        } catch (err) {
            console.error(err);
            alert("Error deleting cartel");
        }
    };

    const handleJoin = async () => {
        let enteredPin = "";
        // If joining and cartel is private, ask for PIN
        if (!isMember && cartel.isPrivate) {
            enteredPin = prompt(t('CARTELS_ENTER_PIN', 'This cartel is private. Please enter the PIN to join:'));
            if (enteredPin === null) return; // User cancelled
        }

        const previousIsMember = isMember;
        // Only optimistic update if LEAVING or if PUBLIC joining.
        // For private joining, wait for server response to verify PIN.
        if (isMember || !cartel.isPrivate) {
            setIsMember(!isMember);
            setMemberCount(prev => !isMember ? prev + 1 : prev - 1);
        }

        try {
            await axios.post(`/cartels/${cartel._id}/join`, { pin: enteredPin });
            if (!isMember && cartel.isPrivate) {
                // If it was private, update state after success
                setIsMember(true);
                setMemberCount(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
            if (isMember || !cartel.isPrivate) {
                setIsMember(previousIsMember);
                setMemberCount(prev => previousIsMember ? prev + 1 : prev - 1);
            }
            alert(err.response?.data || "Error joining/leaving cartel");
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#050505] z-[2000] fixed inset-0 overflow-y-auto pb-8">
            {/* Mafia / Weapons Background Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595590424283-b8f1784cb2c2?q=80&w=1080&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>
            <div className="relative z-10 flex-1 flex flex-col">
            <div className="relative w-full h-48 sm:h-64 bg-black shrink-0">
                {cartel.coverImage ? (
                    <img src={cartel.coverImage} alt="Cover" className="w-full h-full object-cover opacity-50" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#111] to-[#222]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--app-bg)] to-transparent" />
                
                <button onClick={onBack} className="absolute top-4 sm:top-6 left-4 sm:left-6 mt-[env(safe-area-inset-top)] z-50 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/10 transition border border-white/20 shadow-xl">
                    <Icons.ArrowLeft className="w-5 h-5" />
                </button>
                
                

                        {isCreator && (
                            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 mt-[env(safe-area-inset-top)] z-50 flex gap-2">
                                <button onClick={() => setIsEditOpen(true)} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 flex items-center justify-center text-white text-xs font-bold tracking-widest hover:bg-white/20 transition">
                                    {t('CARTELS_EDIT', 'Edit')}
                                </button>
                                <button onClick={handleDeleteCartel} className="bg-red-600/80 backdrop-blur-md rounded-xl px-3 py-2 flex items-center justify-center text-white text-xs font-bold tracking-widest hover:bg-red-500 transition">
                                    {t('CARTELS_DELETE', 'Delete')}
                                </button>
                            </div>
                        )}


                <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black border-2 border-[var(--gold-primary)] overflow-hidden shrink-0 shadow-xl">
                        {cartel.image ? (
                            <img src={cartel.image} alt={cartel.name} className="w-full h-full object-cover object-center bg-black" />
                        ) : (
                            <Icons.Users className="w-10 h-10 m-5 text-[var(--gold-primary)]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                        <h1 className="text-xl sm:text-3xl font-black text-white tracking-widest truncate shadow-black drop-shadow-md flex items-center gap-2">
                            {cartel.name}
                            {cartel.isPrivate && <Icons.Lock className="w-5 h-5 text-red-500" />}
                        </h1>
                        <p className="text-[var(--gold-primary)] font-bold text-sm tracking-wider  drop-shadow-md">
                            {memberCount} {t('CARTELS_MEMBERS', 'Members')}
                        </p>
                    </div>
                    <button onClick={handleJoin} className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black tracking-widest text-xs transition-all ${isMember ? 'bg-white/10 text-white border border-white/20' : 'bg-[var(--gold-primary)] text-black shadow-lg hover:scale-105'}`}>
                        {isMember ? t('CARTELS_LEAVE', 'Leave') : t('CARTELS_JOIN', 'Join')}
                    </button>
                </div>
            </div>

            <div className="px-4 py-4">
                <p className="text-white/70 text-sm font-medium leading-relaxed">{cartel.description || t('CARTELS_WELCOME_DESC', 'Welcome to the cartel.')}</p>
            </div>

            {isMember ? null : (
                <div className="px-4 py-6 text-center border-t border-white/5 mt-4">
                    <Icons.Lock className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50 font-bold  tracking-widest text-xs">{t('CARTELS_JOIN_TO_VIEW', 'Join cartel to view and post intel')}</p>
                </div>
            )}

                        {isMember && (
                <div className="px-4 py-3 mb-4 flex items-center gap-3 bg-[#111] border border-white/5 rounded-2xl mx-4 mt-6 cursor-pointer hover:bg-white/5 transition"
                    onClick={() => onCreatePost(cartel._id)}
                >
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {user?.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : <Icons.User className="w-5 h-5 text-gray-500" />}
                    </div>
                    <div className="text-gray-500 font-bold uppercase tracking-widest text-xs flex-1 text-left">
                        {t('DECRYPT_PH', 'Decrypt your thoughts...')}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Icons.Image className="w-5 h-5" />
                    </div>
                </div>
            )}
            {isMember && (
                <div className="flex-1">
                    {loading ? (
                        <div className="flex justify-center py-10"><Icons.Loader className="w-8 h-8 text-[var(--gold-primary)] animate-spin" /></div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-white/40 font-bold  tracking-widest text-xs">{t('CARTELS_NO_INTEL', 'No intel posted yet.')}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {posts.map(post => (
                                <PostCard key={post._id} post={post} user={user} t={t} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

            
            
            {isEditOpen && <EditCartelModal t={t} cartel={cartel} onClose={() => setIsEditOpen(false)} onUpdated={(c) => { 
                // A quick reload is easiest, or we could pass an onUpdate callback
                window.location.reload(); 
            }} />}

        </div>
    );
};


import { motion, AnimatePresence } from 'framer-motion';


const CartelMessage = ({ post, user, allUsers, onViewProfile }) => {
    const author = allUsers.find(u => u._id === post.userId) || post.userId || {};
    const isMe = author._id === user._id;

    return (
        <div className={`flex w-full mb-6 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                    <div className="flex items-center gap-2 px-2 cursor-pointer" onClick={() => onViewProfile(author)}>
                        <img src={author.profilePic || 'https://via.placeholder.com/150'} className="w-7 h-7 rounded-full object-cover border border-white/20" />
                        <span className="text-[11px] text-white/50 font-black tracking-widest uppercase">{author.username || 'Unknown'}</span>
                    </div>
                )}
                <div className={`p-4 rounded-3xl shadow-xl ${isMe ? 'bg-[var(--gold-primary)] text-black rounded-tr-sm' : 'bg-[#1a1a1a] border border-white/5 text-white rounded-tl-sm'}`}>
                    {post.imageUrl && (
                        <img src={post.imageUrl} className="w-full max-h-72 object-cover rounded-2xl mb-3 border border-black/10" />
                    )}
                    {post.desc && (
                        <p className="text-[15px] font-bold whitespace-pre-wrap leading-relaxed break-words">{post.desc}</p>
                    )}
                </div>
                <div className="text-[10px] text-white/30 font-bold px-2">
                    {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
        </div>
    );
};

const EditCartelModal = ({ onClose, onUpdated, cartel, t }) => {
    const [name, setName] = useState(cartel.name || '');
    const [desc, setDesc] = useState(cartel.description || '');
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState(cartel.image || '');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            alert(err.response?.data || "Error updating cartel");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[20000] flex items-stretch sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div 
                initial={{ scale: 0.95, y: 100 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.95, y: 100 }}
                className="relative w-full max-w-full sm:max-w-md bg-[#0a0a0a] sm:bg-[#111] border-0 sm:border border-white/10 shadow-2xl p-5 sm:p-6 rounded-none sm:rounded-3xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
            >
                {/* Header matching CreateModal */}
                <div className="flex-none flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                    <button type="button" onClick={onClose} className="sm:hidden text-sm font-semibold text-gray-400 hover:text-white transition-colors duration-200">
                        {t('CANCEL', 'Cancel')}
                    </button>
                    <h2 className="text-lg sm:text-xl font-black italic text-white uppercase tracking-tighter">{t('CARTELS_EDIT', 'Edit Cartel')}</h2>
                    <button type="button" disabled={loading} onClick={handleSubmit} className="sm:hidden px-3 py-1.5 bg-[var(--gold-primary)] hover:opacity-90 disabled:opacity-50 text-black font-black text-xs uppercase tracking-normal rounded-full shadow-md transition-all duration-200 whitespace-nowrap shrink-0">
                        {loading ? '...' : t('CARTELS_EDIT', 'Edit')}
                    </button>
                    <button type="button" onClick={onClose} className="hidden sm:flex p-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors duration-200">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4 flex flex-col gap-4">
                    <form onSubmit={handleSubmit} id="cartelForm" className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{t('CARTELS_NAME', 'Cartel Name')}</label>
                            <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none" placeholder="e.g. The Syndicate" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{t('CARTELS_DESC', 'Description')}</label>
                            <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-[1.5rem] p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none min-h-[100px] resize-none custom-scrollbar" placeholder="What is this cartel about?" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{t('CARTELS_IMAGE', 'Image (Upload or URL)')}</label>
                            {/* PREVIEW AREA */}
                            {(imageFile || imageUrl) && (
                                <div className="relative w-full h-40 sm:h-48 rounded-2xl overflow-hidden bg-black/50 border border-white/10 mb-2">
                                    
                                    <img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" />
                                    <img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} className="relative z-10 w-full h-full object-contain" />
    
                                    <button type="button" onClick={() => { setImageFile(null); setImageUrl(''); }} className="absolute top-2 right-2 p-2 bg-black/80 rounded-full hover:bg-red-500 transition-colors">
                                        <Icons.X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={e => { if(e.target.files[0]) { setImageFile(e.target.files[0]); setImageUrl(''); } }} className="hidden" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-black/50 border border-white/10 rounded-2xl p-4 text-white hover:bg-white/5 text-sm flex justify-center items-center gap-2">
                                    <Icons.Image className="w-5 h-5" />
                                    {imageFile ? imageFile.name : t('CARTELS_UPLOAD_IMG', 'Upload Image')}
                                </button>
                                
                            </div>
                            {!imageFile && !imageUrl && (
                                <input type="text" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none mt-2" placeholder="Or paste image URL..." />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{t('CARTELS_PIN', 'Secret PIN (Optional)')}</label>
                            <input type="text" value={pin} onChange={e=>setPin(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none" placeholder="Enter PIN..." />
                        </div>
                        
                        <div className="hidden sm:block mt-4">
                            <button disabled={loading} type="submit" form="cartelForm" className="w-full bg-[var(--gold-primary)] text-black font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-transform disabled:opacity-50">
                                {loading ? '...' : t('CARTELS_EDIT', 'Edit')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};