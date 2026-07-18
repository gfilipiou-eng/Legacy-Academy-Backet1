const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

const importStatement = "import { CartelsExplore } from './components/Cartels';\nimport { CartelView } from './components/CartelView';";

if (!appContent.includes("import { CartelsExplore }")) {
    appContent = appContent.replace(
        "import BubbleSpace from './components/Bubbles/BubbleSpace';",
        "import BubbleSpace from './components/Bubbles/BubbleSpace';\n" + importStatement
    );
    fs.writeFileSync(appPath, appContent);
    console.log("Imports added successfully");
} else {
    console.log("Imports already exist");
}
