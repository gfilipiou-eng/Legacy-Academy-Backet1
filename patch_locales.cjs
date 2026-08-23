const fs = require('fs');
const path = require('path');

const localesDir = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/locales';

const translations = {
    'el.json': {
        LIQUID_GLASS: "Ένταση Liquid Glass",
        LIQUID_GLASS_INTENSITY: "Ένταση Liquid Glass",
        LIQUID_GLASS_DESC: "Προσαρμόστε την ένταση του εφέ θολώματος και γυαλιού σε όλες τις κάρτες και τα πάνελ."
    },
    'cy.json': {
        LIQUID_GLASS: "Ένταση Liquid Glass",
        LIQUID_GLASS_INTENSITY: "Ένταση Liquid Glass",
        LIQUID_GLASS_DESC: "Προσαρμόστε την ένταση του εφέ θολώματος και γυαλιού σε όλες τις κάρτες και τα πάνελ."
    },
    'en.json': {
        LIQUID_GLASS: "Liquid Glass Intensity",
        LIQUID_GLASS_INTENSITY: "Liquid Glass Intensity",
        LIQUID_GLASS_DESC: "Adjust the blur and glass effect strength on all cards and panels."
    },
    'de.json': {
        LIQUID_GLASS: "Liquid Glass Intensitat",
        LIQUID_GLASS_INTENSITY: "Liquid Glass Intensitat",
        LIQUID_GLASS_DESC: "Passen Sie die Starke des Unscharfe- und Glaseffekts auf Karten und Panels an."
    },
    'es.json': {
        LIQUID_GLASS: "Intensidad Liquid Glass",
        LIQUID_GLASS_INTENSITY: "Intensidad Liquid Glass",
        LIQUID_GLASS_DESC: "Ajusta la intensidad del efecto de desenfoque y cristal en tarjetas y paneles."
    },
    'fr.json': {
        LIQUID_GLASS: "Intensite Liquid Glass",
        LIQUID_GLASS_INTENSITY: "Intensite Liquid Glass",
        LIQUID_GLASS_DESC: "Ajustez l'intensite de l'effet de flou et de verre sur les cartes et panneaux."
    },
    'ro.json': {
        LIQUID_GLASS: "Intensitatea sticlei lichide",
        LIQUID_GLASS_INTENSITY: "Intensitatea sticlei lichide",
        LIQUID_GLASS_DESC: "Ajusta?i intensitatea efectului de estompare ?i sticla pe carduri ?i panouri."
    },
    'ru.json': {
        LIQUID_GLASS: "????????????? Liquid Glass",
        LIQUID_GLASS_INTENSITY: "????????????? Liquid Glass",
        LIQUID_GLASS_DESC: "????????? ???? ???????? ? ??????? ?????? ?? ????????? ? ???????."
    },
    'tr.json': {
        LIQUID_GLASS: "Liquid Glass Yogunlugu",
        LIQUID_GLASS_INTENSITY: "Liquid Glass Yogunlugu",
        LIQUID_GLASS_DESC: "Kartlardaki ve panellerdeki bulan?kl?k ve cam efektinin yogunlugunu ayarlay?n."
    }
};

for (const [filename, keys] of Object.entries(translations)) {
    const filePath = path.join(localesDir, filename);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        Object.assign(data, keys);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Updated ${filename}`);
    }
}
