const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// Patch 1: [posts, setPosts] initialization
const postsInitOld = `const [posts, setPosts] = useState([]);`;
const postsInitNew = `const [posts, setPosts] = useState(() => { try { const cached = localStorage.getItem('cached_posts'); if (cached) { const parsed = JSON.parse(cached); if (Array.isArray(parsed)) return parsed; } } catch(e) {} return []; });`;
code = code.replace(postsInitOld, postsInitNew);

// Patch 2: [users, setUsers] initialization
const usersInitOld = `const [users, setUsers] = useState([]);`;
const usersInitNew = `const [users, setUsers] = useState(() => { try { const cached = localStorage.getItem('cached_users'); if (cached) { const parsed = JSON.parse(cached); if (Array.isArray(parsed)) return parsed; } } catch(e) {} return []; });`;
code = code.replace(usersInitOld, usersInitNew);

// Patch 3: safeSetItem('cached_users') in fetchUsers
const fetchUsersFind = `const incoming = res.data || [];`;
const fetchUsersReplace = `const incoming = res.data || []; try { safeSetItem('cached_users', JSON.stringify(incoming)); } catch(e) {}`;
code = code.replace(fetchUsersFind, fetchUsersReplace);

// Patch 4: update logout to clear cache
const logoutFind = `localStorage.removeItem('user');`;
const logoutReplace = `localStorage.removeItem('user');\n          try { localStorage.removeItem('cached_posts'); localStorage.removeItem('cached_users'); } catch(e) {}`;
// Note: It appears multiple times, replace all instances globally.
code = code.replace(/localStorage\.removeItem\('user'\);/g, logoutReplace);

// Patch 5: In fetchPosts, when error occurs, DO NOT set empty array!
// Wait, fetchPosts doesn't set empty array on catch. It just does catch(e) {} finally { setIsLoadingFeed(false) }.
// But what about the loading indicator? If cached_posts exists, we shouldn't show the initial big spinner for 50s.
// Wait, we already fixed that because `postsRef.current.length === 0` controls `setIsLoadingFeed(true)`. Since `posts` will be hydrated from `cached_posts`, `postsRef.current` won't be empty, and `setIsLoadingFeed` won't trigger! So NO initial spinner! The user will see their cached feed instantly.

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Patched caching for instant startup.');
