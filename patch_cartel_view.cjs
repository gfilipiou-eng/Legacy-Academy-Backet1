const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/CartelView.jsx';
let code = fs.readFileSync(p, 'utf8');

// 1. Add enablePin state to EditCartelModal
code = code.replace(
    /const \[imageUrl, setImageUrl\] = useState\(cartel\.image \|\| ''\);\s*const \[pin, setPin\] = useState\(''\);/,
    const [imageUrl, setImageUrl] = useState(cartel.image || '');\n    const [enablePin, setEnablePin] = useState(cartel.isPrivate || false);\n    const [pin, setPin] = useState('');
);

// 2. Add enablePin logic to EditCartelModal handleSubmit
code = code.replace(
    /if \(pin\.trim\(\)\) formData\.append\('pin', pin\);/,
    if (enablePin && pin.trim()) formData.append('pin', pin);\n            else if (!enablePin) formData.append('pin', '');
);

// 3. Update EditCartelModal UI
const oldUI = <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                {t('CARTELS_PIN', 'Secret PIN')}
                                {cartel.isPrivate && (
                                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-[9px] font-black tracking-widest">
                                        ? PIN SET
                                    </span>
                                )}
                            </label>
                            <input
                                type={cartel.isPrivate && pin === '' ? "password" : "text"}
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none"
                                placeholder={cartel.isPrivate ? '•••••••• (Type to change PIN)' : 'Set a secret PIN...'}
                            />
                            {cartel.isPrivate && pin === '' && (
                                <p className="text-[10px] text-amber-400/70 font-bold pl-1">? Leave blank to keep existing PIN</p>
                            )}
                        </div>;

const newUI = <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between pl-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    {t('CARTELS_PIN_TOGGLE', 'Enable PIN Access')}
                                    {cartel.isPrivate && (
                                        <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-[9px] font-black tracking-widest">
                                            ? PIN SET
                                        </span>
                                    )}
                                </label>
                                <button type="button" onClick={() => { setEnablePin(!enablePin); if(enablePin) setPin(''); }} className={\elative inline-flex h-5 w-9 items-center rounded-full transition-colors \\}>
                                    <span className={\inline-block h-4 w-4 transform rounded-full bg-white transition-transform \\} />
                                </button>
                            </div>
                            {enablePin && (
                                <>
                                <input
                                    type={cartel.isPrivate && pin === '' ? "password" : "text"}
                                    value={pin}
                                    onChange={e => setPin(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-[15px] text-white focus:border-[var(--gold-primary)] outline-none mt-1"
                                    placeholder={cartel.isPrivate ? '•••••••• (Type to change PIN)' : 'Enter Secret Code...'}
                                />
                                {cartel.isPrivate && pin === '' && (
                                    <p className="text-[10px] text-amber-400/70 font-bold pl-1">? Leave blank to keep existing PIN</p>
                                )}
                                </>
                            )}
                        </div>;

code = code.replace(oldUI, newUI);

// 4. Update CartelView states for join modal
code = code.replace(
    /const \[isMember, setIsMember\] = useState\(false\);/,
    const [isMember, setIsMember] = useState(false);\n    const [showJoinPinModal, setShowJoinPinModal] = useState(false);\n    const [joinPinInput, setJoinPinInput] = useState('');
);

// 5. Update handleJoin logic
const oldHandleJoin = const handleJoin = async () => {
        let enteredPin = '';
        if (!isMember && liveCartel.isPrivate) {
            enteredPin = prompt(t('CARTELS_ENTER_PIN', 'This cartel is private. Please enter the PIN to join:'));
            if (enteredPin === null) return;
        }
        const previousIsMember = isMember;
        if (isMember || !liveCartel.isPrivate) {
            setIsMember(!isMember);
            setMemberCount(prev => !isMember ? prev + 1 : prev - 1);
        }
        try {
            await axios.post(\/cartels/\/join\, { pin: enteredPin });
            if (!isMember && liveCartel.isPrivate) {
                setIsMember(true);
                setMemberCount(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
            if (isMember || !liveCartel.isPrivate) {
                setIsMember(previousIsMember);
                setMemberCount(prev => previousIsMember ? prev + 1 : prev - 1);
            }
            alert(err.response?.data || 'Error joining/leaving cartel');
        }
    };;

const newHandleJoin = const executeJoin = async (enteredPin = '') => {
        const previousIsMember = isMember;
        if (isMember || !liveCartel.isPrivate) {
            setIsMember(!isMember);
            setMemberCount(prev => !isMember ? prev + 1 : prev - 1);
        }
        try {
            await axios.post(\/cartels/\/join\, { pin: enteredPin });
            if (!isMember && liveCartel.isPrivate) {
                setIsMember(true);
                setMemberCount(prev => prev + 1);
            }
            setShowJoinPinModal(false);
        } catch (err) {
            console.error(err);
            if (isMember || !liveCartel.isPrivate) {
                setIsMember(previousIsMember);
                setMemberCount(prev => previousIsMember ? prev + 1 : prev - 1);
            }
            alert(err.response?.data || 'Error joining/leaving cartel');
        }
    };

    const handleJoin = async () => {
        if (!isMember && liveCartel.isPrivate) {
            setShowJoinPinModal(true);
            return;
        }
        await executeJoin('');
    };

    const submitJoinPin = async () => {
        await executeJoin(joinPinInput);
        setJoinPinInput('');
    };;

code = code.replace(oldHandleJoin, newHandleJoin);

// 6. Inject the modal UI
const joinModalUI = 
                {/* Join PIN Modal */}
                <AnimatePresence>
                    {showJoinPinModal && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowJoinPinModal(false)} />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
                            >
                                <h3 className="text-white font-black italic uppercase tracking-widest text-lg">{t('CARTELS_ENTER_PIN', 'Private Cartel')}</h3>
                                <p className="text-white/60 text-sm">Please enter the secret PIN to join.</p>
                                <input 
                                    type="password" 
                                    value={joinPinInput}
                                    onChange={e => setJoinPinInput(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none"
                                    placeholder="Enter PIN..."
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setShowJoinPinModal(false)} className="px-4 py-2 text-white/60 hover:text-white font-bold text-sm">Cancel</button>
                                    <button onClick={submitJoinPin} className="px-6 py-2 bg-[var(--gold-primary)] text-black rounded-lg font-black uppercase tracking-widest text-sm hover:opacity-90">Join</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
;

code = code.replace('{isEditCartelOpen && (', joinModalUI + '\n                  {isEditCartelOpen && (');

fs.writeFileSync(p, code);
console.log('Successfully patched CartelView');
