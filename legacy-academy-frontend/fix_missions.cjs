const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add showLeaderboard state to MissionsDashboard
code = code.replace(
    /const MissionsDashboard = \(\{ user, onUpdateUser, t, lang \}\) => \{\n    const \[submitting, setSubmitting\] = useState\(false\);/,
    `const MissionsDashboard = ({ user, onUpdateUser, t, lang }) => {\n    const [submitting, setSubmitting] = useState(false);\n    const [showLeaderboard, setShowLeaderboard] = useState(false);`
);

// 2. Add MissionsLeaderboardModal component
const leaderboardModalCode = `
const MissionsLeaderboardModal = ({ isOpen, onClose, t, currentUser }) => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        const fetchLeaders = async () => {
            setLoading(true);
            try {
                // Fetch top 50 users by active streak
                const res = await axios.get('/users/top-streaks'); // Needs backend endpoint, but we can fallback to fetching all and sorting if it fails
                setLeaders(res.data);
            } catch (err) {
                console.error(err);
                // Fallback: fetch all and sort
                try {
                    const allRes = await axios.get('/users/all');
                    const sorted = (allRes.data || [])
                        .filter(u => getActiveStreak(u) > 0)
                        .sort((a, b) => getActiveStreak(b) - getActiveStreak(a))
                        .slice(0, 50);
                    setLeaders(sorted);
                } catch(e) {}
            }
            setLoading(false);
        };
        fetchLeaders();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0a0a0c] border border-orange-500/30 rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-[0_0_50px_rgba(249,115,22,0.15)] relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400" />
                
                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                            <Icons.Trophy className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-widest">{t('RANK_LIST', 'Rank List')}</h2>
                            <p className="text-xs text-orange-500 font-bold uppercase tracking-wider">Top Warriors</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/70 hover:text-white">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 relative z-10 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Icons.Loader className="w-8 h-8 text-orange-500 animate-spin" />
                        </div>
                    ) : leaders.length === 0 ? (
                        <div className="text-center py-10 text-white/50 font-bold uppercase tracking-widest text-sm">
                            No active streaks yet
                        </div>
                    ) : (
                        leaders.map((u, idx) => (
                            <div key={u._id} className={\`p-4 rounded-2xl flex items-center gap-4 border transition-all \${u._id === currentUser?._id ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}\`}>
                                <div className={\`w-8 h-8 shrink-0 flex items-center justify-center font-black text-lg \${idx === 0 ? 'text-yellow-400 text-2xl drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' : idx === 1 ? 'text-gray-300 text-xl' : idx === 2 ? 'text-amber-600 text-xl' : 'text-white/30 text-base'}\`}>
                                    #{idx + 1}
                                </div>
                                <div className="w-12 h-12 rounded-full bg-[#111] border-2 border-white/10 overflow-hidden shrink-0 relative">
                                    <img src={u.profileImage || \`/api/placeholder/150/150\`} alt={u.username} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-white text-base truncate flex items-center gap-2">
                                        {u.username}
                                        {u._id === currentUser?._id && <span className="text-[9px] bg-white/10 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>}
                                    </div>
                                    <div className="text-orange-500 font-black text-sm flex items-center gap-1.5 mt-0.5">
                                        🔥 {getActiveStreak(u)} <span className="text-[10px] text-white/50 uppercase tracking-widest">Streak</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};
`;

code = code.replace(
    /const MissionsDashboard = \(\{ user, onUpdateUser, t, lang \}\) => \{/,
    leaderboardModalCode + '\nconst MissionsDashboard = ({ user, onUpdateUser, t, lang }) => {'
);

// 3. Render MissionsLeaderboardModal inside MissionsDashboard
code = code.replace(
    /<\/div>\n    \);\n\};\n\nconst ProfileModal =/s,
    `        <MissionsLeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} t={t} currentUser={user} />\n        </div>\n    );\n};\n\nconst ProfileModal =`
);

// 4. Update VerifiedBadge for "Live Gold" Founder Badge
const liveGoldBadgeLogic = `    // Apply custom badge color from settings if available
    if (user?.settings?.badgeColor) {
        const customColor = user.settings.badgeColor;
        if (customColor === 'gold') { baseColor = '#F6E27A'; darkColor = '#CB9B51'; gradId = 'gold3DGrad'; }
        else if (customColor === 'crimson') { baseColor = '#FF0844'; darkColor = '#93001E'; gradId = 'crimson3DGrad'; }
        else if (customColor === 'neon-purple') { baseColor = '#B026FF'; darkColor = '#590FB7'; gradId = 'purple3DGrad'; }
        else if (customColor === 'blue') { baseColor = '#2F80ED'; darkColor = '#1CB5E0'; gradId = 'blue3DGrad'; }
        else if (customColor === 'silver') { baseColor = '#E0E0E0'; darkColor = '#888888'; gradId = 'silver3DGrad'; }
        else if (customColor === 'bronze') { baseColor = '#CD7F32'; darkColor = '#8B4513'; gradId = 'bronze3DGrad'; }
        else if (customColor === 'neon-green') { baseColor = '#39FF14'; darkColor = '#008000'; gradId = 'green3DGrad'; }
        else if (customColor === 'holographic') isHolo = true;
        else if (customColor === 'live-gold' && resolvedRole === 'Founder') {
            return (
                <div className={\`\${className} flex items-center justify-center shrink-0\`}>
                    <div className="relative w-full h-full rounded-full animate-spin" style={{ animationDuration: '4s', background: 'conic-gradient(from 0deg, #F6E27A, #CB9B51, #FFF7B0, #CB9B51, #F6E27A)' }}>
                        <div className="absolute inset-[15%] bg-black rounded-full flex items-center justify-center">
                            <Icons.Check className="w-[80%] h-[80%] text-[#F6E27A]" strokeWidth={3} />
                        </div>
                    </div>
                </div>
            );
        }
    }`;

code = code.replace(
    /    \/\/ Apply custom badge color from settings if available[\s\S]*?else if \(customColor === 'holographic'\) isHolo = true;\n    \}/,
    liveGoldBadgeLogic
);

// 5. Add Live Gold to SettingsModal
const settingsGoldBadgeCode = `                                                {[
                                                    { id: 'gold', label: 'Gold', color: '#FFD700' },
                                                    { id: 'live-gold', label: 'Live Gold', color: '#F6E27A', isLive: true },
                                                    { id: 'crimson', label: 'Crimson', color: '#FF0033' },
                                                    { id: 'neon-purple', label: 'Purple', color: '#B026FF' },
                                                    { id: 'holographic', label: 'Holo', isHolo: true }
                                                ].map(b => (
                                                    <button
                                                        key={b.id}
                                                        type="button"
                                                        onClick={() => { setBadgeColor(b.id); handleSave('badgeColor', b.id); }}
                                                        className={\`settings-tile-btn p-2 rounded-xl border flex items-center justify-center gap-2 transition-all \${
                                                            badgeColor === b.id ? 'border-[#1D9BF0] bg-[#1D9BF0]/10' : 'border-white/10 bg-white/[0.02]'
                                                        }\`}
                                                    >
                                                        {b.isLive ? (
                                                            <div className="w-3.5 h-3.5 rounded-full shrink-0 animate-spin" style={{ animationDuration: '4s', background: 'conic-gradient(from 0deg, #F6E27A, #CB9B51, #FFF7B0, #CB9B51, #F6E27A)' }} />
                                                        ) : b.isHolo ? (
                                                            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: 'linear-gradient(45deg, #ff007f, #7f00ff, #00f0ff, #00ff7f, #ff007f)' }} />
                                                        ) : (
                                                            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                                                        )}
                                                        <span className="text-[11px] text-white font-bold uppercase tracking-wider">{b.label}</span>
                                                    </button>
                                                ))}`;

code = code.replace(
    /                                                \{\[\n                                                    \{ id: 'gold', label: 'Gold', color: '#FFD700' \},\n                                                    \{ id: 'crimson', label: 'Crimson', color: '#FF0033' \},\n                                                    \{ id: 'neon-purple', label: 'Purple', color: '#B026FF' \},\n                                                    \{ id: 'holographic', label: 'Holo', isHolo: true \}\n                                                \]\.map\(b => \([\s\S]*?<\/button>\n                                                \)\)\}/,
    settingsGoldBadgeCode
);

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed Missions and Badge');
