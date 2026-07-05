const fs = require('fs');

let vbCode = fs.readFileSync('src/components/VerifiedBadge.jsx', 'utf8');

// Completely remove football team rendering from VerifiedBadge
vbCode = vbCode.replace(
    /const team = user\?\.settings\?\.footballTeam;[\s\S]*?return \([\s\S]*?<span className="inline-flex flex-nowrap whitespace-nowrap items-center gap-1\.5 shrink-0 align-middle">[\s\S]*?\{renderMainBadge\(\)\}[\s\S]*?<span[\s\S]*?<\/span>[\s\S]*?<\/span>[\s\S]*?\);/m,
    'return renderMainBadge();'
);

fs.writeFileSync('src/components/VerifiedBadge.jsx', vbCode);
console.log('VerifiedBadge updated successfully!');
