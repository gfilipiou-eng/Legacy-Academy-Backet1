const fs = require('fs');
const path = require('path');

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

const newList = `<div className="flex flex-col gap-6">
                        {filtered.map(cartel => (
                            <div key={cartel._id} onClick={() => onViewCartel(cartel)} className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden cursor-pointer hover:border-white/10 transition-colors shadow-2xl">
                                <div className="w-full h-48 sm:h-64 relative bg-black/50">
                                    {cartel.image ? (
                                        <img src={cartel.image} alt={cartel.name} className="w-full h-full object-cover object-center" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Icons.Users className="w-16 h-16 text-white/20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
                                </div>
                                <div className="p-5 sm:p-6 -mt-16 relative z-10 flex flex-col gap-2">
                                    <h3 className="text-white font-black text-2xl sm:text-3xl tracking-widest drop-shadow-lg">{cartel.name}</h3>
                                    <div className="flex items-center gap-2 text-[var(--gold-primary)] text-xs font-black tracking-widest uppercase bg-[var(--gold-primary)]/10 self-start px-3 py-1.5 rounded-xl border border-[var(--gold-primary)]/20 shadow-md backdrop-blur-md">
                                        <Icons.Users className="w-4 h-4" />
                                        {cartel.members?.length || 0} {t('CARTELS_MEMBERS', 'Members')}
                                    </div>
                                    <p className="text-white/70 text-sm mt-3 font-medium leading-relaxed">{cartel.description || 'No description'}</p>
                                </div>
                            </div>
                        ))}
                    </div>`;

const oldGrid = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filtered.map(cartel => (
                            <div key={cartel._id} onClick={() => onViewCartel(cartel)} className="bg-white/5 border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-black/50 overflow-hidden shrink-0 border border-white/10 group-hover:border-[var(--gold-primary)] transition-colors">
                                        {cartel.image ? (
                                            <img src={cartel.image} alt={cartel.name} className="w-full h-full object-cover object-center bg-black" />
                                        ) : (
                                            <Icons.Users className="w-8 h-8 m-4 text-white/20" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold text-lg truncate tracking-widest">{cartel.name}</h3>
                                        <p className="text-white/50 text-xs truncate mt-1">{cartel.description || 'No description'}</p>
                                        <div className="text-[var(--gold-primary)] text-xs font-bold mt-2 tracking-wider">
                                            {cartel.members?.length || 0} {t('CARTELS_MEMBERS', 'Members')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>`;

cartelsContent = cartelsContent.replace(newList, oldGrid);
fs.writeFileSync(cartelsPath, cartelsContent);

// ADD IMAGE PREVIEW TO MODALS (Both Create and Edit)
const addImagePreview = (content) => {
    const previewComponent = `{/* PREVIEW AREA */}
                            {(imageFile || imageUrl) && (
                                <div className="relative w-full h-40 sm:h-48 rounded-2xl overflow-hidden bg-black/50 border border-white/10 mb-2">
                                    <img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => { setImageFile(null); setImageUrl(''); }} className="absolute top-2 right-2 p-2 bg-black/80 rounded-full hover:bg-red-500 transition-colors">
                                        <Icons.X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}`;

    // Replace the image upload div area to include preview above the buttons
    const target = `<div className="flex gap-2">
                                <input type="file"`;
    
    return content.replace(target, previewComponent + '\n                            ' + target);
};

cartelsContent = fs.readFileSync(cartelsPath, 'utf8');
cartelsContent = addImagePreview(cartelsContent);

// Remove the red X button that was next to the upload button because we have one on the preview now
cartelsContent = cartelsContent.replace(
    /\{imageFile && <button type="button" onClick=\{[\s\S]*?className="p-4 bg-red-500\/20 text-red-500 rounded-2xl hover:bg-red-500\/40"><Icons.X className="w-5 h-5"\/><\/button>\}/,
    ''
);
// Also hide the URL input if imageFile or imageUrl exists
cartelsContent = cartelsContent.replace(
    '{!imageFile && (',
    '{!imageFile && !imageUrl && ('
);
fs.writeFileSync(cartelsPath, cartelsContent);

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cvContent = fs.readFileSync(cartelViewPath, 'utf8');

// Also revert the CartelMessage "alo style" because they meant they DO want it like Posts!
cvContent = cvContent.replace(
    '<CartelMessage key={post._id} post={post} user={user} allUsers={allUsers} onViewProfile={onViewProfile} />',
    '<PostCard key={post._id} post={post} user={user} t={t} lang={lang} onEditPost={onEditPost} onDeletePost={onDeletePost} allUsers={allUsers} onViewProfile={onViewProfile} />'
);

cvContent = addImagePreview(cvContent);

cvContent = cvContent.replace(
    /\{imageFile && <button type="button" onClick=\{[\s\S]*?className="p-4 bg-red-500\/20 text-red-500 rounded-2xl hover:bg-red-500\/40"><Icons.X className="w-5 h-5"\/><\/button>\}/,
    ''
);
cvContent = cvContent.replace(
    '{!imageFile && (',
    '{!imageFile && !imageUrl && ('
);

fs.writeFileSync(cartelViewPath, cvContent);

console.log('Fixed Cartels grid list, reverted CartelMessage to PostCard, and added big image previews to modals');
