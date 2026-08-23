const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(p, 'utf8');

code = code.replace(
    'relative w-full max-w-full sm:max-w-lg sm:mx-auto h-[80dvh] mt-auto rounded-t-3xl sm:h-[85vh] sm:rounded-[32px]',
    'relative w-[96%] max-w-full mx-auto my-auto sm:max-w-lg sm:mx-auto h-[85dvh] rounded-[32px] sm:h-[85vh]'
);

fs.writeFileSync(p, code);
console.log('App.jsx modal shape updated');
