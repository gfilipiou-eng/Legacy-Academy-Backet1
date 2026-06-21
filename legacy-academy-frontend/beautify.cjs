const fs = require('fs');
const builderPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteBuilder.jsx';
let bCode = fs.readFileSync(builderPath, 'utf8');

// Form Inputs Beautification
bCode = bCode.replace(/bg-black\/50 border border-white\/10 rounded-xl px-4 py-3/g, 'bg-black/60 border border-white/5 shadow-inner rounded-[14px] px-4 py-3.5 backdrop-blur-sm');
bCode = bCode.replace(/bg-black\/50 border border-white\/10 rounded-xl px-3 py-2/g, 'bg-black/60 border border-white/5 shadow-inner rounded-[12px] px-3.5 py-2.5 backdrop-blur-sm');

// Left panel background
bCode = bCode.replace(/className=\`w-full md:w-\[400px\] bg-\[#09090b\] border-r border-white\/10 flex-1 min-h-0 flex-col z-20 shadow-\[10px_0_30px_rgba\(0,0,0,0\.5\)\] shrink-0 \$\{mobileTab === 'preview' \? 'hidden md:flex' : 'flex'\}\`/g, 'className={`w-full md:w-[450px] bg-[#0a0a0c] border-r border-white/5 flex-1 min-h-0 flex-col z-20 shadow-[20px_0_40px_rgba(0,0,0,0.6)] shrink-0 backdrop-blur-xl ${mobileTab === \\'preview\\' ? \\'hidden md:flex\\' : \\'flex\\'}`}');

fs.writeFileSync(builderPath, bCode, 'utf8');
console.log('Beautiful inputs and layout applied!');
