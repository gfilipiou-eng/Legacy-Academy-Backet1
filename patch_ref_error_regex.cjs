const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

code = code.replace(/if \(!publicUser\) \{\s*\/\/[^\n]*\n\s*if \(publicUserLoading\) \{/, `if (!publicUser) {\n          // If still loading, show spinner not error\n          if (loadingUser) {`);

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Fixed ReferenceError for publicUserLoading using regex');
