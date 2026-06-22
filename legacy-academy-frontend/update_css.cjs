const fs = require('fs');

const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/index.css';
let css = fs.readFileSync(path, 'utf8');

// Replace blur(XXpx) with blur(var(--dynamic-blur, XXpx))
css = css.replace(/blur\((?!var\(--dynamic-blur)(\d+px)\)/g, 'blur(var(--dynamic-blur, $1))');

// Replace saturate(YY%) with saturate(var(--dynamic-saturate, YY%))
css = css.replace(/saturate\((?!var\(--dynamic-saturate)(\d+%)\)/g, 'saturate(var(--dynamic-saturate, $1))');

// Update backgrounds for navbars and glass items
css = css.replace(/background:\s*rgba\(\s*10\s*,\s*10\s*,\s*10\s*,\s*0\.[0-9]+\s*\)/g, 'background: var(--dynamic-glass-bg, rgba(10, 10, 10, 0.65))');
css = css.replace(/background-color:\s*rgba\(\s*10\s*,\s*10\s*,\s*10\s*,\s*0\.[0-9]+\s*\)/g, 'background-color: var(--dynamic-glass-bg, rgba(10, 10, 10, 0.65))');
css = css.replace(/background:\s*rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.[0-9]+\s*\)/g, 'background: var(--dynamic-glass-bg, rgba(0, 0, 0, 0.65))');
css = css.replace(/background-color:\s*rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.[0-9]+\s*\)/g, 'background-color: var(--dynamic-glass-bg, rgba(0, 0, 0, 0.65))');

fs.writeFileSync(path, css, 'utf8');
console.log('index.css updated');
