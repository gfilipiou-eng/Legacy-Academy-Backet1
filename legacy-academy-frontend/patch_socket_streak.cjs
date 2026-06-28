const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Update onUserUpdated to recalculate topStreakValue
code = code.replace(
    /const onUserUpdated = \(data\) => \{([\s\S]*?)handleUpdateUser\(data\);/g,
    `const onUserUpdated = (data) => {$1handleUpdateUser(data);
            
            // Recalculate top streak immediately for socket updates
            setUsers(prev => {
                const list = prev || [];
                const mergedList = list.map(u => safeId(u) === data._id ? {...u, ...data} : u);
                window.topStreakValue = Math.max(0, ...mergedList.filter(u => !u.isPrivate).map(u => getActiveStreak(u)));
                return mergedList;
            });`
);

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx patched for socket streak sync.');
