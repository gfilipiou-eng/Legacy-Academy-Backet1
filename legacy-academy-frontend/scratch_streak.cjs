const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace obj?.missionsStreak -> getActiveStreak(obj)
code = code.replace(/([a-zA-Z0-9_]+)\?\.missionsStreak/g, 'getActiveStreak($1)');
// Replace obj.missionsStreak -> getActiveStreak(obj)
code = code.replace(/([a-zA-Z0-9_]+)\.missionsStreak/g, 'getActiveStreak($1)');

const injectCode = `
export const getActiveStreak = (u) => {
    if (!u || !u.missionsStreak || !u.lastMissionCompleted) return 0;
    const diffHours = Math.abs(new Date() - new Date(u.lastMissionCompleted)) / 3600000;
    return diffHours <= 48 ? u.missionsStreak : 0;
};
`;

code = code.replace(/import React.*?;\n/, match => match + injectCode);

// The injected code has 'u.missionsStreak', which might have been replaced by the regex above!
// So let's fix it manually inside the injected function:
code = code.replace(/return diffHours <= 48 \? getActiveStreak\(u\) : 0;/, 'return diffHours <= 48 ? u.missionsStreak : 0;');
code = code.replace(/if \(!u \|\| !getActiveStreak\(u\) \|\| !u\.lastMissionCompleted\) return 0;/, 'if (!u || !u.missionsStreak || !u.lastMissionCompleted) return 0;');

fs.writeFileSync('src/App.jsx', code);
console.log("Done");
