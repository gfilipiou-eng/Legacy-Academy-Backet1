const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Hide Top Nav when selectedCartel is active
appContent = appContent.replace(
    "{!isChatOpen && !isProfileOpen && !isSettingsOpen && !selectedPost && (",
    "{!isChatOpen && !isProfileOpen && !isSettingsOpen && !selectedPost && !selectedCartel && ("
);

// Hide Bottom Nav when selectedCartel is active
appContent = appContent.replace(
    "{(!isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost) && (",
    "{(!isChatOpen && !isProfileOpen && !isSettingsOpen && !isCreateOpen && !isEditOpen && !selectedPost && !selectedCartel) && ("
);

fs.writeFileSync(appPath, appContent);

// Fix CreateCartelModal padding in Cartels.jsx so it fits between navbars
const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

cartelsContent = cartelsContent.replace(
    '<div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">',
    '<div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 pt-[100px] pb-[100px]">'
);

fs.writeFileSync(cartelsPath, cartelsContent);

console.log('Fixed navbar overlap and modal padding');
