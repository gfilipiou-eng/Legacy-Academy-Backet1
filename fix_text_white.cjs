const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Replace specific occurrences of 'text-white' in the auth buttons
appContent = appContent.replace(
    /<span className="relative text-white">SIGN IN<\/span>/g,
    '<span className="relative">SIGN IN</span>'
);

appContent = appContent.replace(
    /<span className="relative text-white">CREATE ACCOUNT<\/span>/g,
    '<span className="relative">CREATE ACCOUNT</span>'
);

appContent = appContent.replace(
    /<span className="relative text-white">RESET PASSWORD<\/span>/g,
    '<span className="relative">RESET PASSWORD</span>'
);

// Unlock access might have similar text-white inside?
// In fix_buttons_solid_gold.cjs we replaced the text-white class on the button itself, 
// but let's make sure there isn't an inner span.
appContent = appContent.replace(
    /<span className="relative text-white">Unlock Access<\/span>/g,
    '<span className="relative">Unlock Access</span>'
);

fs.writeFileSync(appPath, appContent);
console.log('Modifications completed.');

try {
    execSync('git add legacy-academy-frontend/src/App.jsx');
    execSync('git commit -m "Remove hardcoded text-white from auth button inner spans"');
    execSync('git push');
    console.log('Git commit and push successful.');
} catch (e) {
    console.error('Git operation failed:', e.message);
}
