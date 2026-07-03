const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// 1. Avatar Liquid Glass
const avatarRegex = /<div className=\{`post-card-avatar \$\{compact \? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-14 h-14 sm:w-16 sm:h-16'\} relative group cursor-pointer rounded-full border-2 border-white\/15 overflow-hidden bg-\[\#050505\]`\} onClick=\{\(e\) => \{ e\.stopPropagation\(\); onViewProfile\(author\); \}\}>/g;
const newAvatar = `<div className={\`post-card-avatar \${compact ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-14 h-14 sm:w-16 sm:h-16'} relative group cursor-pointer rounded-full border border-white/20 overflow-hidden bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]\`} onClick={(e) => { e.stopPropagation(); onViewProfile(author); }}>`;
code = code.replace(avatarRegex, newAvatar);

// 2. Header Text Liquid Glass Bubble
const headerRegex = /<div className="flex items-start justify-between gap-2 mb-1 sm:mb-2 -mt-1 sm:-mt-0\.5 min-w-0 w-full max-w-full">/g;
const newHeader = `<div className="flex items-center justify-between gap-2 mb-2.5 min-w-0 w-full max-w-full bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">`;
code = code.replace(headerRegex, newHeader);

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Applied localized liquid glass to PostCard profile elements');
