const fs = require('fs');

const localesDir = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/locales';
const files = fs.readdirSync(localesDir);

const translations = {
    'ENABLE_GLOW': {
        'el.json': 'Ενεργοποίηση Φωτισμού',
        'en.json': 'Enable Glow',
        'de.json': 'Leuchten aktivieren',
        'fr.json': 'Activer la lueur',
        'es.json': 'Activar resplandor',
        'ru.json': 'Включить свечение',
        'tr.json': 'Parlama Etkin',
        'cy.json': 'Enable Glow'
    },
    'GLOW_EFFECT_DESC': {
        'el.json': 'Προσθέτει εφέ λάμψης στα χρώματα του θέματος (καταναλώνει περισσότερη μπαταρία)',
        'en.json': 'Adds a glow effect to theme colors (uses more battery)',
        'de.json': 'Fügt Themenfarben einen Leuchteffekt hinzu',
        'fr.json': 'Ajoute un effet de lueur aux couleurs',
        'es.json': 'Añade un efecto de resplandor',
        'ru.json': 'Добавляет эффект свечения к цветам темы',
        'tr.json': 'Tema renklerine parlama efekti ekler',
        'cy.json': 'Adds a glow effect to theme colors'
    },
    'LIQUID_GLASS_INTENSITY': {
        'el.json': 'Ένταση Liquid Glass',
        'en.json': 'Liquid Glass Intensity',
        'de.json': 'Liquid Glass Intensität',
        'fr.json': 'Intensité Liquid Glass',
        'es.json': 'Intensidad Liquid Glass',
        'ru.json': 'Интенсивность Liquid Glass',
        'tr.json': 'Liquid Glass Yoğunluğu',
        'cy.json': 'Liquid Glass Intensity'
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
console.log('Locales updated for glow and liquid glass.');
