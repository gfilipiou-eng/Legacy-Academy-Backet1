const fs = require('fs');
const path = require('path');

const fixImagePreview = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find the preview image block
    const oldPreview = `<img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} className="w-full h-full object-cover" />`;
    
    // Replace with a beautiful object-contain block that has a blurred backdrop
    const newPreview = `
                                    <img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" />
                                    <img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} className="relative z-10 w-full h-full object-contain" />
    `;
    
    content = content.replace(oldPreview, newPreview);
    content = content.replace(oldPreview, newPreview); // run twice in case there are multiple (Create and Edit)
    
    fs.writeFileSync(filePath, content);
};

fixImagePreview(path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx'));
fixImagePreview(path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx'));

console.log('Fixed image preview to object-contain so the whole image is visible');
