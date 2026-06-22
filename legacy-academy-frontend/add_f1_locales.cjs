const fs = require('fs');

const localesDir = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/locales';
const files = fs.readdirSync(localesDir);

const translations = {
    'F1_FERRARI_MODE': {
        'el.json': 'F1 Scuderia',
        'en.json': 'F1 Scuderia',
        'de.json': 'F1 Scuderia',
        'fr.json': 'F1 Scuderia',
        'es.json': 'F1 Scuderia',
        'ru.json': 'F1 Scuderia',
        'tr.json': 'F1 Scuderia',
        'cy.json': 'F1 Scuderia'
    },
    'F1_MERCEDES_MODE': {
        'el.json': 'F1 Silver Arrow',
        'en.json': 'F1 Silver Arrow',
        'de.json': 'F1 Silver Arrow',
        'fr.json': 'F1 Silver Arrow',
        'es.json': 'F1 Silver Arrow',
        'ru.json': 'F1 Silver Arrow',
        'tr.json': 'F1 Silver Arrow',
        'cy.json': 'F1 Silver Arrow'
    },
    'F1_MCLAREN_MODE': {
        'el.json': 'F1 Papaya',
        'en.json': 'F1 Papaya',
        'de.json': 'F1 Papaya',
        'fr.json': 'F1 Papaya',
        'es.json': 'F1 Papaya',
        'ru.json': 'F1 Papaya',
        'tr.json': 'F1 Papaya',
        'cy.json': 'F1 Papaya'
    },
    'F1_REDBULL_MODE': {
        'el.json': 'F1 Bull',
        'en.json': 'F1 Bull',
        'de.json': 'F1 Bull',
        'fr.json': 'F1 Bull',
        'es.json': 'F1 Bull',
        'ru.json': 'F1 Bull',
        'tr.json': 'F1 Bull',
        'cy.json': 'F1 Bull'
    },
    'F1_ASTON_MODE': {
        'el.json': 'F1 Green',
        'en.json': 'F1 Green',
        'de.json': 'F1 Green',
        'fr.json': 'F1 Green',
        'es.json': 'F1 Green',
        'ru.json': 'F1 Green',
        'tr.json': 'F1 Green',
        'cy.json': 'F1 Green'
    }
};

for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const p = `${localesDir}/${file}`;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const key of Object.keys(translations)) {
        data[key] = translations[key][file] || translations[key]['en.json'];
    }
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}
console.log('Locales updated for F1 modes.');
