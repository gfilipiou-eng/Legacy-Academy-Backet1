const fs = require('fs');
const path = require('path');

// 1. Fix Cartels.jsx
const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

// A. Fix PIN Modal Z-Index and add padding for navbar
cartelsContent = cartelsContent.replace(
    '<div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">',
    '<div className="fixed inset-0 z-[50000] flex items-center justify-center p-4 pb-24 bg-black/80 backdrop-blur-md">'
);

// B. Make Cartels List look like Posts (Big Cards instead of Grid)
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
                                        <h3 className="text-white font-bold text-lg truncate  tracking-widest">{cartel.name}</h3>
                                        <p className="text-white/50 text-xs truncate mt-1">{cartel.description || 'No description'}</p>
                                        <div className="text-[var(--gold-primary)] text-xs font-bold mt-2  tracking-wider">
                                            {cartel.members?.length || 0} {t('CARTELS_MEMBERS', 'Members')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>`;

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

cartelsContent = cartelsContent.replace(oldGrid, newList);
fs.writeFileSync(cartelsPath, cartelsContent);

// 2. Fix CartelView.jsx (Posts inside cartel become Chat Bubbles)
const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cvContent = fs.readFileSync(cartelViewPath, 'utf8');

const cartelMessageComp = `
const CartelMessage = ({ post, user, allUsers, onViewProfile }) => {
    const author = allUsers.find(u => u._id === post.userId) || post.userId || {};
    const isMe = author._id === user._id;

    return (
        <div className={\`flex w-full mb-6 \${isMe ? 'justify-end' : 'justify-start'}\`}>
            <div className={\`max-w-[85%] sm:max-w-[70%] flex flex-col gap-1.5 \${isMe ? 'items-end' : 'items-start'}\`}>
                {!isMe && (
                    <div className="flex items-center gap-2 px-2 cursor-pointer" onClick={() => onViewProfile(author)}>
                        <img src={author.profilePic || 'https://via.placeholder.com/150'} className="w-7 h-7 rounded-full object-cover border border-white/20" />
                        <span className="text-[11px] text-white/50 font-black tracking-widest uppercase">{author.username || 'Unknown'}</span>
                    </div>
                )}
                <div className={\`p-4 rounded-3xl shadow-xl \${isMe ? 'bg-[var(--gold-primary)] text-black rounded-tr-sm' : 'bg-[#1a1a1a] border border-white/5 text-white rounded-tl-sm'}\`}>
                    {post.imageUrl && (
                        <img src={post.imageUrl} className="w-full max-h-72 object-cover rounded-2xl mb-3 border border-black/10" />
                    )}
                    {post.desc && (
                        <p className="text-[15px] font-bold whitespace-pre-wrap leading-relaxed break-words">{post.desc}</p>
                    )}
                </div>
                <div className="text-[10px] text-white/30 font-bold px-2">
                    {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
        </div>
    );
};
`;

// Insert the CartelMessage component right before EditCartelModal
if (!cvContent.includes('const CartelMessage')) {
    cvContent = cvContent.replace(
        'const EditCartelModal = ({ onClose, onUpdated, cartel, t }) => {',
        cartelMessageComp + '\nconst EditCartelModal = ({ onClose, onUpdated, cartel, t }) => {'
    );
}

// Replace PostCard with CartelMessage
cvContent = cvContent.replace(
    /<PostCard key=\{post\._id\} post=\{post\} user=\{user\} t=\{t\} lang=\{lang\} onEditPost=\{onEditPost\} onDeletePost=\{onDeletePost\} allUsers=\{allUsers\} onViewProfile=\{onViewProfile\} \/>/g,
    '<CartelMessage key={post._id} post={post} user={user} allUsers={allUsers} onViewProfile={onViewProfile} />'
);

fs.writeFileSync(cartelViewPath, cvContent);

console.log('Fixed Cartel Grid layout, PIN modal z-index, and replaced Cartel Posts with Chat Bubbles');
