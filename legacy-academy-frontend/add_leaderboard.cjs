const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Inject the Leaderboard component definition before App = () => {
const leaderboardCode = `
const StreakLeaderboardModal = ({ users, onClose, currentUser }) => {
    const { t } = useLanguage();
    const sortedUsers = [...(users || [])]
        .filter(u => !u.isPrivate && getActiveStreak(u) > 0)
        .sort((a, b) => getActiveStreak(b) - getActiveStreak(a))
        .slice(0, 50);

    return (
        <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f0f13] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(249,115,22,0.1)]">
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                            <Icons.Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-white text-lg uppercase tracking-widest">Top Streaks</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global Rank List</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative">
                    {sortedUsers.length === 0 ? (
                        <div className="text-center text-gray-500 py-12 text-sm font-bold uppercase tracking-wider">No active streaks found.</div>
                    ) : sortedUsers.map((u, i) => (
                        <div key={u._id} className={\`flex items-center gap-3 p-3 rounded-2xl border transition-all \${u._id === currentUser?._id ? 'bg-orange-500/10 border-orange-500/30 scale-[1.02]' : 'bg-black/40 border-white/5 hover:bg-white/[0.02]'}\`}>
                            <div className="w-8 font-black text-gray-500 text-center text-xs tracking-widest">#{i + 1}</div>
                            <img src={u.profilePic || 'https://via.placeholder.com/150'} alt={u.username} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                <div className="font-bold text-white text-base truncate">{u.username}</div>
                                {isTopStreak(u) && <span className="px-1.5 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-black text-[9px] font-black uppercase rounded-sm shadow-[0_0_10px_rgba(249,115,22,0.6)] tracking-widest leading-none shrink-0 flex items-center gap-0.5"><Icons.TrendingUp className="w-2.5 h-2.5" /> TOP</span>}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                                <span className="text-orange-500 text-sm leading-none">🔥</span>
                                <span className="font-black text-orange-400 leading-none">{getActiveStreak(u)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
`;

code = code.replace(/const App = \(\) => \{/, leaderboardCode + '\nconst App = () => {');

// Inject state for leaderboard
code = code.replace(/const \[activeMissionFilter, setActiveMissionFilter\] = useState\('active'\);/, `const [activeMissionFilter, setActiveMissionFilter] = useState('active');\n    const [showLeaderboard, setShowLeaderboard] = useState(false);`);

// Inject the button next to DAILY MISSIONS
const missionsHeaderMatch = `<h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">{t('DAILY_MISSIONS')}</h3>`;
const newMissionsHeader = `
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-4">
                        {t('DAILY_MISSIONS')}
                        <button 
                            onClick={() => setShowLeaderboard(true)}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Icons.Trophy className="w-3.5 h-3.5 text-orange-400" />
                            RANK LIST
                        </button>
                    </h3>
`;
code = code.replace(missionsHeaderMatch, newMissionsHeader);

// Render the modal inside App
const renderMatch = `{showSettingsModal && (`;
const newRender = `
            {showLeaderboard && (
                <StreakLeaderboardModal 
                    users={users} 
                    onClose={() => setShowLeaderboard(false)} 
                    currentUser={user}
                />
            )}
            {showSettingsModal && (
`;
code = code.replace(renderMatch, newRender);

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx leaderboard injected');
