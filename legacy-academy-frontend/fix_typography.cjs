const fs = require('fs');

const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/PublicWebsiteViewer.jsx';
let code = fs.readFileSync(path, 'utf8');

// Target specifically text elements
code = code.replace(/<h1([^>]*)className=\"/g, '<h1$1className=\"break-words hyphens-auto ');
code = code.replace(/<h2([^>]*)className=\"/g, '<h2$1className=\"break-words hyphens-auto ');
code = code.replace(/<h3([^>]*)className=\"/g, '<h3$1className=\"break-words hyphens-auto ');
code = code.replace(/<p([^>]*)className=\"/g, '<p$1className=\"break-words hyphens-auto ');
code = code.replace(/<span([^>]*)className=\"/g, '<span$1className=\"break-words hyphens-auto ');

// The user also mentioned "social link jana epanaferonte se oti nane". That was the schema persistence issue.
// The user mentioned "to contact information". That was also schema persistence.

fs.writeFileSync(path, code, 'utf8');
console.log('Added break-words safely to typography');
