const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

const targetStr = '${selectedProfileDescriptor.accentClass.replace(/rounded-none/g, \'\')}';
const replacementStr = '${getDescriptorAccentClass(displayUser.profileDescriptor, displayUser?.role).replace(/rounded-none/g, \'\')}';

if (appContent.includes(targetStr)) {
    appContent = appContent.replace(targetStr, replacementStr);
    fs.writeFileSync(appPath, appContent);
    console.log('Fixed profile descriptor inside platform');
} else {
    console.log('Could not find the target string');
}

// Also check line 7023 just in case, but getDescriptorAccentClass doesn't return the full object, just the class.
// So we just replace the accentClass usage on line 7416.
