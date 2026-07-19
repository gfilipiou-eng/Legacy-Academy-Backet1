const fs = require('fs');
const path = require('path');

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cvContent = fs.readFileSync(cartelViewPath, 'utf8');

// 1. Remove the FAB
const fabRegex = /\{\s*isMember\s*&&\s*\(\s*<button\s*onClick=\{\(\)\s*=>\s*onCreatePost\(cartel\._id\)\}[\s\S]*?<Icons\.Upload[^>]*>\s*<\/button>\s*\)\s*\}/;
cvContent = cvContent.replace(fabRegex, '');

// 2. Add "Decrypt your thoughts" box BEFORE the posts list
const decryptBox = `            {isMember && (
                <div className="px-4 py-3 mb-4 flex items-center gap-3 bg-[#111] border border-white/5 rounded-2xl mx-4 mt-6 cursor-pointer hover:bg-white/5 transition"
                    onClick={() => onCreatePost(cartel._id)}
                >
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {user?.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : <Icons.User className="w-5 h-5 text-gray-500" />}
                    </div>
                    <div className="text-gray-500 font-bold uppercase tracking-widest text-xs flex-1 text-left">
                        {t('DECRYPT_PH', 'Decrypt your thoughts...')}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Icons.Image className="w-5 h-5" />
                    </div>
                </div>
            )}`;

cvContent = cvContent.replace(
    '{isMember && (\n                <div className="flex-1">',
    decryptBox + '\n            {isMember && (\n                <div className="flex-1">'
);

// 3. Fix Edit button position so it's not under the status bar
cvContent = cvContent.replace(
    'className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-4 z-50 flex gap-2"',
    'className="absolute top-4 sm:top-6 right-4 sm:right-6 mt-[env(safe-area-inset-top)] z-50 flex gap-2"'
);

cvContent = cvContent.replace(
    'className="absolute top-[calc(env(safe-area-inset-top)+1rem)] left-4 z-50 w-10 h-10',
    'className="absolute top-4 sm:top-6 left-4 sm:left-6 mt-[env(safe-area-inset-top)] z-50 w-10 h-10'
);

// 4. Fix EditCartelModal / CreateCartelModal to be simpler and not break on some phones
// Instead of w-full h-[100dvh] flex flex-col, let's use a normal padded div that scrolls
const fixModal = (content, startTag, endTag) => {
    const s = content.indexOf(startTag);
    if (s === -1) return content;
    const e = content.indexOf(endTag, s);
    if (e === -1) return content;
    
    // Replace the complicated full screen layout with a robust container
    return content.replace(
        '<div className="fixed inset-0 z-[20000] flex items-center justify-center sm:p-4">\n            <div className="absolute inset-0 bg-black/80 backdrop-blur-md hidden sm:block" onClick={onClose} />\n            <motion.div \n                initial={{ opacity: 0, y: 50 }} \n                animate={{ opacity: 1, y: 0 }} \n                exit={{ opacity: 0, y: 50 }} \n                className="relative w-full h-[100dvh] sm:h-auto sm:max-w-[420px] sm:max-h-[88dvh] rounded-none sm:rounded-3xl overflow-hidden flex flex-col bg-[#0a0a0a] sm:bg-[#111] border-0 sm:border border-white/10 shadow-2xl"\n            >',
        '<div className="fixed inset-0 z-[20000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm sm:backdrop-blur-md">\n            <div className="absolute inset-0" onClick={onClose} />\n            <motion.div \n                initial={{ opacity: 0, y: 100 }} \n                animate={{ opacity: 1, y: 0 }} \n                exit={{ opacity: 0, y: 100 }} \n                className="relative w-full max-w-[420px] max-h-[90vh] sm:max-h-[88dvh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col bg-[#0a0a0a] sm:bg-[#111] border-t sm:border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] sm:shadow-2xl"\n            >'
    );
};

cvContent = fixModal(cvContent, '<div className="fixed inset-0 z-[20000]', '</motion.div>');
fs.writeFileSync(cartelViewPath, cvContent);

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');
cartelsContent = fixModal(cartelsContent, '<div className="fixed inset-0 z-[20000]', '</motion.div>');
fs.writeFileSync(cartelsPath, cartelsContent);

console.log('Fixed CartelView decrypt box and modal layout');
