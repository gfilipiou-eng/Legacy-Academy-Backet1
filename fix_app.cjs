const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(p, 'utf8');

// 1. Remove duplicate applyLiquidGlass function
code = code.replace(
    /const applyLiquidGlass = \(intensity\) => \{\s*const val = Number\(intensity\) \|\| 0;\s*if \(val > 0\) \{\s*document\.body\.classList\.add\('liquid-glass-aesthetic'\);\s*document\.body\.style\.setProperty\('--lg-opacity', val\);\s*document\.body\.style\.setProperty\('--lg-blur', `\$\{val \* 35\}px`\);\s*\} else \{\s*document\.body\.classList\.remove\('liquid-glass-aesthetic'\);\s*document\.body\.style\.setProperty\('--lg-opacity', '0'\);\s*document\.body\.style\.setProperty\('--lg-blur', '0px'\);\s*\}\s*localStorage\.setItem\('liquidGlassIntensity', String\(val\)\);\s*\};\s*/,
    ''
);

// 2. Remove duplicate effect blocks
code = code.replace(
    /const savedLiquidGlass = userSettings\?\.settings\?\.liquidGlassIntensity \?\? parseFloat\(localStorage\.getItem\('liquidGlassIntensity'\) \|\| '1\.0'\);\s*applyLiquidGlass\(savedLiquidGlass\);\s*const savedLiquidGlass = userSettings\?\.settings\?\.liquidGlassIntensity \?\? parseFloat\(localStorage\.getItem\('liquidGlassIntensity'\) \|\| '1\.0'\);\s*applyLiquidGlass\(savedLiquidGlass\);/,
    `const savedLiquidGlass = userSettings?.settings?.liquidGlassIntensity ?? parseFloat(localStorage.getItem('liquidGlassIntensity') || '1.0');
        applyLiquidGlass(savedLiquidGlass);`
);

code = code.replace(
    /if \(e\.key === 'liquidGlassIntensity' && e\.newValue\) \{\s*applyLiquidGlass\(parseFloat\(e\.newValue\)\);\s*\}\s*if \(e\.key === 'liquidGlassIntensity' && e\.newValue\) \{\s*applyLiquidGlass\(parseFloat\(e\.newValue\)\);\s*\}/,
    `if (e.key === 'liquidGlassIntensity' && e.newValue) {
                applyLiquidGlass(parseFloat(e.newValue));
            }`
);

code = code.replace(
    /useEffect\(\(\) => \{\s*if \(user\?\.settings\?\.liquidGlassIntensity !== undefined\) \{\s*applyLiquidGlass\(user\.settings\.liquidGlassIntensity\);\s*\}\s*\}, \[user\?\.settings\?\.liquidGlassIntensity\]\);\s*useEffect\(\(\) => \{\s*if \(user\?\.settings\?\.liquidGlassIntensity !== undefined\) \{\s*applyLiquidGlass\(user\.settings\.liquidGlassIntensity\);\s*\}\s*\}, \[user\?\.settings\?\.liquidGlassIntensity\]\);/,
    `useEffect(() => {
        if (user?.settings?.liquidGlassIntensity !== undefined) {
            applyLiquidGlass(user.settings.liquidGlassIntensity);
        }
    }, [user?.settings?.liquidGlassIntensity]);`
);

fs.writeFileSync(p, code);
console.log('App.jsx duplicates fixed');
