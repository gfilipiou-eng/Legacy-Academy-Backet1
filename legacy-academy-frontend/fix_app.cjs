const fs = require('fs');

function fixApp() {
    const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
    let code = fs.readFileSync(p, 'utf8');

    // Revert the wrong basePosts.filter injection
    code = code.replace(/return basePosts\.filter/g, 'return posts.filter');

    // Find the exact groupedPosts block
    const targetBlock = `    const groupedPosts = React.useMemo(() => {
        let basePosts = posts;
        if (feedSortOrder === 'oldest') {
            basePosts = [...posts].reverse();
        } else if (feedSortOrder === 'popular') {
            basePosts = [...posts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        }
        const groups = {};
        const lang = user?.settings?.language || 'en';
        const locale = getLocaleForLang(lang);
        filteredPosts.forEach(p => {`;

    const replacementBlock = `    const groupedPosts = React.useMemo(() => {
        let sortedFilteredPosts = [...filteredPosts];
        if (feedSortOrder === 'oldest') {
            sortedFilteredPosts = sortedFilteredPosts.reverse();
        } else if (feedSortOrder === 'popular') {
            sortedFilteredPosts = sortedFilteredPosts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        }
        const groups = {};
        const lang = user?.settings?.language || 'en';
        const locale = getLocaleForLang(lang);
        sortedFilteredPosts.forEach(p => {`;

    if (code.includes(targetBlock)) {
        code = code.replace(targetBlock, replacementBlock);
        fs.writeFileSync(p, code, 'utf8');
        console.log('Fixed App.jsx successfully!');
    } else {
        console.log('Error: Could not find targetBlock in App.jsx. Here is what is near 8850:');
        const lines = code.split('\\n');
        console.log(lines.slice(8845, 8870).join('\\n'));
    }
}

fixApp();
