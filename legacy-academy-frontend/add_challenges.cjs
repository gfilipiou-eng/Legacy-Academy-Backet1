const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

const newCategory = `
        },
        {
            id: 'challenges',
            nameKey: 'CAT_CHALLENGES',
            descriptionKey: 'CAT_CHALLENGES_DESC',
            icon: '🏆',
            color: 'from-purple-600 to-fuchsia-600',
            missions: [
                { id: 'chal_fast', titleKey: 'MISSION_CHAL_FAST', descKey: 'MISSION_CHAL_FAST_DESC', icon: '⏳' },
                { id: 'chal_monk', titleKey: 'MISSION_CHAL_MONK', descKey: 'MISSION_CHAL_MONK_DESC', icon: '🧘' },
                { id: 'chal_marathon', titleKey: 'MISSION_CHAL_MARATHON', descKey: 'MISSION_CHAL_MARATHON_DESC', icon: '🏅' }
            ]
        }
    ];`;

appCode = appCode.replace(/\n        \}\n    \];/, newCategory);
fs.writeFileSync('src/App.jsx', appCode);

const enFile = 'src/locales/en.json';
let enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
Object.assign(enData, {
    'CAT_CHALLENGES': 'Epic Challenges',
    'CAT_CHALLENGES_DESC': 'Ultimate tests of endurance, discipline, and willpower.',
    'MISSION_CHAL_FAST': '48-Hour Fast',
    'MISSION_CHAL_FAST_DESC': 'Consume zero calories for 48 hours to reset your biology.',
    'MISSION_CHAL_MONK': 'Monk Mode',
    'MISSION_CHAL_MONK_DESC': '7 days of pure discipline: no alcohol, no junk food, intense focus.',
    'MISSION_CHAL_MARATHON': 'Iron Will Marathon',
    'MISSION_CHAL_MARATHON_DESC': 'Run or fast-walk a half-marathon (21km) in a single day.'
});
fs.writeFileSync(enFile, JSON.stringify(enData, null, 2));

const elFile = 'src/locales/el.json';
let elData = JSON.parse(fs.readFileSync(elFile, 'utf8'));
Object.assign(elData, {
    'CAT_CHALLENGES': 'Επικές Προκλήσεις',
    'CAT_CHALLENGES_DESC': 'Οι απόλυτες δοκιμασίες αντοχής, πειθαρχίας και θέλησης.',
    'MISSION_CHAL_FAST': 'Νηστεία 48 Ωρών',
    'MISSION_CHAL_FAST_DESC': 'Μηδέν θερμίδες για 48 ώρες για βιολογική επανεκκίνηση.',
    'MISSION_CHAL_MONK': 'Monk Mode (Μοναχός)',
    'MISSION_CHAL_MONK_DESC': '7 μέρες απόλυτης πειθαρχίας: καθόλου αλκοόλ, junk food, απόλυτη εστίαση.',
    'MISSION_CHAL_MARATHON': 'Μαραθώνιος Θέλησης',
    'MISSION_CHAL_MARATHON_DESC': 'Τρέξε ή περπάτησε γρήγορα έναν Ημιμαραθώνιο (21χλμ) σε μία μέρα.'
});
fs.writeFileSync(elFile, JSON.stringify(elData, null, 2));
console.log("Challenges added!");
