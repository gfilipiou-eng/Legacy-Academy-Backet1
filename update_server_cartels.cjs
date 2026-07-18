const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'legacy-academy-backend', 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

if (!serverContent.includes('import cartelRoute')) {
    serverContent = serverContent.replace(
        'import postRoute from "./routes/posts.js";',
        'import postRoute from "./routes/posts.js";\nimport cartelRoute from "./routes/cartels.js";'
    );
}

if (!serverContent.includes('app.use("/api/cartels"')) {
    serverContent = serverContent.replace(
        'app.use("/api/posts", postRoute);',
        'app.use("/api/posts", postRoute);\napp.use("/api/cartels", cartelRoute);'
    );
}

fs.writeFileSync(serverPath, serverContent);
console.log('server.js updated with cartels route');
