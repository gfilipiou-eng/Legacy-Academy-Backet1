const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(file, 'utf8');

// Inside handleCompleteMission, after onUpdateUser, recalculate top streak
content = content.replace(
    /if \(onUpdateUser\) onUpdateUser\(updatedUser\);/g,
    `if (onUpdateUser) onUpdateUser(updatedUser);
            // Recalculate top streak immediately
            setUsers(prev => {
                const list = prev || [];
                const mergedList = list.map(u => u._id === updatedUser._id ? {...u, ...updatedUser} : u);
                window.topStreakValue = Math.max(0, ...mergedList.filter(u => !u.isPrivate).map(u => getActiveStreak(u)));
                return mergedList;
            });`
);

fs.writeFileSync(file, content);
console.log("App.jsx patched successfully for daily missions reactivity.");
