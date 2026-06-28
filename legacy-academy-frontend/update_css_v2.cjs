const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, 'src', 'index.css');
let cssContent = fs.readFileSync(cssFile, 'utf8');

// 1. Update .bottom-nav-glass
cssContent = cssContent.replace(/\.bottom-nav-glass\s*\{[\s\S]*?isolation:\s*isolate;\s*\}/, `.bottom-nav-glass {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%), rgba(2, 2, 2, 0.1) !important;
  backdrop-filter: blur(var(--dynamic-blur, 60px)) saturate(var(--dynamic-saturate, 250%));
  -webkit-backdrop-filter: blur(var(--dynamic-blur, 60px)) saturate(var(--dynamic-saturate, 250%));
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 16px 40px rgba(0, 0, 0, 0.6), 
    inset 0 1.5px 2px rgba(255, 255, 255, 0.2),
    inset 0 -1.5px 2px rgba(0, 0, 0, 0.1);
  transform: translate3d(0, 0, 0);
  -webkit-transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  isolation: isolate;
}`);

// 2. Add premium badge styles if not present
if (!cssContent.includes('.premium-badge-glow')) {
  cssContent += `

/* Premium Badge Styles */
.premium-badge-glow {
  background: linear-gradient(135deg, rgba(29, 155, 240, 0.2) 0%, rgba(29, 155, 240, 0.05) 100%);
  border: 1px solid rgba(29, 155, 240, 0.4);
  box-shadow: 0 0 15px rgba(29, 155, 240, 0.3), inset 0 0 8px rgba(29, 155, 240, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #1D9BF0;
  text-shadow: 0 0 8px rgba(29, 155, 240, 0.5);
}

.premium-badge-gold {
  background: linear-gradient(135deg, rgba(250, 214, 32, 0.2) 0%, rgba(250, 214, 32, 0.05) 100%);
  border: 1px solid rgba(250, 214, 32, 0.4);
  box-shadow: 0 0 15px rgba(250, 214, 32, 0.3), inset 0 0 8px rgba(250, 214, 32, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #FAD620;
  text-shadow: 0 0 8px rgba(250, 214, 32, 0.5);
}

/* Premium Bio Typography */
.premium-bio-text {
  font-weight: 500;
  line-height: 1.6;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  letter-spacing: 0.01em;
}

.missions-scroll-top {
  position: absolute;
  bottom: 90px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(29, 155, 240, 0.9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(29,155,240,0.4);
  z-index: 50;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
}

.missions-scroll-top:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 8px 25px rgba(0,0,0,0.6), 0 0 20px rgba(29,155,240,0.6);
}

.missions-scroll-top:active {
  transform: translateY(2px) scale(0.95);
}
`;
}

// 3. Update profile glass card for extreme liquid glass
cssContent = cssContent.replace(/\.profile-glass-card\s*\{[\s\S]*?box-shadow:[\s\S]*?\}/, `.profile-glass-card {
  background: linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.3) 100%);
  backdrop-filter: blur(var(--dynamic-blur, 40px)) saturate(var(--dynamic-saturate, 200%));
  -webkit-backdrop-filter: blur(var(--dynamic-blur, 40px)) saturate(var(--dynamic-saturate, 200%));
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.15);
}`);

fs.writeFileSync(cssFile, cssContent);
console.log("CSS updated");
