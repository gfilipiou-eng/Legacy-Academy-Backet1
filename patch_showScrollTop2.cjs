const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

const regex = /\{showScrollTop[\s\S]*?Icons\.ArrowUp[\s\S]*?<\/button>\s*\n\s*\}/;
if (regex.test(code)) {
    code = code.replace(regex, '<ScrollToTop mainScrollRef={mainScrollRef} />');
    fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
    console.log('Successfully replaced showScrollTop using regex');
} else {
    console.log('Regex did not match');
}
