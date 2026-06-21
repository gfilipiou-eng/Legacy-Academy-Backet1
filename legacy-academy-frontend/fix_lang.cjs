const fs = require('fs');
const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/await handleSave\('language', normalizedLanguage\);\s*window\.location\.reload\(\);\s*\}, 150\);\s*/, "await handleSave('language', normalizedLanguage);\n\n");

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed window.location.reload() removal');
