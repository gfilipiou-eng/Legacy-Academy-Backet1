const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const showMore = {
  en: 'Show More',
  el: 'Εμφάνιση Περισσότερων',
  de: 'Mehr anzeigen',
  fr: 'Afficher plus',
  es: 'Mostrar más',
  tr: 'Daha Fazla Göster',
  ru: 'Показать больше',
  cy: 'Dangos mwy',
  ro: 'Afișează mai mult'
};

const showLess = {
  en: 'Show Less',
  el: 'Εμφάνιση Λιγότερων',
  de: 'Weniger anzeigen',
  fr: 'Afficher moins',
  es: 'Mostrar menos',
  tr: 'Daha Az Göster',
  ru: 'Показать меньше',
  cy: 'Dangos llai',
  ro: 'Afișează mai puțin'
};

files.forEach(file => {
  const lang = path.basename(file, '.json');
  const filePath = path.join(localesDir, file);
  
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Error reading ${file}`);
    return;
  }

  data['SHOW_MORE'] = showMore[lang] || showMore['en'];
  data['SHOW_LESS'] = showLess[lang] || showLess['en'];

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${file}`);
});
