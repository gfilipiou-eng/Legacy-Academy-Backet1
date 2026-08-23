const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/api.js';
let code = fs.readFileSync(p, 'utf8');

if (!code.includes('API.interceptors.response.use')) {
    const interceptorCode = `
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            const url = error.config?.url || '';
            if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
                console.warn('[AUTH] Session expired or invalid token. Logging out...');
                removeSafeToken();
                try { localStorage.removeItem('user'); } catch(e) {}
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);
`;
    
    // Insert after request interceptor
    code = code.replace(
        /API\.interceptors\.request\.use\([\s\S]*?\}\);\s*/,
        match => match + interceptorCode
    );
    
    fs.writeFileSync(p, code);
    console.log('Added response interceptor to api.js');
} else {
    console.log('Interceptor already exists');
}
