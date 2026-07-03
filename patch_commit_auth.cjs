const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

const findStr = `          setUser(userData);
          setUsers([]);
          setPosts([]);`;
const replaceStr = `          setUser(userData);
          // Hydrate from cache immediately for instant wake-up
          try {
              const cPosts = localStorage.getItem('cached_posts');
              if (cPosts) setPosts(JSON.parse(cPosts));
              const cUsers = localStorage.getItem('cached_users');
              if (cUsers) setUsers(JSON.parse(cUsers));
          } catch(e) {}`;

code = code.replace(findStr, replaceStr);

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Patched commitAuthenticatedUser to load cached posts/users.');
