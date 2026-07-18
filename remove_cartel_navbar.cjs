const fs = require('fs');
const path = require('path');

const navbarPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'BottomNavbar.jsx');
let navbarContent = fs.readFileSync(navbarPath, 'utf8');

// The cartel tab block we added earlier
// It starts with {/* Tab: Cartels */} and ends with </button> just before {/* Tab: Search */}

// Let's use a simpler replace
navbarContent = navbarContent.replace(
    /\{\/\* Tab: Cartels \*\/\}[\s\S]*?<\/button>/,
    ''
);

navbarContent = navbarContent.replace(
    "const tabs = ['home', 'cartels', 'search', 'alerts', 'profile'];",
    "const tabs = ['home', 'search', 'alerts', 'profile'];"
);

fs.writeFileSync(navbarPath, navbarContent);
console.log('Removed cartels from BottomNavbar');
