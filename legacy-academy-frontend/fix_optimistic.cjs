const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

const targetStr = `            if (key === 'is18PlusProfile') payload = { settings: { is18PlusProfile: Boolean(val) } };
            if (key === 'showProfileShareButton') {`;

const newStr = `            if (key === 'is18PlusProfile') payload = { settings: { is18PlusProfile: Boolean(val) } };
            
            // OPTIMISTIC UPDATE FOR ALL SETTINGS
            if (payload && payload.settings) {
                const baseUserForOptimistic = latestUserRef.current || user || {};
                onUpdateUser?.({
                    ...baseUserForOptimistic,
                    settings: {
                        ...(baseUserForOptimistic?.settings || {}),
                        ...(payload.settings || {})
                    }
                });
            }

            if (key === 'showProfileShareButton') {`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/App.jsx', code);
console.log('Added universal optimistic UI update for settings');
