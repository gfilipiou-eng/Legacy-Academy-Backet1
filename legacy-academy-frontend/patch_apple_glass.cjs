const fs = require('fs');

let code = fs.readFileSync('src/index.css', 'utf8');

// Replace all .bottom-nav-glass with a new one
code = code.replace(/\.bottom-nav-glass\s*\{[\s\S]*?\}/g, '');

const appleGlass = `
.bottom-nav-glass {
  position: relative;
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(80px) saturate(250%) !important;
  -webkit-backdrop-filter: blur(80px) saturate(250%) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.25) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.4), 
    inset 0 1px 1px rgba(255, 255, 255, 0.3) !important;
  transform: translate3d(0, 0, 0);
  -webkit-transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  isolation: isolate;
}
`;

code = code + '\n' + appleGlass;

fs.writeFileSync('src/index.css', code);
console.log('Apple glass injected into index.css');
