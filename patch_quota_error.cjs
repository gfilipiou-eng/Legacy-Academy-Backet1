const fs = require('fs');

let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// 1. Update commitAuthenticatedUser to only save minimal user data in savedAccounts
code = code.replace(
    /const accObj = \{ user: userData, token: currentToken \};/g,
    `const accObj = { 
                token: currentToken, 
                user: { 
                    _id: userData._id, 
                    username: userData.username, 
                    profilePic: userData.profilePic,
                    isPrivate: userData.isPrivate 
                } 
            };`
);

// 2. Update switchAccount to fetch the full user before reloading
code = code.replace(
    /const switchAccount = \(acc\) => \{([\s\S]*?)window\.location\.reload\(\);\s*\};/g,
    `const switchAccount = async (acc) => {
        if (!acc || !acc.token || !acc.user) return;
        localStorage.setItem('token', acc.token);
        
        try {
            // Fetch full user data to avoid loading missing data on boot
            const res = await axios.get(\`/users/find/\${acc.user._id}\`, { headers: { Authorization: \`Bearer \${acc.token}\` } });
            localStorage.setItem('user', JSON.stringify(res.data || acc.user));
        } catch(e) {
            localStorage.setItem('user', JSON.stringify(acc.user));
        }
        
        window.location.reload();
    };`
);

// 3. To clear the existing bloated localStorage if it's already over limit, we can add a one-time sweep on boot.
code = code.replace(
    /const \[savedAccounts, setSavedAccounts\] = useState\(\(\) => \{([\s\S]*?)\}\);/g,
    `const [savedAccounts, setSavedAccounts] = useState(() => {
        try {
            const raw = localStorage.getItem('savedAccounts');
            if (!raw) return [];
            let parsed = JSON.parse(raw);
            // Sanitize existing bloated accounts
            let changed = false;
            parsed = parsed.map(acc => {
                if (acc.user && Object.keys(acc.user).length > 10) {
                    changed = true;
                    return {
                        token: acc.token,
                        user: {
                            _id: acc.user._id,
                            username: acc.user.username,
                            profilePic: acc.user.profilePic,
                            isPrivate: acc.user.isPrivate
                        }
                    };
                }
                return acc;
            });
            if (changed) {
                localStorage.setItem('savedAccounts', JSON.stringify(parsed));
            }
            return parsed;
        } catch { return []; }
    });`
);


fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('App.jsx patched for QuotaExceededError in savedAccounts');
