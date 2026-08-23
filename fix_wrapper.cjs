const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(p, 'utf8');

// Fix main app container
code = code.replace(
    /<div className="h-\[80dvh\] mt-auto rounded-t-3xl bg-\[var\(--app-bg\)\] text-\[var\(--app-text\)\] relative font-sans overflow-hidden flex flex-col">/g,
    '<div className="min-h-[100dvh] bg-[var(--app-bg)] text-[var(--app-text)] relative font-sans overflow-hidden flex flex-col">'
);

// Fix post detail modal sheet
code = code.replace(
    /className="post-detail-modal__sheet w-full h-\[80dvh\] mt-auto rounded-t-3xl max-h-\[80dvh\] mt-auto rounded-t-3xl/g,
    'className="post-detail-modal__sheet w-full h-[100dvh] max-h-[100dvh]'
);

// Fix any other unintended replacements of min-h-[100dvh] that became h-[80dvh] mt-auto rounded-t-3xl
code = code.replace(
    /min-h-\[80dvh\] mt-auto rounded-t-3xl/g,
    'min-h-[100dvh]'
);

fs.writeFileSync(p, code);
console.log('Fixed main app wrapper styling');
