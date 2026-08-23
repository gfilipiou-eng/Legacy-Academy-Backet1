const fs = require('fs');

// Patch App.jsx
const appPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');

const newApplyLiquidGlass = `const applyLiquidGlass = (intensity) => {
    const val = Math.max(0, Math.min(1, Number(intensity) ?? 1));
    const blur = Math.round(4 + (val * 36));
    const saturate = Math.round(100 + (val * 150));
    const bgOpacity = (0.15 + (val * 0.55)).toFixed(2);
    const borderOpacity = (0.05 + (val * 0.2)).toFixed(2);
    
    const root = document.documentElement;
    root.style.setProperty('--dynamic-blur', \`\${blur}px\`);
    root.style.setProperty('--dynamic-saturate', \`\${saturate}%\`);
    root.style.setProperty('--dynamic-glass-bg', \`rgba(10, 10, 10, \${bgOpacity})\`);
    
    document.body.style.setProperty('--lg-opacity', val);
    document.body.style.setProperty('--lg-blur', \`\${blur}px\`);
    document.body.style.setProperty('--lg-border-opacity', borderOpacity);
    
    if (val > 0) {
        document.body.classList.add('liquid-glass-aesthetic');
    } else {
        document.body.classList.remove('liquid-glass-aesthetic');
    }
    
    localStorage.setItem('liquidGlassIntensity', String(val));
};`;

appCode = appCode.replace(/const applyLiquidGlass = \(intensity\) => \{[\s\S]*?\};\s*(?=\n\s*(const|\/\/|\/\*|function|let|var|export))/m, newApplyLiquidGlass + '\n\n');

// Make sure slider label in SettingsModal uses t('LIQUID_GLASS_INTENSITY', 'Liquid Glass Intensity')
appCode = appCode.replace(
    /\{t\('LIQUID_GLASS', 'Liquid Glass Intensity'\)\}/g,
    "{t('LIQUID_GLASS_INTENSITY', 'Liquid Glass Intensity')}"
);

fs.writeFileSync(appPath, appCode, 'utf8');
console.log('App.jsx updated with enhanced applyLiquidGlass');

// Patch index.css
const cssPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/index.css';
let cssCode = fs.readFileSync(cssPath, 'utf8');

const newCSSRules = `/* === Liquid Glass Aesthetic (User Setting - Expanded for Premium UI) === */
body.liquid-glass-aesthetic .premium-post-card,
body.liquid-glass-aesthetic .post-card,
body.liquid-glass-aesthetic .profile-card,
body.liquid-glass-aesthetic .profile-shell,
body.liquid-glass-aesthetic .cartel-card,
body.liquid-glass-aesthetic .cartel-panel,
body.liquid-glass-aesthetic .glass-panel,
body.liquid-glass-aesthetic .nav-drawer-panel,
body.liquid-glass-aesthetic .comment-card,
body.liquid-glass-aesthetic .match-widget-container {
  background: rgba(18, 18, 22, calc(var(--lg-opacity, 1) * 0.45)) !important;
  backdrop-filter: blur(var(--lg-blur, 25px)) saturate(var(--dynamic-saturate, 180%)) !important;
  -webkit-backdrop-filter: blur(var(--lg-blur, 25px)) saturate(var(--dynamic-saturate, 180%)) !important;
  border: 1px solid rgba(255, 255, 255, var(--lg-border-opacity, 0.12)) !important;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
  transition: background 0.2s ease, backdrop-filter 0.2s ease, border-color 0.2s ease !important;
}

@media (max-width: 640px) {
  body.liquid-glass-aesthetic .premium-post-card,
  body.liquid-glass-aesthetic .post-card,
  body.liquid-glass-aesthetic .profile-card,
  body.liquid-glass-aesthetic .cartel-card {
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
    margin-bottom: 0 !important;
  }
}`;

cssCode = cssCode.replace(/\/\* === Liquid Glass Aesthetic \(User Setting\) === \*\/[\s\S]*?\}\s*\}\s*/m, newCSSRules + '\n\n');

fs.writeFileSync(cssPath, cssCode, 'utf8');
console.log('index.css updated with enhanced liquid glass styles');
