const fs = require('fs');

// 1. App.jsx Fixes
let appPath = 'src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');

// Remove Elite Eye
appCode = appCode.replace(/{ id: 'illuminati',  label: t\('BADGE_ILLUMINATI', 'Elite Eye'\) },\n?/, '');

// Fix maxUploadSize
appCode = appCode.replace(/const maxUploadSize = user\?\.role === 'Founder' \? 500 \* 1024 \* 1024 : 90 \* 1024 \* 1024;/g, "const maxUploadSize = 50000 * 1024 * 1024;");
appCode = appCode.replace(/const maxUploadSize = displayUser\?\.role === 'Founder' \? 500 \* 1024 \* 1024 : 90 \* 1024 \* 1024;/g, "const maxUploadSize = 50000 * 1024 * 1024;");

// Fix Search Input UI
appCode = appCode.replace(
    /className="w-full liquid-glass-control rounded-2xl py-4 pl-12 pr-4 font-semibold tracking-\[0\.01em\] outline-none focus:ring-1 focus:ring-white\/30 text-white placeholder:text-white\/50 transition-all duration-300 touch-manipulation"/g,
    'className="w-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl py-4 pl-12 pr-4 font-black tracking-wider outline-none focus:ring-2 focus:ring-[var(--gold-primary)] text-white placeholder:text-white/40 shadow-[0_0_20px_rgba(255,255,255,0.05)] focus:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all duration-300 touch-manipulation"'
);

fs.writeFileSync(appPath, appCode);

// 2. index.css Fixes
let indexCssPath = 'src/index.css';
let indexCss = fs.readFileSync(indexCssPath, 'utf8');

// Replace descriptor-entrepreneur
indexCss = indexCss.replace(/\.descriptor-entrepreneur\s*\{[^}]+\}/g, `.descriptor-entrepreneur {
  color: #00ffaa !important;
  background: linear-gradient(135deg, rgba(0, 255, 170, 0.15) 0%, rgba(0, 150, 100, 0.05) 100%) !important;
  border-color: rgba(0, 255, 170, 0.4) !important;
  box-shadow: 0 0 15px rgba(0, 255, 170, 0.2) !important;
  text-shadow: 0 0 10px rgba(0, 255, 170, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}`);
indexCss = indexCss.replace(/\.descriptor-entrepreneur:hover\s*\{[^}]+\}/g, `.descriptor-entrepreneur:hover {
  border-color: rgba(0, 255, 170, 0.8) !important;
  box-shadow: 0 0 25px rgba(0, 255, 170, 0.4) !important;
  transform: translateY(-2px) scale(1.05);
}`);

fs.writeFileSync(indexCssPath, indexCss);

// 3. bubbles.css Fixes
let bubblesCssPath = 'src/components/Bubbles/bubbles.css';
let bubblesCss = fs.readFileSync(bubblesCssPath, 'utf8');

bubblesCss = bubblesCss.replace(/\.bubble-container\s*\{[\s\S]*?\border: 1px solid rgba\(255, 255, 255, 0\.4\);\s*\}/g, `.bubble-container {
  position: relative;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(3px);
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 25%, rgba(200, 255, 255, 0.2) 50%, rgba(255, 200, 255, 0.3) 75%, rgba(100, 200, 255, 0.5) 100%);
  background-size: 200% 200%;
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.6), inset 10px 0 40px rgba(255, 0, 255, 0.3), inset -10px 0 40px rgba(0, 255, 255, 0.3), 0 0 15px rgba(255,255,255,0.3);
  animation: floatBubble 6s ease-in-out infinite, bubbleShimmer 4s linear infinite;
}`);

if (!bubblesCss.includes('@keyframes floatBubble')) {
    bubblesCss += `\n@keyframes floatBubble {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.02); }
}
@keyframes bubbleShimmer {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
}\n`;
}

fs.writeFileSync(bubblesCssPath, bubblesCss);
console.log("SUCCESS!");
