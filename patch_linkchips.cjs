const fs = require('fs');
let css = fs.readFileSync('legacy-academy-frontend/src/index.css', 'utf8');

// Replace link chip CSS with liquid glass CSS
css = css.replace(/\.text-link-chip--url \{[\s\S]*?\}/, `.text-link-chip--url {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(24px) saturate(150%);
    -webkit-backdrop-filter: blur(24px) saturate(150%);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    color: #fff;
    text-decoration: none;
}`);

css = css.replace(/\.text-link-chip--url:hover \{[\s\S]*?\}/, `.text-link-chip--url:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    color: #fff;
}`);

css = css.replace(/\.text-link-chip--tag,\s*\.text-link-chip--mention \{[\s\S]*?\}/, `.text-link-chip--tag,
.text-link-chip--mention {
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(24px) saturate(150%);
    -webkit-backdrop-filter: blur(24px) saturate(150%);
    color: #e2e8f0;
    cursor: pointer;
}`);

css = css.replace(/\.text-link-chip--tag:hover,\s*\.text-link-chip--mention:hover \{[\s\S]*?\}/, `.text-link-chip--tag:hover,
.text-link-chip--mention:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.25);
    color: #fff;
}`);

fs.writeFileSync('legacy-academy-frontend/src/index.css', css);
console.log('Applied liquid glass to link chips');
