const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

// 1. REVERT POST CARD WRAPPING
appCode = appCode.replace(
    /const nameClass = compact \? 'font-bold text-white text-\[13px\] sm:text-\[15px\] leading-snug hover:underline cursor-pointer truncate shrink min-w-0 max-w-\[50\%\]' : 'font-bold text-white text-\[13px\] sm:text-\[15px\] leading-tight hover:underline cursor-pointer truncate shrink min-w-0 max-w-\[50\%\]';/,
    `const nameClass = compact ? 'font-bold text-white text-[13px] sm:text-[15px] leading-snug hover:underline cursor-pointer break-words min-w-0 max-w-full' : 'font-bold text-white text-[13px] sm:text-[15px] leading-tight hover:underline cursor-pointer break-words min-w-0 max-w-full';`
);

appCode = appCode.replace(
    /<div className="flex flex-nowrap items-center gap-x-1\.5 gap-y-1 min-w-0 w-full max-w-full overflow-hidden">/,
    `<div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0 w-full max-w-full">`
);

// 2. REVERT PROFILE HEADER TEAM LOGO to flex-row but just larger size
appCode = appCode.replace(
    /<div className="mt-4 flex flex-col items-center justify-center gap-2 drop-shadow-2xl select-none">\s*<img src=\{displayUser\.settings\.footballTeam\.strBadge\} alt=\{displayUser\.settings\.footballTeam\.strTeam\} className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-2xl" \/>\s*<span className="text-\[14px\] sm:text-\[18px\] font-black tracking-widest text-white bg-white\/10 px-4 py-2 rounded-xl whitespace-nowrap backdrop-blur-md border border-white\/10 shadow-xl uppercase">\s*\{displayUser\.settings\.footballTeam\.strTeam\}\s*<\/span>\s*<\/div>/,
    `<div className="mt-3.5 flex items-center justify-center gap-3 drop-shadow-2xl select-none">
                                            <img src={displayUser.settings.footballTeam.strBadge} alt={displayUser.settings.footballTeam.strTeam} className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-xl" />
                                            <span className="text-[13px] sm:text-[15px] font-black tracking-widest text-white bg-white/10 px-3.5 py-1.5 rounded-lg whitespace-nowrap backdrop-blur-md border border-white/10 shadow-lg uppercase">
                                                {displayUser.settings.footballTeam.strTeam}
                                            </span>
                                        </div>`
);


fs.writeFileSync('src/App.jsx', appCode);
console.log('Reverted to safer layout.');
