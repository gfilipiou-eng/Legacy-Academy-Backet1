import React, { useState, useEffect } from 'react';
import axios from '../api';
import { Icons } from './Icons';

export const CartelView = ({ cartel, user, onBack, t, onCreatePost, PostCard }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [memberCount, setMemberCount] = useState(0);
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
        try {
            await axios.post(`/cartels/${cartel._id}/join`);
            setIsMember(!isMember);
            setMemberCount(prev => isMember ? prev - 1 : prev + 1);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#050505] z-30 absolute inset-0 overflow-y-auto pb-24">
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
                
                <button onClick={onBack} className="absolute top-safe-4 left-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/10 transition">
                    <Icons.ArrowLeft className="w-5 h-5" />
                </button>
                
                
                        {isCreator && (
                            <button onClick={handleDeleteCartel} className="absolute top-safe-4 right-4 z-10 bg-red-600/80 backdrop-blur-md rounded-xl px-3 py-2 flex items-center justify-center text-white text-xs font-bold tracking-widest hover:bg-red-500 transition">
                                {t('CARTELS_DELETE', 'Delete')}
                            </button>
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
                        <h1 className="text-2xl sm:text-3xl font-black text-white  tracking-widest truncate shadow-black drop-shadow-md">
                            {cartel.name}
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
                <p className="text-white/70 text-sm font-medium leading-relaxed">{cartel.description || 'Welcome to the cartel.'}</p>
            </div>

            {isMember ? (
                <div className="px-4 py-2 mb-4">
                    <button onClick={() => onCreatePost(cartel._id)} className="w-full relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all border border-red-900/50 shadow-2xl shadow-red-900/20 bg-gradient-to-b from-[#1a0505] to-[#0a0000]">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <Icons.Upload className="w-10 h-10 text-red-600 mb-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                        <span className="font-black  tracking-[0.3em] text-white text-sm drop-shadow-md z-10">{t('CARTELS_UPLOAD_INTEL', 'UPLOAD INTEL')}</span>
                        <span className="text-red-500/70 text-[10px]  tracking-widest font-bold z-10">{t('CARTELS_SECURE_CHANNEL', 'Secure Encrypted Channel')}</span>
                    </button>
                </div>
            ) : (
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
        </div>
    );
};
