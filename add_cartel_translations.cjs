const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'en.json');
let enContent = fs.readFileSync(enPath, 'utf8');
let enObj = JSON.parse(enContent);
enObj.CARTELS_UPLOAD_IMG = "Upload Image";
enObj.CARTELS_DELETE = "Delete";
fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2));

const elPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'el.json');
let elContent = fs.readFileSync(elPath, 'utf8');
let elObj = JSON.parse(elContent);
elObj.CARTELS_UPLOAD_IMG = "Ανέβασμα Εικόνας";
elObj.CARTELS_DELETE = "Διαγραφή";
fs.writeFileSync(elPath, JSON.stringify(elObj, null, 2));

console.log('Translations added');
