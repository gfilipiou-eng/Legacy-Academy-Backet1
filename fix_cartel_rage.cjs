const fs = require('fs');
const path = require('path');

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

const fixCartelModal = (content, startTag, endTag, isEdit) => {
    const s = content.indexOf(startTag);
    if (s === -1) return content;
    const e = content.indexOf(endTag, s);
    if (e === -1) return content;
    
    const innerContent = content.substring(s, e + endTag.length);
    
    // We want to replace the ENTIRE return statement with the perfect CreateModal structure
    const titleKey = isEdit ? "'CARTELS_EDIT', 'Edit Cartel'" : "'CARTELS_ESTABLISH', 'Establish Cartel'";
    const submitKey = isEdit ? "'CARTELS_EDIT', 'Edit'" : "'CARTELS_ESTABLISH', 'Establish Cartel'";
    
    const newReturn = `    return (
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
                    <h2 className="text-lg sm:text-xl font-black italic text-white uppercase tracking-tighter">{t(${titleKey})}</h2>
                    <button type="button" disabled={loading} onClick={handleSubmit} className="sm:hidden px-3 py-1.5 bg-[var(--gold-primary)] hover:opacity-90 disabled:opacity-50 text-black font-black text-xs uppercase tracking-normal rounded-full shadow-md transition-all duration-200 whitespace-nowrap shrink-0">
                        {loading ? '...' : t(${submitKey})}
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
                            <div className="flex gap-2">
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={e => { if(e.target.files[0]) { setImageFile(e.target.files[0]); setImageUrl(''); } }} className="hidden" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-black/50 border border-white/10 rounded-2xl p-4 text-white hover:bg-white/5 text-sm flex justify-center items-center gap-2">
                                    <Icons.Image className="w-5 h-5" />
                                    {imageFile ? imageFile.name : t('CARTELS_UPLOAD_IMG', 'Upload Image')}
                                </button>
                                {imageFile && <button type="button" onClick={() => setImageFile(null)} className="p-4 bg-red-500/20 text-red-500 rounded-2xl hover:bg-red-500/40"><Icons.X className="w-5 h-5"/></button>}
                            </div>
                            {!imageFile && (
                                <input type="text" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none mt-2" placeholder="Or paste image URL..." />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">{t('CARTELS_PIN', 'Secret PIN (Optional)')}</label>
                            <input type="text" value={pin} onChange={e=>setPin(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none" placeholder="Enter PIN..." />
                        </div>
                        
                        <div className="hidden sm:block mt-4">
                            <button disabled={loading} type="submit" form="cartelForm" className="w-full bg-[var(--gold-primary)] text-black font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-transform disabled:opacity-50">
                                {loading ? '...' : t(${submitKey})}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};`;

    return content.replace(innerContent, newReturn);
};

cartelsContent = fixCartelModal(cartelsContent, '    return (\n        <div className="fixed inset-0 z-[20000]', '    );\n};', false);
fs.writeFileSync(cartelsPath, cartelsContent);

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cvContent = fs.readFileSync(cartelViewPath, 'utf8');

// 1. Revert header size to small (h-32) because the user complained it was too big and required scrolling
cvContent = cvContent.replace(
    'className="relative w-full h-48 sm:h-64 bg-black shrink-0"',
    'className="relative w-full h-32 sm:h-64 bg-black shrink-0"'
);

cvContent = cvContent.replace(
    'className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black border-2 border-[var(--gold-primary)] overflow-hidden shrink-0 shadow-xl"',
    'className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-black border-2 border-[var(--gold-primary)] overflow-hidden shrink-0 shadow-xl"'
);

// 2. Fix EditCartelModal structure
cvContent = fixCartelModal(cvContent, '    return (\n        <div className="fixed inset-0 z-[20000]', '    );\n};\n', true);
fs.writeFileSync(cartelViewPath, cvContent);

console.log('Fixed ALL cartel modals and header sizing to perfectly match CreatePost');
