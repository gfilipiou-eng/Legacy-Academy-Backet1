const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const newNotifItem = `const NotificationItem = memo(({ note, onViewProfile, onOpenPost, onOpenChat, onAcceptRequest, onRejectRequest, onDelete, t, lang }) => {
    const handleClick = () => {
        if (note.type === 'message') onOpenChat(note.sender);
        else if (note.type === 'follow_request') onViewProfile(note.sender);
        else if (note.type === 'security_alert') onOpenPost(note.post || note.postId);
        else if (note.post || note.postId) onOpenPost(note.post || note.postId);
        else onViewProfile(note.sender);
    };

    const isFounderSender = note?.sender?.role === 'Founder' || note?.fromRole === 'Founder';

    // Rich colors for different notification types
    const getTypeConfig = () => {
        switch(note.type) {
            case 'like': return { color: 'bg-red-500', glow: 'from-red-500/10', icon: Icons.Heart, textClass: 'text-red-400' };
            case 'comment': return { color: 'bg-blue-500', glow: 'from-blue-500/10', icon: Icons.MessageSquare, textClass: 'text-blue-400' };
            case 'message': return { color: 'bg-green-500', glow: 'from-green-500/10', icon: Icons.Mail, textClass: 'text-green-400' };
            case 'follow': return { color: 'bg-[var(--gold-primary)]', glow: 'from-[var(--gold-primary)]/10', icon: Icons.UserPlus, textClass: 'text-[var(--gold-primary)]' };
            case 'follow_request': return { color: 'bg-purple-500', glow: 'from-purple-500/10', icon: Icons.Shield, textClass: 'text-purple-400' };
            case 'security_alert': return { color: 'bg-orange-500', glow: 'from-orange-500/10', icon: Icons.ShieldCheck, textClass: 'text-orange-400' };
            case 'mention': return { color: 'bg-cyan-500', glow: 'from-cyan-500/10', icon: Icons.AtSign, textClass: 'text-cyan-400' };
            default: return { color: 'bg-gray-500', glow: 'from-gray-500/10', icon: Icons.Bell, textClass: 'text-gray-400' };
        }
    };
    
    const config = getTypeConfig();

    return (
        <div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={\`relative flex items-start gap-4 p-4 rounded-2xl cursor-pointer border backdrop-blur-md transition-all duration-300 mb-3 group overflow-hidden \${
                note.read 
                    ? 'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/20' 
                    : 'bg-white/[0.02] border-white/10 hover:border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)]'
            }\`}
            onClick={handleClick}
        >
            {/* Ambient Background Glow based on type */}
            <div className={\`absolute inset-0 bg-gradient-to-r \${config.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none\`} />
            {!note.read && (
                <div className={\`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b \${config.glow.replace('from-', 'from-').replace('/10', '/50')} to-transparent\`} />
            )}

            <div className="relative shrink-0 mt-1">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 relative group-hover:scale-105 transition-transform duration-300">
                    <ProfileAvatar user={{ username: note.fromUsername, profilePic: note.fromProfilePic }} />
                </div>
                <div className={\`absolute -bottom-1 -right-1 \${config.color} rounded-full p-1 border-2 border-black shadow-lg z-10\`}>
                    <config.icon className="w-3 h-3 text-white fill-current" />
                </div>
            </div>

            <div className="flex-1 min-w-0 text-left relative z-10">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-white uppercase tracking-tight text-xs sm:text-sm group-hover:text-[var(--gold-primary)] transition-colors duration-200">
                            {(note.fromUsername && note.fromUsername !== 'Unknown' && note.fromUsername !== 'Someone') ? note.fromUsername : 'Agent'}
                        </span>
                        <VerifiedBadge isFounder={isFounderSender} isUser={!isFounderSender} className="w-3.5 h-3.5" user={note.sender} />
                        {getActiveStreak(note?.sender) > 0 && (
                            <span className="text-orange-500 font-bold text-[11px] shrink-0 flex items-center"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" />{getActiveStreak(note?.sender)}</span>
                        )}
                    </div>
                    {!note.read && (
                        <div className="w-2 h-2 rounded-full bg-[var(--gold-primary)] animate-pulse shadow-[0_0_10px_var(--gold-primary)] shrink-0" />
                    )}
                </div>

                <div className={\`text-[11px] sm:text-xs mt-1 uppercase font-black tracking-wider leading-snug \${config.textClass}\`}>
                    {note.type === 'follow' ? t('NOTIF_FOLLOW') || 'STARTED FOLLOWING YOU' :
                        note.type === 'like' ? t('NOTIF_LIKE') || 'LIKED YOUR POST' :
                            note.type === 'comment' ? t('NOTIF_COMMENT') || 'COMMENTED ON YOUR POST' :
                                note.type === 'message' ? t('NOTIF_MESSAGE') || 'SENT YOU A MESSAGE' :
                                    note.type === 'mention' ? t('NOTIF_MENTION') || 'MENTIONED YOU' :
                                        note.type === 'security_alert' ? 'SECURITY ANOMALY DETECTED' :
                                            note.type === 'follow_request' ? t('NOTIF_REQUEST') || 'WANTS TO FOLLOW YOU' : ''}
                </div>

                {note.text && (
                    <div className="text-xs text-gray-300 mt-2 p-2.5 bg-black/40 border border-white/5 rounded-xl font-medium max-w-full line-clamp-2 leading-relaxed shadow-inner">
                        <span className="opacity-50 italic">"</span>{note.text}<span className="opacity-50 italic">"</span>
                    </div>
                )}

                <div className="flex items-center gap-3 mt-2.5">
                    <CyberDate date={note.createdAt} t={t} lang={lang} />
                </div>

                {note.type === 'follow_request' && (
                    <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => onAcceptRequest(note.sender?._id || note.from, note._id)} className="flex-1 py-2 bg-[var(--gold-primary)] text-black text-[10px] font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.3)]">{t('ACCEPT')}</button>
                        <button onClick={() => onRejectRequest(note.sender?._id || note.from, note._id)} className="flex-1 py-2 bg-white/5 text-white text-[10px] font-black rounded-xl hover:bg-white/10 uppercase tracking-widest">{t('REJECT')}</button>
                    </div>
                )}
            </div>

            {note.postImage && (
                <div className="w-14 h-14 rounded-xl border border-white/10 overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <img 
                        src={resolveMediaUrl(note.postImage)} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.target.style.display = 'none'; }} 
                        alt=""
                    />
                </div>
            )}

            {onDelete && (
                <button
                    onClick={(e) => onDelete(note._id, e)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                    title={t('DELETE_NOTIF') || 'Delete'}
                >
                    <Icons.X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
});`;

const startIdx = code.indexOf('const NotificationItem = memo');
const endIdx = code.indexOf('const PostCard = memo');

if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + newNotifItem + '\n\n' + code.substring(endIdx);
    fs.writeFileSync('src/App.jsx', code);
    console.log('Successfully replaced NotificationItem');
} else {
    console.log('Could not find boundaries');
}
