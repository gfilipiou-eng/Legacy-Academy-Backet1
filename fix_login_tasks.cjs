const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// 1. Create Account text white
// From: hover:text-[var(--gold-primary)] transition-colors bg-transparent border-none outline-none p-0 font-bold text-[var(--gold-primary)]/80 uppercase tracking-widest text-[9px]
// To: hover:text-white transition-colors bg-transparent border-none outline-none p-0 font-bold text-white/90 uppercase tracking-widest text-[9px]
appContent = appContent.replace(
    'hover:text-[var(--gold-primary)] transition-colors bg-transparent border-none outline-none p-0 font-bold text-[var(--gold-primary)]/80 uppercase tracking-widest text-[9px]',
    'hover:text-white transition-colors bg-transparent border-none outline-none p-0 font-bold text-white/90 uppercase tracking-widest text-[9px]'
);

// 2. Forgot Password text white
// From: hover:text-white/60 transition-colors bg-transparent border-none outline-none p-0 font-bold uppercase tracking-widest text-[9px]
// To: hover:text-white transition-colors bg-transparent border-none outline-none p-0 font-bold text-white/90 uppercase tracking-widest text-[9px]
appContent = appContent.replace(
    /hover:text-white\/60 transition-colors bg-transparent border-none outline-none p-0 font-bold uppercase tracking-widest text-\[9px\]/g,
    'hover:text-white transition-colors bg-transparent border-none outline-none p-0 font-bold text-white/90 uppercase tracking-widest text-[9px]'
);

// 3. Return to Login in paywall white
// From: text-[10px] sm:text-[12px] text-white/40 uppercase tracking-[0.25em] font-bold hover:text-white/90 transition-colors underline decoration-white/20 hover:decoration-white/50 underline-offset-4 pb-1 shrink-0
// To: text-[10px] sm:text-[12px] text-white/90 uppercase tracking-[0.25em] font-bold hover:text-white transition-colors underline decoration-white/50 hover:decoration-white underline-offset-4 pb-1 shrink-0 cursor-pointer
appContent = appContent.replace(
    'text-[10px] sm:text-[12px] text-white/40 uppercase tracking-[0.25em] font-bold hover:text-white/90 transition-colors underline decoration-white/20 hover:decoration-white/50 underline-offset-4 pb-1 shrink-0',
    'text-[10px] sm:text-[12px] text-white/90 uppercase tracking-[0.25em] font-bold hover:text-white transition-colors underline decoration-white/50 hover:decoration-white underline-offset-4 pb-1 shrink-0 cursor-pointer'
);

// 4. SIGN IN button styling
// From: className="mt-2 w-full relative group overflow-hidden rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.2em] disabled:opacity-40 hover:opacity-90 text-white transition-all duration-300" style={{ backgroundColor: 'var(--gold-primary)' }}
// To: className="mt-2 w-full relative group overflow-hidden rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.2em] disabled:opacity-40 hover:opacity-90 text-white transition-all duration-300 bg-gradient-to-r from-[#b8860b] via-[#e5b32a] to-[#b8860b] shadow-[0_0_20px_rgba(229,179,42,0.4)] cursor-pointer"
appContent = appContent.replace(
    `className="mt-2 w-full relative group overflow-hidden rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.2em] disabled:opacity-40 hover:opacity-90 text-white transition-all duration-300" style={{ backgroundColor: 'var(--gold-primary)' }}`,
    `className="mt-2 w-full relative group overflow-hidden rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.2em] disabled:opacity-40 hover:opacity-90 text-white transition-all duration-300 bg-gradient-to-r from-[#b8860b] via-[#e5b32a] to-[#b8860b] shadow-[0_0_20px_rgba(229,179,42,0.4)] cursor-pointer border border-[#e5b32a]/30"`
);

// 5. UNLOCK ACCESS button styling fix
// From: className="w-full py-3 sm:py-4 bg-gradient-to-r from-[#b8860b] via-[#e5b32a] to-[#b8860b] text-white font-black uppercase tracking-[0.3em] rounded-[18px] active:scale-95 transition-all duration-300 mb-3 sm:mb-6 text-[10px] sm:text-[12px] relative overflow-hidden group shrink-0"
// To: ... add cursor-pointer, shadow, and border
appContent = appContent.replace(
    `className="w-full py-3 sm:py-4 bg-gradient-to-r from-[#b8860b] via-[#e5b32a] to-[#b8860b] text-white font-black uppercase tracking-[0.3em] rounded-[18px] active:scale-95 transition-all duration-300 mb-3 sm:mb-6 text-[10px] sm:text-[12px] relative overflow-hidden group shrink-0"`,
    `className="w-full py-3 sm:py-4 bg-gradient-to-r from-[#b8860b] via-[#e5b32a] to-[#b8860b] text-white font-black uppercase tracking-[0.3em] rounded-[18px] active:scale-95 transition-all duration-300 mb-3 sm:mb-6 text-[10px] sm:text-[12px] relative overflow-hidden group shrink-0 cursor-pointer shadow-[0_0_20px_rgba(229,179,42,0.4)] border border-[#e5b32a]/30"`
);

fs.writeFileSync(appPath, appContent);
console.log('Modifications completed.');

try {
    execSync('git add legacy-academy-frontend/src/App.jsx');
    execSync('git add legacy-academy-frontend/src/components/Icons.jsx');
    execSync('git add legacy-academy-frontend/src/index.css');
    execSync('git add legacy-academy-frontend/src/locales/*.json');
    execSync('git commit -m "Update login and paywall styles"');
    execSync('git push');
    console.log('Git commit and push successful.');
} catch (e) {
    console.error('Git operation failed:', e.message);
}
