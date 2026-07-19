const fs = require('fs');
const path = require('path');

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');
cartelsContent = cartelsContent.replace(/uppercase/g, '');
fs.writeFileSync(cartelsPath, cartelsContent);

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cartelViewContent = fs.readFileSync(cartelViewPath, 'utf8');
cartelViewContent = cartelViewContent.replace(/uppercase/g, '');
fs.writeFileSync(cartelViewPath, cartelViewContent);

console.log('Removed uppercase tailwind classes');
