const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

const findStr = `try { localStorage.removeItem('cached_posts'); localStorage.removeItem('cached_users'); } catch(e) {}`;
code = code.replace(new RegExp(findStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Removed cache clearing on logout to preserve instant wake-up illusion.');
