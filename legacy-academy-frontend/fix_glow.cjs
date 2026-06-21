const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace('className="w-12 h-12 rounded-full bg-[var(--gold-primary)]/10 flex items-center justify-center backdrop-blur-md border border-[var(--gold-primary)]/30 shadow-[0_0_30px_rgba(212,175,55,0.3)] animate-pulse"', 'className="w-12 h-12 rounded-full bg-[var(--gold-primary)]/10 flex items-center justify-center border border-[var(--gold-primary)]/30 animate-pulse"');

code = code.replace('<Icons.Globe className="w-6 h-6 text-[var(--gold-primary)]" />', '');

code = code.replace('className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#111] border-4 border-black shadow-[0_0_30px_rgba(212,175,55,0.1)] flex items-center justify-center overflow-hidden"', 'className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#111] border-4 border-black flex items-center justify-center overflow-hidden"');

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed');
