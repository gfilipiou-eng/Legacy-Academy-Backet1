const fs = require('fs');

let appPath = 'src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');

// Remove Elite Eye
appCode = appCode.replace(/{ id: 'illuminati',\s*label: t\('BADGE_ILLUMINATI', 'Elite Eye'\) },\s*/g, '');

// Fix maxUploadSize
appCode = appCode.replace(/const maxUploadSize = user\?\.role === 'Founder' \? 500 \* 1024 \* 1024 : 90 \* 1024 \* 1024;/g, "const maxUploadSize = 50000 * 1024 * 1024;");
appCode = appCode.replace(/const maxUploadSize = displayUser\?\.role === 'Founder' \? 500 \* 1024 \* 1024 : 90 \* 1024 \* 1024;/g, "const maxUploadSize = 50000 * 1024 * 1024;");

// Fix Alerts
appCode = appCode.replace(/alert\(displayUser\?\.role === 'Founder' \? "File too large\. Max 500MB for Founders" : "File too large\. Max 90MB"\);/g, "alert('File too large. Please keep under 50GB');");
appCode = appCode.replace(/alert\(user\?\.role === 'Founder' \? "File too large\. Max 500MB for Founders" : "File too large\. Max 90MB"\);/g, "alert('File too large. Please keep under 50GB');");

// Fix Search Input UI
appCode = appCode.replace(
    /className="w-full liquid-glass-control rounded-2xl py-4 pl-12 pr-4 font-semibold tracking-\[0\.01em\] outline-none focus:ring-1 focus:ring-white\/30 text-white placeholder:text-white\/50 transition-all duration-300 touch-manipulation"/g,
    'className="w-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl py-4 pl-12 pr-4 font-black tracking-wider outline-none focus:ring-2 focus:ring-[var(--gold-primary)] text-white placeholder:text-white/40 shadow-[0_0_20px_rgba(255,255,255,0.05)] focus:shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all duration-300 touch-manipulation"'
);

fs.writeFileSync(appPath, appCode);
console.log("App.jsx fixed");
