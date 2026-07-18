const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

const targetLine = "{(activeTab === 'home' || (activeTab === 'search' && searchQuery)) && groupedPosts.map(group => {";

const renderCartels = `
                                    {/* Cartels UI */}
                                    {activeTab === 'cartels' && !selectedCartel && (
                                        <CartelsExplore user={user} t={t} onViewCartel={setSelectedCartel} />
                                    )}
                                    {activeTab === 'cartels' && selectedCartel && (
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

if (appContent.includes(targetLine) && !appContent.includes("<CartelsExplore user={user}")) {
    appContent = appContent.replace(targetLine, renderCartels + "\n                                                " + targetLine);
    fs.writeFileSync(appPath, appContent);
    console.log("Successfully injected Cartels UI into App.jsx");
} else {
    console.error("Failed to find target line or Cartels already injected.");
}
