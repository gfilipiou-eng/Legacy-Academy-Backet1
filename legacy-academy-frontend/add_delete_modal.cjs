const fs = require('fs');

let code = fs.readFileSync('src/components/WebsiteBuilder/WebsiteManager.jsx', 'utf8');

// 1. Add state for websiteToDelete
code = code.replace(
    /const \[activeWebsiteIndex, setActiveWebsiteIndex\] = useState\(null\);/,
    `const [activeWebsiteIndex, setActiveWebsiteIndex] = useState(null);\n    const [websiteToDelete, setWebsiteToDelete] = useState(null);`
);

// 2. Change handleDelete to just set the state
const oldHandleDeleteMatch = `const handleDelete = async (index, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this website?")) return;
        
        const newWebsites = [...websites];
        newWebsites.splice(index, 1);
        
        try {
            const payload = { settings: { businessWebsites: newWebsites } };
            await axios.put('/users/settings', payload);
            if (onUpdateUser) {
                onUpdateUser({
                    ...user,
                    settings: {
                        ...(user.settings || {}),
                        businessWebsites: newWebsites
                    }
                });
            }
        } catch (err) {
            console.error("Failed to delete website", err);
        }
    };`;

const newHandleDelete = `const handleDeletePrompt = (index, e) => {
        e.stopPropagation();
        setWebsiteToDelete(index);
    };

    const confirmDelete = async () => {
        if (websiteToDelete === null) return;
        const newWebsites = [...websites];
        newWebsites.splice(websiteToDelete, 1);
        setWebsiteToDelete(null);
        
        try {
            const payload = { settings: { businessWebsites: newWebsites } };
            await axios.put('/users/settings', payload);
            if (onUpdateUser) {
                onUpdateUser({
                    ...user,
                    settings: {
                        ...(user.settings || {}),
                        businessWebsites: newWebsites
                    }
                });
            }
        } catch (err) {
            console.error("Failed to delete website", err);
        }
    };`;

code = code.replace(oldHandleDeleteMatch, newHandleDelete);

// 3. Change the onClick of the delete button
code = code.replace(/onClick=\{\(e\) => handleDelete\(idx, e\)\}/g, "onClick={(e) => handleDeletePrompt(idx, e)}");

// 4. Inject the Modal before the final return closing tag
const modalCode = `
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {websiteToDelete !== null && (
                    <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0a0a0c] border border-red-500/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden text-center"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                            
                            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-inner">
                                <Icons.AlertTriangle className="w-10 h-10 text-red-500" />
                            </div>
                            
                            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Delete Website?</h3>
                            <p className="text-sm text-white/50 mb-8 font-bold leading-relaxed">
                                This action cannot be undone. Your custom website and link will be permanently destroyed.
                            </p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setWebsiteToDelete(null)}
                                    className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                                >
                                    Destroy
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
`;

code = code.replace(/(\s*)(<\/div>\s*)$/, modalCode + "$1$2");

fs.writeFileSync('src/components/WebsiteBuilder/WebsiteManager.jsx', code);
console.log('Added Delete Modal to WebsiteManager');
