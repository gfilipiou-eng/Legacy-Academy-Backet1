const fs = require('fs');
const path = require('path');

const cartelsRoutePath = path.join(__dirname, 'legacy-academy-backend', 'routes', 'cartels.js');
let cartelsRouteContent = fs.readFileSync(cartelsRoutePath, 'utf8');

if (!cartelsRouteContent.includes('// Check if user is a member')) {
    cartelsRouteContent = cartelsRouteContent.replace(
        "const posts = await Post.find({ cartelId: req.params.id })",
        `// Check if user is a member
        const cartel = await Cartel.findById(req.params.id);
        if (!cartel) return res.status(404).json("Cartel not found");
        if (!cartel.members.includes(req.user.id) && req.user.role !== 'Founder') {
            return res.status(403).json("Intel is encrypted. You must be a member of this cartel to view its posts.");
        }

        const posts = await Post.find({ cartelId: req.params.id })`
    );
    fs.writeFileSync(cartelsRoutePath, cartelsRouteContent);
    console.log('cartels.js updated to enforce member-only post viewing');
}
