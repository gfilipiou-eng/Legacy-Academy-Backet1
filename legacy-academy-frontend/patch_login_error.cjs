const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Patch login catch block and trim password
code = code.replace(
    /const res = await axios\.post\('\/auth\/login', \{ email: formData\.email\.trim\(\)\.toLowerCase\(\), password: formData\.password \}\);\s*localStorage\.setItem\('token', res\.data\.token\);\s*commitAuthenticatedUser\(res\.data\.user\);\s*\} catch \(e\) \{[\s\S]*?setAuthLoading\(false\);\s*\}/g,
    `const res = await axios.post('/auth/login', { email: formData.email.trim().toLowerCase(), password: formData.password.trim() });
                                                    localStorage.setItem('token', res.data.token);
                                                    commitAuthenticatedUser(res.data.user);
                                                } catch (e) {
                                                    if (e.response) {
                                                        setAuthError(e.response?.data?.message || 'Invalid clearance codes or account not found.');
                                                    } else {
                                                        setAuthError('Local Error: ' + (e.message || 'Unknown error. Check Private Browsing or Cookies.'));
                                                    }
                                                    setAuthLoading(false);
                                                }`
);

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx login catch block patched.');
