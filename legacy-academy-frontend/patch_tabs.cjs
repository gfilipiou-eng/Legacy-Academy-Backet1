const fs = require('fs');

function patchPublicWebsiteViewer() {
    const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/PublicWebsiteViewer.jsx';
    let code = fs.readFileSync(p, 'utf8');

    // 1. Add activeTab state
    if (!code.includes('activeTab')) {
        code = code.replace(
            "const [orderComplete, setOrderComplete] = useState(false);",
            "const [orderComplete, setOrderComplete] = useState(false);\n    const [activeTab, setActiveTab] = useState('newest');"
        );
    }

    // 2. Add sorted features logic
    if (!code.includes('getSortedFeatures')) {
        code = code.replace(
            "const activeTheme = themes[config.palette] || themes.dark;",
            `const activeTheme = themes[config.palette] || themes.dark;
    
    const getSortedFeatures = () => {
        if (!config.features) return [];
        const feats = [...config.features];
        if (activeTab === 'oldest') return feats.reverse();
        if (activeTab === 'popular') return feats.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        return feats;
    };
    
    const sortedFeatures = getSortedFeatures();`
        );
    }

    // 3. Add tabs and map sortedFeatures instead of config.features
    const featuresTarget = `{config.featuresTitle !== '' && <h3 className="text-4xl font-black mb-16 text-center tracking-tight">{config.featuresTitle ?? 'Features'}</h3>}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {config.features?.map((feat, idx) => (`;
    
    const featuresReplacement = `{config.featuresTitle !== '' && <h3 className="text-4xl font-black mb-8 text-center tracking-tight">{config.featuresTitle ?? 'Τα Storyline μας'}</h3>}
                                
                                {/* Bluesky style Tabs */}
                                <div className={\`flex items-center justify-center gap-6 mb-12 border-b \${config.palette === 'light' ? 'border-black/10' : 'border-white/10'}\`}>
                                    <button 
                                        onClick={() => setActiveTab('newest')}
                                        className={\`pb-4 font-bold text-sm transition-all relative \${activeTab === 'newest' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}\`}
                                    >
                                        Νεότερα Posts
                                        {activeTab === 'newest' && <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full" style={{ backgroundColor: activeTheme.primary }} />}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('popular')}
                                        className={\`pb-4 font-bold text-sm transition-all relative \${activeTab === 'popular' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}\`}
                                    >
                                        Δημοφιλέστερα Posts
                                        {activeTab === 'popular' && <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full" style={{ backgroundColor: activeTheme.primary }} />}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('oldest')}
                                        className={\`pb-4 font-bold text-sm transition-all relative \${activeTab === 'oldest' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}\`}
                                    >
                                        Παλαιότερα Posts
                                        {activeTab === 'oldest' && <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full" style={{ backgroundColor: activeTheme.primary }} />}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {sortedFeatures.map((feat, idx) => (`;
    
    if (code.includes('config.features?.map')) {
        code = code.replace(featuresTarget, featuresReplacement);
    }

    // Replace defaults with Greek
    code = code.replace(/{config\.navLink1 \?\? 'Services'}/g, "{config.navLink1 ?? 'Υπηρεσίες'}");
    code = code.replace(/{config\.navLink2 \?\? 'About'}/g, "{config.navLink2 ?? 'Σχετικά'}");
    code = code.replace(/{config\.navLink3 \?\? 'Contact'}/g, "{config.navLink3 ?? 'Επικοινωνία'}");
    code = code.replace(/{config\.ctaText \?\? 'Get in Touch'}/g, "{config.ctaText ?? 'Επικοινωνήστε Μαζί Μας'}");

    fs.writeFileSync(p, code, 'utf8');
}

function patchWebsiteBuilder() {
    const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteBuilder.jsx';
    let code = fs.readFileSync(p, 'utf8');

    // 1. Add activeTab state to WebsiteBuilder
    if (!code.includes('activeTab, setActiveTab')) {
        code = code.replace(
            "const [previewMode, setPreviewMode] = useState('desktop');",
            "const [previewMode, setPreviewMode] = useState('desktop');\n    const [activeTab, setActiveTab] = useState('newest');"
        );
    }

    // 2. Add sorted features logic
    if (!code.includes('getSortedFeatures')) {
        code = code.replace(
            "const activeTheme = themes[config.palette] || themes.dark;",
            `const activeTheme = themes[config.palette] || themes.dark;
    
    const getSortedFeatures = () => {
        if (!config.features) return [];
        const feats = [...config.features];
        if (activeTab === 'oldest') return feats.reverse();
        if (activeTab === 'popular') return feats.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        return feats;
    };
    
    const sortedFeatures = getSortedFeatures();`
        );
    }

    // 3. Add tabs and map sortedFeatures instead of config.features in the PREVIEW pane
    const featuresTarget = `{config.featuresTitle !== '' && <h3 className="text-4xl font-black mb-16 text-center tracking-tight">{config.featuresTitle ?? 'Features'}</h3>}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {config.features?.map((feat, idx) => (`;
    
    const featuresReplacement = `{config.featuresTitle !== '' && <h3 className="text-4xl font-black mb-8 text-center tracking-tight">{config.featuresTitle ?? 'Τα Storyline μας'}</h3>}
                                
                                {/* Bluesky style Tabs */}
                                <div className={\`flex items-center justify-center gap-6 mb-12 border-b \${config.palette === 'light' ? 'border-black/10' : 'border-white/10'}\`}>
                                    <button 
                                        onClick={() => setActiveTab('newest')}
                                        className={\`pb-4 font-bold text-sm transition-all relative \${activeTab === 'newest' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}\`}
                                    >
                                        Νεότερα Posts
                                        {activeTab === 'newest' && <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full" style={{ backgroundColor: activeTheme.primary }} />}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('popular')}
                                        className={\`pb-4 font-bold text-sm transition-all relative \${activeTab === 'popular' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}\`}
                                    >
                                        Δημοφιλέστερα Posts
                                        {activeTab === 'popular' && <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full" style={{ backgroundColor: activeTheme.primary }} />}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('oldest')}
                                        className={\`pb-4 font-bold text-sm transition-all relative \${activeTab === 'oldest' ? 'opacity-100' : 'opacity-50 hover:opacity-80'}\`}
                                    >
                                        Παλαιότερα Posts
                                        {activeTab === 'oldest' && <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full" style={{ backgroundColor: activeTheme.primary }} />}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {sortedFeatures.map((feat, idx) => (`;
    
    if (code.includes('config.features?.map')) {
        code = code.replace(featuresTarget, featuresReplacement);
    }

    // Replace default text values used when config is missing
    code = code.replace(/{config\.navLink1 \?\? 'Services'}/g, "{config.navLink1 ?? 'Υπηρεσίες'}");
    code = code.replace(/{config\.navLink2 \?\? 'About'}/g, "{config.navLink2 ?? 'Σχετικά'}");
    code = code.replace(/{config\.navLink3 \?\? 'Contact'}/g, "{config.navLink3 ?? 'Επικοινωνία'}");
    code = code.replace(/{config\.ctaText \?\? 'Get in Touch'}/g, "{config.ctaText ?? 'Επικοινωνήστε Μαζί Μας'}");

    // Replace the default translations in the builder inputs themselves
    code = code.replace(/existingWebsite\.ctaText \?\? 'Get in Touch'/g, "existingWebsite.ctaText ?? 'Επικοινωνήστε Μαζί Μας'");
    code = code.replace(/existingWebsite\.navLink1 \?\? 'Services'/g, "existingWebsite.navLink1 ?? 'Υπηρεσίες'");
    code = code.replace(/existingWebsite\.navLink2 \?\? 'About'/g, "existingWebsite.navLink2 ?? 'Σχετικά'");
    code = code.replace(/existingWebsite\.navLink3 \?\? 'Contact'/g, "existingWebsite.navLink3 ?? 'Επικοινωνία'");
    code = code.replace(/existingWebsite\.featuresTitle \?\? 'Why Choose Us'/g, "existingWebsite.featuresTitle ?? 'Τα Storyline μας'");

    fs.writeFileSync(p, code, 'utf8');
}

patchPublicWebsiteViewer();
patchWebsiteBuilder();
console.log('Patched features tabs and translations successfully!');
