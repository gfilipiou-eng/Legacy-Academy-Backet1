const fs = require('fs');

function fixSortAndTabs() {
    const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
    let code = fs.readFileSync(p, 'utf8');

    // 1. Fix groupedPosts logic
    const oldGroupedPosts = `    const groupedPosts = React.useMemo(() => {
        let sortedFilteredPosts = [...filteredPosts];
        if (feedSortOrder === 'oldest') {
            sortedFilteredPosts = sortedFilteredPosts.reverse();
        } else if (feedSortOrder === 'popular') {
            sortedFilteredPosts = sortedFilteredPosts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        }
        const groups = {};
        const lang = user?.settings?.language || 'en';
        const locale = getLocaleForLang(lang);
        sortedFilteredPosts.forEach(p => {
            const date = new Date(p.createdAt);
            const key = date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = { key, posts: [], dateVal: date.setHours(0, 0, 0, 0) };
            groups[key].posts.push(p);
        });
        // Convert to array and sort DESCENDING (Newest first)
        return Object.values(groups).sort((a, b) => b.dateVal - a.dateVal);
    }, [filteredPosts, user, feedSortOrder]);`;

    const newGroupedPosts = `    const groupedPosts = React.useMemo(() => {
        if (feedSortOrder === 'popular') {
            const sorted = [...filteredPosts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
            return [{ key: 'Δημοφιλέστερα', posts: sorted, dateVal: Date.now() }];
        }
        
        let sortedFilteredPosts = [...filteredPosts];
        if (feedSortOrder === 'oldest') {
            sortedFilteredPosts = sortedFilteredPosts.reverse();
        }
        
        const groups = {};
        const lang = user?.settings?.language || 'en';
        const locale = getLocaleForLang(lang);
        sortedFilteredPosts.forEach(p => {
            const date = new Date(p.createdAt);
            const key = date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = { key, posts: [], dateVal: date.setHours(0, 0, 0, 0) };
            groups[key].posts.push(p);
        });
        
        return Object.values(groups).sort((a, b) => {
            if (feedSortOrder === 'oldest') return a.dateVal - b.dateVal;
            return b.dateVal - a.dateVal;
        });
    }, [filteredPosts, user, feedSortOrder]);`;

    if (code.includes(oldGroupedPosts)) {
        code = code.replace(oldGroupedPosts, newGroupedPosts);
    } else {
        console.log('Error finding oldGroupedPosts block');
    }

    // 2. Fix the Tabs UI
    const oldTabs = `{/* Feed Sort Tabs */}
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
                                    )}`;

    const newTabs = `{/* Feed Sort Tabs */}
                                    {activeTab !== 'search' && (
                                        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-6 px-3 sm:px-4 pt-4 pb-2 border-b border-white/5 bg-transparent w-full">
                                            <button 
                                                onClick={() => setFeedSortOrder('newest')}
                                                className={\`flex items-center gap-1.5 pb-3 font-bold text-[10px] sm:text-[13px] uppercase tracking-wider transition-all relative \${feedSortOrder === 'newest' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}\`}
                                            >
                                                <Icons.Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                <span>Νεότερα</span>
                                                {feedSortOrder === 'newest' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--gold-primary)] rounded-t-full shadow-[0_0_8px_var(--gold-primary)]" />}
                                            </button>
                                            <button 
                                                onClick={() => setFeedSortOrder('popular')}
                                                className={\`flex items-center gap-1.5 pb-3 font-bold text-[10px] sm:text-[13px] uppercase tracking-wider transition-all relative \${feedSortOrder === 'popular' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}\`}
                                            >
                                                <Icons.Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                <span>Δημοφιλή</span>
                                                {feedSortOrder === 'popular' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--gold-primary)] rounded-t-full shadow-[0_0_8px_var(--gold-primary)]" />}
                                            </button>
                                            <button 
                                                onClick={() => setFeedSortOrder('oldest')}
                                                className={\`flex items-center gap-1.5 pb-3 font-bold text-[10px] sm:text-[13px] uppercase tracking-wider transition-all relative \${feedSortOrder === 'oldest' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}\`}
                                            >
                                                <Icons.History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                <span>Παλαιότερα</span>
                                                {feedSortOrder === 'oldest' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--gold-primary)] rounded-t-full shadow-[0_0_8px_var(--gold-primary)]" />}
                                            </button>
                                        </div>
                                    )}`;

    if (code.includes(oldTabs)) {
        code = code.replace(oldTabs, newTabs);
    } else {
        console.log('Error finding oldTabs block');
    }

    fs.writeFileSync(p, code, 'utf8');
}

fixSortAndTabs();
console.log('Done fixing sort logic and mobile tabs.');
