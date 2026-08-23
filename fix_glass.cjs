const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(p, 'utf8');

code = code.replace(
    /const applyLiquidGlass = \(intensity\) => \{\s*const val = Number\(intensity\) \|\| 0;\s*if \(val > 0\) \{\s*document\.body\.classList\.add\('liquid-glass-aesthetic'\);\s*document\.body\.style\.setProperty\('--lg-opacity', val\);\s*document\.body\.style\.setProperty\('--lg-blur', `\$\{val \* 35\}px`\);\s*\} else \{\s*document\.body\.classList\.remove\('liquid-glass-aesthetic'\);\s*document\.body\.style\.setProperty\('--lg-opacity', '0'\);\s*document\.body\.style\.setProperty\('--lg-blur', '0px'\);\s*\}\s*localStorage\.setItem\('liquidGlassIntensity', String\(val\)\);\s*\};/,
    `const applyLiquidGlass = (intensity) => {
    const val = Math.max(0, Math.min(1, Number(intensity) || 0));
    
    // Original Dynamic Glass Logic (fixes Navbar and Boards)
    const blur = 4 + (val * 36); // 4px to 40px
    const saturate = 100 + (val * 150); // 100% to 250%
    const bgOpacity = 0.2 + (val * 0.6); // 0.2 to 0.8
    document.documentElement.style.setProperty('--dynamic-blur', \`\${blur}px\`);
    document.documentElement.style.setProperty('--dynamic-saturate', \`\${saturate}%\`);
    document.documentElement.style.setProperty('--dynamic-glass-bg', \`rgba(10, 10, 10, \${bgOpacity})\`);
    
    // My additional logic
    if (val > 0) {
        document.body.classList.add('liquid-glass-aesthetic');
        document.body.style.setProperty('--lg-opacity', val);
        document.body.style.setProperty('--lg-blur', \`\${val * 35}px\`);
    } else {
        document.body.classList.remove('liquid-glass-aesthetic');
        document.body.style.setProperty('--lg-opacity', '0');
        document.body.style.setProperty('--lg-blur', '0px');
    }
    
    localStorage.setItem('liquidGlassIntensity', String(val));
};`
);

fs.writeFileSync(p, code);
console.log('Restored applyLiquidGlass logic');
