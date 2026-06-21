const fs = require('fs');

const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/PublicWebsiteViewer.jsx';
let code = fs.readFileSync(path, 'utf8');

// Add shrink-0 to Navbar
code = code.replace(/<nav className=\{\`w-full px-6/g, '<nav className={`shrink-0 w-full px-6');

// Add shrink-0 to Hero
code = code.replace(/<div className=\"w-full flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-12 py-12 md:py-24 gap-12 relative min-h-\[80vh\]\"/g, 
                    '<div className=\"shrink-0 w-full flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-12 py-12 md:py-24 gap-12 relative min-h-[80vh]\"');

// Add shrink-0 to Features, Products, About, Contact sections
code = code.replace(/<div id=\"services\" className=\"w-full/g, '<div id=\"services\" className=\"shrink-0 w-full');
code = code.replace(/<div className=\"w-full py-24/g, '<div className=\"shrink-0 w-full py-24'); // Shop section if it doesn't have ID
code = code.replace(/<div id=\"about\" className=\"w-full/g, '<div id=\"about\" className=\"shrink-0 w-full');
code = code.replace(/<div id=\"contact\" className=\"w-full/g, '<div id=\"contact\" className=\"shrink-0 w-full');

// Footer
code = code.replace(/<footer className=\"w-full/g, '<footer className=\"shrink-0 w-full');

fs.writeFileSync(path, code, 'utf8');
console.log('Added shrink-0 to sections');
