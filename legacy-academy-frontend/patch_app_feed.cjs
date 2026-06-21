const fs = require('fs');

function patchApp() {
    const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
    let code = fs.readFileSync(p, 'utf8');

    // 1. Add feedSortOrder state
    if (!code.includes('feedSortOrder')) {
        code = code.replace(
            "const [activeTab, setActiveTab] = useState('home');",
            "const [activeTab, setActiveTab] = useState('home');\n    const [feedSortOrder, setFeedSortOrder] = useState('newest');"
        );
    }

    // 2. Modify groupedPosts to apply feedSortOrder
    const groupedPostsTarget = `const groupedPosts = React.useMemo(() => {`;
    const groupedPostsReplacement = `const groupedPosts = React.useMemo(() => {
        let basePosts = posts;
        if (feedSortOrder === 'oldest') {
            basePosts = [...posts].reverse();
        } else if (feedSortOrder === 'popular') {
            basePosts = [...posts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        }`;
    
    if (code.includes(groupedPostsTarget) && !code.includes('let basePosts = posts;')) {
        code = code.replace(groupedPostsTarget, groupedPostsReplacement);
        // We also need to change `posts.filter` inside groupedPosts to `basePosts.filter`
        const filterRegex = /return posts\.filter/g;
        code = code.replace(filterRegex, 'return basePosts.filter');
    }

    // 3. Insert Tabs above StoriesBar
    const storiesTarget = `{activeTab !== 'search' && <StoriesBar stories={stories} user={user} imgKey={imgKey} key={imgKey || 'stories'} onAddStory={() => { setCreateModeStory(true); setIsCreateOpen(true); }} onViewStory={(s) => setSelectedPost(s)} />}`;
    const storiesReplacement = `
                                    {/* Feed Sort Tabs */}
                                    {activeTab !== 'search' && (
                                        <div className="flex items-center justify-start gap-6 px-4 pt-4 pb-2 border-b border-white/5 bg-transparent overflow-x-auto no-scrollbar">
                                            <button 
                                                onClick={() => setFeedSortOrder('newest')}
                                                className={\`pb-3 font-bold text-[13px] uppercase tracking-wider transition-all relative whitespace-nowrap \${feedSortOrder === 'newest' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}\`}
                                            >
                                                Νεότερα Posts
                                                {feedSortOrder === 'newest' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--gold-primary)] rounded-t-full shadow-[0_0_8px_var(--gold-primary)]" />}
                                            </button>
                                            <button 
                                                onClick={() => setFeedSortOrder('popular')}
                                                className={\`pb-3 font-bold text-[13px] uppercase tracking-wider transition-all relative whitespace-nowrap \${feedSortOrder === 'popular' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}\`}
                                            >
                                                Δημοφιλέστερα Posts
                                                {feedSortOrder === 'popular' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--gold-primary)] rounded-t-full shadow-[0_0_8px_var(--gold-primary)]" />}
                                            </button>
                                            <button 
                                                onClick={() => setFeedSortOrder('oldest')}
                                                className={\`pb-3 font-bold text-[13px] uppercase tracking-wider transition-all relative whitespace-nowrap \${feedSortOrder === 'oldest' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}\`}
                                            >
                                                Παλαιότερα Posts
                                                {feedSortOrder === 'oldest' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--gold-primary)] rounded-t-full shadow-[0_0_8px_var(--gold-primary)]" />}
                                            </button>
                                        </div>
                                    )}

                                    ${storiesTarget}`;
    
    if (code.includes(storiesTarget) && !code.includes('feedSortOrder === \'newest\'')) {
        code = code.replace(storiesTarget, storiesReplacement);
    }

    fs.writeFileSync(p, code, 'utf8');
}

patchApp();
console.log('Patched App.jsx successfully with Feed Sort tabs!');
