const fs = require('fs');
const path = require('path');

const translations = {
  en: { YOUR_STORY: "YOUR STORY", ADD_STORY: "ADD STORY" },
  el: { YOUR_STORY: "Η ΙΣΤΟΡΙΑ ΣΟΥ", ADD_STORY: "ΠΡΟΣΘΗΚΗ ΙΣΤΟΡΙΑΣ" },
  cy: { YOUR_STORY: "ΤΟ ΣΤΟΡΥ ΣΟΥ", ADD_STORY: "ΒΑΛΕ ΣΤΟΡΥ" },
  de: { YOUR_STORY: "DEINE STORY", ADD_STORY: "STORY HINZUFÜGEN" },
  es: { YOUR_STORY: "TU HISTORIA", ADD_STORY: "AÑADIR HISTORIA" },
  fr: { YOUR_STORY: "VOTRE HISTOIRE", ADD_STORY: "AJOUTER UNE STORY" },
  ro: { YOUR_STORY: "POVESTEA TA", ADD_STORY: "ADAUGĂ POVESTE" },
  ru: { YOUR_STORY: "ТВОЯ ИСТОРИЯ", ADD_STORY: "ДОБАВИТЬ ИСТОРИЮ" },
  tr: { YOUR_STORY: "HİKAYEN", ADD_STORY: "HİKAYE EKLE" }
};

const localesDir = path.join(__dirname, 'src', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const lang = file.replace('.json', '');
  if (translations[lang]) {
    const filePath = path.join(localesDir, file);
    let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let changed = false;
    if (!data.YOUR_STORY) { data.YOUR_STORY = translations[lang].YOUR_STORY; changed = true; }
    if (!data.ADD_STORY) { data.ADD_STORY = translations[lang].ADD_STORY; changed = true; }
    
    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      console.log(`Updated ${file}`);
    }
  }
}
