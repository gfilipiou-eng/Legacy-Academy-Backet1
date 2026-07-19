import React, { useState, useEffect } from 'react';
import axios from '../api';
import { Icons } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

export const CartelsExplore = ({ user, onViewCartel, t }) => {
    const [cartels, setCartels] = useState([]);
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchCartels = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/cartels');
            setCartels(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCartels();
    }, []);

    const filtered = cartels.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()));

    return (
        <>
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595590424283-b8f1784cb2c2?q=80&w=1080&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>
            <div className="w-full h-full flex flex-col relative z-10 pt-safe mt-[80px] sm:mt-0">
            <div className="px-4 py-4 flex justify-between items-center sticky top-0 bg-[var(--app-bg)] z-20 border-b border-white/5">
                <h1 className="text-xl sm:text-2xl font-black text-white  tracking-widest">
                    <Icons.Users className="inline-block w-6 h-6 mr-2 text-[var(--gold-primary)]" />
                    Cartels
                </h1>
                <button onClick={() => setIsCreateOpen(true)} className="bg-[var(--gold-primary)] text-black px-4 py-2 rounded-xl font-bold  tracking-wider text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all">
                    Create
                </button>
            </div>

            <div className="px-4 py-3">
                <div className="relative">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                        type="text"
                        placeholder="Search cartels..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[var(--gold-primary)] transition-colors"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-32">
                {loading ? (
                    <div className="flex justify-center py-10"><Icons.Loader className="animate-spin text-[var(--gold-primary)] w-8 h-8" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center text-white/40 py-10 font-bold  tracking-widest text-sm">{t('CARTELS_NO_FOUND', 'No cartels found')}</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filtered.map(cartel => (
                            <div key={cartel._id} onClick={() => onViewCartel(cartel)} className="bg-white/5 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-black/50 overflow-hidden shrink-0 border border-white/10 group-hover:border-[var(--gold-primary)] transition-colors">
                                        {cartel.image ? (
                                            <img src={cartel.image} alt={cartel.name} className="w-full h-full object-cover object-center bg-black" />
                                        ) : (
                                            <Icons.Users className="w-8 h-8 m-4 text-white/20" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold text-lg truncate tracking-widest">{cartel.name}</h3>
                                        <p className="text-white/50 text-xs truncate mt-1">{cartel.description || 'No description'}</p>
                                        <div className="text-[var(--gold-primary)] text-xs font-bold mt-2 tracking-wider">
                                            {cartel.members?.length || 0} {t('CARTELS_MEMBERS', 'Members')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MAFIA STYLE FLOATING ADD GROUP BUTTON */}
            <button 
                onClick={() => setIsCreateOpen(true)} 
                className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-4 sm:right-10 z-[1000] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 rounded-full pointer-events-none"></div>
                <Icons.Gun className="w-7 h-7 sm:w-8 sm:h-8 text-white z-10" />
            </button>

            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateCartelModal t={t} onClose={() => setIsCreateOpen(false)} onCreated={(c) => { setCartels([c, ...cartels]); setIsCreateOpen(false); }} />
                )}
            </AnimatePresence>
        </div>
        </>
    );
};

const CreateCartelModal = ({ onClose, onCreated, t }) => {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
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
            if (pin.trim()) formData.append('pin', pin);
            if (imageFile) {
                formData.append('image', imageFile);
            } else if (imageUrl) {
                formData.append('image', imageUrl);
            }
            const res = await axios.post('/cartels', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            onCreated(res.data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data || "Error creating cartel");
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
                    <h2 className="text-lg sm:text-xl font-black italic text-white uppercase tracking-tighter">{t('CARTELS_ESTABLISH', 'Establish Cartel')}</h2>
                    <button type="button" disabled={loading} onClick={handleSubmit} className="sm:hidden px-3 py-1.5 bg-[var(--gold-primary)] hover:opacity-90 disabled:opacity-50 text-black font-black text-xs uppercase tracking-normal rounded-full shadow-md transition-all duration-200 whitespace-nowrap shrink-0">
                        {loading ? '...' : t('CARTELS_ESTABLISH', 'Establish Cartel')}
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
                                {loading ? '...' : t('CARTELS_ESTABLISH', 'Establish Cartel')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
