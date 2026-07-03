const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// The string we want to remove
const topRegex = /\{isTopStreak\([^)]+\)\s*&&\s*<span[^>]*><Icons\.TrendingUp[^>]*\/>\s*TOP<\/span>\}/g;
code = code.replace(topRegex, '');

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Removed TOP badge globally.');
