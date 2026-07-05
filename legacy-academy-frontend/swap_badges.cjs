const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// The goal is to swap the ProfileDescriptor and Flame around so Flame is FIRST in Post Cards and Share Post Modals

// Post Cards Header
code = code.replace(
    /(\{author\?\.profileDescriptor && PROFILE_DESCRIPTOR_MAP\[author\.profileDescriptor\] && \([\s\S]*?<\/div>\s*\)\})\s*(\{getActiveStreak\(author\) > 0 && <span className="text-orange-500 font-bold text-\[11px\] sm:text-xs shrink-0 flex items-center"><Icons\.Streak className="inline-block w-\[1\.1em\] h-\[1\.1em\] -mt-1" \/>\{getActiveStreak\(author\)\}<\/span>\})/,
    '$2\n                                        $1'
);

// Share Post Modal
code = code.replace(
    /(\{shareModalPost\.author\?\.profileDescriptor && PROFILE_DESCRIPTOR_MAP\[shareModalPost\.author\.profileDescriptor\] && \([\s\S]*?<\/div>\s*\)\})\s*(\{getActiveStreak\(shareModalPost\?\.author\) > 0 && <span className="text-orange-500 font-bold text-xs shrink-0 flex items-center"><Icons\.Streak className="inline-block w-\[1\.1em\] h-\[1\.1em\] -mt-1" \/>\{getActiveStreak\(shareModalPost\?\.author\)\}\{isTopStreak\(shareModalPost\?\.author\) && <span className="ml-1\.5 px-1\.5 py-0\.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-\[9px\] font-black uppercase rounded-sm shadow-md tracking-widest leading-none align-middle inline-flex items-center gap-0\.5"><Icons\.TrendingUp className="w-2\.5 h-2\.5" \/> TOP<\/span>\}<\/span>\})/,
    '$2\n                                        $1'
);


fs.writeFileSync('src/App.jsx', code);
console.log("Regex swap completed.");
