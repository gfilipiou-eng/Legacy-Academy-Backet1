const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// 1. Remove glow from CreateModal and EditPostModal
code = code.replace(/shadow-\[0_0_50px_rgba\([^)]+\)\]/g, 'shadow-2xl');
code = code.replace(/shadow-\[0_0_30px_rgba\([^)]+\)\]/g, 'shadow-xl');
code = code.replace(/shadow-\[0_0_15px_rgba\([^)]+\)\]/g, 'shadow-md');

// 2. Remove glow from StoryItem (shadow-[0_0_...])
code = code.replace(/shadow-\[0_0_20px_rgba\([^)]+\)\]/g, 'shadow-lg');
code = code.replace(/shadow-\[0_0_10px_rgba\([^)]+\)\]/g, 'shadow-md');

// 3. Make PostCard profile liquid glass
const postHeaderRegex = /<div className=\{`flex \$\{headerGapClass\} w-full max-w-full overflow-visible`\}>/g;
const newPostHeader = `<div className={\`flex \${headerGapClass} w-full max-w-full overflow-visible items-center p-3 sm:p-4 mb-3 sm:mb-4 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative\`}>\n<div className="absolute inset-0 rounded-[20px] bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none"></div>`;
code = code.replace(postHeaderRegex, newPostHeader);

const authorInfoRegex = /<div className="flex items-start justify-between gap-2 mb-1 sm:mb-2 -mt-1 sm:-mt-0\.5 min-w-0 w-full max-w-full">/g;
code = code.replace(authorInfoRegex, '<div className="flex items-center justify-between gap-2 min-w-0 w-full max-w-full z-10 relative">');

const spaceYRegex = /<div className="space-y-3 mt-1">/g;
code = code.replace(spaceYRegex, '<div className="space-y-3 mt-2 px-1">');

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Postcard and Glows patched successfully');
