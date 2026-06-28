const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add savedAccounts state to App component
content = content.replace(
    /const \[user, setUser\] = useState\(null\);/,
    `const [user, setUser] = useState(null);
    const [savedAccounts, setSavedAccounts] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('savedAccounts')) || [];
        } catch { return []; }
    });
    const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);`
);

// 2. Modify commitAuthenticatedUser
content = content.replace(
    /const commitAuthenticatedUser = useCallback\(\(userData\) => \{([\s\S]*?)startTransition\(\(\) => setUser\(userData\)\);/,
    `const commitAuthenticatedUser = useCallback((userData) => {$1startTransition(() => setUser(userData));
        setSavedAccounts(prev => {
            const currentToken = localStorage.getItem('token');
            if (!currentToken) return prev;
            let newList = [...prev];
            const existingIdx = newList.findIndex(a => a.user?._id === userData._id);
            const accObj = { user: userData, token: currentToken };
            if (existingIdx >= 0) newList[existingIdx] = accObj;
            else newList.push(accObj);
            localStorage.setItem('savedAccounts', JSON.stringify(newList));
            return newList;
        });`
);

// 3. Add switchAccount function after googleLogin
content = content.replace(
    /const handleGoogleSignIn = \(\) => \{([\s\S]*?)\};/,
    `$&
    
    const switchAccount = (acc) => {
        if (!acc || !acc.token || !acc.user) return;
        localStorage.setItem('token', acc.token);
        localStorage.setItem('user', JSON.stringify(acc.user));
        
        // Ensure new token is picked up by axios interceptors automatically (they read localStorage)
        setToken(acc.token);
        setUser(acc.user);
        setIsAccountSwitcherOpen(false);
        addToast(\`Switched to \${acc.user.username}\`, 'success');
        
        // Force full reload to properly re-initialize sockets and states cleanly
        window.location.reload();
    };
    
    const removeSavedAccount = (accId) => {
        setSavedAccounts(prev => {
            const newList = prev.filter(a => a.user._id !== accId);
            localStorage.setItem('savedAccounts', JSON.stringify(newList));
            return newList;
        });
    };`
);

// 4. Update Profile Header to include a dropdown icon for Account Switcher
content = content.replace(
    /\{displayUser\?\.username\}\{getActiveStreak\(displayUser\) > 0 &&/,
    `{displayUser?.username}
    {isMe && (
        <button onClick={() => setIsAccountSwitcherOpen(true)} className="ml-1 p-1 hover:bg-white/10 rounded-full transition-colors active:scale-95">
            <Icons.ChevronDown className="w-3.5 h-3.5 text-white/70" />
        </button>
    )}
    {getActiveStreak(displayUser) > 0 &&`
);

// 5. Inject AccountSwitcherModal at the end of the return statement before the closing Fragment
const accountSwitcherHTML = `
            <AnimatePresence>
                {isAccountSwitcherOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAccountSwitcherOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm glass-panel p-5 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-white text-sm uppercase tracking-widest">Switch Account</h3>
                                <button onClick={() => setIsAccountSwitcherOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors">
                                    <Icons.Close className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="space-y-3 mb-6">
                                {savedAccounts.map((acc) => {
                                    const isActive = user?._id === acc.user._id;
                                    return (
                                        <div key={acc.user._id} onClick={() => !isActive && switchAccount(acc)} className={\`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 \${isActive ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/10 cursor-default' : 'border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer hover:scale-[1.02]'}\`}>
                                            <div className="flex items-center gap-3">
                                                <img src={acc.user.profilePic || '/default-avatar.png'} className="w-10 h-10 rounded-full object-cover border border-white/20" alt="" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{acc.user.username}</span>
                                                    {isActive && <span className="text-[10px] text-[var(--gold-primary)] uppercase tracking-widest font-bold">Active</span>}
                                                </div>
                                            </div>
                                            {!isActive && (
                                                <button onClick={(e) => { e.stopPropagation(); removeSavedAccount(acc.user._id); }} className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-colors">
                                                    <Icons.Delete className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <button onClick={() => {
                                setIsAccountSwitcherOpen(false);
                                setUser(null);
                                setToken(null);
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                            }} className="w-full py-3.5 rounded-xl border border-white/20 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                                <Icons.Plus className="w-4 h-4" /> Add Existing Account
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
`;

content = content.replace(
    /\{isImageViewerOpen && \([\s\S]*?<\/AnimatePresence>/,
    `$&
    ${accountSwitcherHTML}`
);


// 6. Update Missions scroll-to-top HTML exactly as user provided
content = content.replace(
    /<div className="missions-scroll-top" onClick=\{\(\) => mainScrollRef\.current\?\.scrollTo\(\{ top: 0, behavior: 'smooth' \}\)\}>[\s\S]*?<\/div>/,
    `<button className="fixed bottom-[calc(158px+env(safe-area-inset-bottom))] right-20 sm:right-32 z-[950] w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ffffff]/10 shrink-0 flex-none flex items-center justify-center text-[var(--gold-primary)] backdrop-blur-2xl border border-[#ffffff]/20 hover:scale-105 active:scale-95 transition-all duration-500 ease-out" onClick={() => mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 sm:w-10 sm:h-10"><path d="M12 19V5"></path><path d="m5 12 7-7 7 7"></path></svg>
    </button>`
);

fs.writeFileSync(file, content);
console.log('Multi-account and missions scroll-to-top injected into App.jsx');
