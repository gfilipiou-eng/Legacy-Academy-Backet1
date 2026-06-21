const fs = require('fs');

function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

const wmPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteManager.jsx';
let wmCode = fs.readFileSync(wmPath, 'utf8');
wmCode = replaceAll(wmCode, 'var(--gold-primary)', 'var(--builder-primary)');
const rootDiv = `<div className="min-h-screen bg-black text-white font-sans overflow-x-hidden pt-20">`;
if (wmCode.includes(rootDiv)) {
    wmCode = wmCode.replace(rootDiv, `<div className="min-h-screen bg-black text-white font-sans overflow-x-hidden pt-20" style={{ '--builder-primary': '#D4AF37' }}>`);
} else {
    // try finding just min-h-screen
    const fallback = `<div className="min-h-screen`;
    wmCode = wmCode.replace(fallback, `<div style={{ '--builder-primary': '#D4AF37' }} className="min-h-screen`);
}
fs.writeFileSync(wmPath, wmCode, 'utf8');

const tplPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteTemplates.jsx';
let tplCode = fs.readFileSync(tplPath, 'utf8');
tplCode = replaceAll(tplCode, 'var(--gold-primary)', 'var(--builder-primary)');
const tplRoot = `<div className="fixed inset-0 z-[4000] bg-black/95 backdrop-blur-xl flex flex-col font-sans overflow-y-auto">`;
if (tplCode.includes(tplRoot)) {
    tplCode = tplCode.replace(tplRoot, `<div className="fixed inset-0 z-[4000] bg-black/95 backdrop-blur-xl flex flex-col font-sans overflow-y-auto" style={{ '--builder-primary': '#D4AF37' }}>`);
}
fs.writeFileSync(tplPath, tplCode, 'utf8');

console.log('Fixed WebsiteManager and WebsiteTemplates!');
