const fs = require('fs');

function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

// 1. WebsiteBuilder.jsx
const wbPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteBuilder.jsx';
let wbCode = fs.readFileSync(wbPath, 'utf8');

// Replace the root div to inject the variable
const wbRootFind = `<div className="fixed inset-0 z-[3000] bg-black flex flex-col md:flex-row font-sans w-full h-[100dvh] sm:h-screen overscroll-none touch-none">`;
const wbRootReplace = `<div className="fixed inset-0 z-[3000] bg-black flex flex-col md:flex-row font-sans w-full h-[100dvh] sm:h-screen overscroll-none touch-none" style={{ '--builder-primary': activeTheme?.primary || '#D4AF37' }}>`;

if (wbCode.includes(wbRootFind)) {
    wbCode = wbCode.replace(wbRootFind, wbRootReplace);
}

// Replace all var(--gold-primary)
wbCode = replaceAll(wbCode, 'var(--gold-primary)', 'var(--builder-primary)');
fs.writeFileSync(wbPath, wbCode, 'utf8');


// 2. PublicWebsiteViewer.jsx
const pubPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/PublicWebsiteViewer.jsx';
let pubCode = fs.readFileSync(pubPath, 'utf8');

// The style object in PublicWebsiteViewer.jsx is:
/*
            style={{ 
                fontFamily: config.font || 'Inter',
                backgroundColor: activeTheme.bg,
                color: config.palette === 'light' ? '#000' : '#fff'
            }}
*/
const pubStyleFind = `style={{ 
                fontFamily: config.font || 'Inter',
                backgroundColor: activeTheme.bg,
                color: config.palette === 'light' ? '#000' : '#fff'
            }}`;

const pubStyleReplace = `style={{ 
                fontFamily: config.font || 'Inter',
                backgroundColor: activeTheme.bg,
                color: config.palette === 'light' ? '#000' : '#fff',
                '--builder-primary': activeTheme?.primary || '#D4AF37'
            }}`;

if (pubCode.includes(pubStyleFind)) {
    pubCode = pubCode.replace(pubStyleFind, pubStyleReplace);
}

// Replace all var(--gold-primary)
pubCode = replaceAll(pubCode, 'var(--gold-primary)', 'var(--builder-primary)');
fs.writeFileSync(pubPath, pubCode, 'utf8');

console.log('Successfully updated builder and public viewer to use dynamic colors!');
