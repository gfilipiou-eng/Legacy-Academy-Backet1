const fs = require('fs');
const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteBuilder.jsx';
let code = fs.readFileSync(path, 'utf8');

// Add showSaveSuccess state
code = code.replace(
    'const [showPublishSuccess, setShowPublishSuccess] = useState(false);',
    'const [showPublishSuccess, setShowPublishSuccess] = useState(false);\n    const [showSaveSuccess, setShowSaveSuccess] = useState(false);'
);

// Update handlePublish logic
code = code.replace(
    /setShowPublishSuccess\(true\);\s*setTimeout\(\(\) => setPublished\(false\), 3000\);/s,
    `if (isDraft) {
                setShowSaveSuccess(true);
                setTimeout(() => setShowSaveSuccess(false), 3000);
            } else {
                setShowPublishSuccess(true);
            }
            setTimeout(() => setPublished(false), 3000);`
);

// Add Save Success Toast UI just above the Publish Success Modal
const saveToastUI = `
            {/* Save Success Toast */}
            {showSaveSuccess && (
                <div className="fixed top-4 right-4 z-[5000] bg-green-500/20 border border-green-500/50 backdrop-blur-xl text-green-400 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <Icons.CheckCircle className="w-6 h-6" />
                    <div>
                        <div className="font-bold">Draft Saved</div>
                        <div className="text-sm opacity-80">You can continue editing safely.</div>
                    </div>
                </div>
            )}
`;

code = code.replace(
    '{/* Publish Success Modal */}',
    saveToastUI + '\n            {/* Publish Success Modal */}'
);

fs.writeFileSync(path, code, 'utf8');
console.log('Added showSaveSuccess logic');
