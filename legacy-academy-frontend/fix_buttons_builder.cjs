const fs = require('fs');

// App.jsx: Fix Follow/Unfollow button touches
const appPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');

// Replace Follow button
appCode = appCode.replace(
    /className=\`\{\`flex-1 relative overflow-hidden py-2\.5 rounded-full text-\[13px\] sm:text-\[14px\] font-bold transition-all duration-300 hover:scale-\[1\.02\] active:scale-\[0\.98\] shadow-sm flex items-center justify-center \$\{isFollowing \? 'bg-transparent border border-white\/30 text-white hover:border-red-500\/50 hover:text-red-500 hover:bg-red-500\/5' : 'bg-white border border-transparent text-black hover:bg-neutral-200'\}\`\}/,
    'className={`flex-1 relative py-2.5 rounded-full text-[14px] font-bold transition-colors active:scale-[0.97] flex items-center justify-center touch-manipulation select-none cursor-pointer ${isFollowing ? \\'bg-transparent border border-white/30 text-white active:border-red-500/50 active:text-red-500 active:bg-red-500/5 md:hover:border-red-500/50 md:hover:text-red-500 md:hover:bg-red-500/5\\' : \\'bg-white border border-transparent text-black active:bg-neutral-200 md:hover:bg-neutral-200\\'}`}'
);

// Replace Whispers button
appCode = appCode.replace(
    /className=\"relative overflow-hidden py-2\.5 px-6 rounded-full text-\[13px\] sm:text-\[14px\] font-bold transition-all duration-300 hover:scale-\[1\.02\] active:scale-\[0\.98\] shadow-sm flex items-center justify-center bg-transparent border border-white\/30 text-white hover:bg-white\/10 shrink-0\"/,
    'className="relative py-2.5 px-6 rounded-full text-[14px] font-bold transition-colors active:scale-[0.97] flex items-center justify-center bg-transparent border border-white/30 text-white active:bg-white/10 md:hover:bg-white/10 shrink-0 touch-manipulation select-none cursor-pointer"'
);

fs.writeFileSync(appPath, appCode, 'utf8');


// WebsiteBuilder.jsx: Fix deletions and beautify
const builderPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteBuilder.jsx';
let bCode = fs.readFileSync(builderPath, 'utf8');

// Fix Nav Links rendering (allow deletion)
bCode = bCode.replace(
    /<a href=\"#services\" className=\"hover:opacity-100\">\{config\.navLink1 \|\| 'Services'\}<\/a>/,
    "{config.navLink1 !== '' && <a href=\"#services\" className=\"hover:opacity-100\">{config.navLink1 ?? 'Services'}</a>}"
);
bCode = bCode.replace(
    /<a href=\"#about\" className=\"hover:opacity-100\">\{config\.navLink2 \|\| 'About'\}<\/a>/,
    "{config.navLink2 !== '' && <a href=\"#about\" className=\"hover:opacity-100\">{config.navLink2 ?? 'About'}</a>}"
);
bCode = bCode.replace(
    /<a href=\"#contact\" className=\"hover:opacity-100\">\{config\.navLink3 \|\| 'Contact'\}<\/a>/,
    "{config.navLink3 !== '' && <a href=\"#contact\" className=\"hover:opacity-100\">{config.navLink3 ?? 'Contact'}</a>}"
);

// Fix CTA Button rendering (allow deletion)
bCode = bCode.replace(
    /<a\s+href=\{config\.ctaLink === '#' \? '#contact' : config\.ctaLink\}\s+className=\"px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all hover:scale-105 hover:shadow-2xl\"\s+style=\{\{\s+backgroundColor: activeTheme\.primary,\s+color: config\.palette === 'light' \? '#fff' : '#000',\s+boxShadow: `0 0 30px \$\{activeTheme\.primary\}40`\s+\}\}\s+>\s+\{config\.ctaText\}\s+<\/a>/,
    `{config.ctaText !== '' && (
                                    <a 
                                        href={config.ctaLink === '#' ? '#contact' : config.ctaLink}
                                        className="px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all hover:scale-105 hover:shadow-2xl"
                                        style={{ 
                                            backgroundColor: activeTheme.primary, 
                                            color: config.palette === 'light' ? '#fff' : '#000',
                                            boxShadow: \`0 0 30px \${activeTheme.primary}40\`
                                        }}
                                    >
                                        {config.ctaText ?? 'Get in Touch'}
                                    </a>
                                )}`
);

// Form Inputs Beautification
// Make inputs more premium
bCode = bCode.replace(/bg-black\/50 border border-white\/10 rounded-xl px-4 py-3/g, "bg-black/60 border border-white/5 shadow-inner rounded-[14px] px-4 py-3.5 backdrop-blur-sm");
bCode = bCode.replace(/bg-black\/50 border border-white\/10 rounded-xl px-3 py-2/g, "bg-black/60 border border-white/5 shadow-inner rounded-[12px] px-3.5 py-2.5 backdrop-blur-sm");

// Make left panel background more elegant
bCode = bCode.replace(/className=\"w-full md:w-\[450px\] h-full flex flex-col bg-\[\#09090b\] relative z-40\"/, 'className="w-full md:w-[450px] h-full flex flex-col bg-black relative z-40 border-r border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.5)]"');

fs.writeFileSync(builderPath, bCode, 'utf8');
console.log('Fixed WebsiteBuilder deletions, beautified, and fixed follow buttons.');
