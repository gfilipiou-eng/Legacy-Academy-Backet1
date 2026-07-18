const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cssPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

const buttonCss = `
.live-gold-button {
  background: linear-gradient(
    -45deg,
    #BF953F 0%,
    #FCF6BA 25%,
    #B38728 50%,
    #FBF5B7 75%,
    #AA771C 100%
  ) !important;
  background-size: 200% auto !important;
  color: #0a0a0a !important;
  border: 1px solid rgba(212, 175, 55, 0.5) !important;
  box-shadow: none !important;
  animation: shineLiveGold 3s linear infinite !important;
  transition: transform 0.2s ease !important;
}

.live-gold-button:hover {
  transform: translateY(-2px) scale(1.01) !important;
}
`;

if (!cssContent.includes('.live-gold-button')) {
    cssContent += '\n' + buttonCss;
    fs.writeFileSync(cssPath, cssContent);
    console.log('Added .live-gold-button to index.css');
}

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// The sign in button
// From: bg-[#D4AF37] hover:bg-[#F1C40F] text-[#0a0a0a] shadow-none cursor-pointer border-none
// Also it has: disabled:opacity-40 hover:opacity-90 text-[#0a0a0a] transition-all duration-300 bg-[#D4AF37]
appContent = appContent.replace(
    'disabled:opacity-40 hover:opacity-90 text-[#0a0a0a] transition-all duration-300 bg-[#D4AF37]',
    'disabled:opacity-40 hover:opacity-90 transition-all duration-300 live-gold-button'
);

// The unlock access button
// From: bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#F1C40F] font-black uppercase tracking-[0.3em] rounded-[18px] active:scale-95 transition-all duration-300 mb-3 sm:mb-6 text-[10px] sm:text-[12px] relative overflow-hidden group shrink-0 cursor-pointer shadow-none border-none
appContent = appContent.replace(
    'bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#F1C40F] font-black uppercase tracking-[0.3em] rounded-[18px] active:scale-95 transition-all duration-300 mb-3 sm:mb-6 text-[10px] sm:text-[12px] relative overflow-hidden group shrink-0 cursor-pointer shadow-none border-none',
    'live-gold-button font-black uppercase tracking-[0.3em] rounded-[18px] active:scale-95 transition-all duration-300 mb-3 sm:mb-6 text-[10px] sm:text-[12px] relative overflow-hidden group shrink-0 cursor-pointer'
);

fs.writeFileSync(appPath, appContent);
console.log('App.jsx modified with live-gold-button');

try {
    execSync('git add legacy-academy-frontend/src/App.jsx legacy-academy-frontend/src/index.css');
    execSync('git commit -m "Change buttons to animated live gold"');
    execSync('git push');
    console.log('Git commit and push successful.');
} catch (e) {
    console.error('Git operation failed:', e.message);
}
