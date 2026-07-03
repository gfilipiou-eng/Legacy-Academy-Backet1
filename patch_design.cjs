const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// 1. Remove glows from CreateModal and EditPostModal
// Usually they use shadow-[0_0_50px_rgba(249,115,22,0.1)] or similar.
code = code.replace(/shadow-\[0_0_50px_[^\]]+\]/g, 'shadow-2xl');
code = code.replace(/shadow-\[0_0_30px_[^\]]+\]/g, 'shadow-xl');
code = code.replace(/shadow-\[0_0_20px_[^\]]+\]/g, 'shadow-lg');

// 2. Storyline glow removal. The stories row has avatars with glow.
// Find: shadow-[0_0_15px_rgba(249,115,22,0.4)]
code = code.replace(/shadow-\[0_0_15px_[^\]]+\]/g, '');

// 3. PostCard profile liquid glass
// We need to find where PostCard renders the author header.
// It usually looks like: <div className="flex justify-between items-start mb-3 sm:mb-4 px-3 sm:px-4">
// Let's add the liquid glass class to the PostCard header.
const postCardHeaderRegex = /<div className="flex justify-between items-start mb-3 sm:mb-4 px-3 sm:px-4/g;
code = code.replace(postCardHeaderRegex, '<div className="flex justify-between items-start mb-3 sm:mb-4 px-3 sm:px-4 py-2 sm:py-3 mx-2 sm:mx-3 mt-2 sm:mt-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]');

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('App.jsx design patched');
