const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// 1. Add imports
if (!appContent.includes("import { CartelsExplore }")) {
    appContent = appContent.replace(
        "import { WebsiteManager } from './components/WebsiteBuilder/WebsiteManager';",
        "import { WebsiteManager } from './components/WebsiteBuilder/WebsiteManager';\nimport { CartelsExplore } from './components/Cartels';\nimport { CartelView } from './components/CartelView';"
    );
}

// 2. Add state
if (!appContent.includes("const [selectedCartel, setSelectedCartel] = useState(null);")) {
    appContent = appContent.replace(
        "const [activeTab, setActiveTab] = useState('home');",
        "const [activeTab, setActiveTab] = useState('home');\n    const [selectedCartel, setSelectedCartel] = useState(null);"
    );
}

// 3. Render Cartels UI
// We need to inject the Cartels component right after the `feed` or inside the main content area.
// The main content area has `{activeTab === 'home' && ...}`
const renderCartels = `
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
                                        setIsCreateOpen(true);
                                        // We need to pass cartelId to CreatePostModal, but we might just use a global or pass it down.
                                        // For now, let's set a state or just open it. We'll modify CreatePostModal.
                                        // Actually, let's define setCreateCartelId(cartelId)
                                    }}
                                    PostCard={PostCard}
                                />
                            )}
`;

if (!appContent.includes("{activeTab === 'cartels'")) {
    appContent = appContent.replace(
        "{activeTab === 'home' && (",
        renderCartels + "\n                            {activeTab === 'home' && ("
    );
}

// 4. Update CreatePostModal to accept cartelId
// State for createCartelId
if (!appContent.includes("const [createCartelId, setCreateCartelId] = useState(null);")) {
    appContent = appContent.replace(
        "const [isCreateOpen, setIsCreateOpen] = useState(false);",
        "const [isCreateOpen, setIsCreateOpen] = useState(false);\n    const [createCartelId, setCreateCartelId] = useState(null);"
    );
}

// Pass it to the button in CartelView (which I did: setCreateCartelId(cartelId); setIsCreateOpen(true);)
appContent = appContent.replace(
    "// Actually, let's define setCreateCartelId(cartelId)",
    "setCreateCartelId(cartelId);"
);

// We must also pass cartelId to CreatePostModal. Let's find where CreatePostModal is rendered.
// <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} ... />
if (!appContent.includes("cartelId={createCartelId}")) {
    appContent = appContent.replace(
        "<CreatePostModal",
        "<CreatePostModal cartelId={createCartelId} "
    );
    appContent = appContent.replace(
        "setIsCreateOpen(false)",
        "{ setIsCreateOpen(false); setCreateCartelId(null); }"
    );
}

// 5. CreatePostModal implementation inside App.jsx needs to accept cartelId and send it.
// const CreatePostModal = ({ isOpen, onClose, addToast, user, ...
if (!appContent.includes("cartelId = null")) {
    appContent = appContent.replace(
        "const CreatePostModal = ({ isOpen, onClose, addToast, user, isStoryMode = false }) => {",
        "const CreatePostModal = ({ isOpen, onClose, addToast, user, isStoryMode = false, cartelId = null }) => {"
    );
    appContent = appContent.replace(
        "formData.append('isStory', isStoryMode);",
        "formData.append('isStory', isStoryMode);\n            if (cartelId) formData.append('cartelId', cartelId);"
    );
}

fs.writeFileSync(appPath, appContent);
console.log('App.jsx updated with Cartels Explore and View rendering');
