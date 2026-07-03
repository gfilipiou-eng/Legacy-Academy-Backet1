const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

code = code.replace(/const \[user, setUser\] = useState\(null\);/, "const [user, setUser] = useState(null);\n    const [isRestoringSession, setIsRestoringSession] = useState(true);");

code = code.replace(/if \(userData && token\) \{/, "setIsRestoringSession(false);\n        if (userData && token) {");

code = code.replace(/\} else if \(token && !userData\) \{[\s\S]*?const decoded = decodeJWT\(token\);/, "} else if (token && !userData) {\n            setIsRestoringSession(true);\n            const decoded = decodeJWT(token);");

code = code.replace(/axios\.get\('\/users'\)\.then\(res => \{[\s\S]*?const me = res\.data\.find\(u => u\._id === decoded\.id\);/, "axios.get('/users/find/' + decoded.id).then(res => {\n                    const me = res.data;");

code = code.replace(/\} else \{ removeSafeToken\(\); setUser\(null\); \}/g, "} else { removeSafeToken(); setUser(null); setIsRestoringSession(false); }");

code = code.replace(/removeSafeToken\(\); setUser\(null\);\s*\}\);/, "removeSafeToken(); setUser(null); setIsRestoringSession(false);\n                });");

code = code.replace(/\} else \{ removeSafeToken\(\); setUser\(null\); setIsRestoringSession\(false\); \}\s*\} else if \(saved && !token\)/, "} else { removeSafeToken(); setUser(null); setIsRestoringSession(false); }\n        } else if (saved && !token)");

code = code.replace(/if \(user === null && !isPublicExperience && !isPublicSiteMode\) \{/, "if (isRestoringSession) return <div className=\"h-[100dvh] w-full bg-black flex items-center justify-center\"><Icons.Loader className=\"w-8 h-8 text-white animate-spin\" /></div>;\n    if (user === null && !isPublicExperience && !isPublicSiteMode) {");

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('App.jsx patched for restoring session');
