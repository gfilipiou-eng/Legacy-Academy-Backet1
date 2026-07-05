const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

// 1. FIX POST CARD NAME TRUNCATION
appCode = appCode.replace(
    /const nameClass = compact \? 'font-bold text-white text-\[13px\] sm:text-\[15px\] leading-snug hover:underline cursor-pointer break-words min-w-0 max-w-full' : 'font-bold text-white text-\[13px\] sm:text-\[15px\] leading-tight hover:underline cursor-pointer break-words min-w-0 max-w-full';/,
    `const nameClass = compact ? 'font-bold text-white text-[13px] sm:text-[15px] leading-snug hover:underline cursor-pointer truncate shrink min-w-0 max-w-[50%]' : 'font-bold text-white text-[13px] sm:text-[15px] leading-tight hover:underline cursor-pointer truncate shrink min-w-0 max-w-[50%]';`
);

// We LEAVE the container as flex-wrap so the handle can wrap!

// 2. FIX PROFILE TEAM BADGE
appCode = appCode.replace(
    /<div className="mt-3\.5 flex items-center justify-center gap-3 drop-shadow-2xl select-none">\s*<img src=\{displayUser\.settings\.footballTeam\.strBadge\} alt=\{displayUser\.settings\.footballTeam\.strTeam\} className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-xl" \/>\s*<span className="text-\[13px\] sm:text-\[15px\] font-black tracking-widest text-white bg-white\/10 px-3\.5 py-1\.5 rounded-lg whitespace-nowrap backdrop-blur-md border border-white\/10 shadow-lg uppercase">\s*\{displayUser\.settings\.footballTeam\.strTeam\}\s*<\/span>\s*<\/div>/,
    `<div className="mt-3.5 flex items-center justify-center gap-3 sm:gap-4 drop-shadow-2xl select-none">
                                            <img src={displayUser.settings.footballTeam.strBadge} alt={displayUser.settings.footballTeam.strTeam} className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-2xl" />
                                            <span className="text-[14px] sm:text-[16px] font-black tracking-widest text-white bg-white/10 px-4 py-2 rounded-xl whitespace-nowrap backdrop-blur-md border border-white/10 shadow-xl uppercase">
                                                {displayUser.settings.footballTeam.strTeam}
                                            </span>
                                        </div>`
);


fs.writeFileSync('src/App.jsx', appCode);
console.log('Fixed again!');
