const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Use regex to remove POST_DELETED_REALTIME line
code = code.replace(/addToast\(t\('POST_DELETED_REALTIME'\)[^\n]+\n/g, '');

fs.writeFileSync('src/App.jsx', code);
console.log('Removed post deleted toast via regex');
