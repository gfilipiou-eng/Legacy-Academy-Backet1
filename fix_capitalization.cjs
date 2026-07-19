const fs = require('fs');
const path = require('path');

const elPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'el.json');
let elContent = fs.readFileSync(elPath, 'utf8');
let elObj = JSON.parse(elContent);

elObj.CARTELS = "Cartels / Mafia";
elObj.CARTELS_EXPLORE_TITLE = "Όλα τα Cartel";
elObj.CARTELS_SEARCH_PH = "Αναζήτηση Cartel...";
elObj.CARTELS_NO_FOUND = "Δεν βρέθηκαν Cartel";
elObj.CARTELS_MEMBERS = "Μέλη";
elObj.CARTELS_ESTABLISH = "Ίδρυση Cartel";
elObj.CARTELS_NAME = "Όνομα Cartel";
elObj.CARTELS_DESC = "Περιγραφή";
elObj.CARTELS_IMAGE = "Εικόνα URL (Προαιρετικό)";
elObj.CARTELS_JOIN = "Είσοδος";
elObj.CARTELS_LEAVE = "Έξοδος";
elObj.CARTELS_UPLOAD_INTEL = "Ανέβασε Υλικό";
elObj.CARTELS_SECURE_CHANNEL = "Κρυπτογραφημένο Κανάλι";
elObj.CARTELS_JOIN_TO_VIEW = "Μπες στο Cartel για να δεις υλικό";
elObj.CARTELS_NO_INTEL = "Δεν υπάρχει ακόμη υλικό.";
elObj.CARTELS_FOUNDING = "Ίδρυση...";

fs.writeFileSync(elPath, JSON.stringify(elObj, null, 2));

const enPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'en.json');
let enContent = fs.readFileSync(enPath, 'utf8');
let enObj = JSON.parse(enContent);
enObj.CARTELS = "Cartels / Mafia";
fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2));

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace(
    "{ id: 'cartels', icon: Icons.Users, label: t('CARTELS') || 'Cartels / Mafia' }",
    "{ id: 'cartels', icon: Icons.Users, label: t('CARTELS', 'Cartels / Mafia') }"
);
fs.writeFileSync(appPath, appContent);

console.log('Fixed capitalization in translations');
