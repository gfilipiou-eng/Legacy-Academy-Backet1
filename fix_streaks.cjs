const fs = require('fs');
let appPath = 'legacy-academy-frontend/src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');

appCode = appCode.replace(/<Icons\.Streak className="inline-block w-\[1\.1em\] h-\[1\.1em\] -mt-1" \/>/g, '<Icons.Streak className="w-[1.2em] h-[1.2em] shrink-0" />');
appCode = appCode.replace(/<span className="text-orange-500 font-bold text-xs shrink-0 flex items-center">/g, '<span className="text-orange-500 font-bold text-xs shrink-0 flex items-center gap-1">');

fs.writeFileSync(appPath, appCode);
console.log("Streaks fixed");
