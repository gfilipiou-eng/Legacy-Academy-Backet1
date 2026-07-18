import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Icons } from './Icons';

export const CartelView = ({ cartel, user, onBack, t, onCreatePost, PostCard }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [memberCount, setMemberCount] = useState(0);

    useEffect(() => {
        if (!cartel) return;
        setIsMember(cartel.members?.includes(user._id));
        setMemberCount(cartel.members?.length || 0);
        fetchPosts();
    }, [cartel, user]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/cartels/${cartel._id}/posts`);
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        try {
            await axios.post(`/api/cartels/${cartel._id}/join`);
            setIsMember(!isMember);
            setMemberCount(prev => isMember ? prev - 1 : prev + 1);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[var(--app-bg)] z-30 absolute inset-0 overflow-y-auto pb-24">
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
                
                <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black border-2 border-[var(--gold-primary)] overflow-hidden shrink-0 shadow-xl">
                        {cartel.image ? (
                            <img src={cartel.image} alt={cartel.name} className="w-full h-full object-cover" />
                        ) : (
                            <Icons.Users className="w-10 h-10 m-5 text-[var(--gold-primary)]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-widest truncate shadow-black drop-shadow-md">
                            {cartel.name}
                        </h1>
                        <p className="text-[var(--gold-primary)] font-bold text-sm tracking-wider uppercase drop-shadow-md">
                            {memberCount} Members
                        </p>
                    </div>
                    <button onClick={handleJoin} className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${isMember ? 'bg-white/10 text-white border border-white/20' : 'bg-[var(--gold-primary)] text-black shadow-lg hover:scale-105'}`}>
                        {isMember ? 'Leave' : 'Join'}
                    </button>
                </div>
            </div>

            <div className="px-4 py-4">
                <p className="text-white/70 text-sm font-medium leading-relaxed">{cartel.description || 'Welcome to the cartel.'}</p>
            </div>

            {isMember ? (
                <div className="px-4 py-2 mb-4">
                    <button onClick={() => onCreatePost(cartel._id)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center gap-3 transition-colors text-left text-white/50">
                        <div className="w-8 h-8 rounded-full bg-[var(--gold-primary)]/20 flex items-center justify-center shrink-0">
                            <Icons.Plus className="w-4 h-4 text-[var(--gold-primary)]" />
                        </div>
                        <span className="font-bold uppercase tracking-wider text-xs">Post to {cartel.name}</span>
                    </button>
                </div>
            ) : (
                <div className="px-4 py-6 text-center border-t border-white/5 mt-4">
                    <Icons.Lock className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50 font-bold uppercase tracking-widest text-xs">Join cartel to view and post intel</p>
                </div>
            )}

            {isMember && (
                <div className="flex-1">
                    {loading ? (
                        <div className="flex justify-center py-10"><Icons.Loader className="w-8 h-8 text-[var(--gold-primary)] animate-spin" /></div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">No intel posted yet.</p>
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
    );
};
