const fs = require('fs');

let mgrCode = fs.readFileSync('src/components/WebsiteBuilder/WebsiteManager.jsx', 'utf8');

const modalUI = `
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {websiteToDelete !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
                        onClick={() => setWebsiteToDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0c] border border-red-500/30 rounded-3xl w-full max-w-sm p-6 sm:p-8 flex flex-col items-center shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden text-center"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
                            
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                                <Icons.AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>

                            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Delete Website?</h3>
                            <p className="text-sm text-gray-400 font-bold mb-8">
                                This action is permanent and cannot be undone. Are you absolutely sure?
                            </p>

                            <div className="flex w-full gap-3">
                                <button
                                    type="button"
                                    onClick={() => setWebsiteToDelete(null)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[11px] uppercase tracking-wider transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                                >
                                    Destroy
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
`;

mgrCode = mgrCode.replace(
    /            \{\/\* Custom Toast for Copy Link \*\/\}/,
    modalUI + '\n            {/* Custom Toast for Copy Link */}'
);

fs.writeFileSync('src/components/WebsiteBuilder/WebsiteManager.jsx', mgrCode);
console.log('Added Delete Modal UI');
