const fs = require('fs');
const path = require('path');

// 1. Rewrite CreateCartelModal in Cartels.jsx
const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

const oldCreateStart = '    return (\n        <div className="fixed inset-0 z-[2000] overflow-y-auto bg-black/80 backdrop-blur-md pb-[120px] pt-[80px] sm:py-10">';
const oldCreateEnd = '            </div>\n        </div>\n    );\n};';

const newCreateModal = `    return (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="relative w-full max-w-[420px] max-h-[88dvh] rounded-[24px] sm:rounded-3xl overflow-hidden flex flex-col bg-[#111] border border-white/10 shadow-2xl"
            >
                <div className="p-4 sm:p-6 pb-2 sm:pb-4 flex justify-between items-center shrink-0 border-b border-white/5">
                    <h2 className="text-xl font-black text-white tracking-widest">{t('CARTELS_ESTABLISH', 'Establish Cartel')}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-white/50 hover:text-white rounded-full bg-white/5"><Icons.X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-y-contain custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-white/50 tracking-widest mb-2">{t('CARTELS_NAME', 'Cartel Name')}</label>
                            <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none" placeholder="e.g. The Syndicate" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/50 tracking-widest mb-2">{t('CARTELS_DESC', 'Description')}</label>
                            <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none resize-none h-24" placeholder="What is this cartel about?" />
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
                                <input type="text" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none text-sm" placeholder="Or paste image URL..." />
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/50 tracking-widest mb-2">{t('CARTELS_PIN', 'Secret PIN (Optional)')}</label>
                            <input type="text" value={pin} onChange={e=>setPin(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none" placeholder="Leave empty for public cartel..." />
                            <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest">If set, users must enter this PIN to join.</p>
                        </div>
                        <div className="pt-2">
                            <button disabled={loading} type="submit" className="w-full bg-[var(--gold-primary)] text-black font-black tracking-widest py-4 rounded-xl active:scale-95 transition-transform disabled:opacity-50">
                                {loading ? t('CARTELS_FOUNDING', 'Founding...') : t('CARTELS_ESTABLISH', 'Establish Cartel')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};`;

const createStartIdx = cartelsContent.indexOf(oldCreateStart);
const createEndIdx = cartelsContent.indexOf(oldCreateEnd) + oldCreateEnd.length;

if (createStartIdx !== -1 && createEndIdx !== -1) {
    cartelsContent = cartelsContent.substring(0, createStartIdx) + newCreateModal + cartelsContent.substring(createEndIdx);
    fs.writeFileSync(cartelsPath, cartelsContent);
} else {
    console.log("Could not find old CreateCartelModal in Cartels.jsx");
}

// 2. Rewrite EditCartelModal in CartelView.jsx
const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cvContent = fs.readFileSync(cartelViewPath, 'utf8');

const oldEditStart = '    return (\n        <div className="fixed inset-0 z-[20000] overflow-y-auto bg-black/80 backdrop-blur-md pb-[120px] pt-[80px] sm:py-10">';
const oldEditEnd = '            </div>\n        </div>\n    );\n};\n';

const newEditModal = `    return (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="relative w-full max-w-[420px] max-h-[88dvh] rounded-[24px] sm:rounded-3xl overflow-hidden flex flex-col bg-[#111] border border-white/10 shadow-2xl"
            >
                <div className="p-4 sm:p-6 pb-2 sm:pb-4 flex justify-between items-center shrink-0 border-b border-white/5">
                    <h2 className="text-xl font-black text-white tracking-widest">{t('CARTELS_EDIT', 'Edit Cartel')}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-white/50 hover:text-white rounded-full bg-white/5"><Icons.X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-y-contain custom-scrollbar">
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
                        <div className="pt-2">
                            <button disabled={loading} type="submit" className="w-full bg-[var(--gold-primary)] text-black font-black tracking-widest py-4 rounded-xl active:scale-95 transition-transform disabled:opacity-50">
                                {loading ? '...' : t('CARTELS_EDIT', 'Edit')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
`;

const editStartIdx = cvContent.indexOf(oldEditStart);
let editEndStr = oldEditEnd;
let editEndIdx = cvContent.indexOf(editEndStr);

if (editStartIdx !== -1 && editEndIdx !== -1) {
    cvContent = cvContent.substring(0, editStartIdx) + newEditModal + cvContent.substring(editEndIdx + editEndStr.length);
    fs.writeFileSync(cartelViewPath, cvContent);
    console.log('Modified EditCartelModal');
} else {
    console.log('Could not find old EditCartelModal in CartelView.jsx');
}

