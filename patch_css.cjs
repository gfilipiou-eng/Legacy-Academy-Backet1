const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/index.css';
let code = fs.readFileSync(p, 'utf8');

const regex = /\/\* === Liquid Glass Aesthetic \(User Setting\) === \*\/[\s\S]*?\}\n\}\n/m;
code = code.replace(regex, '');

fs.writeFileSync(p, code);
console.log('index.css patched');
