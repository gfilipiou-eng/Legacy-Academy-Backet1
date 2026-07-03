const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

code = code.replace(/const \[showScrollTop, setShowScrollTop\] = useState\(false\);/, '');

const handleScrollRegex = /const lastScrollTime = useRef\(0\);\s*const handleScroll = \(e\) => \{[\s\S]*?setShowScrollTop\(false\);\s*\}\s*\};\s*/;
code = code.replace(handleScrollRegex, '');

code = code.replace(/onScroll=\{handleScroll\}/g, '');

const importRegex = /import BottomNavbar/;
if (!code.includes('ScrollToTop')) {
    code = code.replace(importRegex, "import ScrollToTop from './components/ScrollToTop';\nimport BottomNavbar");
}

const buttonRegex = /\{showScrollTop && [\s\S]*?<\/button>\s*\}/;
code = code.replace(buttonRegex, '<ScrollToTop mainScrollRef={mainScrollRef} />');

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('App.jsx patched successfully');
