const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

const targetCatch = `.catch(() => {
                      // Ignore, they'll see login
                      removeSafeToken(); setUser(null); setIsRestoringSession(false);
                  });`;

const replaceCatch = `.catch((err) => {
                      // Only log out if token is explicitly rejected (401/403)
                      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                          removeSafeToken(); setUser(null); setIsRestoringSession(false);
                      } else {
                          // Network error / 502 / etc. Do NOT wipe token or user data! Just stop restoring.
                          setIsRestoringSession(false);
                      }
                  });`;

code = code.replace(targetCatch, replaceCatch);

const targetCatch2 = `} else { removeSafeToken(); setUser(null); setIsRestoringSession(false); }
                  }).catch(`

// Also, the second part:
const targetElseIf = `} else if (saved && !token) {
              localStorage.removeItem('user');
              setUser(null);
          }`;

// If saved && !token occurs (e.g. storage inconsistency), maybe we shouldn't proactively nuke the local user data unless we're sure.
// But if token is gone, they can't make requests anyway, so maybe that's fine.

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Patched App.jsx session persistence.');
