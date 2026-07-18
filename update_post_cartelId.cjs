const fs = require('fs');
const path = require('path');

const postsRoutePath = path.join(__dirname, 'legacy-academy-backend', 'routes', 'posts.js');
let postsRouteContent = fs.readFileSync(postsRoutePath, 'utf8');

if (!postsRouteContent.includes('cartelId: req.body.cartelId || null')) {
    postsRouteContent = postsRouteContent.replace(
        'author: req.user.id,',
        'author: req.user.id,\n            cartelId: req.body.cartelId || null,'
    );
    fs.writeFileSync(postsRoutePath, postsRouteContent);
    console.log('posts.js updated with cartelId in POST route');
}
