const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/index.css';
let code = fs.readFileSync(p, 'utf8');

code = code.replace(
    /background: rgba\(20, 20, 20, 0\.4\) !important;/g,
    'background: rgba(20, 20, 20, calc(var(--lg-opacity, 1) * 0.4)) !important;'
);

fs.writeFileSync(p, code);
console.log('Fixed hardcoded background opacity in liquid-glass-aesthetic');
