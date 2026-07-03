const fs = require('fs');

const localesDir = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/locales';
const files = fs.readdirSync(localesDir);

const translations = {
    'el.json': {
        BUBBLES: 'Φούσκες Σκέψεων',
        BUBBLES_PLACEHOLDER: 'Τι σκέφτεσαι;',
        BUBBLES_BLOWING: 'Δημιουργία...',
        BUBBLES_BLOW_BTN: 'Φύσα τη Φούσκα 🫧'
    },
    'en.json': {
        BUBBLES: 'Thought Bubbles',
        BUBBLES_PLACEHOLDER: "What's in your bubble?",
        BUBBLES_BLOWING: 'Blowing...',
        BUBBLES_BLOW_BTN: 'Blow Bubble 🫧'
    },
    'de.json': {
        BUBBLES: 'Gedankenblasen',
        BUBBLES_PLACEHOLDER: 'Was ist in deiner Blase?',
        BUBBLES_BLOWING: 'Pusten...',
        BUBBLES_BLOW_BTN: 'Blase pusten 🫧'
    },
    'fr.json': {
        BUBBLES: 'Bulles de Pensée',
        BUBBLES_PLACEHOLDER: 'Qu\'y a-t-il dans ta bulle ?',
        BUBBLES_BLOWING: 'Souffle...',
        BUBBLES_BLOW_BTN: 'Souffler la Bulle 🫧'
    },
    'es.json': {
        BUBBLES: 'Burbujas de Pensamiento',
        BUBBLES_PLACEHOLDER: '¿Qué hay en tu burbuja?',
        BUBBLES_BLOWING: 'Soplando...',
        BUBBLES_BLOW_BTN: 'Soplar Burbuja 🫧'
    },
    'ru.json': {
        BUBBLES: 'Пузыри Мыслей',
        BUBBLES_PLACEHOLDER: 'Что в твоем пузыре?',
        BUBBLES_BLOWING: 'Надуваем...',
        BUBBLES_BLOW_BTN: 'Надуть Пузырь 🫧'
    },
    'tr.json': {
        BUBBLES: 'Düşünce Baloncukları',
        BUBBLES_PLACEHOLDER: 'Baloncuğunda ne var?',
        BUBBLES_BLOWING: 'Üfleniyor...',
        BUBBLES_BLOW_BTN: 'Baloncuk Üfle 🫧'
    },
    'cy.json': { // fallback
        BUBBLES: 'Thought Bubbles',
        BUBBLES_PLACEHOLDER: "What's in your bubble?",
        BUBBLES_BLOWING: 'Blowing...',
        BUBBLES_BLOW_BTN: 'Blow Bubble 🫧'
    }
};

for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const p = `${localesDir}/${file}`;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    
    if (translations[file]) {
        Object.assign(data, translations[file]);
    } else {
        Object.assign(data, translations['en.json']); // fallback to English
    }
    
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}
console.log('Bubbles Locales updated.');
