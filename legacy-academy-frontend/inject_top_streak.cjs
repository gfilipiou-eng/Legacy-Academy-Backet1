const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

// Inject isTopStreak helper right after getActiveStreak
const isTopStreakCode = `
export const isTopStreak = (u) => {
    if (!u || u.isPrivate || !window.topStreakValue) return false;
    const streak = getActiveStreak(u);
    return streak > 0 && streak === window.topStreakValue;
};
`;
appCode = appCode.replace(/(export const getActiveStreak = .*?};\n)/s, `$1${isTopStreakCode}`);

// Inject the global topStreakValue calculation inside App component's useEffect
// Let's find `const App = () => {` and insert a useEffect or just attach it to the `setUsers` call?
// In App.jsx, `users` is updated when fetching users. Let's just find `setUsers(res.data);`
appCode = appCode.replace(/setUsers\(res\.data\);/g, `setUsers(res.data);
                window.topStreakValue = Math.max(0, ...res.data.filter(u => !u.isPrivate).map(u => getActiveStreak(u)));`);

// Regex to find the fire streak rendering and append the Top badge.
// It looks like: 🔥{getActiveStreak(author)}</span>
// Or 🔥 {getActiveStreak(displayUser)}</span>
// Some have spaces, some don't.
appCode = appCode.replace(/(🔥\s*\{getActiveStreak\([^)]+\)\})(<\/span>)/g, (match, prefix, suffix) => {
    // extract the variable name
    const matchVar = prefix.match(/getActiveStreak\(([^)]+)\)/);
    if (!matchVar) return match;
    const varName = matchVar[1];
    return `${prefix}{isTopStreak(${varName}) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}${suffix}`;
});

// For lines that don't have </span> but just 🔥 {getActiveStreak(user)} {t('MISSION_STREAK')}
appCode = appCode.replace(/(🔥\s*\{getActiveStreak\([^)]+\)\})(\s*\{t\('MISSION_STREAK'\)\})/g, (match, prefix, suffix) => {
    const matchVar = prefix.match(/getActiveStreak\(([^)]+)\)/);
    if (!matchVar) return match;
    const varName = matchVar[1];
    return `${prefix}{isTopStreak(${varName}) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}${suffix}`;
});

fs.writeFileSync('src/App.jsx', appCode);
console.log("Top streak logic injected!");
