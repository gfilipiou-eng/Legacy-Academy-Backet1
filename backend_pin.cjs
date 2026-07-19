const fs = require('fs');
const path = require('path');

// 1. Update Cartel Schema
const cartelModelPath = path.join(__dirname, 'legacy-academy-backend', 'models', 'Cartel.js');
let cartelModelContent = fs.readFileSync(cartelModelPath, 'utf8');
if (!cartelModelContent.includes('pin: { type: String')) {
    cartelModelContent = cartelModelContent.replace(
        "isPrivate: { type: Boolean, default: false }",
        "isPrivate: { type: Boolean, default: false },\n  pin: { type: String, default: \"\" }"
    );
    fs.writeFileSync(cartelModelPath, cartelModelContent);
}

// 2. Update Cartel Routes
const cartelsRoutePath = path.join(__dirname, 'legacy-academy-backend', 'routes', 'cartels.js');
let cartelsRouteContent = fs.readFileSync(cartelsRoutePath, 'utf8');

// POST /cartels
cartelsRouteContent = cartelsRouteContent.replace(
    'const { name, description, coverImage } = req.body;',
    'const { name, description, coverImage, pin } = req.body;'
);
cartelsRouteContent = cartelsRouteContent.replace(
    'image,\n            coverImage,',
    'image,\n            coverImage,\n            pin: pin || "",\n            isPrivate: !!pin,'
);

// GET /cartels and GET /:id (Strip PIN)
// For simplicity, we just won't select pin or we will map over them
cartelsRouteContent = cartelsRouteContent.replace(
    'const cartels = await Cartel.find()',
    'const cartels = await Cartel.find().select("-pin")'
);
cartelsRouteContent = cartelsRouteContent.replace(
    'const cartel = await Cartel.findById(req.params.id)',
    'const cartel = await Cartel.findById(req.params.id).select("-pin")'
);

// POST /cartels/:id/join
const oldJoin = `// JOIN / LEAVE CARTEL
router.post("/:id/join", verifyToken, async (req, res) => {
    try {
        const cartel = await Cartel.findById(req.params.id);
        if (!cartel) return res.status(404).json("Cartel not found");

        if (cartel.members.includes(req.user.id)) {
            // Leave
            await cartel.updateOne({ $pull: { members: req.user.id } });
            res.status(200).json("Left cartel");
        } else {
            // Join
            await cartel.updateOne({ $push: { members: req.user.id } });
            res.status(200).json("Joined cartel");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});`;

const newJoin = `// JOIN / LEAVE CARTEL
router.post("/:id/join", verifyToken, async (req, res) => {
    try {
        const cartel = await Cartel.findById(req.params.id);
        if (!cartel) return res.status(404).json("Cartel not found");

        if (cartel.members.includes(req.user.id)) {
            // Leave
            await cartel.updateOne({ $pull: { members: req.user.id } });
            res.status(200).json("Left cartel");
        } else {
            // Join
            const { pin } = req.body;
            if (cartel.isPrivate && cartel.pin) {
                if (cartel.pin !== pin) {
                    return res.status(403).json("Invalid PIN. Access denied.");
                }
            }
            await cartel.updateOne({ $push: { members: req.user.id } });
            res.status(200).json("Joined cartel");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});`;

if (cartelsRouteContent.includes('// JOIN / LEAVE CARTEL')) {
    const regex = /\/\/ JOIN \/ LEAVE CARTEL[\s\S]*?\}\);/;
    cartelsRouteContent = cartelsRouteContent.replace(regex, newJoin);
}

fs.writeFileSync(cartelsRoutePath, cartelsRouteContent);

console.log('Backend Cartel PIN support added');
