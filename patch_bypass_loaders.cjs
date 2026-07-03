const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/App.jsx', 'utf8');

// Patch 1: PublicProfileLinktree posts spinner condition
const findPostsSpinner = `                  {/* Posts with same style as regular profile */}
                  <div className="w-full space-y-6 pb-20">
                    {loadingPosts || !postsReady ? (`;
const replacePostsSpinner = `                  {/* Posts with same style as regular profile */}
                  <div className="w-full space-y-6 pb-20">
                    {loadingPosts && !postsReady ? (`;
// Use a more relaxed match due to indentation
code = code.replace(/\{loadingPosts\s*\|\|\s*!postsReady\s*\?\s*\(/g, '{loadingPosts && !postsReady ? (');

// Patch 2: publicSiteUsername loading condition
code = code.replace(/if\s*\(publicUserLoading\)\s*\{\s*return\s*<div className="min-h-screen w-full bg-\[\#050505\] flex items-center justify-center">/g, 
`if (publicUserLoading && !publicUser) {
            return <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center">`);

fs.writeFileSync('legacy-academy-frontend/src/App.jsx', code);
console.log('Patched public site and profile linktree to bypass loaders when cache is available.');
