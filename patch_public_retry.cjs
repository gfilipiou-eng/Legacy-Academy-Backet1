const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// Patch loadUser
const findLoadUser = /let retries = 3;\s*let lastError = null;\s*while \(retries > 0 && isActive\) \{[\s\S]*?if \(retries > 0\) await new Promise\(r => setTimeout\(r, 1200\)\);\s*\}\s*\}/;

const replaceLoadUser = `let retries = 10;
                let lastError = null;

                while (retries > 0 && isActive) {
                    try {
                        const res = await axios.get(\`/users/username/\${encodeURIComponent(normalizedUsername)}?t=\${Date.now()}\`, { timeout: 12000 });
                        latestUser = res?.data || null;
                        if (!isActive) return;
                        setPublicUser(latestUser);
                        syncCachedProfile();
                        break;
                    } catch (error) {
                        lastError = error;
                        if (error.response && error.response.status === 404) break; // Don't retry on 404
                        retries -= 1;
                        if (retries > 0) await new Promise(r => setTimeout(r, 5000));
                    }
                }`;
code = code.replace(findLoadUser, replaceLoadUser);

// Patch loadPosts
const findLoadPosts = /for \(let attempt = 0; attempt <= 2 && isActive; attempt \+= 1\) \{[\s\S]*?if \(attempt === 2\) \{[\s\S]*?\} else \{\s*await new Promise\(r => setTimeout\(r, 900\)\);\s*\}\s*\}\s*\}/;

const replaceLoadPosts = `for (let attempt = 0; attempt <= 10 && isActive; attempt += 1) {
                    try {
                        const res = await axios.get(\`/users/public/posts/\${encodeURIComponent(normalizedUsername)}?t=\${Date.now()}\`, { timeout: 15000 });
                        if (!isActive) return;
                        const nextPosts = Array.isArray(res?.data)
                            ? res.data.filter(p => p.isStory !== true && String(p.isStory) !== 'true')
                            : [];
                        latestPosts = nextPosts;
                        setPublicPosts(nextPosts);
                        syncCachedProfile();
                        break;
                    } catch (error) {
                        if (error.response && error.response.status === 404) {
                            if (!latestPosts.length) setPublicPosts([]);
                            break;
                        }
                        if (attempt >= 10) {
                            if (isActive) {
                                console.error("Failed to load public posts:", error);
                                if (!latestPosts.length) setPublicPosts([]);
                            }
                        } else {
                            await new Promise(r => setTimeout(r, 5000));
                        }
                    }
                }`;
code = code.replace(findLoadPosts, replaceLoadPosts);

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Patched public profile loading logic to retry 10 times for 502 Bad Gateway.');
