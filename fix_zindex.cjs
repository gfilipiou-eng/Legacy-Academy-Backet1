const fs = require('fs');
const path = require('path');

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

// Increase z-index of CreateCartelModal to 2000 so it covers the Gun button (z-1000)
cartelsContent = cartelsContent.replace(
    'className="fixed inset-0 z-[200] flex items-center justify-center p-4"',
    'className="fixed inset-0 z-[2000] flex items-center justify-center p-4"'
);
fs.writeFileSync(cartelsPath, cartelsContent);

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cartelViewContent = fs.readFileSync(cartelViewPath, 'utf8');

// Make CartelView cover the entire screen including the navbar
cartelViewContent = cartelViewContent.replace(
    '<div className="w-full h-full flex flex-col bg-[#050505] z-30 absolute inset-0 overflow-y-auto pb-24">',
    '<div className="w-full h-full flex flex-col bg-[#050505] z-[9999] fixed inset-0 overflow-y-auto pb-8">'
);
fs.writeFileSync(cartelViewPath, cartelViewContent);

console.log('Fixed z-index issues');
