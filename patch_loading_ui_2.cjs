const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// Patch PlatformLoadingPanel
const p1 = `const PlatformLoadingPanel = ({ label, compact = false }) => (
    <div className={\`flex flex-col items-center justify-center gap-6 \${compact ? 'py-10' : 'py-20'} relative animate-fade-in\`}>
        <div className="relative flex items-center justify-center w-12 h-12">
            <Icons.Loader className="w-8 h-8 text-[var(--gold-primary)]" />
        </div>
        {label && (
            <div className="flex flex-col items-center gap-2">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold-primary)] relative z-10">
                    {label}
                </div>
            </div>
        )}
    </div>
);`;

const r1 = `const PlatformLoadingPanel = ({ label, compact = false }) => (
    <div className={\`flex flex-col items-center justify-center gap-6 \${compact ? 'py-10' : 'py-20'} relative animate-fade-in\`}>
        <div className="relative flex items-center justify-center w-12 h-12">
            <Icons.Loader className="w-8 h-8 text-[var(--gold-primary)]" />
        </div>
        {label && (
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold-primary)] relative z-10">
                    {label}
                </div>
                <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--gold-primary)]/50 mt-1">
                    (WAKING UP SECURE SERVER... MAY TAKE 50S)
                </div>
            </div>
        )}
    </div>
);`;
code = code.replace(p1, r1);

// Patch SIGN IN button
const p2 = `                                                {authLoading ? (
                                                    <div className="w-5 h-5 text-black">
                                                        <Icons.Loader />
                                                    </div>
                                                ) : <span className="relative">SIGN IN</span>}`;

const r2 = `                                                {authLoading ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 text-black"><Icons.Loader /></div>
                                                        <span className="text-black text-[9px] font-black tracking-widest uppercase">Waking Server (Up to 50s)...</span>
                                                    </div>
                                                ) : <span className="relative">SIGN IN</span>}`;
// We have to use regex for safety due to whitespace
code = code.replace(/<div className="w-5 h-5 text-black">\s*<Icons\.Loader \/>\s*<\/div>\s*\) : <span className="relative">SIGN IN<\/span>\}/g, 
`<div className="flex items-center justify-center gap-2"><div className="w-4 h-4 text-black"><Icons.Loader /></div><span className="text-black text-[9px] font-black tracking-widest uppercase">WAKING SERVER (UP TO 50s)...</span></div>) : <span className="relative">SIGN IN</span>}`);

// Patch CREATE ACCOUNT button
code = code.replace(/<div className="w-5 h-5 text-black">\s*<Icons\.Loader \/>\s*<\/div>\s*\) : <span className="relative">CREATE ACCOUNT<\/span>\}/g, 
`<div className="flex items-center justify-center gap-2"><div className="w-4 h-4 text-black"><Icons.Loader /></div><span className="text-black text-[9px] font-black tracking-widest uppercase">WAKING SERVER (UP TO 50s)...</span></div>) : <span className="relative">CREATE ACCOUNT</span>}`);

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Patched UI strings');
