const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
    /setSavedAccounts\(prev => \{\s*const currentToken = localStorage\.getItem\('token'\);\s*if \(!currentToken\) return prev;\s*let newList = \[\.\.\.prev\];/g,
    `setSavedAccounts(prev => {
              let currentToken = null;
              try { currentToken = localStorage.getItem('token'); } catch(e) {}
              if (!currentToken) return prev;
              let newList = Array.isArray(prev) ? [...prev] : [];`
);

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed potential crash in setSavedAccounts updater.');
