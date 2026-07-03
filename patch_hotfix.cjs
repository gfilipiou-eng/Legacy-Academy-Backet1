const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// 1. Fix Syntax Error
code = code.replace(/onOpenAccountSwitcher\s*\\\}/, 'onOpenAccountSwitcher })');

// 2. Remove showScrollTop block and replace with ScrollToTop component
const scrollButtonRegex = /\{showScrollTop[^<]+<button[\s\S]*?scrollToTop[\s\S]*?<\/button>\s*\n\s*\}/;
code = code.replace(scrollButtonRegex, '<ScrollToTop mainScrollRef={mainScrollRef} />');

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Syntax error and showScrollTop fixed');
