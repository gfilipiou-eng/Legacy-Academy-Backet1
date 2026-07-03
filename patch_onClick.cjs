const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

code = code.replace(/onClick=\{\(\) => if \(onOpenAccountSwitcher\) onOpenAccountSwitcher\(\);\}/g, 'onClick={() => { if (onOpenAccountSwitcher) onOpenAccountSwitcher(); }}');

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Fixed onClick syntax error');
