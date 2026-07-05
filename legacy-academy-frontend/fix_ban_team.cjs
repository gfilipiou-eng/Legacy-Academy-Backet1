const fs = require('fs');

// Fix translations for BAN in EN
let enCode = fs.readFileSync('src/locales/en.json', 'utf8');
enCode = enCode.replace(/"BAN_DAYS": "BAN DAYS"/, '"BAN_DAYS": "BAN AGENT"');
enCode = enCode.replace(/"BAN_1_DAY": "BAN 1 DAY"/, '"BAN_1_DAY": "BAN 1 DAY"');
enCode = enCode.replace(/"BAN_3_DAYS": "BAN 3 DAYS"/, '"BAN_3_DAYS": "BAN 3 DAYS"');
enCode = enCode.replace(/"BAN_7_DAYS": "BAN 7 DAYS"/, '"BAN_7_DAYS": "BAN 7 DAYS"');
enCode = enCode.replace(/"BAN_30_DAYS": "BAN 30 DAYS"/, '"BAN_30_DAYS": "BAN 30 DAYS"');
fs.writeFileSync('src/locales/en.json', enCode);

// Fix translations for BAN in EL
let elCode = fs.readFileSync('src/locales/el.json', 'utf8');
elCode = elCode.replace(/"BAN_DAYS": "ΗΜΕΡΕΣ ΑΠΟΚΛΕΙΣΜΟΥ"/, '"BAN_DAYS": "BAN (ΕΠΙΛΟΓΗ)"');
elCode = elCode.replace(/"BAN_1_DAY": "ΑΠΟΚΛΕΙΣΜΟΣ 1 ΗΜΕΡΑΣ"/, '"BAN_1_DAY": "BAN 1 ΜΕΡΑ"');
elCode = elCode.replace(/"BAN_3_DAYS": "ΑΠΟΚΛΕΙΣΜΟΣ 3 ΗΜΕΡΩΝ"/, '"BAN_3_DAYS": "BAN 3 ΜΕΡΕΣ"');
elCode = elCode.replace(/"BAN_7_DAYS": "ΑΠΟΚΛΕΙΣΜΟΣ 7 ΗΜΕΡΩΝ"/, '"BAN_7_DAYS": "BAN 7 ΜΕΡΕΣ"');
elCode = elCode.replace(/"BAN_30_DAYS": "ΑΠΟΚΛΕΙΣΜΟΣ 30 ΗΜΕΡΩΝ"/, '"BAN_30_DAYS": "BAN 30 ΜΕΡΕΣ"');
fs.writeFileSync('src/locales/el.json', elCode);

// Fix team badge size in App.jsx
let appCode = fs.readFileSync('src/App.jsx', 'utf8');
// Original: className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-xl scale-[1.35]"
// We make it much larger: className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xl"
appCode = appCode.replace(
    /className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-xl scale-\[1\.35\]"/,
    `className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-2xl"`
);

// We should also increase the text size slightly to match the big logo
// Original: className="text-[13px] sm:text-[15px] font-black tracking-widest text-white bg-white/10 px-3.5 py-1.5 rounded-lg whitespace-nowrap backdrop-blur-md border border-white/10 shadow-lg uppercase"
appCode = appCode.replace(
    /className="text-\[13px\] sm:text-\[15px\] font-black tracking-widest text-white bg-white\/10 px-3\.5 py-1\.5 rounded-lg whitespace-nowrap backdrop-blur-md border border-white\/10 shadow-lg uppercase"/,
    `className="text-[14px] sm:text-[18px] font-black tracking-widest text-white bg-white/10 px-4 py-2 rounded-xl whitespace-nowrap backdrop-blur-md border border-white/10 shadow-xl uppercase"`
);

// And the gap between them from gap-3 to gap-4
appCode = appCode.replace(
    /<div className="mt-3\.5 flex items-center justify-center gap-3 drop-shadow-2xl select-none">/,
    `<div className="mt-4 flex flex-col items-center justify-center gap-2 drop-shadow-2xl select-none">`
);
// Wait, flex-col might be better if the logo is huge! Let's make it flex-col so it's a big badge above the name.

fs.writeFileSync('src/App.jsx', appCode);
console.log('Fixed BAN text and Team Badge Size');
