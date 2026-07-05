const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const newStoriesBar = `const StoriesBar = ({ stories, user, onAddStory, onViewStory, imgKey }) => {
    const { t } = useTranslation(user);
    const storySizeClass = 'w-[68px] h-[68px] sm:w-[72px] sm:h-[72px]';
    return (
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-3 px-4 border-b border-white/5 bg-transparent">
            {/* CURRENT USER ADD STORY */}
            <div onClick={onAddStory} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                <div className={\`\${storySizeClass} rounded-full relative group\`}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#111]">
                        <ProfileAvatar user={user} className="object-cover w-full h-full" key={imgKey} cacheKey={imgKey} />
                    </div>
                    <div className="absolute bottom-0 right-0 w-[22px] h-[22px] bg-[#0095f6] text-white rounded-full border-[3px] border-black flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                </div>
                <span className="text-[11px] text-gray-400 mt-1 max-w-[72px] truncate text-center">{t('YOUR_STORY') || 'Your story'}</span>
            </div>

            {stories && stories.map((s, i) => {
                const isYT = isYouTubeUrl(s.videoUrl);
                const isNativeVideo = (!isYT) && ((s.videoUrl && s.videoUrl.match(/\\.(mp4|mov|webm|avi|m4v)$/i)) || (s.image && s.image.match(/\\.(mp4|mov|webm|avi|m4v)$/i)));
                const authorName = s.author?.username || 'Agent';
                const hasStoryMedia = postHasMedia(s);
                const storyMediaUrl = hasStoryMedia ? (s.thumbnailUrl || s.image || s.videoUrl) : null;

                return (
                    <div key={s._id || i} onClick={() => onViewStory(s)} className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group">
                        <div className={\`\${storySizeClass} rounded-full p-[2.5px] bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] via-[#d62976] to-[#962fbf] relative transform-gpu hover:scale-[1.02] active:scale-95 transition-all duration-200\`}>
                            <div className="w-full h-full rounded-full overflow-hidden bg-black border-[2.5px] border-black">
                                {hasStoryMedia && storyMediaUrl ? (
                                    <img 
                                        src={resolveMediaUrl(storyMediaUrl, null, false, true)} 
                                        className="w-full h-full object-cover object-center" 
                                        alt="" 
                                        onError={(e) => { e.target.style.display = 'none'; }} 
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#222] p-1.5 flex items-center justify-center">
                                        <span className="text-white text-[7px] font-bold text-center break-words line-clamp-4 leading-tight">
                                            {getPostTextPreview(s.desc, 48)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {(isNativeVideo || isYT) && (
                                <div className="absolute bottom-0 right-0 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center border-2 border-black z-10">
                                    <Icons.Play className="w-2.5 h-2.5 fill-black pl-[1px]" />
                                </div>
                            )}
                        </div>
                        <span className="text-[11px] text-gray-200 mt-1 max-w-[72px] truncate text-center group-hover:text-white transition-colors">{authorName}</span>
                    </div>
                );
            })}
        </div>
    );
};`;

const startIdx = code.indexOf('const StoriesBar =');
const endIdx = code.indexOf('const AudioPlayer =');

if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + newStoriesBar + '\n\n' + code.substring(endIdx);
    fs.writeFileSync('src/App.jsx', code);
    console.log('Successfully replaced StoriesBar');
} else {
    console.log('Could not find boundaries');
}
