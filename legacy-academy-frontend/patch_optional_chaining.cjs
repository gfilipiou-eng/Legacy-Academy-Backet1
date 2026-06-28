const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
    /e\.message\?\.toLowerCase\(\)\.includes\('quota'\)/g,
    `e.message?.toLowerCase()?.includes('quota')`
);

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed TypeError in quota check.');
