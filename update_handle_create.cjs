const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// 1. In handleCreatePost, capture createCartelId
appContent = appContent.replace(
    "const handleCreatePost = async (formData, previewUrl, isStory) => {",
    "const handleCreatePost = async (formData, previewUrl, isStory) => {\n        const currentCartelId = createCartelId;\n        if (currentCartelId) formData.append('cartelId', currentCartelId);"
);

// 2. Prevent optimistic UI from putting it in the global feed if it's a cartel post
appContent = appContent.replace(
    "// Add to feed immediately\n        setPosts(prev => [tempPost, ...prev]);",
    "// Add to feed immediately\n        if (!currentCartelId) { setPosts(prev => [tempPost, ...prev]); }"
);

// 3. Also prevent optimistic UI progress update from failing if it's a cartel post
// Actually it updates `posts` array, which doesn't have it, so map won't do anything, which is fine.

// 4. Update the real post logic
// Wait, if it's a cartel post, after it's created, we shouldn't replace it in `posts` either.
appContent = appContent.replace(
    "setPosts(currentPosts => currentPosts.map(p => p._id === tempId ? createdPost : p));",
    "if (!currentCartelId) { setPosts(currentPosts => currentPosts.map(p => p._id === tempId ? createdPost : p)); } else { /* For cartel posts, CartelView will refetch */ }"
);

appContent = appContent.replace(
    "setPosts(currentPosts => currentPosts.filter(p => p._id !== tempId));",
    "if (!currentCartelId) { setPosts(currentPosts => currentPosts.filter(p => p._id !== tempId)); }"
);

fs.writeFileSync(appPath, appContent);
console.log('App.jsx handleCreatePost updated');
