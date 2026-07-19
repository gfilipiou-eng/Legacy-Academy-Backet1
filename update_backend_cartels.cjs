const fs = require('fs');
const path = require('path');

const cartelsPath = path.join(__dirname, 'legacy-academy-backend', 'routes', 'cartels.js');
let content = fs.readFileSync(cartelsPath, 'utf8');

if (!content.includes('import upload')) {
    content = content.replace(
        'import { verifyToken } from "../middleware/auth.js";',
        'import { verifyToken } from "../middleware/auth.js";\nimport upload from "../middleware/upload.js";'
    );
}

// Update POST route
content = content.replace(
    'router.post("/", verifyToken, async (req, res) => {',
    'router.post("/", verifyToken, upload.single("image"), async (req, res) => {'
);

content = content.replace(
    'const { name, description, image, coverImage } = req.body;',
    'const { name, description, coverImage } = req.body;\n        let image = req.body.image || "";\n        if (req.file) { image = req.file.path; }'
);

// Add DELETE route
const deleteRoute = `
// DELETE CARTEL
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const cartel = await Cartel.findById(req.params.id);
        if (!cartel) return res.status(404).json("Cartel not found");

        if (cartel.creator.toString() !== req.user.id && req.user.role !== 'Founder') {
            return res.status(403).json("You can only delete your own cartel");
        }

        await Post.deleteMany({ cartelId: cartel._id });
        await cartel.deleteOne();
        res.status(200).json("Cartel deleted successfully");
    } catch (err) {
        res.status(500).json(err);
    }
});

// JOIN / LEAVE CARTEL`;

if (!content.includes('DELETE CARTEL')) {
    content = content.replace('// JOIN / LEAVE CARTEL', deleteRoute);
}

fs.writeFileSync(cartelsPath, content);
console.log('Backend cartels route updated');
