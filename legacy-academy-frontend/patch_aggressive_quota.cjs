const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Patch 1: Safe commitAuthenticatedUser
code = code.replace(
    /const commitAuthenticatedUser = useCallback\(\(userData\) => \{[\s\S]*?setSavedAccounts\(prev => \{/g,
    `const commitAuthenticatedUser = useCallback((userData) => {
        try {
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('language', userData.settings?.language || 'en');
            localStorage.setItem('themeColor', userData.settings?.theme || '#ffd700');
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.message?.toLowerCase().includes('quota')) {
                console.warn("Storage full! Nuking localStorage to recover...");
                localStorage.clear();
                try {
                    localStorage.setItem('user', JSON.stringify(userData));
                } catch(err) {}
            }
        }
        startTransition(() => setUser(userData));
        setSavedAccounts(prev => {`
);

// Patch 2: Safe savedAccounts saving
code = code.replace(
    /if \(existingIdx >= 0\) newList\[existingIdx\] = accObj;\s*else newList\.push\(accObj\);\s*localStorage\.setItem\('savedAccounts', JSON\.stringify\(newList\)\);\s*return newList;/g,
    `if (existingIdx >= 0) newList[existingIdx] = accObj;
            else newList.push(accObj);
            try {
                localStorage.setItem('savedAccounts', JSON.stringify(newList));
            } catch (e) {
                console.error("Failed to save accounts array due to quota.", e);
                localStorage.removeItem('savedAccounts');
                return [];
            }
            return newList;`
);

// Patch 3: Safe token set in login
code = code.replace(
    /localStorage\.setItem\('token', res\.data\.token\);/g,
    `try {
        localStorage.setItem('token', res.data.token);
    } catch(e) {
        if (e.name === 'QuotaExceededError' || e.message?.toLowerCase().includes('quota')) {
            localStorage.clear();
            localStorage.setItem('token', res.data.token);
        }
    }`
);

fs.writeFileSync('src/App.jsx', code);
console.log('Patched App.jsx to forcefully resolve QuotaExceededError.');
