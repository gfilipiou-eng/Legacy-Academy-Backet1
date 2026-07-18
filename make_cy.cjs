const fs = require('fs');
const path = require('path');

const elPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'el.json');
const cyPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'cy.json');

const elData = JSON.parse(fs.readFileSync(elPath, 'utf8'));
const cyData = {};

const replacements = [
    { from: 'Αρχική', to: 'Αρκική' },
    { from: 'Αναζήτηση', to: 'Γύρεμαν' },
    { from: 'Ειδοποιήσεις', to: 'Χαπάρκα' },
    { from: 'Ρυθμίσεις', to: 'Σάσιασμαν' },
    { from: 'ΑΠΟΣΥΝΔΕΣΗ', to: 'ΦΕΥΚΩ' },
    { from: 'ΕΙΣΟΔΟΣ', to: 'ΕΜΠΑ' },
    { from: 'ΕΓΓΡΑΦΗ', to: 'ΓΡΑΨΟΥ' },
    { from: 'ΕΠΕΞΕΡΓΑΣΙΑ', to: 'ΑΛΛΑΞΤΟ' },
    { from: 'Επεξεργασία', to: "Άλλαξ'το" },
    { from: 'ΔΙΑΓΡΑΦΗ ΟΛΩΝ', to: 'ΣΒΗΣΤΑ ΟΥΛΛΑ' },
    { from: 'ΔΙΑΓΡΑΦΗ ΛΟΓΑΡΙΑΣΜΟΥ', to: 'ΣΒΗΣΙΜΟ ΛΟΓΑΡΙΑΣΜΟΥ' },
    { from: 'ΔΙΑΓΡΑΦΗ', to: 'ΣΒΗΣΤΟ' },
    { from: 'Διαγραφή', to: 'Σβήστο' },
    { from: 'ΑΚΥΡΩΣΗ', to: 'ΑΚΥΡΟΝ' },
    { from: 'Ακύρωση', to: 'Άκυρον' },
    { from: 'ΑΠΟΘΗΚΕΥΣΗ', to: 'ΣΩΣΤΟ' },
    { from: 'Αποθήκευση', to: 'Σώστο' },
    { from: 'Όχι', to: 'Όι' },
    { from: 'Τώρα', to: 'Τωρά' },
    { from: 'ΤΩΡΑ', to: 'ΤΩΡΑ' },
    { from: 'Κοινοποίηση', to: 'Μοίρασμα' },
    { from: 'Μου αρέσει', to: 'Αρέσκει μου' },
    { from: 'Τι σκέφτεστε;', to: 'Ίνταμπου σκέφτεσαι;' },
    { from: 'ΚΑΜΙΑ ΕΙΔΟΠΟΙΗΣΗ', to: 'ΚΑΝΕΝΑ ΧΑΠΑΡΙ' },
    { from: 'ΕΠΙΣΤΡΟΦΗ', to: 'ΠΙΣΩ' },
    { from: 'Μηνύματα', to: 'Κουβέντες' },
    { from: 'Ψίθυροι', to: 'Κουβέντες' },
    { from: 'Φίλοι', to: 'Παρέα' },
    { from: 'ΔΗΜΟΣΙΕΥΣΕΙΣ', to: 'ΠΟΣΤΑΡΙΣΜΑΤΑ' },
    { from: 'Προσθήκη', to: 'Βάλε' },
    { from: 'ΠΡΟΣΘΗΚΗ', to: 'ΒΑΛΕ' },
    { from: 'ΑΚΟΛΟΥΘΗΣΤΕ', to: 'ΑΚΟΛΟΥΘΑ' },
    { from: 'ΞΕΧΑΣΑΤΕ ΤΟΝ ΚΩΔΙΚΟ;', to: 'ΕΞΙΧΑΣΕΣ ΤΟ ΠΑΣΓΟΥΟΡΤ;' },
    { from: 'ΔΗΜΙΟΥΡΓΙΑ', to: 'ΦΚΙΑΞΙΜΟ' },
    { from: 'Σχόλια', to: 'Σχόλια' },
    { from: 'Νέο', to: 'Καίνουργιο' },
    { from: 'ΝΕΟ', to: 'ΚΑΙΝΟΥΡΓΙΟ' }
];

for (const [key, value] of Object.entries(elData)) {
    let cyValue = value;
    if (typeof cyValue === 'string') {
        for (const { from, to } of replacements) {
            // Replace exact matches or words if they are standalone in the value.
            // A simple global replace without regex boundaries works for most of these strings.
            cyValue = cyValue.split(from).join(to);
        }
        
        // Exact manual overrides for tricky cases or specific keys
        if (key === 'FOLLOWERS') cyValue = 'Ακόλουθοι';
        if (key === 'FOLLOWING') cyValue = 'Ακολουθάς';
        if (key === 'WHATS_ON_YOUR_MIND') cyValue = 'Ίνταμπου σκέφτεσαι;';
        if (key === 'SEARCH_PLACEHOLDER') cyValue = 'Γύρεμαν...';
        if (key === 'POST_BTN') cyValue = 'Πόσταρε';
        if (key === 'FREE_AGENT') cyValue = 'Ελεύθερος Παίχτης';
        if (key === 'FORMULA_1') cyValue = 'Φόρμουλα 1';
        if (key === 'FAVORITE_PLAYER') cyValue = 'Αγαπημένος Παίχτης';
        if (key === 'UPDATE_IDENTITY') cyValue = 'ΑΛΛΑΞΕ ΤΟ ΠΡΟΦΙΛ';
    }
    cyData[key] = cyValue;
}

fs.writeFileSync(cyPath, JSON.stringify(cyData, null, 2));
console.log('Cypriot translation generated successfully with simple split/join!');
