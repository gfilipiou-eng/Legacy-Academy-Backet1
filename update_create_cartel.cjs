const fs = require('fs');
const path = require('path');

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let content = fs.readFileSync(cartelsPath, 'utf8');

// Replace CreateCartelModal with an updated version that supports file upload
const oldModalStart = "const CreateCartelModal = ({ onClose, onCreated, t }) => {";
const oldModalEnd = "};\n";

const newModal = `const CreateCartelModal = ({ onClose, onCreated, t }) => {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><Icons.X className="w-6 h-6" /></button>
                <h2 className="text-xl font-black text-white tracking-widest mb-6">{t('CARTELS_ESTABLISH', 'Establish Cartel')}</h2>
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
                    <button disabled={loading} type="submit" className="w-full bg-[var(--gold-primary)] text-black font-black tracking-widest py-4 rounded-xl mt-4 active:scale-95 transition-transform disabled:opacity-50">
                        {loading ? t('CARTELS_FOUNDING', 'Founding...') : t('CARTELS_ESTABLISH', 'Establish Cartel')}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};`;

const startIdx = content.indexOf(oldModalStart);
if (startIdx !== -1) {
    content = content.substring(0, startIdx) + newModal + '\n';
    fs.writeFileSync(cartelsPath, content);
    console.log('CreateCartelModal updated');
} else {
    console.log('CreateCartelModal not found');
}
