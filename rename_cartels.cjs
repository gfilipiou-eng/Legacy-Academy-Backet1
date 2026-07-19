const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace(
    "label: t('CARTELS', 'Cartels / Mafia')",
    "label: t('CARTELS', 'Cartels')"
);
fs.writeFileSync(appPath, appContent);

const enPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'en.json');
let enContent = fs.readFileSync(enPath, 'utf8');
let enObj = JSON.parse(enContent);
enObj.CARTELS = "Cartels";
fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2));

const elPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'el.json');
let elContent = fs.readFileSync(elPath, 'utf8');
let elObj = JSON.parse(elContent);
elObj.CARTELS = "Cartels";
fs.writeFileSync(elPath, JSON.stringify(elObj, null, 2));

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');
cartelsContent = cartelsContent.replace("Mafia Cartels", "Cartels");
fs.writeFileSync(cartelsPath, cartelsContent);

console.log("Renamed to Cartels");
