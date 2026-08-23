const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(p, 'utf8');

code = code.replace(/h-\[90dvh\]/g, 'h-[80dvh]');

fs.writeFileSync(p, code);
console.log('App.jsx modal height patched to 80dvh');
