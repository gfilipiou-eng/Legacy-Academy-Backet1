const fs = require('fs');

// ── 1. Fix VerifiedBadge: smaller circle (r=11) so black doesn't bleed outside badge shape
let badge = fs.readFileSync('src/components/VerifiedBadge.jsx', 'utf8');
badge = badge.replace(
    '<circle cx="20" cy="20" r="20" fill="#000000" />',
    '<circle cx="20" cy="20" r="11" fill="#000000" />'
);
fs.writeFileSync('src/components/VerifiedBadge.jsx', badge);
console.log('Fixed ig badge circle radius');

// ── 2. Fix App.jsx: remove Metal Blue, simplify touch (no scale, just opacity on press)
let app = fs.readFileSync('src/App.jsx', 'utf8');

// Remove metal-blue from user badge list
app = app.replace(
    `                                                { id: 'metal-blue',label: t('BADGE_METAL_BLUE', 'Metal Blue') },\n`,
    ''
);

// Fix touch feel: remove active:scale-90 -> active:opacity-60 on both grids
app = app.replace(
    /transition-all duration-150 active:scale-90 select-none/g,
    'transition-colors duration-100 select-none'
);

// Fix selected state: make it cleaner - just a simple white/colored border
// Replace the complex selected classes for founder
app = app.replace(
    `isSelected\n                                                                ? 'border-white/40 bg-white/[0.06]'\n                                                                : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.04]'`,
    `isSelected\n                                                                ? 'border-white/50 bg-white/[0.07]'\n                                                                : 'border-white/[0.08] bg-white/[0.02]'`
);

fs.writeFileSync('src/App.jsx', app);
console.log('Fixed App.jsx');
