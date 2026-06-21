const fs = require('fs');

// Read App.jsx
let appCode = fs.readFileSync('src/App.jsx', 'utf8');

// Replace the hardcoded string
appCode = appCode.replace(
    '<div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Come back tomorrow to keep your streak!</div>',
    '<div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{t(\'MISSION_COME_BACK_TOMORROW\')}</div>'
);

// Remove liquid-glass-control from the banner
appCode = appCode.replace(
    'bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 animate-fade-in liquid-glass-control',
    'bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 animate-fade-in'
);

const newCategories = `
    const missionCategories = [
        {
            id: 'gym',
            nameKey: 'CAT_GYM',
            descriptionKey: 'CAT_GYM_DESC',
            icon: '🏋️‍♂️',
            color: 'from-orange-500 to-red-600',
            missions: [
                { id: 'gym_spartan', titleKey: 'MISSION_GYM_SPARTAN', descKey: 'MISSION_GYM_SPARTAN_DESC', icon: '⚔️' },
                { id: 'gym_lift', titleKey: 'MISSION_GYM_LIFT', descKey: 'MISSION_GYM_LIFT_DESC', icon: '🦍' },
                { id: 'gym_cardio', titleKey: 'MISSION_GYM_CARDIO', descKey: 'MISSION_GYM_CARDIO_DESC', icon: '🔥' }
            ]
        },
        {
            id: 'adventure',
            nameKey: 'CAT_ADVENTURE',
            descriptionKey: 'CAT_ADVENTURE_DESC',
            icon: '🗺️',
            color: 'from-emerald-400 to-teal-600',
            missions: [
                { id: 'adv_jungle', titleKey: 'MISSION_ADV_JUNGLE', descKey: 'MISSION_ADV_JUNGLE_DESC', icon: '🌴' },
                { id: 'adv_unknown', titleKey: 'MISSION_ADV_UNKNOWN', descKey: 'MISSION_ADV_UNKNOWN_DESC', icon: '🧭' },
                { id: 'adv_mountain', titleKey: 'MISSION_ADV_MOUNTAIN', descKey: 'MISSION_ADV_MOUNTAIN_DESC', icon: '⛰️' }
            ]
        },
        {
            id: 'survival',
            nameKey: 'CAT_SURVIVAL',
            descriptionKey: 'CAT_SURVIVAL_DESC',
            icon: '🏕️',
            color: 'from-amber-600 to-yellow-500',
            missions: [
                { id: 'surv_fire', titleKey: 'MISSION_SURV_FIRE', descKey: 'MISSION_SURV_FIRE_DESC', icon: '🔥' },
                { id: 'surv_detox', titleKey: 'MISSION_SURV_DETOX', descKey: 'MISSION_SURV_DETOX_DESC', icon: '📵' },
                { id: 'surv_cold', titleKey: 'MISSION_SURV_COLD', descKey: 'MISSION_SURV_COLD_DESC', icon: '🧊' }
            ]
        },
        {
            id: 'mind',
            nameKey: 'CAT_MIND',
            descriptionKey: 'CAT_MIND_DESC',
            icon: '🧠',
            color: 'from-blue-500 to-indigo-600',
            missions: [
                { id: 'mind_strategy', titleKey: 'MISSION_MIND_STRATEGY', descKey: 'MISSION_MIND_STRATEGY_DESC', icon: '♟️' },
                { id: 'mind_read', titleKey: 'MISSION_MIND_READ', descKey: 'MISSION_MIND_READ_DESC', icon: '📜' },
                { id: 'mind_puzzle', titleKey: 'MISSION_MIND_PUZZLE', descKey: 'MISSION_MIND_PUZZLE_DESC', icon: '🧩' }
            ]
        },
        {
            id: 'combat',
            nameKey: 'CAT_COMBAT',
            descriptionKey: 'CAT_COMBAT_DESC',
            icon: '🥋',
            color: 'from-red-600 to-rose-700',
            missions: [
                { id: 'combat_shadow', titleKey: 'MISSION_COMBAT_SHADOW', descKey: 'MISSION_COMBAT_SHADOW_DESC', icon: '🥷' },
                { id: 'combat_tactics', titleKey: 'MISSION_COMBAT_TACTICS', descKey: 'MISSION_COMBAT_TACTICS_DESC', icon: '🎯' },
                { id: 'combat_spar', titleKey: 'MISSION_COMBAT_SPAR', descKey: 'MISSION_COMBAT_SPAR_DESC', icon: '🥊' }
            ]
        }
    ];
`;

appCode = appCode.replace(/const missionCategories = \[\s*\{\s*id: 'health'[\s\S]*?id: 'social'[\s\S]*?\]\s*\}\s*\];/, newCategories.trim());

// If expandedCategory is 'core', change to 'gym'
appCode = appCode.replace("useState('core')", "useState('gym')");

fs.writeFileSync('src/App.jsx', appCode);

// Update en.json
const enFile = 'src/locales/en.json';
let enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

Object.assign(enData, {
    "MISSION_COME_BACK_TOMORROW": "Come back tomorrow to keep your streak!",
    "CAT_GYM": "Gym Quests",
    "CAT_GYM_DESC": "Push your physical limits and build a Spartan physique.",
    "MISSION_GYM_SPARTAN": "Spartan Workout",
    "MISSION_GYM_SPARTAN_DESC": "Complete 300 reps of bodyweight exercises (pushups, pullups, squats).",
    "MISSION_GYM_LIFT": "Beast Mode Lift",
    "MISSION_GYM_LIFT_DESC": "Hit the gym and crush your personal best in any compound lift.",
    "MISSION_GYM_CARDIO": "Cardio Survival",
    "MISSION_GYM_CARDIO_DESC": "Run 5km without stopping, pushing through the mental barriers.",
    
    "CAT_ADVENTURE": "Adventures",
    "CAT_ADVENTURE_DESC": "Explore the unknown, conquer the jungle, and escape the matrix.",
    "MISSION_ADV_JUNGLE": "Jungle Expedition",
    "MISSION_ADV_JUNGLE_DESC": "Go for a hike in nature, navigating through difficult terrain.",
    "MISSION_ADV_UNKNOWN": "Journey to the Unknown",
    "MISSION_ADV_UNKNOWN_DESC": "Travel to a place in your city you have never been before.",
    "MISSION_ADV_MOUNTAIN": "Conquer the Peak",
    "MISSION_ADV_MOUNTAIN_DESC": "Reach the highest elevation point near you and meditate.",

    "CAT_SURVIVAL": "Survival & Instincts",
    "CAT_SURVIVAL_DESC": "Master your primal instincts and survive extreme conditions.",
    "MISSION_SURV_FIRE": "Primal Cooking",
    "MISSION_SURV_FIRE_DESC": "Cook a meal purely from raw ingredients over fire or stove.",
    "MISSION_SURV_DETOX": "Grid Offline",
    "MISSION_SURV_DETOX_DESC": "Survive 12 hours straight without looking at a screen.",
    "MISSION_SURV_COLD": "Ice Immersion",
    "MISSION_SURV_COLD_DESC": "Take a 5-minute freezing cold shower to forge mental toughness.",

    "CAT_MIND": "Mind Operations",
    "CAT_MIND_DESC": "Sharpen your intellect, strategy, and critical thinking.",
    "MISSION_MIND_STRATEGY": "Chess Master",
    "MISSION_MIND_STRATEGY_DESC": "Play and analyze 3 strategic chess games.",
    "MISSION_MIND_READ": "Ancient Knowledge",
    "MISSION_MIND_READ_DESC": "Read 50 pages of a powerful book on strategy or history.",
    "MISSION_MIND_PUZZLE": "Matrix Decoder",
    "MISSION_MIND_PUZZLE_DESC": "Solve a complex logic puzzle or learn a new coding concept.",

    "CAT_COMBAT": "Combat & Tactics",
    "CAT_COMBAT_DESC": "Prepare yourself for battle. Speed, precision, and power.",
    "MISSION_COMBAT_SHADOW": "Shadow Assassin",
    "MISSION_COMBAT_SHADOW_DESC": "Perform 15 minutes of intense shadowboxing.",
    "MISSION_COMBAT_TACTICS": "Sniper Focus",
    "MISSION_COMBAT_TACTICS_DESC": "Practice precision targeting or intense focus drills for 30 mins.",
    "MISSION_COMBAT_SPAR": "Ring General",
    "MISSION_COMBAT_SPAR_DESC": "Spar with a partner or hit the heavy bag for 5 rounds."
});
fs.writeFileSync(enFile, JSON.stringify(enData, null, 2));

// Update el.json
const elFile = 'src/locales/el.json';
let elData = JSON.parse(fs.readFileSync(elFile, 'utf8'));

Object.assign(elData, {
    "MISSION_COME_BACK_TOMORROW": "Επίστρεψε αύριο για να διατηρήσεις το σερί σου!",
    "CAT_GYM": "Επικές Προκλήσεις Γυμναστηρίου",
    "CAT_GYM_DESC": "Ξεπέρασε τα όριά σου και χτίσε σώμα Σπαρτιάτη.",
    "MISSION_GYM_SPARTAN": "Σπαρτιατική Προπόνηση",
    "MISSION_GYM_SPARTAN_DESC": "Ολοκλήρωσε 300 επαναλήψεις (κάμψεις, έλξεις, καθίσματα).",
    "MISSION_GYM_LIFT": "Λειτουργία Κτήνους",
    "MISSION_GYM_LIFT_DESC": "Πήγαινε στο γυμναστήριο και σπάσε το προσωπικό σου ρεκόρ.",
    "MISSION_GYM_CARDIO": "Επιβίωση Αντοχής",
    "MISSION_GYM_CARDIO_DESC": "Τρέξε 5χλμ χωρίς σταματημό, σπάζοντας τα νοητικά σου όρια.",
    
    "CAT_ADVENTURE": "Ταξίδια & Περιπέτεια",
    "CAT_ADVENTURE_DESC": "Εξερεύνησε το άγνωστο, δάμασε τη ζούγκλα και ξέφυγε.",
    "MISSION_ADV_JUNGLE": "Αποστολή στη Ζούγκλα",
    "MISSION_ADV_JUNGLE_DESC": "Κάνε μια εξόρμηση στη φύση, διασχίζοντας δύσβατα μονοπάτια.",
    "MISSION_ADV_UNKNOWN": "Ταξίδι στο Άγνωστο",
    "MISSION_ADV_UNKNOWN_DESC": "Ταξίδεψε σε ένα μέρος της πόλης που δεν έχεις πάει ποτέ ξανά.",
    "MISSION_ADV_MOUNTAIN": "Κατάκτηση της Κορυφής",
    "MISSION_ADV_MOUNTAIN_DESC": "Φτάσε στο ψηλότερο σημείο της περιοχής σου.",

    "CAT_SURVIVAL": "Επιβίωση & Ένστικτο",
    "CAT_SURVIVAL_DESC": "Γίνε κυρίαρχος των ενστίκτων σου σε ακραίες συνθήκες.",
    "MISSION_SURV_FIRE": "Αρχέγονη Μαγειρική",
    "MISSION_SURV_FIRE_DESC": "Μαγείρεψε ένα γεύμα αποκλειστικά από φυσικά υλικά.",
    "MISSION_SURV_DETOX": "Εκτός Δικτύου",
    "MISSION_SURV_DETOX_DESC": "Επιβίωσε 12 ώρες σερί χωρίς να κοιτάξεις καμία οθόνη.",
    "MISSION_SURV_COLD": "Παγωμένη Κόλαση",
    "MISSION_SURV_COLD_DESC": "Κάνε ένα 5λεπτο παγωμένο ντους για νοητική σκληραγώγηση.",

    "CAT_MIND": "Αποστολές Μυαλού",
    "CAT_MIND_DESC": "Ακόνισε τη διάνοια, τη στρατηγική και την κριτική σου σκέψη.",
    "MISSION_MIND_STRATEGY": "Μετρ του Σκακιού",
    "MISSION_MIND_STRATEGY_DESC": "Παίξε και ανέλυσε 3 στρατηγικές παρτίδες σκάκι.",
    "MISSION_MIND_READ": "Αρχαία Γνώση",
    "MISSION_MIND_READ_DESC": "Διάβασε 50 σελίδες από ένα ισχυρό βιβλίο στρατηγικής.",
    "MISSION_MIND_PUZZLE": "Αποκωδικοποίηση",
    "MISSION_MIND_PUZZLE_DESC": "Λύσε έναν περίπλοκο γρίφο ή μάθε μια νέα έννοια κώδικα.",

    "CAT_COMBAT": "Μάχη & Τακτική",
    "CAT_COMBAT_DESC": "Προετοιμάσου για μάχη. Ταχύτητα, ακρίβεια και δύναμη.",
    "MISSION_COMBAT_SHADOW": "Σκιώδης Δολοφόνος",
    "MISSION_COMBAT_SHADOW_DESC": "Κάνε 15 λεπτά έντονης σκιαμαχίας (shadowboxing).",
    "MISSION_COMBAT_TACTICS": "Συγκέντρωση Ελεύθερου Σκοπευτή",
    "MISSION_COMBAT_TACTICS_DESC": "Κάνε ασκήσεις απόλυτης συγκέντρωσης και ακρίβειας για 30 λεπτά.",
    "MISSION_COMBAT_SPAR": "Στρατηγός του Ρινγκ",
    "MISSION_COMBAT_SPAR_DESC": "Κάνε sparring ή χτύπα τον σάκο με δύναμη για 5 γύρους."
});
fs.writeFileSync(elFile, JSON.stringify(elData, null, 2));

console.log("Missions Gamified!");
