const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Sign In Button
appContent = appContent.replace(
    'bg-gradient-to-r from-[#b8860b] via-[#e5b32a] to-[#b8860b] shadow-[0_0_20px_rgba(229,179,42,0.4)] cursor-pointer border border-[#e5b32a]/30',
    'bg-gradient-to-r from-[#b8860b] via-[#e5b32a] to-[#b8860b] shadow-md shadow-black/20 cursor-pointer border border-[#e5b32a]/30'
);

// Unlock Access Button
appContent = appContent.replace(
    'cursor-pointer shadow-[0_0_20px_rgba(229,179,42,0.4)] border border-[#e5b32a]/30',
    'cursor-pointer shadow-md shadow-black/20 border border-[#e5b32a]/30'
);

fs.writeFileSync(appPath, appContent);
console.log('Modifications completed.');

try {
    execSync('git add legacy-academy-frontend/src/App.jsx');
    execSync('git commit -m "Remove glow effect from login and paywall buttons"');
    execSync('git push');
    console.log('Git commit and push successful.');
} catch (e) {
    console.error('Git operation failed:', e.message);
}
