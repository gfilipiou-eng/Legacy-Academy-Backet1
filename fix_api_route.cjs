const fs = require('fs');
const path = require('path');

function replaceApiRoute(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\/api\/cartels/g, '/cartels');
    fs.writeFileSync(filePath, content);
}

replaceApiRoute(path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx'));
replaceApiRoute(path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx'));

console.log('Fixed /api route duplication');
