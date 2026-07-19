const fs = require('fs');
const babel = require('@babel/core');

function check(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    try {
        babel.transformSync(code, {
            presets: ['@babel/preset-react'],
            filename: filePath
        });
        console.log(filePath, 'syntax is valid');
    } catch (e) {
        console.error('Syntax error in', filePath, ':', e.message);
    }
}

check('./legacy-academy-frontend/src/components/CartelView.jsx');
check('./legacy-academy-frontend/src/components/Cartels.jsx');
check('./legacy-academy-frontend/src/App.jsx');
