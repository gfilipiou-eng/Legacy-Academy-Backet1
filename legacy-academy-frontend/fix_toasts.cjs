const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const badRemoval = `const messageText = \`\${t('NOTIF_MESSAGE', 'New message from')} \${msg.senderName || 'Agent'}\`;
                
                // Trigger browser notification`;

const goodRestoration = `const messageText = \`\${t('NOTIF_MESSAGE', 'New message from')} \${msg.senderName || 'Agent'}\`;
                // Show a toast if chat window is not open
                if (!isChatOpen) {
                    addToast(messageText, 'info');
                }

                // Trigger browser notification`;

code = code.replace(badRemoval, goodRestoration);

const toastToRemove = `            if (selectedPost && selectedPost._id === data.postId) {
                setSelectedPost(null);
                addToast(t('POST_DELETED_REALTIME') || 'Post was deleted.', 'info');
            }`;
            
const toastRemoved = `            if (selectedPost && selectedPost._id === data.postId) {
                setSelectedPost(null);
            }`;

code = code.replace(toastToRemove, toastRemoved);

fs.writeFileSync('src/App.jsx', code);
console.log('Restored message toast and removed post deleted toast');
