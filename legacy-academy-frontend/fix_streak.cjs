const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

// 1. PostCard Streak
appCode = appCode.replace(
    /\{getActiveStreak\(author\) > 0 && <span className="text-orange-500 font-bold text-\[11px\] sm:text-xs shrink-0 flex items-center"><Icons\.Streak className="inline-block w-\[1\.1em\] h-\[1\.1em\] -mt-1" \/>\{getActiveStreak\(author\)\}<\/span>\}/g,
    `{getActiveStreak(author) > 0 && <span className="text-orange-500 font-bold text-[11px] sm:text-xs shrink-0 flex items-center gap-0.5"><Icons.Streak className="w-[1.2em] h-[1.2em]" />{getActiveStreak(author)}</span>}`
);

// 2. ProfileModal Streak
appCode = appCode.replace(
    /\{getActiveStreak\(displayUser\) > 0 && <span className="text-orange-500 font-bold text-lg sm:text-xl shrink-0 flex items-center gap-1"><span className="text-lg sm:text-xl"><Icons\.Streak className="inline-block w-\[1\.1em\] h-\[1\.1em\] -mt-1" \/><\/span>\{getActiveStreak\(displayUser\)\}<\/span>\}/g,
    `{getActiveStreak(displayUser) > 0 && <span className="text-orange-500 font-bold text-lg sm:text-xl shrink-0 flex items-center gap-1"><Icons.Streak className="w-[1.2em] h-[1.2em]" />{getActiveStreak(displayUser)}</span>}`
);

// 3. PublicProfileModal Streak
appCode = appCode.replace(
    /\{getActiveStreak\(publicUser\) > 0 && <span className="text-orange-500 font-bold text-base sm:text-lg shrink-0 flex items-center gap-1"><span className="text-base sm:text-lg"><Icons\.Streak className="inline-block w-\[1\.1em\] h-\[1\.1em\] -mt-1" \/><\/span>\{getActiveStreak\(publicUser\)\}<\/span>\}/g,
    `{getActiveStreak(publicUser) > 0 && <span className="text-orange-500 font-bold text-base sm:text-lg shrink-0 flex items-center gap-1"><Icons.Streak className="w-[1.2em] h-[1.2em]" />{getActiveStreak(publicUser)}</span>}`
);

// 4. ShareModal Profile
appCode = appCode.replace(
    /\{getActiveStreak\(shareModalProfile\) > 0 && <span className="text-orange-500 font-bold text-lg shrink-0 flex items-center"><Icons\.Streak className="inline-block w-\[1\.1em\] h-\[1\.1em\] -mt-1" \/>\{getActiveStreak\(shareModalProfile\)/g,
    `{getActiveStreak(shareModalProfile) > 0 && <span className="text-orange-500 font-bold text-lg shrink-0 flex items-center gap-1"><Icons.Streak className="w-[1.2em] h-[1.2em]" />{getActiveStreak(shareModalProfile)`
);

// 5. ShareModal Post
appCode = appCode.replace(
    /\{getActiveStreak\(shareModalPost\?\.author\) > 0 && <span className="text-orange-500 font-bold text-xs shrink-0 flex items-center"><Icons\.Streak className="inline-block w-\[1\.1em\] h-\[1\.1em\] -mt-1" \/>\{getActiveStreak\(shareModalPost\?\.author\)/g,
    `{getActiveStreak(shareModalPost?.author) > 0 && <span className="text-orange-500 font-bold text-xs shrink-0 flex items-center gap-0.5"><Icons.Streak className="w-[1.2em] h-[1.2em]" />{getActiveStreak(shareModalPost?.author)`
);

fs.writeFileSync('src/App.jsx', appCode);
console.log('Fixed Streak alignment in components!');
