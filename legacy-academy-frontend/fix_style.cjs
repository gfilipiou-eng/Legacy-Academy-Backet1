const fs = require('fs');

let indexCssPath = 'src/index.css';
let indexCss = fs.readFileSync(indexCssPath, 'utf8');

// Replace descriptor-entrepreneur
indexCss = indexCss.replace(/\.descriptor-entrepreneur\s*\{[^}]+\}/g, `.descriptor-entrepreneur {
  color: #ef4444 !important;
  background-color: rgba(239, 68, 68, 0.1) !important;
  border: 1px solid #ef4444 !important;
  box-shadow: none !important;
  text-shadow: none !important;
  font-weight: 700 !important;
  transition: all 0.2s ease-in-out !important;
}`);
indexCss = indexCss.replace(/\.descriptor-entrepreneur:hover\s*\{[^}]+\}/g, `.descriptor-entrepreneur:hover {
  background-color: rgba(239, 68, 68, 0.2) !important;
  border-color: #ef4444 !important;
  box-shadow: none !important;
  transform: translateY(-2px) scale(1.02);
}`);

fs.writeFileSync(indexCssPath, indexCss);
console.log("index.css fixed");

let bubblesCssPath = 'src/components/Bubbles/bubbles.css';
let bubblesCss = fs.readFileSync(bubblesCssPath, 'utf8');

// Advanced 3D Bubble CSS
bubblesCss = bubblesCss.replace(/\.bubble-container\s*\{[\s\S]*?\border: 1px solid rgba\(255, 255, 255, 0\.5\);\s*[\s\S]*?\}/g, `.bubble-container {
  position: relative;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 
    inset 0 0 20px rgba(255, 255, 255, 0.5),
    inset 10px 0 40px rgba(255, 0, 255, 0.3),
    inset -10px 0 40px rgba(0, 255, 255, 0.3),
    0 0 20px rgba(255, 255, 255, 0.1);
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 20%, rgba(0, 255, 255, 0.2) 50%, rgba(255, 0, 255, 0.2) 75%, rgba(255, 255, 255, 0.3) 100%);
  animation: floatBubble 6s ease-in-out infinite, bubbleShimmer 4s linear infinite;
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}`);

if (!bubblesCss.includes('.bubble-container::before')) {
    bubblesCss += `\n.bubble-container::before {
  content: '';
  position: absolute;
  top: 15%;
  left: 20%;
  width: 30%;
  height: 20%;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
  transform: rotate(-45deg);
  pointer-events: none;
}

.bubble-container::after {
  content: '';
  position: absolute;
  bottom: 10%;
  right: 15%;
  width: 40%;
  height: 15%;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
  transform: rotate(20deg);
  pointer-events: none;
}\n`;
}

fs.writeFileSync(bubblesCssPath, bubblesCss);
console.log("bubbles.css fixed");
