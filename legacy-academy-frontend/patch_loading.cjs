const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Upgrade PlatformLoadingPanel
const oldPlatformLoadingPanelMatch = `const PlatformLoadingPanel = ({ label, compact = false }) => (
    <div className={\`flex flex-col items-center justify-center gap-6 \${compact ? 'py-10' : 'py-20'} relative\`}>
        <div className="relative flex items-center justify-center w-16 h-16">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-[2px] border-t-[var(--gold-primary)] border-r-[var(--gold-primary)]/30 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s' }} />
            {/* Inner pulsing core */}
            <div className="w-10 h-10 rounded-full bg-[var(--gold-primary)]/10 animate-pulse flex items-center justify-center backdrop-blur-sm border border-[var(--gold-primary)]/20 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <Icons.Loader className="w-4 h-4 text-[var(--gold-primary)] animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
            </div>
        </div>
        {label && (
            <div className="flex flex-col items-center gap-2">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold-primary)] relative z-10 shadow-black drop-shadow-md">
                    {label}
                </div>
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[var(--gold-primary)] to-transparent opacity-50" />
            </div>
        )}
    </div>
);`;

const newPlatformLoadingPanel = `const PlatformLoadingPanel = ({ label, compact = false }) => (
    <div className={\`flex flex-col items-center justify-center gap-6 \${compact ? 'py-10' : 'py-20'} relative\`}>
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative flex items-center justify-center w-20 h-20"
        >
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-[2px] border-t-[var(--gold-primary)] border-r-[var(--gold-primary)]/30 border-b-transparent border-l-transparent" 
            />
            <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-12 h-12 rounded-full bg-[var(--gold-primary)]/10 flex items-center justify-center backdrop-blur-md border border-[var(--gold-primary)]/30 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
            >
                <Icons.Globe className="w-6 h-6 text-[var(--gold-primary)]" />
            </motion.div>
        </motion.div>
        {label && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col items-center gap-3"
            >
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--gold-primary)] relative z-10 shadow-black drop-shadow-md">
                    {label}
                </div>
                <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-[var(--gold-primary)] to-transparent opacity-50" />
            </motion.div>
        )}
    </div>
);`;

code = code.replace(oldPlatformLoadingPanelMatch, newPlatformLoadingPanel);

// 2. Add Skeleton Loader and replace in PublicProfileLinktree
const skeletonCode = `const PublicProfileSkeleton = () => (
    <div className="min-h-screen bg-black w-full flex flex-col relative overflow-hidden" style={{ '--gold-primary': '#D4AF37' }}>
        <motion.div 
            className="absolute inset-0 z-50 pointer-events-none"
            animate={{ 
                backgroundPosition: ['200% 0', '-200% 0']
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ 
                backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0) 100%)',
                backgroundSize: "200% 100%" 
            }}
        />
        <div className="w-full h-[25vh] sm:h-[30vh] bg-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
        </div>
        <div className="w-full flex justify-center -mt-16 sm:-mt-20 relative z-10">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#111] border-4 border-black shadow-[0_0_30px_rgba(212,175,55,0.1)] flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-white/5 animate-pulse" />
            </div>
        </div>
        <div className="w-full max-w-2xl mx-auto px-4 mt-6 flex flex-col items-center gap-4">
            <div className="w-48 h-8 bg-white/5 rounded-full animate-pulse" />
            <div className="w-32 h-4 bg-white/5 rounded-full animate-pulse mb-4" />
            <div className="w-full h-20 bg-white/5 rounded-2xl animate-pulse" />
            <div className="w-full flex flex-col gap-4 mt-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-full h-16 bg-white/5 rounded-[1.5rem] animate-pulse" />
                ))}
            </div>
        </div>
    </div>
);
`;

code = code.replace(/const PublicProfileLinktree = \(\{/, skeletonCode + '\nconst PublicProfileLinktree = ({');

const oldProfileLoadingMatch = `    if (loadingUser && !publicUser) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ '--gold-primary': themeColor }}>
                <PlatformLoadingPanel label="GATHERING INTEL..." />
            </div>
        );
    }`;

const newProfileLoading = `    if (loadingUser && !publicUser) {
        return <PublicProfileSkeleton />;
    }`;

code = code.replace(oldProfileLoadingMatch, newProfileLoading);

// 3. Improve initial app loading screen (if there's any global loading text)
const appLoadingMatch = `<div className="flex items-center justify-center min-h-screen bg-black text-white">
                <PlatformLoadingPanel label="INITIALIZING..." />
            </div>`;
const appLoadingMatch2 = `if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center"><PlatformLoadingPanel label="INITIALIZING..." /></div>;`;

// Actually we will just rely on the upgraded PlatformLoadingPanel which looks 100x better for all of them!

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx loading animations patched');
