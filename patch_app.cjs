const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(p, 'utf8');

// 1. Settings state
code = code.replace(
    /const \[enableGlow, setEnableGlow\] = useState\([\s\S]*?\);/,
    `$&
    const [liquidGlassAesthetic, setLiquidGlassAesthetic] = useState(
        user?.settings?.liquidGlassAesthetic ?? localStorage.getItem('liquidGlassAesthetic') === 'true'
    );`
);

// 2. applyLiquidGlassAesthetic function
const applyLiquidGlassFn = `const applyLiquidGlassAesthetic = (enabled) => {
    if (enabled) {
        document.body.classList.add('liquid-glass-aesthetic');
    } else {
        document.body.classList.remove('liquid-glass-aesthetic');
    }
    localStorage.setItem('liquidGlassAesthetic', enabled ? 'true' : 'false');
};`;
code = code.replace(
    /const applyGlow = \(enabled\) => \{[\s\S]*?localStorage\.setItem\('enableGlow', enabled \? 'true' : 'false'\);\s*\};/,
    `$&\n\n${applyLiquidGlassFn}`
);

// 3. Init effect
code = code.replace(
    /const savedGlow = userSettings\?\.settings\?\.enableGlow \?\? localStorage\.getItem\('enableGlow'\) === 'true';\s*applyGlow\(savedGlow\);/,
    `$&\n        const savedLiquidGlassAesthetic = userSettings?.settings?.liquidGlassAesthetic ?? localStorage.getItem('liquidGlassAesthetic') === 'true';\n        applyLiquidGlassAesthetic(savedLiquidGlassAesthetic);`
);

// 4. Storage event
code = code.replace(
    /if \(e\.key === 'enableGlow' && e\.newValue\) \{\s*applyGlow\(e\.newValue === 'true'\);\s*\}/,
    `$&\n            if (e.key === 'liquidGlassAesthetic' && e.newValue) {\n                applyLiquidGlassAesthetic(e.newValue === 'true');\n            }`
);

// 5. User prop change effect
code = code.replace(
    /useEffect\(\(\) => \{\s*if \(user\?\.settings\?\.enableGlow !== undefined\) \{\s*applyGlow\(user\.settings\.enableGlow\);\s*\}\s*\}, \[user\?\.settings\?\.enableGlow\]\);/,
    `$&\n\n    useEffect(() => {\n        if (user?.settings?.liquidGlassAesthetic !== undefined) {\n            applyLiquidGlassAesthetic(user.settings.liquidGlassAesthetic);\n        }\n    }, [user?.settings?.liquidGlassAesthetic]);`
);

// 6. UI Toggle
const uiToggle = `                                <SettingRow label={t('LIQUID_GLASS', 'Liquid Glass Aesthetic')} desc={t('LIQUID_GLASS_DESC', 'Enable premium liquid glass on cards')}>
                                    <Toggle active={liquidGlassAesthetic} onToggle={() => {
                                        const v = !liquidGlassAesthetic;
                                        setLiquidGlassAesthetic(v);
                                        applyLiquidGlassAesthetic(v);
                                        handleSave('liquidGlassAesthetic', v);
                                    }} saving={saving} color="blue" />
                                </SettingRow>`;
code = code.replace(
    /(<SettingRow label=\{t\('ENABLE_GLOW'\)\} desc=\{t\('GLOW_EFFECT_DESC'\)\}>[\s\S]*?<\/SettingRow>)/,
    `$1\n\n${uiToggle}`
);

fs.writeFileSync(p, code);
console.log('App.jsx patched successfully');
