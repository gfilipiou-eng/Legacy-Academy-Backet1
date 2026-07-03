const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

code = code.replace(`      if (!publicUser) {
          // If still loading, show spinner not error
          if (publicUserLoading) {`, `      if (!publicUser) {
          // If still loading, show spinner not error
          if (loadingUser) {`);

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Fixed ReferenceError for publicUserLoading');
