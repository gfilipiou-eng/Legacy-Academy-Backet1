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
        <div className="w-full h-full flex flex-col bg-[#050505] z-[9999] fixed inset-0 overflow-y-auto pb-8">
            {/* Mafia / Weapons Background Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595590424283-b8f1784cb2c2?q=80&w=1080&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>
            <div className="relative z-10 flex-1 flex flex-col">
            <div className="relative w-full h-48 sm:h-64 bg-black">
                {cartel.coverImage ? (
                    <img src={cartel.coverImage} alt="Cover" className="w-full h-full object-cover opacity-50" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#111] to-[#222]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--app-bg)] to-transparent" />
                
                <button onClick={onBack} className="absolute top-[calc(env(safe-area-inset-top)+1rem)] left-4 z-50 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/10 transition border border-white/20 shadow-xl">
                    <Icons.ArrowLeft className="w-5 h-5" />
                </button>
                
                

                        {isCreator && (
                            <div className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-4 z-50 flex gap-2">
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
                            <img src={cartel.image} alt={cartel.name} className="w-full h-full object-cover" />
                        ) : (
                            <Icons.Users className="w-10 h-10 m-5 text-[var(--gold-primary)]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-widest truncate shadow-black drop-shadow-md flex items-center gap-2">
                            {cartel.name}
                            {cartel.isPrivate && <Icons.Lock className="w-5 h-5 text-red-500" />}
                        </h1>
                        <p className="text-[var(--gold-primary)] font-bold text-sm tracking-wider  drop-shadow-md">
                            {memberCount} {t('CARTELS_MEMBERS', 'Members')}
                        </p>
                    </div>
                    <button onClick={handleJoin} className={`px-6 py-2.5 rounded-xl font-black  tracking-widest text-xs transition-all ${isMember ? 'bg-white/10 text-white border border-white/20' : 'bg-[var(--gold-primary)] text-black shadow-lg hover:scale-105'}`}>
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

            {isMember && (
                <button 
                    onClick={() => onCreatePost(cartel._id)} 
                    className="fixed bottom-[calc(env(safe-area-inset-bottom)+20px)] right-4 sm:right-10 z-[100] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600/90 backdrop-blur-xl border border-white/20 shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-300"
                >
                    <Icons.Upload className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-md" />
                </button>
            )}
            
            {isEditOpen && <EditCartelModal t={t} cartel={cartel} onClose={() => setIsEditOpen(false)} onUpdated={(c) => { 
                // A quick reload is easiest, or we could pass an onUpdate callback
                window.location.reload(); 
            }} />}

        </div>
    );
};


import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 pt-[100px] pb-[100px]">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><Icons.X className="w-6 h-6" /></button>
                <h2 className="text-xl font-black text-white tracking-widest mb-6">{t('CARTELS_EDIT', 'Edit Cartel')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-white/50 tracking-widest mb-2">{t('CARTELS_NAME', 'Cartel Name')}</label>
                        <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white/50 tracking-widest mb-2">{t('CARTELS_DESC', 'Description')}</label>
                        <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none resize-none h-24" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white/50 tracking-widest mb-2">{t('CARTELS_IMAGE', 'Image (Upload or URL)')}</label>
                        <div className="flex gap-2 mb-2">
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={e => { if(e.target.files[0]) { setImageFile(e.target.files[0]); setImageUrl(''); } }} className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white hover:bg-white/10 text-sm flex justify-center items-center gap-2">
                                <Icons.Image className="w-5 h-5" />
                                {imageFile ? imageFile.name : t('CARTELS_UPLOAD_IMG', 'Upload Image')}
                            </button>
                            {imageFile && <button type="button" onClick={() => setImageFile(null)} className="p-3 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500/40"><Icons.X className="w-5 h-5"/></button>}
                        </div>
                        {!imageFile && (
                            <input type="text" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none text-sm" />
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white/50 tracking-widest mb-2">{t('CARTELS_PIN', 'Secret PIN (Optional)')}</label>
                        <input type="text" value={pin} onChange={e=>setPin(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none" placeholder="Enter new PIN..." />
                    </div>
                    <button disabled={loading} type="submit" className="w-full bg-[var(--gold-primary)] text-black font-black tracking-widest py-4 rounded-xl mt-4 active:scale-95 transition-transform disabled:opacity-50">
                        {loading ? '...' : t('CARTELS_EDIT', 'Edit')}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
