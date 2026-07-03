const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

code = code.replace(/onOpenAccountSwitcher=\{\(\) => setIsAccountSwitcherOpen\(true\)\}/g, '');
code = code.replace(/const \[isAccountSwitcherOpen, setIsAccountSwitcherOpen\] = useState\(false\);/g, '');

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Cleaned up onOpenAccountSwitcher props');
