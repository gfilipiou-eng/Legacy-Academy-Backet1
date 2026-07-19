const fs = require('fs');
const path = require('path');

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

cartelsContent = cartelsContent.replace(
    "return (\n        <div className=\"fixed inset-0 pointer-events-none opacity-20 z-0 mix-blend-overlay\"",
    "return (\n        <>\n            <div className=\"fixed inset-0 pointer-events-none opacity-20 z-0 mix-blend-overlay\""
);

cartelsContent = cartelsContent.replace(
    "        </div>\n    );\n};\n\nconst CreateCartelModal",
    "        </div>\n        </>\n    );\n};\n\nconst CreateCartelModal"
);

fs.writeFileSync(cartelsPath, cartelsContent);
console.log('Fixed JSX fragment syntax error');
