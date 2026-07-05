const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

const oldUsernameRowStr = `<div className="flex items-center justify-center gap-2 sm:gap-3 leading-none uppercase tracking-[0.1em] flex-nowrap whitespace-nowrap overflow-hidden w-full max-w-full px-2">
                                        <span className="profile-headline font-black text-white text-xl sm:text-2xl truncate min-w-0">{displayUser?.username || "Unknown Agent"}</span>
                                        {getActiveStreak(displayUser) > 0 && <span className="text-orange-500 font-bold text-lg sm:text-xl shrink-0 flex items-center gap-1"><span className="text-lg sm:text-xl"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" /></span>{getActiveStreak(displayUser)}</span>}
                                        <VerifiedBadge isFounder={isFounderProfile} isUser={!isFounderProfile} className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 flex-shrink-0 drop-shadow-xl" user={displayUser} showFootballText={true} />
                                    </div>`;

const newUsernameRowStr = `<div className="flex items-center justify-center gap-2 sm:gap-3 leading-none uppercase tracking-[0.1em] flex-nowrap whitespace-nowrap overflow-hidden w-full max-w-full px-2">
                                        <span className="profile-headline font-black text-white text-xl sm:text-2xl truncate min-w-0">{displayUser?.username || "Unknown Agent"}</span>
                                        {getActiveStreak(displayUser) > 0 && <span className="text-orange-500 font-bold text-lg sm:text-xl shrink-0 flex items-center gap-1"><span className="text-lg sm:text-xl"><Icons.Streak className="inline-block w-[1.1em] h-[1.1em] -mt-1" /></span>{getActiveStreak(displayUser)}</span>}
                                        <VerifiedBadge isFounder={isFounderProfile} isUser={!isFounderProfile} className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 flex-shrink-0 drop-shadow-xl" user={displayUser} hideFootball={true} />
                                    </div>
                                    {displayUser?.settings?.footballTeam && (
                                        <div className="mt-3.5 flex items-center justify-center gap-3 drop-shadow-2xl select-none">
                                            <img src={displayUser.settings.footballTeam.strBadge} alt={displayUser.settings.footballTeam.strTeam} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-xl scale-[1.35]" />
                                            <span className="text-[13px] sm:text-[15px] font-black tracking-widest text-white bg-white/10 px-3.5 py-1.5 rounded-lg whitespace-nowrap backdrop-blur-md border border-white/10 shadow-lg uppercase">
                                                {displayUser.settings.footballTeam.strTeam}
                                            </span>
                                        </div>
                                    )}`;

if (appCode.includes(oldUsernameRowStr)) {
    appCode = appCode.replace(oldUsernameRowStr, newUsernameRowStr);
    fs.writeFileSync('src/App.jsx', appCode);
    console.log('App.jsx fixed successfully!');
} else {
    console.log('Could not find the target string in App.jsx');
}
