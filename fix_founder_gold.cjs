const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

appContent = appContent.replace(
    /if \(descriptor === 'entrepreneur' && role === 'Founder'\) \{/g,
    "if (descriptor === 'entrepreneur' && role && role.toLowerCase() === 'founder') {"
);

fs.writeFileSync(appPath, appContent);
console.log('App.jsx fixed');

const cssPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

const newFounderCss = `
.descriptor-founder-entrepreneur {
  color: #FFD700 !important;
  background-color: transparent !important;
  border: 1px solid #FFD700 !important;
  box-shadow: none !important;
  text-shadow: none !important;
  font-weight: 800 !important;
  transition: all 0.2s ease-in-out !important;
}

@media (hover: hover) {
  .descriptor-founder-entrepreneur:hover {
    background-color: transparent !important;
    border-color: #F1C40F !important;
    box-shadow: none !important;
    transform: translateY(-1px) scale(1.02);
  }
}
`;

cssContent = cssContent.replace(/\.descriptor-founder-entrepreneur \{[\s\S]*?\}\s*\}\s*/, newFounderCss);
fs.writeFileSync(cssPath, cssContent);
console.log('index.css fixed');
