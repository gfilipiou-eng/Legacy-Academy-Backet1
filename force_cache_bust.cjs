const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'legacy-academy-frontend', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

indexContent = indexContent.replace(/\?v=20260710d/g, '?v=20260719e');
indexContent = indexContent.replace(/\?v=20260705a/g, '?v=20260719e');

// Inject a tiny script to unregister service workers just in case they have one stuck
const swScript = `
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }
    // Bust caches
    if ('caches' in window) {
      caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => caches.delete(key)));
      });
    }
  </script>
</head>
`;

if (!indexContent.includes('registration.unregister()')) {
    indexContent = indexContent.replace('</head>', swScript);
}

fs.writeFileSync(indexPath, indexContent);
console.log('index.html cache busted');
