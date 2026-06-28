const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(file, 'utf8');

// --- 1. Add Reply to Comments ---
// Add onReply prop to CommentItem
content = content.replace(
  /const CommentItem = memo\(\(\{(.*?)\}\) => \{/,
  'const CommentItem = memo(({$1, onReply}) => {'
);

// Add Reply button next to the time or actions
content = content.replace(
  /<span className="x-comment__time">.*?<\/span>/,
  `$&
  <button type="button" onClick={() => onReply && onReply(commentAuthor?.username)} className="x-comment__time ml-2 hover:text-white transition-colors">Reply</button>`
);

// Pass onReply from PostDetailModal
content = content.replace(
  /<CommentItem\s+key=\{comment\._id\}\s+comment=\{comment\}/g,
  `<CommentItem
      key={comment._id}
      comment={comment}
      onReply={(username) => {
          setCommentText((prev) => prev ? \`\${prev} @\${username} \` : \`@\${username} \`);
          setIsWritingComment(true);
      }}`
);

// --- 2. Missions Scroll to Top ---
// Ensure Missions Scroll state exists
if (!content.includes('const [showMissionsScrollTop, setShowMissionsScrollTop]')) {
    content = content.replace(
        /const \[activeTab, setActiveTab\] = useState\('home'\);/,
        `$&
    const [showMissionsScrollTop, setShowMissionsScrollTop] = useState(false);`
    );
}

// Add logic to handleScroll
content = content.replace(
    /const handleScroll = \(e\) => \{([\s\S]*?)const target = e\.target;/,
    `const handleScroll = (e) => {
        const target = e.target;
        if (activeTab === 'missions') {
            setShowMissionsScrollTop(target.scrollTop > 300);
        }
$1`
);

// Add the Scroll to Top button before the closing </main> or in the main wrapper
content = content.replace(
    /<\/main>/,
    `
        {activeTab === 'missions' && showMissionsScrollTop && (
            <div className="missions-scroll-top" onClick={() => mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </div>
        )}
        </main>`
);


// --- 3. Better Notification Interactivity ---
// Make notifications look more like liquid glass
content = content.replace(
    /className="relative bg-white\/5 p-4 rounded-xl border border-white\/10 flex items-start gap-4 transition-all duration-300"/g,
    `className="relative profile-glass-card p-4 rounded-xl border border-white/10 flex items-start gap-4 transition-all duration-300 hover:scale-[1.02]"`
);

// --- 4. Bio and LinkProfile Styling ---
// Add premium bio styling
content = content.replace(
    /<div className="text-sm sm:text-base text-gray-300 break-words whitespace-pre-wrap">/g,
    `<div className="text-sm sm:text-base text-gray-200 break-words whitespace-pre-wrap premium-bio-text">`
);

content = content.replace(
    /className="flex items-center gap-3 p-4 bg-white\/5 border border-white\/10 rounded-xl hover:bg-white\/10 transition-colors"/g,
    `className="flex items-center gap-3 p-4 profile-glass-btn border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"`
);

fs.writeFileSync(file, content);
console.log("App.jsx patched successfully for replies, missions scroll, notifications, and bio.");
