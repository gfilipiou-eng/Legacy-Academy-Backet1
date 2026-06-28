const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
    /console\.warn\("Storage full! Nuking localStorage to recover\.\.\."\);\s*localStorage\.clear\(\);\s*try \{\s*localStorage\.setItem\('user', JSON\.stringify\(userData\)\);\s*\} catch\(err\) \{\}/g,
    `console.warn("Storage full! Nuking localStorage to recover...");
                const backupToken = localStorage.getItem('token');
                localStorage.clear();
                try {
                    if (backupToken) localStorage.setItem('token', backupToken);
                    localStorage.setItem('user', JSON.stringify(userData));
                } catch(err) {}`
);

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx patched to preserve token during quota clear.');
