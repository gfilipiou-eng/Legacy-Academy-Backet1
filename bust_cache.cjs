const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

appContent = appContent.replace(
    "const APP_ASSET_VERSION = '20260705a';",
    "const APP_ASSET_VERSION = '20260719a_cartels';"
);

fs.writeFileSync(appPath, appContent);
console.log("APP_ASSET_VERSION updated to force cache bust");
