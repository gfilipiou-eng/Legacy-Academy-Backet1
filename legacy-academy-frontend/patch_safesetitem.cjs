const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

if (!code.includes('const safeSetItem')) {
    code = code.replace(
        /const App = \(\) => \{/g,
        `const safeSetItem = (key, value) => { try { localStorage.setItem(key, value); } catch(e) { console.warn('safeSetItem caught error for ' + key); } };\nconst App = () => {`
    );
}

// 1. Replace cached_posts
code = code.replace(/localStorage\.setItem\('cached_posts'/g, "safeSetItem('cached_posts'");

// 2. Replace in updateUserState
code = code.replace(
    /localStorage\.setItem\('user', JSON\.stringify\(storageMerged\)\);/g,
    "safeSetItem('user', JSON.stringify(storageMerged));"
);

// 3. Replace in notification update
code = code.replace(
    /localStorage\.setItem\('user', JSON\.stringify\(updated\)\);/g,
    "safeSetItem('user', JSON.stringify(updated));"
);

// 4. Replace in savedAccounts update (removeSavedAccount)
code = code.replace(
    /const newList = prev\.filter\(a => a\.user\._id !== accId\);\s*localStorage\.setItem\('savedAccounts', JSON\.stringify\(newList\)\);/g,
    `const newList = prev.filter(a => a.user._id !== accId);
              safeSetItem('savedAccounts', JSON.stringify(newList));`
);

// 5. Check if there are any JSON.parse(localStorage.getItem('user')) without try-catch inside setState
code = code.replace(
    /const current = prev \|\| JSON\.parse\(localStorage\.getItem\('user'\) \|\| '\{ \}'\);/g,
    `let current = prev;
            if (!current) {
                try { current = JSON.parse(localStorage.getItem('user') || '{ }'); } catch(e) { current = {}; }
            }`
);

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed uncaught quota errors inside React state updaters.');
