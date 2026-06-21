const fs = require('fs');
const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /\{ id: 'metal-blue', label: 'Metal Blue', color: '#0083B0' \}/g,
    `{ id: 'metal-blue', label: t('BADGE_METAL_BLUE', 'Metal Blue'), color: '#0083B0' }`
);

fs.writeFileSync(path, code, 'utf8');

// Update locales
const localesDir = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/locales';
const files = fs.readdirSync(localesDir);

const translations = {
    'el.json': 'Μεταλλικό Μπλε',
    'en.json': 'Metal Blue',
    'de.json': 'Metallblau',
    'fr.json': 'Bleu Métal',
    'es.json': 'Azul Metálico',
    'ru.json': 'Металлический Синий',
    'tr.json': 'Metalik Mavi',
    'cy.json': 'Metal Blue' // Welsh/fallback
};

for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const p = `${localesDir}/${file}`;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    data['BADGE_METAL_BLUE'] = translations[file] || 'Metal Blue';
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}
console.log('App.jsx and Locales updated.');
