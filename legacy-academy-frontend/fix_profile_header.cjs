const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

// Use regex to swap Flame and VerifiedBadge for displayUser profile header
const regex = /(\{getActiveStreak\(displayUser\) > 0 && <span className="text-orange-500 font-bold text-lg sm:text-xl shrink-0 flex items-center gap-1"><span className="text-lg sm:text-xl"><Icons\.Streak className="inline-block w-\[1\.1em\] h-\[1\.1em\] -mt-1" \/><\/span>\{getActiveStreak\(displayUser\)\}<\/span>\})\s*(<VerifiedBadge isFounder=\{isFounderProfile\} isUser=\{!isFounderProfile\} className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 flex-shrink-0 drop-shadow-xl" user=\{displayUser\} \/>)/;

appCode = appCode.replace(regex, '$2\n                                        $1');

fs.writeFileSync('src/App.jsx', appCode);
console.log('Profile Header layout tweak applied!');
