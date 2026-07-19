const fs = require('fs');
const path = require('path');

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

// Defensive check for c.name
cartelsContent = cartelsContent.replace(
    "const filtered = cartels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));",
    "const filtered = cartels.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()));"
);

// Import axios from api instead of raw axios
cartelsContent = cartelsContent.replace(
    "import axios from 'axios';",
    "import axios from '../api';"
);

fs.writeFileSync(cartelsPath, cartelsContent);

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cartelViewContent = fs.readFileSync(cartelViewPath, 'utf8');

// Import axios from api instead of raw axios
cartelViewContent = cartelViewContent.replace(
    "import axios from 'axios';",
    "import axios from '../api';"
);

fs.writeFileSync(cartelViewPath, cartelViewContent);

console.log("Defensive checks added");
