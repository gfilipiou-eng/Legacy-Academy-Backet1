const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

const regexStr = /axios\.get\('\/users\/find\/' \+ decoded\.id\)\.then\(res => \{[\s\S]*?\}\)\.catch\(\(\) => \{[\s\S]*?\}\);/;

const replaceStr = `const fetchUserWithRetry = async (retryCount = 0) => {
                      try {
                          const res = await axios.get('/users/find/' + decoded.id);
                          const me = res.data;
                          if (me) {
                              setUser(me);
                              safeSetItem('user', JSON.stringify(me));
                              setIsRestoringSession(false);
                          } else {
                              removeSafeToken(); setUser(null); setIsRestoringSession(false);
                          }
                      } catch (err) {
                          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                              removeSafeToken(); setUser(null); setIsRestoringSession(false);
                          } else if (retryCount < 10) {
                              // Server is likely sleeping (502) or network error. Wait 5s and retry.
                              setTimeout(() => fetchUserWithRetry(retryCount + 1), 5000);
                          } else {
                              // Give up after 50 seconds
                              removeSafeToken(); setUser(null); setIsRestoringSession(false);
                          }
                      }
                  };
                  fetchUserWithRetry();`;

if (code.match(regexStr)) {
    code = code.replace(regexStr, replaceStr);
    fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
    console.log('Successfully patched session restore logic with retry.');
} else {
    console.log('REGEX DID NOT MATCH!');
}
