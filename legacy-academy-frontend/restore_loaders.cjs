const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

const currentPanelMatch = /const PlatformLoadingPanel = \(\{ label, compact = false \}\) => \([\s\S]*?\n\);\n/;
const oldPanel = `const PlatformLoadingPanel = ({ label, compact = false }) => (
    <div className={\`flex flex-col items-center justify-center gap-6 \${compact ? 'py-10' : 'py-20'} relative\`}>
        <div className="relative flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 rounded-full border-[2px] border-t-[var(--gold-primary)] border-r-[var(--gold-primary)]/30 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s' }} />
            <div className="w-10 h-10 rounded-full bg-[var(--gold-primary)]/10 animate-pulse flex items-center justify-center border border-[var(--gold-primary)]/20">
                <Icons.Loader className="w-4 h-4 text-[var(--gold-primary)] animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
            </div>
        </div>
        {label && (
            <div className="flex flex-col items-center gap-2">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold-primary)] relative z-10">
                    {label}
                </div>
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[var(--gold-primary)] to-transparent opacity-50" />
            </div>
        )}
    </div>
);\n`;

code = code.replace(currentPanelMatch, oldPanel);

const skeletonMatch = /const PublicProfileSkeleton = \(\) => \([\s\S]*?\n\);\n\n/;
code = code.replace(skeletonMatch, '');

const linktreeMatch = /if \(loadingUser && !publicUser\) \{\s*return <PublicProfileSkeleton \/>;\s*\}/;
const oldLinktree = `if (loadingUser && !publicUser) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ '--gold-primary': themeColor }}>
                <PlatformLoadingPanel label="GATHERING INTEL..." />
            </div>
        );
    }`;

code = code.replace(linktreeMatch, oldLinktree);

fs.writeFileSync('src/App.jsx', code);
console.log('Restored original safe loaders minus glow');
