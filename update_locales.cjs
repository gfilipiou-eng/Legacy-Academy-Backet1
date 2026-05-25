const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const translations = {
  en: 'Session monitoring',
  el: 'Παρακολούθηση συνεδρίας',
  de: 'Sitzungsüberwachung',
  fr: 'Surveillance de session',
  es: 'Monitoreo de sesión',
  tr: 'Oturum izleme',
  ru: 'Мониторинг сеансов',
  cy: 'Monitro sesiwn'
};

const activeDevices = {
  en: 'Active Devices',
  el: 'Ενεργές Συσκευές',
  de: 'Aktive Geräte',
  fr: 'Appareils Actifs',
  es: 'Dispositivos Activos',
  tr: 'Aktif Cihazlar',
  ru: 'Активные устройства',
  cy: 'Dyfeisiau Gweithredol'
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

  // Ensure ACTIVE_DEVICES exists
  if (!data['ACTIVE_DEVICES']) {
    data['ACTIVE_DEVICES'] = activeDevices[lang] || activeDevices['en'];
  }

  // Add SESSION_MONITORING
  data['SESSION_MONITORING'] = translations[lang] || translations['en'];

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${file}`);
});
