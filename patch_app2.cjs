const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(p, 'utf8');

// 1. Revert to liquidGlassIntensity state in SettingsModal
code = code.replace(
    /const \[liquidGlassAesthetic, setLiquidGlassAesthetic\] = useState\([\s\S]*?\);/,
    `const [liquidGlassIntensity, setLiquidGlassIntensity] = useState(
        user?.settings?.liquidGlassIntensity ?? parseFloat(localStorage.getItem('liquidGlassIntensity') || '1.0')
    );`
);

// 2. Fix handleSave mapping for liquidGlassIntensity
// Wait, I will just ensure the slider calls `handleSave('liquidGlassIntensity', value)` and I update `handleSave` in `App.jsx`
code = code.replace(
    /if \(key === 'liquidGlassIntensity'\) \{\s*payload = \{ settings: \{ liquidGlassIntensity: Number\(val\) \} \};\s*\}/,
    `if (key === 'liquidGlassIntensity') {
                payload = { settings: { liquidGlassIntensity: Number(val) } };
                localStorage.setItem('liquidGlassIntensity', String(val));
            }`
);

// If it's not there, add it just before OPTIMISTIC UPDATE
if (!code.includes("key === 'liquidGlassIntensity'")) {
    code = code.replace(
        /\/\/ OPTIMISTIC UPDATE FOR ALL SETTINGS/,
        `if (key === 'liquidGlassIntensity') {
                payload = { settings: { liquidGlassIntensity: Number(val) } };
                localStorage.setItem('liquidGlassIntensity', String(val));
            }
            
            // OPTIMISTIC UPDATE FOR ALL SETTINGS`
    );
}

// 3. Update the UI from Toggle to Slider
const liquidGlassUI = `<div className="px-5 sm:px-6 py-5 border-t border-white/5">
                                  <div className="flex items-center justify-between mb-4">
                                      <span className="text-[16px] sm:text-[15px] font-normal text-white">{t('LIQUID_GLASS', 'Liquid Glass Intensity')}</span>
                                      <span className="text-[15px] font-semibold text-[#1D9BF0] tabular-nums">{Math.round(liquidGlassIntensity * 100)}%</span>
                                  </div>
                                  <input
                                      type="range"
                                      min="0"
                                      max="1"
                                      step="0.05"
                                      value={liquidGlassIntensity}
                                      onChange={(e) => {
                                          const val = parseFloat(e.target.value);
                                          setLiquidGlassIntensity(val);
                                          applyLiquidGlass(val);
                                      }}
                                      onPointerUp={() => handleSave('liquidGlassIntensity', liquidGlassIntensity)}
                                      onKeyUp={() => handleSave('liquidGlassIntensity', liquidGlassIntensity)}
                                      className="settings-range w-full h-2 accent-[#1D9BF0]"
                                      style={{
                                          '--progress-width': \`\${(liquidGlassIntensity) * 100}%\`
                                      }}
                                  />
                                  <p className="text-[#8E8E93] text-sm mt-3">{t('LIQUID_GLASS_DESC', 'Adjust the blur and glass effect strength on cards.')}</p>
                              </div>`;

code = code.replace(
    /<SettingRow label=\{t\('LIQUID_GLASS', 'Liquid Glass Aesthetic'\)\} desc=\{t\('LIQUID_GLASS_DESC', 'Enable premium liquid glass on cards'\)\}>[\s\S]*?<\/SettingRow>/,
    liquidGlassUI
);

// Also remove `liquidGlassAesthetic` from global logic and put back `applyLiquidGlass`
code = code.replace(
    /const applyLiquidGlassAesthetic = \(enabled\) => \{[\s\S]*?localStorage\.setItem\('liquidGlassAesthetic', enabled \? 'true' : 'false'\);\s*\};/,
    `const applyLiquidGlass = (intensity) => {
    const val = Number(intensity) || 0;
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

code = code.replace(
    /const savedLiquidGlassAesthetic = userSettings\?\.settings\?\.liquidGlassAesthetic \?\? localStorage\.getItem\('liquidGlassAesthetic'\) === 'true';\s*applyLiquidGlassAesthetic\(savedLiquidGlassAesthetic\);/,
    `const savedLiquidGlass = userSettings?.settings?.liquidGlassIntensity ?? parseFloat(localStorage.getItem('liquidGlassIntensity') || '1.0');
        applyLiquidGlass(savedLiquidGlass);`
);

code = code.replace(
    /if \(e\.key === 'liquidGlassAesthetic' && e\.newValue\) \{\s*applyLiquidGlassAesthetic\(e\.newValue === 'true'\);\s*\}/,
    `if (e.key === 'liquidGlassIntensity' && e.newValue) {
                applyLiquidGlass(parseFloat(e.newValue));
            }`
);

code = code.replace(
    /useEffect\(\(\) => \{\s*if \(user\?\.settings\?\.liquidGlassAesthetic !== undefined\) \{\s*applyLiquidGlassAesthetic\(user\.settings\.liquidGlassAesthetic\);\s*\}\s*\}, \[user\?\.settings\?\.liquidGlassAesthetic\]\);/,
    `useEffect(() => {
        if (user?.settings?.liquidGlassIntensity !== undefined) {
            applyLiquidGlass(user.settings.liquidGlassIntensity);
        }
    }, [user?.settings?.liquidGlassIntensity]);`
);


// 4. Shrink ProfileModal
// Find ProfileModal return class which was: `className="fixed inset-0 z-[2100] flex items-end sm:items-center justify-center overflow-x-hidden"`
// Actually, earlier output showed: `absolute inset-0 bg-black/75 backdrop-blur-2xl`
// And `absolute top-0 left-0 right-0 h-[220px]` but wait, there is a `div` for the modal panel itself.
code = code.replace(
    /className="relative w-full max-w-full sm:max-w-\[680px\] min-h-\[100dvh\] sm:min-h-0 sm:h-auto sm:max-h-\[85vh\] bg-\[#050505\] sm:rounded-2xl shadow-2xl flex flex-col"/,
    'className="relative w-full max-w-full sm:max-w-[680px] h-[95dvh] sm:h-auto sm:max-h-[85vh] bg-[#050505] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"'
);

// Some older styling might exist
code = code.replace(
    /className="relative w-full max-w-full sm:max-w-\[680px\] min-h-\[100dvh\] sm:min-h-0 sm:h-auto sm:max-h-\[85vh\] flex flex-col bg-black sm:rounded-3xl border-0 sm:border border-white\/10 shadow-2xl"/,
    'className="relative w-full max-w-full sm:max-w-[680px] h-[90dvh] sm:h-auto sm:max-h-[85vh] flex flex-col bg-black rounded-t-3xl sm:rounded-3xl border-0 sm:border border-white/10 shadow-2xl"'
);

code = code.replace(
    /className="relative w-full max-w-full sm:max-w-md bg-\[#0a0a0a\] border border-white\/10 shadow-2xl p-5 sm:p-6 rounded-none sm:rounded-3xl flex flex-col h-\[100dvh\] sm:h-auto sm:max-h-\[85vh\] overflow-hidden"/g,
    'className="relative w-full max-w-full sm:max-w-md bg-[#0a0a0a] border border-white/10 shadow-2xl p-5 sm:p-6 rounded-t-3xl sm:rounded-3xl flex flex-col h-[90dvh] sm:h-auto sm:max-h-[85vh] overflow-hidden mt-auto sm:mt-0"'
);

// We should also replace it globally if there are variations:
// min-h-[100dvh] -> h-[90dvh] rounded-t-3xl mt-auto
// h-[100dvh] -> h-[90dvh] rounded-t-3xl mt-auto
code = code.replace(/min-h-\[100dvh\]/g, 'h-[90dvh] mt-auto rounded-t-3xl');
code = code.replace(/h-\[100dvh\]/g, 'h-[90dvh] mt-auto rounded-t-3xl');
code = code.replace(/rounded-none sm:rounded/g, 'rounded-t-3xl sm:rounded');
code = code.replace(/sm:rounded-none/g, ''); // cleanup

fs.writeFileSync(p, code);
console.log('App.jsx patched successfully');
