const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

const oldCartelView = `                                    {activeTab === 'cartels' && selectedCartel && (
                                        <CartelView 
                                            cartel={selectedCartel} 
                                            user={user} 
                                            t={t} 
                                            onBack={() => setSelectedCartel(null)} 
                                            onCreatePost={(cartelId) => {
                                                setCreateCartelId(cartelId);
                                                setIsCreateOpen(true);
                                            }}
                                            PostCard={PostCard}
                                        />
                                    )}`;

// 1. Remove it from inside the feed
appContent = appContent.replace(oldCartelView, '');

// 2. Insert it next to CreateModal
const createModalStr = `<CreateModal isOpen={isCreateOpen}`;
const newCartelView = `{selectedCartel && (
                        <CartelView 
                            cartel={selectedCartel} 
                            user={user} 
                            t={t} 
                            onBack={() => setSelectedCartel(null)} 
                            onCreatePost={(cartelId) => {
                                setCreateCartelId(cartelId);
                                setIsCreateOpen(true);
                            }}
                            PostCard={PostCard}
                        />
                    )}
                    `;

appContent = appContent.replace(createModalStr, newCartelView + createModalStr);

fs.writeFileSync(appPath, appContent);

// 3. ALSO in CartelView.jsx, revert the header height to h-48 or h-64 to match "big".
// The user complained it was "san kartaki" (like a small card), which could also mean the header was squished.
const cvPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cvContent = fs.readFileSync(cvPath, 'utf8');

// The header was shrunk to h-32, let's restore it to h-48 sm:h-64
cvContent = cvContent.replace(
    'className="relative w-full h-32 sm:h-64 bg-black shrink-0"',
    'className="relative w-full h-48 sm:h-64 bg-black shrink-0"'
);
cvContent = cvContent.replace(
    'className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-black border-2 border-[var(--gold-primary)] overflow-hidden shrink-0 shadow-xl"',
    'className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black border-2 border-[var(--gold-primary)] overflow-hidden shrink-0 shadow-xl"'
);

fs.writeFileSync(cvPath, cvContent);
console.log('Fixed CartelView trapping bug by moving it to root. Restored big header.');
