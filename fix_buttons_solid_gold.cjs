const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Sign In Button
appContent = appContent.replace(
    'bg-gradient-to-r from-[#b8860b] via-[#e5b32a] to-[#b8860b] shadow-md shadow-black/20 cursor-pointer border border-[#e5b32a]/30',
    'bg-[#D4AF37] hover:bg-[#F1C40F] text-[#0a0a0a] shadow-none cursor-pointer border-none'
);

// We need to also remove text-white from the sign in button if we make the text dark
appContent = appContent.replace(
    'disabled:opacity-40 hover:opacity-90 text-white transition-all duration-300 bg-[#D4AF37]',
    'disabled:opacity-40 hover:opacity-90 text-[#0a0a0a] transition-all duration-300 bg-[#D4AF37]'
);

// Unlock Access Button
appContent = appContent.replace(
    'bg-gradient-to-r from-[#b8860b] via-[#e5b32a] to-[#b8860b] text-white font-black uppercase tracking-[0.3em] rounded-[18px] active:scale-95 transition-all duration-300 mb-3 sm:mb-6 text-[10px] sm:text-[12px] relative overflow-hidden group shrink-0 cursor-pointer shadow-md shadow-black/20 border border-[#e5b32a]/30',
    'bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#F1C40F] font-black uppercase tracking-[0.3em] rounded-[18px] active:scale-95 transition-all duration-300 mb-3 sm:mb-6 text-[10px] sm:text-[12px] relative overflow-hidden group shrink-0 cursor-pointer shadow-none border-none'
);

fs.writeFileSync(appPath, appContent);
console.log('Modifications completed.');

try {
    execSync('git add legacy-academy-frontend/src/App.jsx');
    execSync('git commit -m "Make buttons solid rich gold with dark text and no glow"');
    execSync('git push');
    console.log('Git commit and push successful.');
} catch (e) {
    console.error('Git operation failed:', e.message);
}
