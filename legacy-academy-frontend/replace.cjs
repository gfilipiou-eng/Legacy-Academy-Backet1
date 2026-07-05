const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');
c = c.replace(/'🔥'/g, '<Icons.Streak className="w-8 h-8" />');
c = c.replace(/🔥/g, '<Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" />');
fs.writeFileSync('src/App.jsx', c);
