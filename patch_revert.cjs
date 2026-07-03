const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// Undo the wrapper liquid glass
const wrongHeaderRegex = /<div className=\{`flex \$\{headerGapClass\} w-full max-w-full overflow-visible items-center p-3 sm:p-4 mb-3 sm:mb-4 bg-white\/\[0\.03\] backdrop-blur-2xl border border-white\/10 rounded-\[20px\] shadow-\[0_8px_32px_rgba\(0,0,0,0\.4\)\] relative`\}>\n<div className="absolute inset-0 rounded-\[20px\] bg-gradient-to-tr from-white\/0 via-white\/5 to-white\/0 pointer-events-none"><\/div>/g;
code = code.replace(wrongHeaderRegex, '<div className={`flex ${headerGapClass} w-full max-w-full overflow-visible`}>');

// Revert the flex-1 inner header flex
const wrongInnerHeaderRegex = /<div className="flex items-center justify-between gap-2 min-w-0 w-full max-w-full z-10 relative">/g;
code = code.replace(wrongInnerHeaderRegex, '<div className="flex items-start justify-between gap-2 mb-1 sm:mb-2 -mt-1 sm:-mt-0.5 min-w-0 w-full max-w-full">');

// Revert space-y-3
const wrongSpaceYRegex = /<div className="space-y-3 mt-2 px-1">/g;
code = code.replace(wrongSpaceYRegex, '<div className="space-y-3 mt-1">');

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Reverted bad postcard changes');
