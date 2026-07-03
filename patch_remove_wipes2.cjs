const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

code = code.replace(/if \(userData && token\) \{\s*setUser\(userData\);\s*setUsers\(\[\]\);\s*setPosts\(\[\]\);\s*\}/, `if (userData && token) {
              setUser(userData);
          }`);

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Removed array wiping for instant wake up using Regex.');
