const NotificationItem = memo(({ note, onViewProfile, onOpenPost, onOpenChat, onAcceptRequest, onRejectRequest, onDelete, t, lang }) => {
    const handleClick = () => {
        if (note.type === 'message') onOpenChat(note.sender);
        else if (note.type === 'follow_request') onViewProfile(note.sender);
        else if (note.type === 'security_alert') onOpenPost(note.post || note.postId);
        else if (note.post || note.postId) onOpenPost(note.post || note.postId);
        else onViewProfile(note.sender);

    };

    const isFounderSender = note?.sender?.role === 'Founder' || note?.fromRole === 'Founder';

    return (
        <div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`relative flex items-center gap-4 p-4 rounded-[24px] cursor-pointer border transition-all duration-300 mb-3 group overflow-hidden ${
                note.read 
                    ? 'bg-black/40 border-white/5 hover:bg-white/[0.03] hover:border-white/10' 
                    : 'bg-gradient-to-r from-[var(--gold-primary)]/10 to-transparent border-[var(--gold-primary)]/30 hover:border-[var(--gold-primary)]/50 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
            }`}
            onClick={handleClick}
        >
            {/* Ambient Background Glow for unread */}
            {!note.read && (
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--gold-primary)]/5 to-transparent pointer-events-none" />
            )}
            <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 relative">
                    <ProfileAvatar user={{ username: note.fromUsername, profilePic: note.fromProfilePic }} />
                </div>
                {note.type === 'like' && (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 border border-black shadow-lg">
                        <Icons.Heart className="w-2.5 h-2.5 text-white fill-current" />
                    </div>
                )}
                {note.type === 'comment' && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border border-black shadow-lg">
                        <Icons.MessageSquare className="w-2.5 h-2.5 text-white fill-current" />
                    </div>
                )}
                {note.type === 'message' && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border border-black shadow-lg">
                        <Icons.Mail className="w-2.5 h-2.5 text-white" />
                    </div>
                )}
                {note.type === 'follow' && (
                    <div className="absolute -bottom-1 -right-1 bg-[var(--gold-primary)] rounded-full p-1 border border-black shadow-lg">
                        <Icons.UserPlus className="w-2.5 h-2.5 text-black" />
                    </div>
                )}
                {note.type === 'follow_request' && (
                    <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1 border border-black shadow-lg">
                        <Icons.Shield className="w-2.5 h-2.5 text-white" />
                    </div>
                )}
                {note.type === 'security_alert' && (
                    <div className="absolute -bottom-1 -right-1 bg-orange-500 rounded-full p-1 border border-black shadow-lg ">
                        <Icons.ShieldCheck className="w-2.5 h-2.5 text-white" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-white uppercase tracking-tight text-xs sm:text-sm">
                        {(note.fromUsername && note.fromUsername !== 'Unknown' && note.fromUsername !== 'Someone') ? note.fromUsername : 'Agent'}
                    </span>
                    <VerifiedBadge isFounder={isFounderSender} isUser={!isFounderSender} className="w-3.5 h-3.5" user={note.sender} />
                    {getActiveStreak(note?.sender) > 0 && (
                        <span className="text-orange-500 font-bold text-[11px] shrink-0 flex items-center"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" />{getActiveStreak(note?.sender)}</span>
                    )}
                    {note.sender?.profileDescriptor && PROFILE_DESCRIPTOR_MAP[note.sender.profileDescriptor] ? (
                        <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 backdrop-blur-xl text-[9px] font-black uppercase tracking-wider shrink-0 ${PROFILE_DESCRIPTOR_MAP[note.sender.profileDescriptor].accentClass.replace(/rounded-none/g, '').replace(/!/g, '')}`}>
                            {React.createElement(PROFILE_DESCRIPTOR_MAP[note.sender.profileDescriptor].Icon, { className: "w-2.5 h-2.5 shrink-0" })}
                            <span className="text-[9px] font-black uppercase tracking-[0.12em]">{t(`DESC_${note.sender.profileDescriptor.toUpperCase()}`, PROFILE_DESCRIPTOR_MAP[note.sender.profileDescriptor].label)}</span>
                        </div>
                    ) : (note?.fromDescriptor && (
                        <span className="text-[9px] text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/20 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest shrink-0">
                            {t(`DESC_${note.fromDescriptor.toUpperCase()}`, note.fromDescriptor)}
                        </span>
                    ))}

                </div>

                <div className="text-[11px] sm:text-xs text-gray-300 mt-1 uppercase font-bold tracking-wider leading-snug">
                    {note.type === 'follow' ? t('NOTIF_FOLLOW') :
                        note.type === 'like' ? t('NOTIF_LIKE') :
                            note.type === 'comment' ? t('NOTIF_COMMENT') :
                                note.type === 'message' ? t('NOTIF_MESSAGE') :
                                    note.type === 'mention' ? t('NOTIF_MENTION') :
                                        note.type === 'security_alert' ? (lang === 'el' ? 'ΑΝΕΥΡΕΣΗ ΑΝΩΜΑΛΙΑΣ' : 'SECURITY ANOMALY DETECTED') :
                                            note.type === 'follow_request' ? t('NOTIF_REQUEST') : ''}
                </div>

                {note.text && (
                    <div className="text-xs text-gray-400 mt-1.5 p-2 bg-white/[0.02] border border-white/5 rounded-lg italic font-medium max-w-full truncate">
                        "{note.text}"
                    </div>
                )}

                <div className="flex items-center gap-3 mt-2">
                    <CyberDate date={note.createdAt} t={t} lang={lang} />
                    {!note.read && (
                        <span className="text-[8px] font-black uppercase text-[var(--gold-primary)] bg-[var(--gold-primary)]/10 px-1.5 py-0.5 rounded border border-[var(--gold-primary)]/20">NEW</span>
                    )}
                </div>

                {note.type === 'follow_request' && (
                    <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => onAcceptRequest(note.sender?._id || note.from, note._id)} className="flex-1 py-1.5 bg-[var(--gold-primary)] text-black text-[10px] font-black rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform uppercase tracking-widest">{t('ACCEPT')}</button>
                        <button onClick={() => onRejectRequest(note.sender?._id || note.from, note._id)} className="flex-1 py-1.5 bg-white/5 text-gray-400 text-[10px] font-black rounded-lg hover:bg-white/10 uppercase tracking-widest">{t('REJECT')}</button>
                    </div>
                )}
            </div>

            {note.postImage && (
                <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden shrink-0">
                    <img 
                        src={resolveMediaUrl(note.postImage)} 
                        className="w-full h-full object-cover opacity-80" 
                        onError={(e) => { e.target.style.display = 'none'; }} 
                        alt=""
                    />
                </div>
            )}

            {onDelete && (
                <button 
                    onClick={(e) => onDelete(note._id, e)}
                    className="absolute top-3 right-3 p-1.5 text-gray-500 hover:bg-red-500 hover:text-white rounded-full transition-all duration-200 z-10 active:scale-95 bg-black/40 sm:bg-transparent sm:opacity-0 sm:group-hover:opacity-100 sm:hover:bg-red-500 border border-white/5 sm:border-transparent shadow-lg"
                    title={t('DELETE_NOTIF', 'Delete')}
                >
                    <Icons.X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
});

const StoriesBar = ({ stories, user, onAddStory, onViewStory, imgKey }) => {
    const { t } = useTranslation(user);
    const storySizeClass = 'w-[74px] h-[74px] sm:w-[76px] sm:h-[76px]';
    return (
        <div className="flex gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar py-3.5 px-3 sm:px-4 border-b border-white/5 bg-transparent">
            {/* CURRENT USER ADD STORY */}
            <div onClick={onAddStory} className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0">
                <div className={`${storySizeClass} rounded-full relative group border-2 border-dashed border-white/25 bg-white/[0.03]`}>
                    <div className="absolute inset-[3px] rounded-full overflow-hidden bg-[#050505]">
                        <ProfileAvatar user={user} className="object-cover w-full h-full" key={imgKey} cacheKey={imgKey} />
                        <div className="absolute inset-0 bg-black/30" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 group-active:scale-95 transition-all duration-300">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{t('ADD_STORY')}</span>
            </div>

            {stories && stories.map((s, i) => {
                const isYT = isYouTubeUrl(s.videoUrl);
                const isNativeVideo = (!isYT) && ((s.videoUrl && s.videoUrl.match(/\.(mp4|mov|webm|avi|m4v)$/i)) || (s.image && s.image.match(/\.(mp4|mov|webm|avi|m4v)$/i)));
                const authorName = s.author?.username || 'Agent';
                const hasStoryMedia = postHasMedia(s);
                const storyMediaUrl = hasStoryMedia ? (s.thumbnailUrl || s.image || s.videoUrl) : null;

                return (
                    <div key={s._id || i} onClick={() => onViewStory(s)} className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group">
                        <div className={`${storySizeClass} rounded-full p-[2.5px] bg-gradient-to-tr from-[#1D9BF0]/90 via-[#1D9BF0]/40 to-white/30 relative transform-gpu`}>
                            <div className="w-full h-full rounded-full overflow-hidden bg-black border border-black">
                                {hasStoryMedia && storyMediaUrl ? (
                                    <img 
                                        src={resolveMediaUrl(storyMediaUrl, null, false, true)} 
                                        className="w-full h-full object-cover object-center" 
                                        alt="" 
                                        onError={(e) => { e.target.style.display = 'none'; }} 
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#111] p-1.5 flex items-center justify-center">
                                        <span className="text-white text-[7px] font-bold text-center break-words line-clamp-4 leading-tight">
                                            {getPostTextPreview(s.desc, 48)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {(isNativeVideo || isYT) && (
                                <div className="absolute bottom-0 right-0 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center border border-black z-10">
                                    <Icons.Play className="w-2.5 h-2.5 fill-black pl-[0.5px]" />
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider group-hover:text-white transition-colors max-w-[68px] truncate text-center">{authorName}</span>
                    </div>
                );
            })}
        </div>
    );
};

const AudioPlayer = memo(({ audioUrl, trackName }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="w-full p-4 sm:p-6 bg-gradient-to-br from-[#121212] to-[#181818] rounded-2xl border border-white/10 shadow-xl flex flex-col gap-4">
            <audio 
                ref={audioRef}
                src={audioUrl} 
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />
            
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-[#1DB954] to-[#1ed760] flex items-center justify-center shrink-0 shadow-lg">
                    <Icons.Music className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm sm:text-base truncate">{trackName}</div>
                    <div className="text-white/50 text-xs sm:text-sm mt-1">Audio</div>
                </div>
                <button 
                    onClick={togglePlay}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1DB954] flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg shadow-[#1DB954]/40"
                >
                    {isPlaying ? (
                        <Icons.Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                    ) : (
                        <Icons.Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                    )}
                </button>
            </div>

            <div className="flex flex-col gap-2">
                <div className="relative w-full h-1.5 sm:h-2 bg-white/20 rounded-full cursor-pointer group">
                    <div 
                        className="absolute top-0 left-0 h-full bg-[#1DB954] rounded-full transition-all duration-100"
                        style={{ width: `${progressPercent}%` }}
                    />
                    <input 
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ left: `calc(${progressPercent}% - 6px)` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs text-white/50 font-bold">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
});