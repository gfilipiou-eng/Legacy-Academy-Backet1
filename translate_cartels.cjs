const fs = require('fs');
const path = require('path');

const elPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'el.json');
let elContent = fs.readFileSync(elPath, 'utf8');

const translations = {
  "CARTELS": "ΚΑΡΤΕΛ / MAFIA",
  "CARTELS_EXPLORE_TITLE": "ΟΛΑ ΤΑ ΚΑΡΤΕΛ",
  "CARTELS_SEARCH_PH": "Αναζήτηση Καρτέλ...",
  "CARTELS_NO_FOUND": "Δεν βρέθηκαν Καρτέλ",
  "CARTELS_MEMBERS": "Μέλη",
  "CARTELS_ESTABLISH": "ΙΔΡΥΣΗ ΚΑΡΤΕΛ",
  "CARTELS_NAME": "Ονομα Καρτελ",
  "CARTELS_DESC": "Περιγραφη",
  "CARTELS_IMAGE": "Εικονα URL (Προαιρετικο)",
  "CARTELS_JOIN": "ΕΙΣΟΔΟΣ",
  "CARTELS_LEAVE": "ΕΞΟΔΟΣ",
  "CARTELS_UPLOAD_INTEL": "ΑΝΕΒΑΣΕ ΥΛΙΚΟ",
  "CARTELS_SECURE_CHANNEL": "Κρυπτογραφημενο Καναλι",
  "CARTELS_JOIN_TO_VIEW": "Μπες στο Καρτελ για να δεις υλικο",
  "CARTELS_NO_INTEL": "Δεν υπαρχει ακομη υλικο.",
  "CARTELS_FOUNDING": "Ιδρυση..."
};

let elObj = JSON.parse(elContent);
Object.assign(elObj, translations);
fs.writeFileSync(elPath, JSON.stringify(elObj, null, 2));
console.log('Added translations to el.json');

// Update Cartels.jsx
const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');
cartelsContent = cartelsContent.replace(/"Search Cartels\.\.\."/g, "{t('CARTELS_SEARCH_PH', 'Search Cartels...')}");
cartelsContent = cartelsContent.replace(/>No cartels found</g, ">{t('CARTELS_NO_FOUND', 'No cartels found')}<");
cartelsContent = cartelsContent.replace(/{cartel.members\?.length \|\| 0} Members/g, "{cartel.members?.length || 0} {t('CARTELS_MEMBERS', 'Members')}");
cartelsContent = cartelsContent.replace(/>Found Cartel</g, ">{t('CARTELS_ESTABLISH', 'Establish Cartel')}<");
cartelsContent = cartelsContent.replace(/>Cartel Name</g, ">{t('CARTELS_NAME', 'Cartel Name')}<");
cartelsContent = cartelsContent.replace(/>Description</g, ">{t('CARTELS_DESC', 'Description')}<");
cartelsContent = cartelsContent.replace(/>Image URL \(Optional\)</g, ">{t('CARTELS_IMAGE', 'Image URL (Optional)')}<");
cartelsContent = cartelsContent.replace(/{loading \? 'Creating\.\.\.' : 'Establish Cartel'}/g, "{loading ? t('CARTELS_FOUNDING', 'Founding...') : t('CARTELS_ESTABLISH', 'Establish Cartel')}");
// ensure t is extracted in CreateCartelModal
cartelsContent = cartelsContent.replace(
    "const CreateCartelModal = ({ onClose, onCreated }) => {",
    "const CreateCartelModal = ({ onClose, onCreated, t }) => {"
);
cartelsContent = cartelsContent.replace(
    "<CreateCartelModal onClose={() => setIsCreateOpen(false)} onCreated={(c) => { setCartels([c, ...cartels]); setIsCreateOpen(false); }} />",
    "<CreateCartelModal t={t} onClose={() => setIsCreateOpen(false)} onCreated={(c) => { setCartels([c, ...cartels]); setIsCreateOpen(false); }} />"
);
fs.writeFileSync(cartelsPath, cartelsContent);
console.log('Updated Cartels.jsx translations');

// Update CartelView.jsx
const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cartelViewContent = fs.readFileSync(cartelViewPath, 'utf8');
cartelViewContent = cartelViewContent.replace(/{memberCount} Members/g, "{memberCount} {t('CARTELS_MEMBERS', 'Members')}");
cartelViewContent = cartelViewContent.replace(/{isMember \? 'Leave' : 'Join'}/g, "{isMember ? t('CARTELS_LEAVE', 'Leave') : t('CARTELS_JOIN', 'Join')}");
cartelViewContent = cartelViewContent.replace(/>UPLOAD INTEL</g, ">{t('CARTELS_UPLOAD_INTEL', 'UPLOAD INTEL')}<");
cartelViewContent = cartelViewContent.replace(/>Secure Encrypted Channel</g, ">{t('CARTELS_SECURE_CHANNEL', 'Secure Encrypted Channel')}<");
cartelViewContent = cartelViewContent.replace(/>Join cartel to view and post intel</g, ">{t('CARTELS_JOIN_TO_VIEW', 'Join cartel to view and post intel')}<");
cartelViewContent = cartelViewContent.replace(/>No intel posted yet\.</g, ">{t('CARTELS_NO_INTEL', 'No intel posted yet.')}<");
fs.writeFileSync(cartelViewPath, cartelViewContent);
console.log('Updated CartelView.jsx translations');
