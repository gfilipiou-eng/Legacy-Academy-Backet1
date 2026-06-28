const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
    /const \[showComments, setShowComments\] = useState\(false\);\s*const \[commentText, setCommentText\] = useState\(''\);\s*const \[showMenu, setShowMenu\] = useState\(false\);/g,
    `const [showComments, setShowComments] = useState(false);
      const [commentText, setCommentText] = useState('');
      const [isWritingComment, setIsWritingComment] = useState(false);
      const [showMenu, setShowMenu] = useState(false);`
);

fs.writeFileSync('src/App.jsx', code);
console.log('Added setIsWritingComment to PostCard state to fix ReferenceError crash overlay in Vite.');
