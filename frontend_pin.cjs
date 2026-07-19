const fs = require('fs');
const path = require('path');

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let content = fs.readFileSync(cartelsPath, 'utf8');

// Add PIN to state and form data in CreateCartelModal
content = content.replace(
    "const [imageUrl, setImageUrl] = useState('');",
    "const [imageUrl, setImageUrl] = useState('');\n    const [pin, setPin] = useState('');"
);

content = content.replace(
    "formData.append('description', desc);",
    "formData.append('description', desc);\n            if (pin.trim()) formData.append('pin', pin);"
);

// Add PIN input to form
const pinInput = `
                    <div>
                        <label className="block text-xs font-bold text-white/50 tracking-widest mb-2">{t('CARTELS_PIN', 'Secret PIN (Optional)')}</label>
                        <input type="text" value={pin} onChange={e=>setPin(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none" placeholder="Leave empty for public cartel..." />
                        <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest">If set, users must enter this PIN to join.</p>
                    </div>`;

content = content.replace(
    "<button disabled={loading} type=\"submit\"",
    pinInput + "\n                    <button disabled={loading} type=\"submit\""
);

fs.writeFileSync(cartelsPath, content);

// Update CartelView.jsx
const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cvContent = fs.readFileSync(cartelViewPath, 'utf8');

const oldHandleJoin = `    const handleJoin = async () => {
        const previousIsMember = isMember;
        setIsMember(!isMember);
        setMemberCount(prev => !isMember ? prev + 1 : prev - 1);
        
        try {
            await axios.post(\`/cartels/\${cartel._id}/join\`);
        } catch (err) {
            console.error(err);
            setIsMember(previousIsMember);
            setMemberCount(prev => previousIsMember ? prev + 1 : prev - 1);
            alert("Error joining/leaving cartel");
        }
    };`;

const newHandleJoin = `    const handleJoin = async () => {
        let enteredPin = "";
        // If joining and cartel is private, ask for PIN
        if (!isMember && cartel.isPrivate) {
            enteredPin = prompt(t('CARTELS_ENTER_PIN', 'This cartel is private. Please enter the PIN to join:'));
            if (enteredPin === null) return; // User cancelled
        }

        const previousIsMember = isMember;
        // Only optimistic update if LEAVING or if PUBLIC joining.
        // For private joining, wait for server response to verify PIN.
        if (isMember || !cartel.isPrivate) {
            setIsMember(!isMember);
            setMemberCount(prev => !isMember ? prev + 1 : prev - 1);
        }

        try {
            await axios.post(\`/cartels/\${cartel._id}/join\`, { pin: enteredPin });
            if (!isMember && cartel.isPrivate) {
                // If it was private, update state after success
                setIsMember(true);
                setMemberCount(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
            if (isMember || !cartel.isPrivate) {
                setIsMember(previousIsMember);
                setMemberCount(prev => previousIsMember ? prev + 1 : prev - 1);
            }
            alert(err.response?.data || "Error joining/leaving cartel");
        }
    };`;

cvContent = cvContent.replace(oldHandleJoin, newHandleJoin);

// Replace Lock icon when viewing a private cartel
cvContent = cvContent.replace(
    "<h1 className=\"text-2xl sm:text-3xl font-black text-white  tracking-widest truncate shadow-black drop-shadow-md\">\n                            {cartel.name}\n                        </h1>",
    "<h1 className=\"text-2xl sm:text-3xl font-black text-white tracking-widest truncate shadow-black drop-shadow-md flex items-center gap-2\">\n                            {cartel.name}\n                            {cartel.isPrivate && <Icons.Lock className=\"w-5 h-5 text-red-500\" />}\n                        </h1>"
);

fs.writeFileSync(cartelViewPath, cvContent);

// Update translations
const enPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'en.json');
let enContent = fs.readFileSync(enPath, 'utf8');
let enObj = JSON.parse(enContent);
enObj.CARTELS_PIN = "Secret PIN (Optional)";
enObj.CARTELS_ENTER_PIN = "This cartel is private. Please enter the PIN to join:";
fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2));

const elPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'el.json');
let elContent = fs.readFileSync(elPath, 'utf8');
let elObj = JSON.parse(elContent);
elObj.CARTELS_PIN = "Μυστικό PIN (Προαιρετικό)";
elObj.CARTELS_ENTER_PIN = "Αυτό το Cartel είναι ιδιωτικό. Εισάγετε το PIN για να μπείτε:";
fs.writeFileSync(elPath, JSON.stringify(elObj, null, 2));

console.log('Frontend Cartel PIN support added');
