import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-widest flex items-center gap-2">
                    <span className="text-[var(--gold-primary)] text-2xl">◆</span>
                    {t('CARTELS_TITLE', 'The Cartels')}
                </h1>
                <button onClick={() => setIsCreateOpen(true)} className="bg-[var(--gold-primary)] text-black px-4 py-2 rounded-xl font-bold tracking-wider text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all">
                    {t('CREATE', 'Create')}
                </button>
            </div>

            <div className="px-4 py-3">
                <div className="relative">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                        type="text"
                        placeholder={t('CARTELS_SEARCH', 'Search cartels...')}
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

            <button 
                onClick={() => setIsCreateOpen(true)} 
                className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-4 sm:right-10 z-[1000] w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 ease-out"
                style={{ background: 'linear-gradient(135deg, var(--gold-primary), #b8860b)', boxShadow: '0 0 30px rgba(212,175,55,0.4)' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-black">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
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

    return ReactDOM.createPortal(
      (
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
            <motion.div 
                initial={{ y: '100%' }} 
                animate={{ y: 0 }} 
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full sm:max-w-md bg-[#0f0f0f] border-t border-white/10 sm:border sm:rounded-3xl rounded-t-3xl flex flex-col overflow-hidden shadow-2xl"
                style={{
                    maxHeight: 'min(85dvh, 700px)',
                    paddingTop: 'max(1.25rem, calc(env(safe-area-inset-top, 0px) + 4px))',
                    paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))'
                }}
            >
                {/* Drag handle indicator */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/20 sm:hidden" />

                {/* Header */}
                <div className="flex-none flex items-center justify-between px-5 pb-3 border-b border-white/5 mb-2">
                    <button type="button" onClick={onClose} className="sm:hidden text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                        {t('CANCEL', 'Cancel')}
                    </button>
                    <h2 className="text-base sm:text-xl font-black italic text-white uppercase tracking-tighter">{t('CARTELS_ESTABLISH', 'Establish Cartel')}</h2>
                    <button type="button" disabled={loading} onClick={handleSubmit} className="sm:hidden px-3 py-1.5 bg-[var(--gold-primary)] hover:opacity-90 disabled:opacity-50 text-black font-black text-xs uppercase tracking-normal rounded-full shadow-md transition-all whitespace-nowrap shrink-0">
                        {loading ? '...' : t('CARTELS_ESTABLISH', 'Establish')}
                    </button>
                    <button type="button" onClick={onClose} className="hidden sm:flex p-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4 min-h-0">
                    <form onSubmit={handleSubmit} id="cartelForm" className="flex flex-col gap-4 pt-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{t('CARTELS_NAME', 'Cartel Name')}</label>
                            <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none" placeholder="e.g. The Syndicate" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{t('CARTELS_DESC', 'Description')}</label>
                            <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-[1.5rem] p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none min-h-[80px] resize-none custom-scrollbar" placeholder="What is this cartel about?" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{t('CARTELS_IMAGE', 'Cover Image')}</label>
                            {(imageFile || imageUrl) && (
                                <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/10 mb-1">
                                    <img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" />
                                    <img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} className="relative z-10 w-full max-h-40 object-contain" />
                                    <button type="button" onClick={() => { setImageFile(null); setImageUrl(''); }} className="absolute top-2 right-2 z-20 p-2 bg-black/80 rounded-full hover:bg-red-500 transition-colors">
                                        <Icons.X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={e => { if(e.target.files[0]) { setImageFile(e.target.files[0]); setImageUrl(''); } }} className="hidden" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-black/50 border border-dashed border-white/20 rounded-2xl p-3.5 text-white hover:border-[var(--gold-primary)] transition-all text-sm flex justify-center items-center gap-2 font-bold">
                                    <Icons.Image className="w-5 h-5 text-[var(--gold-primary)]" />
                                    {imageFile ? imageFile.name : t('CARTELS_UPLOAD_IMG', 'Upload Image')}
                                </button>
                            </div>
                            {!imageFile && !imageUrl && (
                                <input type="text" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none" placeholder="Or paste image URL..." />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{t('CARTELS_PIN', 'Secret Access Code (Optional)')}</label>
                            <input type="text" value={pin} onChange={e=>setPin(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none" placeholder="e.g. 1234" />
                            <p className="text-[10px] text-white/25 font-bold pl-1">Leave blank for open access.</p>
                        </div>
                        <button disabled={loading} type="submit" form="cartelForm" className="w-full bg-[var(--gold-primary)] text-black font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-transform disabled:opacity-50 mt-2">
                            {loading ? '...' : t('CARTELS_ESTABLISH', 'Establish Cartel')}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
      ), document.body
    );
};


