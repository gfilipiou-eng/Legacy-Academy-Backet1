const fs = require('fs');

// 1. Fix WebsiteManager.jsx delete button onTouchEnd
let mgrCode = fs.readFileSync('src/components/WebsiteBuilder/WebsiteManager.jsx', 'utf8');

const oldTrashButton = `<button type="button" onClick={(e) => handleDeletePrompt(idx, e)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs font-bold text-red-500 transition-all touch-manipulation">`;
const newTrashButton = `<button type="button" onClick={(e) => handleDeletePrompt(idx, e)} onTouchEnd={(e) => { e.preventDefault(); handleDeletePrompt(idx, e); }} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs font-bold text-red-500 transition-all touch-manipulation relative z-20">`;

mgrCode = mgrCode.replace(oldTrashButton, newTrashButton);
fs.writeFileSync('src/components/WebsiteBuilder/WebsiteManager.jsx', mgrCode);


// 2. Fix WebsiteBuilder.jsx Save Draft buttons
let bldrCode = fs.readFileSync('src/components/WebsiteBuilder/WebsiteBuilder.jsx', 'utf8');

// Desktop Save Draft Button
const oldDesktopSave = `<button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        {saving ? <Icons.Loader className="w-4 h-4 animate-spin" /> : (config.isDraft ? <Icons.Check className="w-4 h-4" /> : t('SAVE_DRAFT', 'Save Draft'))}
                    </button>`;

const newDesktopSave = `<button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-full border border-[var(--gold-primary)]/50 text-[var(--gold-primary)] font-black text-[10px] uppercase tracking-wider hover:bg-[var(--gold-primary)]/10 transition-all flex items-center gap-2"
                    >
                        {saving ? <Icons.Loader className="w-4 h-4 animate-spin" /> : (config.isDraft ? <Icons.Check className="w-4 h-4" /> : t('SAVE_DRAFT', 'Save Draft'))}
                    </button>`;

// Mobile Save Draft Button
const oldMobileSave = `<button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider hover:bg-white/10 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            {saving ? <Icons.Loader className="w-3 h-3 animate-spin" /> : (config.isDraft ? <Icons.Check className="w-3 h-3" /> : t('SAVE_DRAFT', 'Save Draft'))}
                        </button>`;

const newMobileSave = `<button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 rounded-full border border-[var(--gold-primary)]/50 text-[var(--gold-primary)] font-black text-[10px] uppercase tracking-wider hover:bg-[var(--gold-primary)]/10 transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? <Icons.Loader className="w-3 h-3 animate-spin" /> : (config.isDraft ? <Icons.Check className="w-3 h-3" /> : t('SAVE_DRAFT', 'Save Draft'))}
                        </button>`;

bldrCode = bldrCode.replace(oldDesktopSave, newDesktopSave);
bldrCode = bldrCode.replace(oldMobileSave, newMobileSave);

fs.writeFileSync('src/components/WebsiteBuilder/WebsiteBuilder.jsx', bldrCode);
console.log('Fixed Delete onTouchEnd and styled Save Draft buttons');
