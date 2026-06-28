const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Remove the old text-based reply button next to the time
code = code.replace(
    /<span className="x-comment__time"><CyberDate date=\{comment\.createdAt\} t=\{t\} lang=\{lang\} \/><\/span>\s*<button type="button" onClick=\{\(\) => onReply && onReply\(commentAuthor\?\.username\)\} className="x-comment__time ml-2 hover:text-white transition-colors">Reply<\/button>/g,
    `<span className="x-comment__time"><CyberDate date={comment.createdAt} t={t} lang={lang} /></span>`
);

// 2. Add the X-style Action Bar under the comment content in CommentItem
code = code.replace(
    /(\{\/\* Translate link \*\/\}[\s\S]*?<\/>\s*\)\})/g,
    `$1
            {/* Action Bar (X Style) */}
            <div className="flex items-center gap-6 mt-1.5 text-gray-500">
                <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); onReply && onReply(commentAuthor?.username); }} 
                    className="flex items-center gap-1.5 hover:text-[#1d9bf0] transition-colors group"
                >
                    <div className="p-1.5 -ml-1.5 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                        <Icons.Comment className="w-4 h-4" />
                    </div>
                </button>
            </div>`
);

// 3. Inject the onReply prop into all CommentItem usages within PostDetailModal
code = code.replace(
    /userBadgeKey=\{`\$\{user\?\.settings\?\.badgeColor\}-\$\{user\?\.settings\?\.showBadge\}`\}/g,
    `userBadgeKey={\`\${user?.settings?.badgeColor}-\${user?.settings?.showBadge}\`}
    onReply={(username) => {
        setCommentText((prev) => prev ? prev + ' @' + username + ' ' : '@' + username + ' ');
        setIsWritingComment(true);
    }}`
);

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx patched for X-style comment replies.');
