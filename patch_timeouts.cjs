const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// Replace public profile user load timeout
code = code.replace(/axios\.get\(\`\/users\/username\/\$\{encodeURIComponent\(normalizedUsername\)\}\?t=\$\{Date\.now\(\)\}\`,\s*\{\s*timeout:\s*12000\s*\}\)/g, 
`axios.get(\`/users/username/\${encodeURIComponent(normalizedUsername)}?t=\${Date.now()}\`, { timeout: 60000 })`);

// Replace public profile posts load timeout
code = code.replace(/axios\.get\(\`\/users\/public\/posts\/\$\{encodeURIComponent\(normalizedUsername\)\}\?t=\$\{Date\.now\(\)\}\`,\s*\{\s*timeout:\s*15000\s*\}\)/g, 
`axios.get(\`/users/public/posts/\${encodeURIComponent(normalizedUsername)}?t=\${Date.now()}\`, { timeout: 60000 })`);

// Replace regular profile posts load timeout
code = code.replace(/axios\.get\(\`\/posts\/user\/\$\{targetUserId\}\`,\s*\{\s*timeout:\s*15000\s*\}\)/g, 
`axios.get(\`/posts/user/\${targetUserId}\`, { timeout: 60000 })`);

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Increased timeouts to 60s for cold starts.');
