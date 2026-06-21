const fs = require('fs');
const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/aiSimulator.js';
let code = fs.readFileSync(path, 'utf8');

// The issue is that descriptions are wrapped in single quotes: desc = isGreek ? '...' : '...';
// But some English words have single quotes (company's, today's). We must escape them.
code = code.replace(/company's/g, "company\\'s");
code = code.replace(/today's/g, "today\\'s");
code = code.replace(/industry's/g, "industry\\'s");
code = code.replace(/doesn't/g, "doesn\\'t");

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed quotes in aiSimulator.js');
