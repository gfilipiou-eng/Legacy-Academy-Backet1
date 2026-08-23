const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/index.css';
let code = fs.readFileSync(p, 'utf8');

code = code.replace(
    /backdrop-filter: blur\(25px\) saturate\(200\%\) !important;/g,
    'backdrop-filter: blur(var(--lg-blur, 25px)) saturate(200%) !important;'
);

code = code.replace(
    /-webkit-backdrop-filter: blur\(25px\) saturate\(200\%\) !important;/g,
    '-webkit-backdrop-filter: blur(var(--lg-blur, 25px)) saturate(200%) !important;'
);

fs.writeFileSync(p, code);
console.log('Fixed hardcoded blur in liquid-glass-aesthetic');
