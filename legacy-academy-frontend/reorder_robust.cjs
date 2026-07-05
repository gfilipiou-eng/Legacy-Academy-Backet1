const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

// The goal is to enforce the order: VerifiedBadge -> Streak -> ProfileDescriptor
// Across all 5 instances in App.jsx.

// 1. Post Card Header (Line ~2698)
const postCardHeaderOld = `<VerifiedBadge isFounder={isFounder} isUser={!isFounder && (author?.settings?.showBadge !== false)} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 flex-shrink-0" user={author} hideFootball={true} />
                                        {author?.profileDescriptor && PROFILE_DESCRIPTOR_MAP[author.profileDescriptor] && (
                                            <div className={\`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 backdrop-blur-xl text-[9px] font-black uppercase tracking-wider shrink-0 \${PROFILE_DESCRIPTOR_MAP[author.profileDescriptor].accentClass.replace(/rounded-none/g, '')}\`}>
                                                {React.createElement(PROFILE_DESCRIPTOR_MAP[author.profileDescriptor].Icon, { className: "w-2.5 h-2.5 shrink-0" })}
                                                <span className="text-[9px] font-black uppercase tracking-[0.12em]">{t(\`DESC_\${author.profileDescriptor.toUpperCase()}\`, PROFILE_DESCRIPTOR_MAP[author.profileDescriptor].label)}</span>
                                            </div>
                                        )}
                                        {getActiveStreak(author) > 0 && <span className="text-orange-500 font-bold text-[11px] sm:text-xs shrink-0 flex items-center"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" />{getActiveStreak(author)}</span>}`;

const postCardHeaderNew = `<VerifiedBadge isFounder={isFounder} isUser={!isFounder && (author?.settings?.showBadge !== false)} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 flex-shrink-0" user={author} hideFootball={true} />
                                        {getActiveStreak(author) > 0 && <span className="text-orange-500 font-bold text-[11px] sm:text-xs shrink-0 flex items-center"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" />{getActiveStreak(author)}</span>}
                                        {author?.profileDescriptor && PROFILE_DESCRIPTOR_MAP[author.profileDescriptor] && (
                                            <div className={\`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 backdrop-blur-xl text-[9px] font-black uppercase tracking-wider shrink-0 \${PROFILE_DESCRIPTOR_MAP[author.profileDescriptor].accentClass.replace(/rounded-none/g, '')}\`}>
                                                {React.createElement(PROFILE_DESCRIPTOR_MAP[author.profileDescriptor].Icon, { className: "w-2.5 h-2.5 shrink-0" })}
                                                <span className="text-[9px] font-black uppercase tracking-[0.12em]">{t(\`DESC_\${author.profileDescriptor.toUpperCase()}\`, PROFILE_DESCRIPTOR_MAP[author.profileDescriptor].label)}</span>
                                            </div>
                                        )}`;
appCode = appCode.replace(postCardHeaderOld, postCardHeaderNew);


// 2. Share Modal Post (Line ~11853)
const shareModalPostOld = `<VerifiedBadge isFounder={shareModalPost.author?.role === 'Founder'} isUser={shareModalPost.author?.role !== 'Founder'} className="w-4 h-4 shrink-0" user={shareModalPost.author} />
                                        {shareModalPost.author?.profileDescriptor && PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor] && (
                                            <div className={\`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 backdrop-blur-xl text-[9px] font-black uppercase tracking-wider shrink-0 \${PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor].accentClass.replace(/rounded-none/g, '')}\`}>
                                                {React.createElement(PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor].Icon, { className: "w-2.5 h-2.5 shrink-0" })}
                                                <span className="text-[9px] font-black uppercase tracking-[0.12em]">{t(\`DESC_\${shareModalPost.author.profileDescriptor.toUpperCase()}\`, PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor].label)}</span>
                                            </div>
                                        )}
                                        {getActiveStreak(shareModalPost?.author) > 0 && <span className="text-orange-500 font-bold text-xs shrink-0 flex items-center"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" />{getActiveStreak(shareModalPost?.author)}{isTopStreak(shareModalPost?.author) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-md tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}`;

const shareModalPostNew = `<VerifiedBadge isFounder={shareModalPost.author?.role === 'Founder'} isUser={shareModalPost.author?.role !== 'Founder'} className="w-4 h-4 shrink-0" user={shareModalPost.author} />
                                        {getActiveStreak(shareModalPost?.author) > 0 && <span className="text-orange-500 font-bold text-xs shrink-0 flex items-center"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" />{getActiveStreak(shareModalPost?.author)}{isTopStreak(shareModalPost?.author) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-md tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}
                                        {shareModalPost.author?.profileDescriptor && PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor] && (
                                            <div className={\`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 backdrop-blur-xl text-[9px] font-black uppercase tracking-wider shrink-0 \${PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor].accentClass.replace(/rounded-none/g, '')}\`}>
                                                {React.createElement(PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor].Icon, { className: "w-2.5 h-2.5 shrink-0" })}
                                                <span className="text-[9px] font-black uppercase tracking-[0.12em]">{t(\`DESC_\${shareModalPost.author.profileDescriptor.toUpperCase()}\`, PROFILE_DESCRIPTOR_MAP[shareModalPost.author.profileDescriptor].label)}</span>
                                            </div>
                                        )}`;
appCode = appCode.replace(shareModalPostOld, shareModalPostNew);


// 3. Public Profile Header Modal
appCode = appCode.replace(
    /\{getActiveStreak\(publicUser\) > 0 && <span className="text-orange-500 font-bold text-base sm:text-lg shrink-0 flex items-center gap-1"><span className="text-base sm:text-lg"><Icons\.Streak className="inline-block w-\[1\.1em\] h-\[1\.1em\] -mt-1" \/><\/span>\{getActiveStreak\(publicUser\)\}<\/span>\}\s*<VerifiedBadge isFounder=\{isFounder\} isUser=\{!isFounder\} className="w-5 h-5 shrink-0" user=\{publicUser\} \/>/,
    `<VerifiedBadge isFounder={isFounder} isUser={!isFounder} className="w-5 h-5 shrink-0" user={publicUser} />
                        {getActiveStreak(publicUser) > 0 && <span className="text-orange-500 font-bold text-base sm:text-lg shrink-0 flex items-center gap-1"><span className="text-base sm:text-lg"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" /></span>{getActiveStreak(publicUser)}</span>}`
);

// 4. Global Search User List
appCode = appCode.replace(
    /\{getActiveStreak\(u\) > 0 && <span className="text-orange-500 font-bold text-xs shrink-0 flex items-center"><Icons\.Streak className="inline-block w-\[1\.1em\] h-\[1\.1em\] -mt-1" \/>\{getActiveStreak\(u\)\}\{isTopStreak\(u\) && <span className="ml-1\.5 px-1\.5 py-0\.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-\[9px\] font-black uppercase rounded-sm shadow-md tracking-widest leading-none align-middle inline-flex items-center gap-0\.5"><Icons\.TrendingUp className="w-2\.5 h-2\.5" \/> TOP<\/span>\}<\/span>\}\s*<VerifiedBadge isFounder=\{u\.role === 'Founder'\} isUser=\{u\.role !== 'Founder'\} className="w-3\.5 h-3\.5 shrink-0" user=\{u\} \/>/,
    `<VerifiedBadge isFounder={u.role === 'Founder'} isUser={u.role !== 'Founder'} className="w-3.5 h-3.5 shrink-0" user={u} />
                                                                    {getActiveStreak(u) > 0 && <span className="text-orange-500 font-bold text-xs shrink-0 flex items-center"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" />{getActiveStreak(u)}{isTopStreak(u) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-md tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}`
);

// 5. Share Modal Profile
appCode = appCode.replace(
    /\{getActiveStreak\(shareModalProfile\) > 0 && <span className="text-orange-500 font-bold text-lg shrink-0"><Icons\.Streak className="inline-block w-\[1\.1em\] h-\[1\.1em\] -mt-1" \/>\{getActiveStreak\(shareModalProfile\)\}\{isTopStreak\(shareModalProfile\) && <span className="ml-1\.5 px-1\.5 py-0\.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-\[9px\] font-black uppercase rounded-sm shadow-md tracking-widest leading-none align-middle inline-flex items-center gap-0\.5"><Icons\.TrendingUp className="w-2\.5 h-2\.5" \/> TOP<\/span>\}<\/span>\}\s*<VerifiedBadge isFounder=\{shareModalProfile\.role === 'Founder'\} isUser=\{shareModalProfile\.role !== 'Founder'\} className="w-6 h-6 shrink-0" user=\{shareModalProfile\} \/>/,
    `<VerifiedBadge isFounder={shareModalProfile.role === 'Founder'} isUser={shareModalProfile.role !== 'Founder'} className="w-6 h-6 shrink-0" user={shareModalProfile} />
                                    {getActiveStreak(shareModalProfile) > 0 && <span className="text-orange-500 font-bold text-lg shrink-0 flex items-center"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" />{getActiveStreak(shareModalProfile)}{isTopStreak(shareModalProfile) && <span className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-md tracking-widest leading-none align-middle inline-flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}</span>}`
);


fs.writeFileSync('src/App.jsx', appCode);
console.log('App.jsx layout successfully fixed!');
