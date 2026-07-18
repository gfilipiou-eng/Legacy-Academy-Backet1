const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

if (!appContent.includes("{ id: 'cartels', icon: Icons.Users, label: t('CARTELS') || 'Cartels / Mafia' }")) {
    appContent = appContent.replace(
        "{ id: 'search', icon: Icons.Search, label: t('EXPLORE') },",
        "{ id: 'search', icon: Icons.Search, label: t('EXPLORE') },\n                            { id: 'cartels', icon: Icons.Users, label: t('CARTELS') || 'Cartels / Mafia' },"
    );
    fs.writeFileSync(appPath, appContent);
    console.log('App.jsx updated with Cartels in NavigationDrawer');
}
