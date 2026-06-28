const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Patch commitAuthenticatedUser to wrap recovery in try-catch
code = code.replace(
    /const backupToken = localStorage\.getItem\('token'\);\s*localStorage\.clear\(\);\s*try \{\s*if \(backupToken\) localStorage\.setItem\('token', backupToken\);\s*localStorage\.setItem\('user', JSON\.stringify\(userData\)\);\s*\} catch\(err\) \{\}/g,
    `try {
                    const backupToken = localStorage.getItem('token');
                    localStorage.clear();
                    if (backupToken) localStorage.setItem('token', backupToken);
                    localStorage.setItem('user', JSON.stringify(userData));
                } catch(err) {}`
);

// Patch login token set
code = code.replace(
    /if \(e\.name === 'QuotaExceededError' \|\| e\.message\?\.toLowerCase\(\)\?\.includes\('quota'\)\) \{\s*localStorage\.clear\(\);\s*localStorage\.setItem\('token', res\.data\.token\);\s*\}/g,
    `if (e.name === 'QuotaExceededError' || e.message?.toLowerCase()?.includes('quota')) {
              try {
                  localStorage.clear();
                  localStorage.setItem('token', res.data.token);
              } catch(err) {}
          }`
);

fs.writeFileSync('src/App.jsx', code);
console.log('Wrapped quota recovery in try-catch.');
