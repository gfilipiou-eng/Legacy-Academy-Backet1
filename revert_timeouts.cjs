const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// Revert public profile user load timeout
code = code.replace(/axios\.get\(\`\/users\/username\/\$\{encodeURIComponent\(normalizedUsername\)\}\?t=\$\{Date\.now\(\)\}\`,\s*\{\s*timeout:\s*60000\s*\}\)/g, 
`axios.get(\`/users/username/\${encodeURIComponent(normalizedUsername)}?t=\${Date.now()}\`, { timeout: 12000 })`);

// Revert public profile posts load timeout
code = code.replace(/axios\.get\(\`\/users\/public\/posts\/\$\{encodeURIComponent\(normalizedUsername\)\}\?t=\$\{Date\.now\(\)\}\`,\s*\{\s*timeout:\s*60000\s*\}\)/g, 
`axios.get(\`/users/public/posts/\${encodeURIComponent(normalizedUsername)}?t=\${Date.now()}\`, { timeout: 15000 })`);

// Revert regular profile posts load timeout
code = code.replace(/axios\.get\(\`\/posts\/user\/\$\{targetUserId\}\`,\s*\{\s*timeout:\s*60000\s*\}\)/g, 
`axios.get(\`/posts/user/\${targetUserId}\`, { timeout: 15000 })`);

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Reverted timeouts to original 12s/15s.');
