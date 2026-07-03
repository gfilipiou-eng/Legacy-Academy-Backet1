const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// Replace the showScrollTop button block exactly
const blockToReplace = `                    {showScrollTop && !isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost && (
                        <button
                            onClick={scrollToTop}
                            className="fixed bottom-[calc(158px+env(safe-area-inset-bottom))] right-20 sm:right-32 z-[950] w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ffffff]/10 shrink-0 flex-none flex items-center justify-center text-[var(--gold-primary)] backdrop-blur-2xl border border-[#ffffff]/20 hover:scale-105 active:scale-95 transition-all duration-500 ease-out"
                        >
                            <Icons.ArrowUp className="w-8 h-8 sm:w-10 sm:h-10" />
                        </button>
                    )}`;
                    
const newBlock = `                    <ScrollToTop mainScrollRef={mainScrollRef} />`;

code = code.replace(blockToReplace, newBlock);

// Also remove setShowScrollTop(false) if it exists
code = code.replace(/setShowScrollTop\(false\);/g, '');

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Fixed showScrollTop exactly');
