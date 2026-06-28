const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add imports to App.jsx if missing
if (!code.includes('getSafeToken')) {
    code = code.replace(
        /import axios from '\.\/api';/,
        `import axios, { getSafeToken, setSafeToken, removeSafeToken } from './api';\nconst decodeJWT = (t) => { try { return JSON.parse(atob(t.split('.')[1])); } catch(e) { return null; } };`
    );
}

// 2. Replace token getters and setters
code = code.replace(/localStorage\.getItem\('token'\)/g, 'getSafeToken()');

// 3. Replace all variations of setting token with setSafeToken
code = code.replace(/try\s*\{\s*localStorage\.setItem\('token',\s*res\.data\.token\);\s*\}\s*catch\s*\(e\)\s*\{\s*if\s*\([^)]*\)\s*\{\s*try\s*\{\s*localStorage\.clear\(\);\s*localStorage\.setItem\('token',\s*res\.data\.token\);\s*\}\s*catch\s*\(err\)\s*\{\}\s*\}\s*\}/g, "setSafeToken(res.data.token);");
code = code.replace(/localStorage\.setItem\('token',\s*res\.data\.token\);/g, "setSafeToken(res.data.token);");
code = code.replace(/localStorage\.setItem\('token',\s*acc\.token\);/g, "setSafeToken(acc.token);");
code = code.replace(/localStorage\.setItem\('token',\s*backupToken\);/g, "setSafeToken(backupToken);");

// 4. Replace removing token
code = code.replace(/localStorage\.removeItem\('token'\);/g, "removeSafeToken();");

// 5. Update initial mount logic to auto-fetch user if token exists but user is missing from storage!
const mountLogicOld = `if (userData && token) {
            setUser(userData);
            // CLEAN ALL STATE: Reset users/posts and fetch fresh
            setUsers([]);
            setPosts([]);
        } else if (saved && !token) {
            localStorage.removeItem('user');
            setUser(null);
        }`;

const mountLogicNew = `if (userData && token) {
            setUser(userData);
            setUsers([]);
            setPosts([]);
        } else if (token && !userData) {
            // Memory Fallback Recovery: Token survived (e.g. via Cookie), but user data didn't (Quota/Memory clear).
            const decoded = decodeJWT(token);
            if (decoded && decoded.id) {
                // Auto-fetch user silently
                axios.get('/users').then(res => {
                    const me = res.data.find(u => u._id === decoded.id);
                    if (me) {
                        setUser(me);
                        safeSetItem('user', JSON.stringify(me));
                    } else { removeSafeToken(); setUser(null); }
                }).catch(() => {
                    // Ignore, they'll see login
                    removeSafeToken(); setUser(null);
                });
            } else { removeSafeToken(); setUser(null); }
        } else if (saved && !token) {
            localStorage.removeItem('user');
            setUser(null);
        }`;

if (code.includes(mountLogicOld)) {
    code = code.replace(mountLogicOld, mountLogicNew);
} else {
    // Try regex if exact match failed due to whitespace
    code = code.replace(
        /if\s*\(\s*userData\s*&&\s*token\s*\)\s*\{[\s\S]*?else\s*if\s*\(\s*saved\s*&&\s*!token\s*\)\s*\{\s*localStorage\.removeItem\('user'\);\s*setUser\(null\);\s*\}/,
        mountLogicNew
    );
}

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx patched for indestructible token management.');
