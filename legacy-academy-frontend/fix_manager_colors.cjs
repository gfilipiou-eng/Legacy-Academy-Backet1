const fs = require('fs');

const wmPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteManager.jsx';
let wmCode = fs.readFileSync(wmPath, 'utf8');

const themeColorsCode = `    const themeColors = {
        gold: { primary: '#D4AF37', bg: '#09090b', card: '#111113' },
        blue: { primary: '#1D9BF0', bg: '#001018', card: '#001824' },
        pink: { primary: '#e83c74', bg: '#17050d', card: '#210712' },
        green: { primary: '#2fd840', bg: '#041206', card: '#061c09' },
        red: { primary: '#ef4444', bg: '#140505', card: '#1f0707' }
    };
    const activePalette = websites.length > 0 ? (websites[0].palette || 'blue') : 'blue';
    const builderPrimary = themeColors[activePalette]?.primary || '#1D9BF0';
`;

wmCode = wmCode.replace('const handleCreateNew', themeColorsCode + '\n    const handleCreateNew');

// Replace the hardcoded #D4AF37
wmCode = wmCode.replace(/style=\{\{\s*'--builder-primary':\s*'#D4AF37'\s*\}\}/g, "style={{ '--builder-primary': builderPrimary }}");

fs.writeFileSync(wmPath, wmCode, 'utf8');

const tplPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteTemplates.jsx';
let tplCode = fs.readFileSync(tplPath, 'utf8');
tplCode = tplCode.replace(/style=\{\{\s*'--builder-primary':\s*'#D4AF37'\s*\}\}/g, "style={{ '--builder-primary': '#1D9BF0' }}");
fs.writeFileSync(tplPath, tplCode, 'utf8');

console.log('Fixed WebsiteManager and WebsiteTemplates colors!');
