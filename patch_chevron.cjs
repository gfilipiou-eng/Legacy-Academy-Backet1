const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

const regex = /\s*\{isMe && \(\s*<button onClick=\{\(\) => \{ if \(onOpenAccountSwitcher\) onOpenAccountSwitcher\(\); \}\} className="ml-1 p-1 hover:bg-white\/10 rounded-full transition-colors active:scale-95">\s*<Icons\.ChevronDown className="w-3\.5 h-3\.5 text-white\/70" \/>\s*<\/button>\s*\)\}/g;

code = code.replace(regex, '');

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Removed useless AccountSwitcher ChevronDown button');
