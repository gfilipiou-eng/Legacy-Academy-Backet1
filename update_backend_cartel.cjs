const fs = require('fs');
const path = require('path');

const postModelPath = path.join(__dirname, 'legacy-academy-backend', 'models', 'Post.js');
let postContent = fs.readFileSync(postModelPath, 'utf8');

if (!postContent.includes('cartelId:')) {
    postContent = postContent.replace(
        "author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User for populate",
        "cartelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cartel', default: null },\n  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User for populate"
    );
    fs.writeFileSync(postModelPath, postContent);
    console.log('Post.js updated with cartelId');
}

// Update routes/posts.js
// I need to add cartelId: null to the feed filters so cartel posts don't show up in the main feed.
// In routes/posts.js, the global feed is fetched via: `const posts = await Post.find()`
// Wait, the query might have filters already, let's look at it.
// The route says: const posts = await Post.find().populate...
// We can just change `Post.find()` to `Post.find({ cartelId: null })` inside the GET "/" route.
const postsRoutePath = path.join(__dirname, 'legacy-academy-backend', 'routes', 'posts.js');
let postsRouteContent = fs.readFileSync(postsRoutePath, 'utf8');

// The main feed is around line 52: const posts = await Post.find()
if (!postsRouteContent.includes('Post.find({ cartelId: null })')) {
    postsRouteContent = postsRouteContent.replace(
        'const posts = await Post.find()',
        'const posts = await Post.find({ cartelId: null })'
    );
    fs.writeFileSync(postsRoutePath, postsRouteContent);
    console.log('posts.js updated to filter cartel posts');
}
