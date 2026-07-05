const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Fix Post Card Name wrapping
// In App.jsx, there's `const nameClass = ... break-words min-w-0 max-w-full ...`
// We need to change it to use truncate shrink and max-w-[50%] instead of break-words
appCode = appCode.replace(
    /const nameClass = compact \? 'font-bold text-white text-\[13px\] sm:text-\[15px\] leading-snug hover:underline cursor-pointer break-words min-w-0 max-w-full' : 'font-bold text-white text-\[13px\] sm:text-\[15px\] leading-tight hover:underline cursor-pointer break-words min-w-0 max-w-full';/,
    `const nameClass = compact ? 'font-bold text-white text-[13px] sm:text-[15px] leading-snug hover:underline cursor-pointer truncate shrink min-w-0 max-w-[50%]' : 'font-bold text-white text-[13px] sm:text-[15px] leading-tight hover:underline cursor-pointer truncate shrink min-w-0 max-w-[50%]';`
);

// 2. Fix Post Card header wrapping
// Change `flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0 w-full max-w-full`
// to `flex-nowrap items-center gap-x-1.5 gap-y-1 min-w-0 w-full max-w-full overflow-hidden`
// Ensure it ONLY replaces the Post Card one (around line 2696)
appCode = appCode.replace(
    /<div className="flex flex-wrap items-center gap-x-1\.5 gap-y-1 min-w-0 w-full max-w-full">/,
    `<div className="flex flex-nowrap items-center gap-x-1.5 gap-y-1 min-w-0 w-full max-w-full overflow-hidden">`
);

// 3. Fix Profile Header Badge Order (displayUser)
// Find this block around line 7074:
/*
<span className="profile-headline font-black text-white text-xl sm:text-2xl truncate min-w-0">{displayUser?.username || "Unknown Agent"}</span>
{getActiveStreak(displayUser) > 0 && <span className="text-orange-500 font-bold text-lg sm:text-xl shrink-0 flex items-center gap-1"><span className="text-lg sm:text-xl"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" /></span>{getActiveStreak(displayUser)}</span>}
<VerifiedBadge isFounder={isFounderProfile} isUser={!isFounderProfile} className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 flex-shrink-0 drop-shadow-xl" user={displayUser} />
*/
// And change the order to VerifiedBadge BEFORE Streak.

const oldProfileHeader = `<span className="profile-headline font-black text-white text-xl sm:text-2xl truncate min-w-0">{displayUser?.username || "Unknown Agent"}</span>
                                        {getActiveStreak(displayUser) > 0 && <span className="text-orange-500 font-bold text-lg sm:text-xl shrink-0 flex items-center gap-1"><span className="text-lg sm:text-xl"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" /></span>{getActiveStreak(displayUser)}</span>}
                                        <VerifiedBadge isFounder={isFounderProfile} isUser={!isFounderProfile} className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 flex-shrink-0 drop-shadow-xl" user={displayUser} />`;

const newProfileHeader = `<span className="profile-headline font-black text-white text-xl sm:text-2xl truncate min-w-0">{displayUser?.username || "Unknown Agent"}</span>
                                        <VerifiedBadge isFounder={isFounderProfile} isUser={!isFounderProfile} className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 flex-shrink-0 drop-shadow-xl" user={displayUser} />
                                        {getActiveStreak(displayUser) > 0 && <span className="text-orange-500 font-bold text-lg sm:text-xl shrink-0 flex items-center gap-1"><span className="text-lg sm:text-xl"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" /></span>{getActiveStreak(displayUser)}</span>}`;

appCode = appCode.replace(oldProfileHeader, newProfileHeader);


fs.writeFileSync('src/App.jsx', appCode);
console.log('App.jsx layout tweaks applied!');
