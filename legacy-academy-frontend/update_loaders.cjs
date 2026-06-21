const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace PlatformLoadingPanel
const panelRegex = /const PlatformLoadingPanel = \(\{ label, compact = false \}\) => \([\s\S]*?\n\);\n/;
const modernPanel = `const PlatformLoadingPanel = ({ label, compact = false }) => (
    <div className={\`flex flex-col items-center justify-center gap-8 \${compact ? 'py-10' : 'py-20'}\`}>
        <div className="relative flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 rounded-full border border-white/5" />
            <div className="absolute inset-0 rounded-full border border-t-[var(--gold-primary)] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1s' }} />
            <div className="absolute inset-2 rounded-full border border-b-[var(--gold-primary)] border-r-transparent border-t-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
            <div className="absolute inset-4 rounded-full bg-[var(--gold-primary)]/10 animate-pulse flex items-center justify-center" />
        </div>
        {label && (
            <div className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--gold-primary)]/80">
                {label}
            </div>
        )}
    </div>
);
`;
code = code.replace(panelRegex, modernPanel);

// Replace PublicProfileSkeleton EXACTLY
const skeletonStart = "const PublicProfileSkeleton = () => (";
const linktreeStart = "const PublicProfileLinktree = ({";

if (code.includes(skeletonStart) && code.includes(linktreeStart)) {
    const startIdx = code.indexOf(skeletonStart);
    const endIdx = code.indexOf(linktreeStart);
    
    const modernSkeleton = `const PublicProfileSkeleton = () => (
    <div className="min-h-screen bg-black w-full flex flex-col relative overflow-hidden" style={{ '--gold-primary': '#D4AF37' }}>
        <div className="w-full h-[25vh] sm:h-[30vh] bg-[#111] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#222] to-[#111] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        </div>
        <div className="w-full flex justify-center -mt-16 sm:-mt-20 relative z-10">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#111] border-4 border-black relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#222] to-[#111] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
            </div>
        </div>
        <div className="w-full max-w-2xl mx-auto px-4 mt-6 flex flex-col items-center gap-4">
            <div className="w-48 h-8 bg-[#111] rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#222] to-[#111] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
            </div>
            <div className="w-32 h-4 bg-[#111] rounded-full relative overflow-hidden mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#222] to-[#111] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
            </div>
            <div className="w-full flex flex-col gap-4 mt-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-full h-16 bg-[#111] rounded-[1.5rem] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#222] to-[#111] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

`;
    code = code.substring(0, startIdx) + modernSkeleton + code.substring(endIdx);
}


// Update Edit Profile save button
const editProfileSaveRegex = /\{profileSaving \? \([\s\S]*?\) : \([\s\S]*?SAVE'\s*\}\s*<\/>\s*\)\}/;
const modernEditProfileSave = `{profileSaving ? (
                                <div className="flex items-center justify-center gap-1.5 h-4">
                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            ) : (
                                <>
                                    <Icons.Check className="w-4 h-4" />
                                    {t('SAVE') || 'SAVE'}
                                </>
                            )}`;
code = code.replace(editProfileSaveRegex, modernEditProfileSave);

fs.writeFileSync('src/App.jsx', code);
console.log('Done replacing loaders properly');
