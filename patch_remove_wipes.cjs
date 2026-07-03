const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// We want to remove `setUsers([]);` and `setPosts([]);` inside the initialization block.
const findStr = `          if (userData && token) {
              setUser(userData);
              setUsers([]);
              setPosts([]);
          }`;
const replaceStr = `          if (userData && token) {
              setUser(userData);
              // Removed setUsers([]) and setPosts([]) to preserve initial cached arrays for instant wake up
          }`;

code = code.replace(findStr, replaceStr);

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Removed array wiping for instant wake up.');
