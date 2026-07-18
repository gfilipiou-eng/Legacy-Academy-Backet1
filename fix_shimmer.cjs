const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cssPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

const newFounderCss = `
.descriptor-founder-entrepreneur {
  border: 1px solid rgba(212, 175, 55, 0.6) !important;
  background: rgba(0, 0, 0, 0.2) !important;
  box-shadow: none !important;
  transition: all 0.3s ease !important;
}

.descriptor-founder-entrepreneur svg {
  color: #FCF6BA !important;
}

.descriptor-founder-entrepreneur span {
  background: linear-gradient(
    -45deg,
    #BF953F 0%,
    #FCF6BA 25%,
    #B38728 50%,
    #FBF5B7 75%,
    #AA771C 100%
  ) !important;
  background-size: 200% auto !important;
  color: transparent !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  animation: shineLiveGold 3s linear infinite !important;
  font-weight: 900 !important;
}

@keyframes shineLiveGold {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@media (hover: hover) {
  .descriptor-founder-entrepreneur:hover {
    border-color: #FCF6BA !important;
    background: rgba(212, 175, 55, 0.1) !important;
    transform: translateY(-1px) scale(1.02);
  }
}
`;

cssContent = cssContent.replace(/\.descriptor-founder-entrepreneur \{[\s\S]*?\}\s*\}\s*/, newFounderCss);
fs.writeFileSync(cssPath, cssContent);
console.log('Fixed index.css');

try {
    execSync('git add legacy-academy-frontend/src/index.css');
    execSync('git commit -m "Add animated live gold shimmer effect without box shadow"');
    execSync('git push');
    console.log('Git commit and push successful.');
} catch (e) {
    console.error('Git operation failed:', e.message);
}
