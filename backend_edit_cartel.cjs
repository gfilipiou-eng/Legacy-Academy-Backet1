const fs = require('fs');
const path = require('path');

const cartelsRoutePath = path.join(__dirname, 'legacy-academy-backend', 'routes', 'cartels.js');
let cartelsRouteContent = fs.readFileSync(cartelsRoutePath, 'utf8');

const putRoute = `
// EDIT CARTEL
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
    try {
        const cartel = await Cartel.findById(req.params.id);
        if (!cartel) return res.status(404).json("Cartel not found");

        if (cartel.creator.toString() !== req.user.id && req.user.role !== 'Founder') {
            return res.status(403).json("You can only edit your own cartel");
        }

        const { name, description, coverImage, pin } = req.body;
        
        let imageUrl = cartel.image;
        if (req.file) {
            imageUrl = req.file.path;
        } else if (req.body.image !== undefined) {
            imageUrl = req.body.image;
        }

        cartel.name = name || cartel.name;
        cartel.description = description !== undefined ? description : cartel.description;
        cartel.image = imageUrl;
        cartel.coverImage = coverImage !== undefined ? coverImage : cartel.coverImage;
        
        if (pin !== undefined) {
            cartel.pin = pin;
            cartel.isPrivate = !!pin;
        }

        const updatedCartel = await cartel.save();
        res.status(200).json(updatedCartel);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json("Cartel name already exists!");
        res.status(500).json(err);
    }
});
`;

if (!cartelsRouteContent.includes('// EDIT CARTEL')) {
    cartelsRouteContent = cartelsRouteContent.replace('// DELETE CARTEL', putRoute + '\n// DELETE CARTEL');
    fs.writeFileSync(cartelsRoutePath, cartelsRouteContent);
    console.log('Added PUT /cartels/:id');
} else {
    console.log('PUT /cartels/:id already exists');
}
