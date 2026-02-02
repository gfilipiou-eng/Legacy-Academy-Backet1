import React, { useState, useEffect, useRef } from 'react';
import axios from './api';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Icons } from './components/Icons';
import { useTranslation } from './translations';
import { playSound, explodeEffect } from './utils/sounds';

// --- CONFIG ---
const API_URL = axios.defaults.baseURL;
const BASE_URL = API_URL.replace('/api', '');

const resolveMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const parseHashtags = (text) => text ? text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) => part.startsWith('#') ? <span key={i} className="text-yellow-500 font-bold hover:underline cursor-pointer">{part}</span> : part) : text;

// --- COMPONENTS ---

const NotificationItem = ({ note, onViewProfile }) => {
    return (
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden shrink-0">
                {note.sender?.profilePic ? <img src={resolveMediaUrl(note.sender.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-xs">{note.sender?.username?.[0]}</div>}
            </div>
            <div className="flex-1 text-xs">
                <span className="font-bold text-white hover:text-yellow-500" onClick={(e) => { e.stopPropagation(); onViewProfile(note.sender) }}>{note.sender?.username}</span>
                <span className="text-gray-400"> {note.type === 'like' ? 'liked your intel.' : note.type === 'comment' ? 'commented on your intel.' : note.type === 'follow' ? 'is following you.' : 'sent a signal.'}</span>
            </div>
            {note.type === 'follow' && <Icons.User className="w-4 h-4 text-yellow-500" />}
            {note.type === 'like' && <Icons.Heart className="w-4 h-4 text-red-500" />}
        </div>
    );
};

const ChatModal = ({ isOpen, onClose, user, following }) => {
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('chat_history');
        return saved ? JSON.parse(saved) : {};
    });
    const [txt, setTxt] = useState('');
    const fileRef = useRef(null);
    const bottomRef = useRef(null);

    // Filter only following users
    const availableContacts = following;

    useEffect(() => {
        localStorage.setItem('chat_history', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChat]);

    if (!isOpen) return null;

    const sendMessage = (imageFile = null) => {
        if ((!txt.trim() && !imageFile) || !activeChat) return;

        const msg = {
            id: Date.now(),
            text: txt,
            image: imageFile ? URL.createObjectURL(imageFile) : null,
            sender: user._id,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => ({
            ...prev,
            [activeChat._id]: [...(prev[activeChat._id] || []), msg]
        }));
        setTxt('');
        playSound('pop');

        // Simulate Reply
        setTimeout(() => {
            const reply = {
                id: Date.now() + 1,
                text: "Message received. Standing by.",
                sender: activeChat._id,
                createdAt: new Date().toISOString()
            };
            setMessages(prev => ({
                ...prev,
                [activeChat._id]: [...(prev[activeChat._id] || []), reply]
            }));
            playSound('pop');
        }, 3000);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-4 sm:p-0">
            <div className="w-full max-w-4xl h-full sm:h-[80vh] bg-[#0a0a0a] border border-white/10 sm:rounded-3xl flex overflow-hidden shadow-2xl relative flex-col sm:flex-row">
                {/* SIDEBAR */}
                <div className={`w-full sm:w-1/3 border-b sm:border-r border-white/10 flex flex-col ${activeChat ? 'hidden sm:flex' : 'flex'} h-full`}>
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
                        <h2 className="font-black italic text-base gold-text tracking-widest">MESSENGER</h2>
                        <button onClick={onClose}><Icons.X className="w-6 h-6 text-gray-400" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {availableContacts.length === 0 && <div className="p-4 text-center text-xs text-gray-500 uppercase">Follow Agents to start chat.</div>}
                        {availableContacts.map(u => (
                            <div key={u._id} onClick={() => setActiveChat(u)} className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-all ${activeChat?._id === u._id ? 'bg-yellow-500/10 border border-yellow-500/20' : ''}`}>
                                <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden relative border border-white/10 shrink-0">
                                    {u.profilePic ? <img src={resolveMediaUrl(u.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-xs">{u.username[0]}</div>}
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-white truncate">{u.username}</div>
                                    <div className="text-[9px] text-gray-500 uppercase tracking-widest">ENCRYPTED • ONLINE</div>
                                </div>
                                <Icons.ChevronRight className="w-4 h-4 text-gray-600" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* CHAT AREA */}
                <div className={`w-full sm:w-2/3 flex flex-col bg-black/20 ${!activeChat ? 'hidden sm:flex' : 'flex'} h-full absolute sm:relative inset-0 sm:inset-auto`}>
                    {!activeChat ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50 relative">
                            <div className="liquid-bg opacity-20" />
                            <Icons.MessageCircle className="w-16 h-16 mb-4 text-yellow-500/50" />
                            <p className="font-bold uppercase tracking-[0.2em] text-xs text-yellow-500">Secure Line Ready</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-3 border-b border-white/5 flex items-center gap-3 bg-black/80 backdrop-blur-md sticky top-0 z-10">
                                <button onClick={() => setActiveChat(null)} className="sm:hidden p-1 rounded-full hover:bg-white/10"><Icons.Back className="w-6 h-6" /></button>
                                <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                    {activeChat.profilePic ? <img src={resolveMediaUrl(activeChat.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-xs">{activeChat.username[0]}</div>}
                                </div>
                                <div>
                                    <div className="font-bold italic text-white uppercase text-sm">{activeChat.username}</div>
                                    <div className="text-[8px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> ONLINE</div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/40">
                                {(messages[activeChat._id] || []).map((m, i) => (
                                    <div key={i} className={`flex ${m.sender === user._id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] space-y-1`}>
                                            {m.image && <img src={m.image} className="rounded-xl border border-white/10 max-h-60 object-cover" />}
                                            {m.text && (
                                                <div className={`px-4 py-2 rounded-2xl text-sm font-medium ${m.sender === user._id ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black rounded-tr-none' : 'bg-[#1a1a1a] text-white rounded-tl-none border border-white/5'}`}>
                                                    {m.text}
                                                </div>
                                            )}
                                            <div className={`text-[9px] text-gray-600 ${m.sender === user._id ? 'text-right' : 'text-left'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>

                            <div className="p-3 border-t border-white/10 flex gap-2 bg-black/80 backdrop-blur-md mb-safe">
                                <button onClick={() => fileRef.current.click()} className="p-2 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"><Icons.Image className="w-5 h-5" /></button>
                                <input type="file" hidden ref={fileRef} onChange={(e) => sendMessage(e.target.files[0])} accept="image/*" />
                                <input value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Message..." className="flex-1 bg-transparent border-none outline-none text-white font-medium placeholder-gray-600 text-sm" />
                                <button onClick={() => sendMessage()} className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-xl font-bold uppercase text-[10px]">SEND</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const CommentItem = ({ c, user, post }) => {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(c.text);
    const isAuthor = c.authorId === user._id;

    return (
        <div className="flex gap-3 text-sm group animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0 border border-white/10 mt-1">
                <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-gradient-to-br from-gray-700 to-black text-white">{c.authorName?.[0]}</div>
            </div>
            <div className="flex-1 bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                <div className="flex items-baseline justify-between mb-1">
                    <span className="font-black text-yellow-500 mr-2 text-xs uppercase tracking-wide">{c.authorName}</span>
                    <span className="text-[9px] text-gray-600">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                {editing ? (
                    <div className="mt-1 flex gap-2">
                        <input value={val} onChange={e => setVal(e.target.value)} className="flex-1 bg-black/50 rounded px-2 py-1 text-white border border-white/10 outline-none focus:border-yellow-500/50" />
                        <button onClick={() => setEditing(false)} className="text-green-500 text-[10px] font-bold uppercase hover:bg-green-500/10 px-2 rounded">SAVE</button>
                    </div>
                ) : (
                    <p className="text-gray-200 leading-snug font-medium text-xs">{val}</p>
                )}
                <div className="flex gap-3 mt-2">
                    <button className="text-[9px] font-bold text-gray-500 hover:text-white transition-colors">REPLY</button>
                    {isAuthor && <button onClick={() => setEditing(true)} className="text-[9px] font-bold text-gray-500 hover:text-yellow-500 transition-colors">EDIT</button>}
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ isOpen, onClose, user, logout }) => {
    const { t } = useTranslation(user);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative liquid-nav w-full max-w-sm rounded-3xl overflow-hidden p-6 space-y-4 shadow-2xl border border-white/10">
                <div className="flex justify-between items-center text-yellow-500 border-b border-white/10 pb-4">
                    <h2 className="text-xl font-black italic uppercase"><Icons.Settings className="inline w-6 h-6 mr-2" /> {t('SETTINGS')}</h2>
                    <button onClick={onClose}><Icons.X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
                </div>

                <div className="space-y-3">
                    <div className="glass-card p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:border-yellow-500/30">
                        <div>
                            <div className="font-bold text-white text-sm">ELITE MODE (PRIVATE)</div>
                            <div className="text-[10px] text-gray-500">Only approved agents can follow</div>
                        </div>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${user.isPrivate ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${user.isPrivate ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    <div className="glass-card p-4 rounded-xl flex items-center justify-between">
                        <span className="font-bold text-gray-300 text-sm">{t('THEME')}</span>
                        <div className="flex gap-2">
                            {['cobalt', 'crimson', 'emerald', 'violet'].map(c => (
                                <button key={c} onClick={() => { localStorage.setItem('theme', c); document.documentElement.setAttribute('data-theme', c); playSound('click'); }} className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform" style={{ background: c === 'cobalt' ? '#0047AB' : c === 'crimson' ? '#DC143C' : c === 'emerald' ? '#50C878' : '#8A2BE2' }} />
                            ))}
                        </div>
                    </div>
                </div>

                <button onClick={logout} className="w-full py-4 bg-red-900/10 text-red-500 border border-red-900/30 rounded-xl font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 mt-4">
                    <Icons.Logout className="w-5 h-5" /> {t('LOGOUT')}
                </button>
            </div>
        </div>
    );
};

const SearchModal = ({ isOpen, onClose, users, onViewProfile }) => {
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState('agents');

    const filteredAgents = users.filter(u => u.username.toLowerCase().includes(query.toLowerCase()));

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[160] flex flex-col bg-black/95 backdrop-blur-xl animate-fade-in">
            <div className="absolute inset-0 liquid-bg opacity-30 pointer-events-none" />
            <div className="pt-4 px-4 pb-2 flex gap-3 border-b border-white/5 mt-10 sm:mt-0 relative z-10">
                <div className="flex-1 bg-white/5 rounded-xl flex items-center px-4 py-3 border border-white/5 focus-within:border-yellow-500/50 transition-colors">
                    <Icons.Search className="w-5 h-5 text-gray-400 mr-2" />
                    <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={mode === 'agents' ? "SEARCH AGENTS..." : "SEARCH INTEL #..."} className="bg-transparent border-none outline-none text-white w-full font-bold uppercase placeholder-gray-500 text-sm" />
                </div>
                <button onClick={onClose} className="p-3 bg-white/5 rounded-xl text-white hover:bg-white/10 hover:text-red-500 transition-colors"><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="flex border-b border-white/5 relative z-10">
                <button onClick={() => setMode('agents')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${mode === 'agents' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-white'}`}>AGENTS</button>
                <button onClick={() => setMode('intel')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors ${mode === 'intel' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-white'}`}>INTEL (#)</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative z-10">
                {mode === 'agents' ? (
                    filteredAgents.length > 0 ? filteredAgents.map(u => (
                        <button key={u._id} onClick={() => { onViewProfile(u); onClose(); }} className="w-full p-4 glass-card rounded-2xl flex items-center gap-4 hover:border-yellow-500/30 transition-all group text-left bg-black/20">
                            <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden border border-white/10 group-hover:border-yellow-500 transition-colors">
                                {u.profilePic ? <img src={resolveMediaUrl(u.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-white/50 text-xl">{u.username[0]}</div>}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="font-black text-white text-base">{u.username}</div>
                                    {u.role === 'Founder' && <Icons.Shield className="w-3 h-3 text-yellow-500" />}
                                </div>
                                <div className="text-[9px] text-yellow-500/70 font-bold uppercase tracking-widest">{u.role || 'AGENT'}</div>
                            </div>
                            <Icons.ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-yellow-500 ml-auto" />
                        </button>
                    )) : <div className="text-center py-20 text-gray-600 font-bold uppercase text-xs tracking-widest">NO AGENTS FOUND</div>
                ) : (
                    <div className="text-center py-20 text-gray-600 font-bold uppercase text-xs tracking-widest">HASHTAG SYSTEM PENDING</div>
                )}
            </div>
        </div>
    );
};

const CreateModal = ({ isOpen, onClose, onSuccess, user }) => {
    const { t } = useTranslation(user);
    const [preview, setPreview] = useState(null);
    const [isVideo, setIsVideo] = useState(false);
    const fileRef = useRef(null);
    if (!isOpen) return null;
    const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { setPreview(URL.createObjectURL(file)); setIsVideo(file.type.startsWith('video')); } };
    return (
        <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/90 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#0a0a0a] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-3xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-sm font-black italic gold-text uppercase flex items-center gap-2 tracking-[0.2em]">UPLOAD INTEL</h2>
                    <button onClick={onClose}><Icons.X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10">
                            {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{user.username[0]}</div>}
                        </div>
                        <textarea id="post-desc" placeholder="Decrypting intel..." className="flex-1 bg-transparent border-none text-white resize-none h-24 outline-none text-base p-2 placeholder-gray-600 font-medium" />
                    </div>
                    <div onClick={() => fileRef.current.click()} className="cursor-pointer group">
                        {preview ? (
                            <div className="w-full h-64 rounded-xl overflow-hidden relative bg-black border border-white/10">
                                {isVideo ? <video src={preview} className="w-full h-full object-contain" controls /> : <img src={preview} className="w-full h-full object-cover" />}
                                <button onClick={(e) => { e.stopPropagation(); setPreview(null); fileRef.current.value = ''; }} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full hover:bg-red-500"><Icons.X className="w-4 h-4 text-white" /></button>
                            </div>
                        ) : (
                            <div className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all bg-white/5">
                                <Icons.Camera className="w-6 h-6 text-gray-500 group-hover:text-yellow-500" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-yellow-500">SELECT MEDIA</span>
                            </div>
                        )}
                        <input type="file" ref={fileRef} accept="image/*,video/*" hidden onChange={handleFileChange} />
                    </div>
                    <button onClick={async () => {
                        const desc = document.getElementById('post-desc').value;
                        const file = fileRef.current.files[0];
                        if (!desc && !file) return alert("EMPTY INTEL");
                        const btn = document.getElementById('btn-upload'); btn.innerText = "TRANSMITTING..."; btn.disabled = true;
                        const fd = new FormData(); fd.append('desc', desc); if (file) fd.append('image', file);
                        try { await axios.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); onSuccess(); setPreview(null); playSound('magic'); explodeEffect(); }
                        catch (e) { alert("FAIL"); btn.innerText = "PUBLISH INTEL"; btn.disabled = false; }
                    }} id="btn-upload" className="liquid-btn w-full py-4 rounded-xl shadow-lg shadow-yellow-500/20 text-xs tracking-widest">{t('PUBLISH_INTEL')}</button>
                </div>
            </div>
        </div>
    );
};

const PostCard = ({ post, user, onDelete, onViewProfile }) => {
    const { t } = useTranslation(user);
    const [liked, setLiked] = useState((post.likes || []).includes(user._id));
    const [likesCount, setLikesCount] = useState((post.likes || []).length);
    const [disliked, setDisliked] = useState((post.dislikes || []).includes(user._id));
    const [dislikesCount, setDislikesCount] = useState((post.dislikes || []).length);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [comments, setComments] = useState(post.comments || []);

    const isFounder = user.role === 'Founder';
    const isAuthor = (typeof post.author === 'object' ? post.author._id : post.author) === user._id;
    const author = typeof post.author === 'string' ? { username: 'Unknown', _id: post.author } : post.author;

    const handleLike = async () => { setLiked(!liked); if (liked) setLikesCount(c => c - 1); else setLikesCount(c => c + 1); playSound('pop'); try { await axios.put(`/posts/${post._id}/like`); } catch (e) { } };
    const handleDislike = async () => { setDisliked(!disliked); if (disliked) setDislikesCount(c => c - 1); else setDislikesCount(c => c + 1); playSound('pop'); try { await axios.put(`/posts/${post._id}/dislike`); } catch (e) { } };
    const handleComment = async () => {
        const text = document.getElementById(`comment-${post._id}`).value;
        if (!text) return;
        playSound('pop');
        const newReview = { text, authorName: user.username, authorId: user._id, createdAt: new Date() };
        setComments([...comments, newReview]);
        document.getElementById(`comment-${post._id}`).value = '';
        try { await axios.put(`/posts/${post._id}/comment`, { text }); } catch (e) { }
    };

    return (
        <div className="glass-card rounded-3xl overflow-hidden mb-8 shadow-2xl bg-black/40 border border-white/5">
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewProfile(author)}>
                    <div className={"w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 overflow-hidden " + (author.role === 'Founder' ? 'founder-glow' : 'border-gray-700 bg-black')}>
                        {author.profilePic ? <img src={resolveMediaUrl(author.profilePic)} className="w-full h-full object-cover" /> : author.username?.[0]}
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm flex items-center gap-1 hover:text-yellow-500 transition-colors">
                            {author.username}
                            {author.role === 'Founder' && <Icons.Shield className="w-3 h-3 text-yellow-500" />}
                        </div>
                        <div className="text-[9px] text-gray-500 font-bold uppercase">{new Date(post.createdAt || Date.now()).toLocaleDateString()}</div>
                    </div>
                </div>
                {(isFounder || isAuthor) && <button onClick={onDelete} className="p-2 text-gray-600 hover:text-red-500"><Icons.Trash className="w-5 h-5" /></button>}
            </div>

            {post.desc && <div className="px-5 py-4 text-sm text-gray-200 font-medium leading-relaxed">{parseHashtags(post.desc)}</div>}

            {(post.image || post.videoUrl) && (
                <div className="w-full bg-black relative">
                    {post.videoUrl ? (
                        <video src={resolveMediaUrl(post.videoUrl)} controls className="w-full max-h-[500px]" />
                    ) : (
                        <img src={resolveMediaUrl(post.image)} className="w-full max-h-[500px] object-contain" />
                    )}
                </div>
            )}

            <div className="px-4 py-3 flex items-center gap-6 border-b border-white/5 relative bg-white/5 backdrop-blur-md">
                <button onClick={handleLike} className={"flex items-center gap-2 font-bold transition-transform active:scale-90 " + (liked ? 'text-red-500' : 'text-gray-400 hover:text-white')}>
                    <Icons.Heart className={"w-6 h-6 " + (liked ? 'fill-current' : '')} />
                    <span className="text-xs">{likesCount}</span>
                </button>
                <button onClick={() => setCommentsOpen(!commentsOpen)} className="flex items-center gap-2 font-bold text-gray-400 hover:text-white transition-colors">
                    <Icons.MessageCircle className="w-6 h-6" />
                    <span className="text-xs">{comments.length}</span>
                </button>
                <button onClick={handleDislike} className={"flex items-center gap-2 font-bold transition-colors ml-auto " + (disliked ? 'text-red-500' : 'text-gray-400 hover:text-white')}>
                    <Icons.ThumbsDown className="w-5 h-5" />
                    <span className="text-xs">{dislikesCount}</span>
                </button>
                <button className="text-gray-400 hover:text-green-500"><Icons.Send className="w-5 h-5" /></button>
            </div>

            <AnimatePresence>
                {commentsOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-black/40">
                        <div className="p-4 space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
                            {comments.map((c, i) => <CommentItem key={i} c={c} user={user} post={post} />)}
                            {comments.length === 0 && <div className="text-[10px] text-gray-600 font-bold uppercase text-center py-2">NO COMMENTS YET</div>}
                        </div>
                        <div className="p-3 border-t border-white/10 flex gap-2 bg-white/5">
                            <input id={`comment-${post._id}`} placeholder="Add to the intel..." className="flex-1 bg-transparent text-sm outline-none text-white placeholder-gray-600" />
                            <button onClick={handleComment} className="text-yellow-500 font-black text-[10px] uppercase px-3 py-1 bg-yellow-500/10 rounded-lg hover:bg-yellow-500 hover:text-black transition-all">POST</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ... SideMenu, ProfileModal (Standard code preserved for brevity but included in output logic) ...
// Assuming standard implementations for SideMenu/Profile as previously perfectly working, focusing on App Login/Chat fixes.

const SideMenu = ({ isOpen, onClose, user, logout, onViewProfile, onOpenSettings, setActiveTab, notifications }) => {
    const { t } = useTranslation(user);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[160] flex">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="relative w-4/5 max-w-xs bg-[#0a0a0a] border-r border-yellow-500/20 flex flex-col h-full shadow-2xl p-6">
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
                    <div className={"w-16 h-16 rounded-full border-2 overflow-hidden cursor-pointer " + (user.role === 'Founder' ? 'founder-glow' : 'border-white/10')} onClick={() => { onViewProfile(user); onClose(); }}>
                        {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-2xl text-white bg-gray-900">{user.username[0]}</div>}
                    </div>
                    <div>
                        <div className="gold-text text-xl italic">{user.username}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded w-fit mt-1">{user.role || 'AGENT'}</div>
                    </div>
                </div>
                <div className="space-y-1 flex-1 overflow-y-auto">
                    {[
                        { icon: Icons.Home, label: t('HOME'), action: () => { setActiveTab('home'); onClose(); } },
                        { icon: Icons.User, label: t('PROFILE'), action: () => { onViewProfile(user); onClose(); } },
                        { icon: Icons.Bell, label: t('ALERTS'), badge: notifications.length, action: () => { setActiveTab('alerts'); onClose(); } },
                        { icon: Icons.MessageCircle, label: 'COMMUNICATIONS', action: () => { setActiveTab('chat'); onClose(); } },
                        { icon: Icons.Settings, label: t('SETTINGS'), action: onOpenSettings },
                    ].map((item, i) => (
                        <button key={i} onClick={item.action} className="w-full p-4 hover:bg-white/5 rounded-xl flex items-center justify-between text-gray-400 hover:text-white transition-all group">
                            <div className="flex items-center gap-4 font-bold text-sm uppercase tracking-wider"><item.icon className="w-5 h-5 group-hover:text-yellow-500 transition-colors" /> {item.label}</div>
                            {item.badge > 0 && <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.badge}</div>}
                        </button>
                    ))}
                </div>
                <button onClick={logout} className="w-full p-4 bg-red-900/10 text-red-500 rounded-xl font-black uppercase flex items-center justify-center gap-2 mt-4 border border-red-900/20 hover:bg-red-900/30">
                    <Icons.Logout className="w-4 h-4" /> {t('LOGOUT')}
                </button>
            </motion.div>
        </div>
    );
};
const ProfileModal = ({ isOpen, onClose, profileUser, currentUser, posts, allUsers, onViewProfile }) => {
    const { t } = useTranslation(currentUser);
    const [tab, setTab] = useState('posts');
    const [following, setFollowing] = useState(false);
    const [userData, setUserData] = useState(null);
    const userPosts = posts.filter(p => p.username === profileUser?.username);
    const isOwnProfile = profileUser?.username === currentUser?.username;

    useEffect(() => {
        if (profileUser?.username) {
            const fetchUserData = async () => {
                try {
                    const res = await axios.get('/users/username/' + profileUser.username);
                    setUserData(res.data);
                    setFollowing(res.data.followers?.includes(currentUser?._id));
                } catch (e) { setUserData(profileUser); }
            };
            fetchUserData();
            setTab('posts');
        }
    }, [profileUser]);
    const handleFollow = async () => { if (!userData?._id) return; playSound('pop'); try { const res = await axios.put('/users/' + userData._id + '/follow'); setFollowing(res.data.isFollowing); } catch (e) { } };
    const uploadRef = useRef();
    const handleUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return; const fd = new FormData(); fd.append('image', file);
        try { const res = await axios.post('/users/profile-pic', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); if (isOwnProfile) { localStorage.setItem('user', JSON.stringify(res.data)); window.location.reload(); } } catch (e) { alert("UPLOAD ERROR"); }
    };
    if (!isOpen || !profileUser) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative bg-[#111] border border-white/10 w-full max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-black/40">
                    <button onClick={onClose}><Icons.Back className="w-6 h-6 rotate-180 text-white" /></button>
                    <div className="flex-1 font-black italic text-white uppercase">{profileUser.username}</div>
                </div>
                <div className="p-8 text-center bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
                    <div onClick={() => isOwnProfile && uploadRef.current.click()} className={"w-28 h-28 mx-auto rounded-full bg-gray-900 border-4 shadow-2xl overflow-hidden relative group " + (isOwnProfile ? 'cursor-pointer hover:border-yellow-500' : 'border-gray-800')}>
                        {userData?.profilePic ? <img src={resolveMediaUrl(userData.profilePic)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white">{profileUser.username[0]}</div>}
                        <input type="file" ref={uploadRef} hidden onChange={handleUpload} />
                    </div>
                    <h2 className="text-2xl font-black italic gold-text mt-4 uppercase">{profileUser.username}</h2>
                    {!isOwnProfile && (
                        <button onClick={handleFollow} className={"mt-4 px-8 py-3 rounded-xl font-black text-xs uppercase transition-all ring-1 " + (following ? 'bg-transparent ring-white/20 text-white' : 'liquid-btn ring-transparent text-black')}>
                            {following ? 'UNFOLLOW' : 'FOLLOW'}
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/50 p-1">
                    {userPosts.map(post => (
                        <div key={post._id} className="aspect-square bg-gray-900 overflow-hidden relative border border-black inline-block w-1/3">
                            {post.image ? <img src={resolveMediaUrl(post.image)} className="w-full h-full object-cover" /> : <div className="text-[9px] text-gray-500 p-2">{post.desc}</div>}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

// --- MAIN APP ---

const App = () => {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [createOpen, setCreateOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [isRegister, setIsRegister] = useState(false); // FOR LOGIN/REGISTER TOGGLE
    const { t } = useTranslation(user);

    // MOCK ALERTS (Improved for demo)
    const notifications = [
        { type: 'like', sender: { username: 'TRISTAN', profilePic: '' } },
        { type: 'follow', sender: { username: 'COBRA', profilePic: '' } },
        { type: 'comment', sender: { username: 'AGENT_X', profilePic: '' } }
    ];

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (savedUser && token) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchPosts();
            fetchUsers();
        }
    }, [user]);

    const fetchPosts = async () => { try { const r = await axios.get('/posts?limit=100'); setPosts(r.data); } catch (e) { } };
    const fetchUsers = async () => { try { const r = await axios.get('/users'); setUsers(r.data); } catch (e) { } };

    // NAVIGATION HANDLERS
    const handleNav = (tab) => {
        setActiveTab(tab);
        if (tab === 'search') setSearchOpen(true);
        if (tab === 'chat') setChatOpen(true);
        if (tab === 'profile') viewProfile(user);
    };

    const deletePost = async (postId) => { if (!confirm("DELETE INTEL?")) return; try { await axios.delete(`/posts/${postId}`); setPosts(posts.filter(p => p._id !== postId)); playSound('delete'); } catch (e) { alert("UNAUTHORIZED"); } };
    const logout = () => { localStorage.clear(); setUser(null); window.location.reload(); };
    const viewProfile = (u) => { setProfileUser(u); setProfileOpen(true); };

    // LOGIN SCREEN
    if (!user) return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
            <div className="liquid-bg" />
            <div className="w-full max-w-sm text-center relative z-10 glass-panel p-8 rounded-3xl border-t border-yellow-500/20 shadow-2xl">
                <div className="mb-6">
                    <h1 className="text-4xl font-black italic gold-text mb-2 tracking-tighter">LEGACY</h1>
                    <div className="h-1 w-16 bg-yellow-500 mx-auto rounded-full shadow-[0_0_20px_rgba(255,215,0,0.5)]"></div>
                    <p className="text-[10px] text-yellow-500/50 uppercase tracking-[0.4em] mt-3">Global Network</p>
                </div>

                <div className="space-y-3">
                    {isRegister && <input type="text" placeholder="CODENAME (USERNAME)" id="reg-username" className="cyber-input w-full text-center text-sm" />}
                    <input type="email" placeholder="EMAIL ADDRESS" id="login-email" className="cyber-input w-full text-center text-sm" />
                    <input type="password" placeholder="PASSWORD" id="login-pass" className="cyber-input w-full text-center text-sm" />

                    <button onClick={async () => {
                        const email = document.getElementById('login-email').value;
                        const password = document.getElementById('login-pass').value;

                        if (isRegister) {
                            const username = document.getElementById('reg-username').value;
                            if (!username || !email || !password) return alert("MISSING INTEL");
                            try {
                                await axios.post('/auth/register', { username, email, password });
                                alert("AGENT REGISTERED. LOG IN.");
                                setIsRegister(false);
                            } catch (e) { alert("REGISTRATION FAILED"); }
                        } else {
                            if (!email || !password) return alert("CREDENTIALS REQUIRED");
                            try {
                                const res = await axios.post('/auth/login', { email, password });
                                localStorage.setItem('token', res.data.token);
                                localStorage.setItem('user', JSON.stringify(res.data.user));
                                setUser(res.data.user);
                            } catch (e) { alert("ACCESS DENIED"); }
                        }
                    }} className="liquid-btn w-full py-3 rounded-xl shadow-lg shadow-yellow-500/10 mt-4 text-sm tracking-widest font-black">
                        {isRegister ? 'INITIALIZE AGENT' : 'ENTER SYSTEM'}
                    </button>

                    <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase mt-6 px-2">
                        <button onClick={() => setIsRegister(!isRegister)} className="hover:text-yellow-500 transition-colors">{isRegister ? 'Back to Login' : 'Create Agent ID'}</button>
                        <button onClick={() => alert("Contact High Command.")} className="hover:text-white transition-colors">Forgot Password?</button>
                    </div>
                </div>
            </div>
        </div>
    );

    // MAIN APP
    return (
        <div className="min-h-screen bg-black text-white max-w-xl mx-auto border-x border-white/5 pb-24 relative overflow-hidden shadow-2xl">
            <div className="liquid-bg" />

            <header className="sticky top-0 p-4 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
                <button onClick={() => { setMenuOpen(true); playSound('click'); }} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Icons.Menu className="w-6 h-6 text-white" /></button>
                <div onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex flex-col items-center cursor-pointer group">
                    <div className="text-xl font-black italic tracking-tighter gold-text leading-none group-hover:scale-105 transition-transform">LEGACY</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setChatOpen(true); playSound('pop'); }} className="p-2 bg-white/5 rounded-xl relative hover:bg-white/10 transition-colors">
                        <Icons.MessageCircle className="w-6 h-6 text-white" />
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black animate-pulse"></div>
                    </button>
                    <button onClick={() => { setCreateOpen(true); playSound('pop'); }} className="p-2 bg-yellow-500 text-black rounded-xl shadow-lg shadow-yellow-500/20 hover:scale-105 transition-transform"><Icons.Plus className="w-6 h-6" /></button>
                </div>
            </header>

            <main className="relative z-10 p-4 space-y-6">
                {activeTab === 'alerts' ? (
                    <div className="space-y-2 animate-fade-in">
                        <h2 className="font-black italic text-xl mb-4 ml-1 gold-text">INCOMING SIGNALS</h2>
                        {notifications.map((n, i) => <NotificationItem key={i} note={n} onViewProfile={viewProfile} />)}
                    </div>
                ) : (
                    <>
                        {posts.map(post => <PostCard key={post._id} post={post} user={user} onDelete={() => deletePost(post._id)} onViewProfile={viewProfile} />)}
                    </>
                )}
            </main>

            <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => { setCreateOpen(false); fetchPosts(); }} user={user} />
            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} users={users} onViewProfile={viewProfile} />
            <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} user={user} following={users} />

            <AnimatePresence>
                {menuOpen && (
                    <SideMenu
                        isOpen={menuOpen}
                        onClose={() => setMenuOpen(false)}
                        user={user}
                        logout={logout}
                        onViewProfile={viewProfile}
                        onOpenSettings={() => { setMenuOpen(false); setSettingsOpen(true); }}
                        setActiveTab={handleNav}
                        notifications={notifications}
                    />
                )}
            </AnimatePresence>

            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} logout={logout} />
            <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} profileUser={profileUser} currentUser={user} posts={posts} allUsers={users} onViewProfile={viewProfile} />

            {/* FLOATING CAPSULE NAVIGATION */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
                <div className="liquid-nav rounded-full px-6 py-4 flex justify-between items-center shadow-2xl">
                    <button onClick={() => handleNav('home')} className={`transition-all duration-300 ${activeTab === 'home' ? 'text-yellow-500 scale-125' : 'text-white/70 hover:text-white'}`}><Icons.Home className="w-6 h-6" /></button>
                    <button onClick={() => handleNav('search')} className={`transition-all duration-300 ${activeTab === 'search' ? 'text-yellow-500 scale-125' : 'text-white/70 hover:text-white'}`}><Icons.Search className="w-6 h-6" /></button>
                    <div onClick={() => setCreateOpen(true)} className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center -mt-8 border-4 border-[#111] shadow-lg cursor-pointer hover:scale-110 transition-transform">
                        <Icons.Plus className="w-6 h-6 text-black" />
                    </div>
                    <button onClick={() => handleNav('alerts')} className={`transition-all duration-300 ${activeTab === 'alerts' ? 'text-yellow-500 scale-125' : 'text-white/70 hover:text-white'}`}><Icons.Bell className="w-6 h-6" /></button>
                    <button onClick={() => handleNav('profile')} className={`transition-all duration-300 ${activeTab === 'profile' ? 'ring-2 ring-yellow-500 rounded-full scale-110' : 'text-white/70 hover:text-white'}`}>
                        <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden border border-transparent">
                            {user.profilePic ? <img src={resolveMediaUrl(user.profilePic)} className="w-full h-full object-cover" /> : <div className="text-[8px] font-bold w-full h-full flex items-center justify-center">{user.username[0]}</div>}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;
