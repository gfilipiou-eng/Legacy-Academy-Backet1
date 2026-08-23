const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(p, 'utf8');

code = code.replace(
    /\s*const \[liquidGlassIntensity, setLiquidGlassIntensity\] = useState\(0\);\s*/,
    '\n'
);

fs.writeFileSync(p, code);
console.log('Fixed duplicate declaration in App.jsx');
