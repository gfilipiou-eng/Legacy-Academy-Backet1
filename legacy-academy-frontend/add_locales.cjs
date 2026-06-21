const fs = require('fs');

const enPath = 'src/locales/en.json';
const elPath = 'src/locales/el.json';

let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let el = JSON.parse(fs.readFileSync(elPath, 'utf8'));

Object.assign(en, {
    "CAT_CHALLENGES": "Epic Challenges",
    "CAT_CHALLENGES_DESC": "Special challenges to test your limits and claim the top spot.",
    "MISSION_CHAL_FAST": "Speed Run",
    "MISSION_CHAL_FAST_DESC": "Complete a task you've been procrastinating in under 10 minutes.",
    "MISSION_CHAL_LIMIT": "Push the Limits",
    "MISSION_CHAL_LIMIT_DESC": "Go beyond your physical or mental limits today. Do 10% more than yesterday.",
    "MISSION_CHAL_DARE": "Dare to Fail",
    "MISSION_CHAL_DARE_DESC": "Attempt something you are afraid of failing at. Failure is just a stepping stone.",
    "MISSION_ADV_TRAVEL": "Pack Your Bags",
    "MISSION_ADV_TRAVEL_DESC": "Plan your next weekend getaway. Pick a destination and set a date.",
    "MISSION_ADV_EXPLORE": "Explore the Unknown",
    "MISSION_ADV_EXPLORE_DESC": "Visit a city, town, or neighborhood you've never been to before."
});

Object.assign(el, {
    "CAT_CHALLENGES": "Επικές Προκλήσεις",
    "CAT_CHALLENGES_DESC": "Ειδικές δοκιμασίες για να ξεπεράσεις τα όριά σου και να κατακτήσεις την κορυφή.",
    "MISSION_CHAL_FAST": "Γρήγορη Εκτέλεση",
    "MISSION_CHAL_FAST_DESC": "Ολοκλήρωσε σε κάτω από 10 λεπτά μια δουλειά που αναβάλλεις συνεχώς.",
    "MISSION_CHAL_LIMIT": "Ξεπέρασε τα Όρια",
    "MISSION_CHAL_LIMIT_DESC": "Πήγαινε πέρα από τα φυσικά ή νοητικά σου όρια σήμερα. Κάνε 10% περισσότερο από χθες.",
    "MISSION_CHAL_DARE": "Τόλμησε την Αποτυχία",
    "MISSION_CHAL_DARE_DESC": "Δοκίμασε κάτι που φοβάσαι μήπως αποτύχεις. Η αποτυχία είναι απλά ένα σκαλοπάτι.",
    "MISSION_ADV_TRAVEL": "Ετοίμασε Βαλίτσες",
    "MISSION_ADV_TRAVEL_DESC": "Σχεδίασε την επόμενη απόδραση του Σαββατοκύριακου. Επίλεξε προορισμό και ημερομηνία.",
    "MISSION_ADV_EXPLORE": "Εξερεύνησε το Άγνωστο",
    "MISSION_ADV_EXPLORE_DESC": "Επισκέψου μια πόλη, χωριό ή γειτονιά που δεν έχεις πάει ποτέ ξανά."
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 4));
fs.writeFileSync(elPath, JSON.stringify(el, null, 4));

console.log('Locales updated!');
