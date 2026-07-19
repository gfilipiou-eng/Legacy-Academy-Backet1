const fs = require('fs');
const path = require('path');

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let content = fs.readFileSync(cartelViewPath, 'utf8');

// 1. Remove the big UPLOAD INTEL box
const bigUploadBox = `            {isMember ? (
                <div className="px-4 py-2 mb-4">
                    <button onClick={() => onCreatePost(cartel._id)} className="w-full relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all border border-red-900/50 shadow-2xl shadow-red-900/20 bg-gradient-to-b from-[#1a0505] to-[#0a0000]">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <Icons.Upload className="w-10 h-10 text-red-600 mb-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                        <span className="font-black  tracking-[0.3em] text-white text-sm drop-shadow-md z-10">{t('CARTELS_UPLOAD_INTEL', 'UPLOAD INTEL')}</span>
                        <span className="text-red-500/70 text-[10px]  tracking-widest font-bold z-10">{t('CARTELS_SECURE_CHANNEL', 'Secure Encrypted Channel')}</span>
                    </button>
                </div>
            ) : (`;

const noUploadBox = `            {isMember ? null : (`;
content = content.replace(bigUploadBox, noUploadBox);

// 2. Add Floating Action Button for Upload
const fab = `
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
`;

content = content.replace(
    '        </div>\n    );\n};\n',
    fab + '\n        </div>\n    );\n};\n'
);

// 3. Add Edit Button next to Delete Button
const editButton = `
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
`;

const oldDeleteButton = `                        {isCreator && (
                            <button onClick={handleDeleteCartel} className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-4 z-50 bg-red-600/80 backdrop-blur-md rounded-xl px-3 py-2 flex items-center justify-center text-white text-xs font-bold tracking-widest hover:bg-red-500 transition">
                                {t('CARTELS_DELETE', 'Delete')}
                            </button>
                        )}`;

content = content.replace(oldDeleteButton, editButton);

// 4. Add isEditOpen state
content = content.replace(
    'const [memberCount, setMemberCount] = useState(0);',
    'const [memberCount, setMemberCount] = useState(0);\n    const [isEditOpen, setIsEditOpen] = useState(false);'
);

// 5. Append EditCartelModal component
const editModalCode = `
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

            const res = await axios.put(\`/cartels/\${cartel._id}\`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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
`;

content = content + '\n' + editModalCode;
fs.writeFileSync(cartelViewPath, content);
console.log('CartelView modified with FAB and EditCartelModal');

// 6. Fix "Cartels" -> "Καρτέλ" in el.json
const elPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'el.json');
let elContent = fs.readFileSync(elPath, 'utf8');
let elObj = JSON.parse(elContent);

// Translate properly
elObj.CARTELS = "Καρτέλ";
elObj.CARTELS_EXPLORE_TITLE = "Όλα τα Καρτέλ";
elObj.CARTELS_SEARCH_PH = "Αναζήτηση Καρτέλ...";
elObj.CARTELS_NO_FOUND = "Δεν βρέθηκαν Καρτέλ";
elObj.CARTELS_ESTABLISH = "Ίδρυση Καρτέλ";
elObj.CARTELS_NAME = "Όνομα Καρτέλ";
elObj.CARTELS_EDIT = "Επεξεργασία";

fs.writeFileSync(elPath, JSON.stringify(elObj, null, 2));

const enPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'en.json');
let enContent = fs.readFileSync(enPath, 'utf8');
let enObj = JSON.parse(enContent);
enObj.CARTELS_EDIT = "Edit";
fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2));

console.log('Translations fixed');
