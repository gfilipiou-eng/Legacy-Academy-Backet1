const fs = require('fs');
const path = require('path');

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let content = fs.readFileSync(cartelViewPath, 'utf8');

// 1. Optimistic handleJoin
const oldHandleJoin = `    const handleJoin = async () => {
        try {
            await axios.post(\`/cartels/\${cartel._id}/join\`);
            setIsMember(!isMember);
            setMemberCount(prev => isMember ? prev - 1 : prev + 1);
        } catch (err) {
            console.error(err);
        }
    };`;

const newHandleJoin = `    const handleJoin = async () => {
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

content = content.replace(oldHandleJoin, newHandleJoin);

// 2. Fix top-safe-4
content = content.replace(
    'className="absolute top-safe-4 left-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/10 transition"',
    'className="absolute top-[calc(env(safe-area-inset-top)+1rem)] left-4 z-50 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/10 transition border border-white/20 shadow-xl"'
);

// Delete button fix
content = content.replace(
    'className="absolute top-safe-4 right-4 z-10',
    'className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-4 z-50'
);

// 3. Translate "Welcome to the cartel."
content = content.replace(
    "{cartel.description || 'Welcome to the cartel.'}",
    "{cartel.description || t('CARTELS_WELCOME_DESC', 'Welcome to the cartel.')}"
);

fs.writeFileSync(cartelViewPath, content);

const elPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'el.json');
let elContent = fs.readFileSync(elPath, 'utf8');
let elObj = JSON.parse(elContent);
elObj.CARTELS_WELCOME_DESC = "Καλώς ήρθατε στο Cartel.";
fs.writeFileSync(elPath, JSON.stringify(elObj, null, 2));

const enPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'locales', 'en.json');
let enContent = fs.readFileSync(enPath, 'utf8');
let enObj = JSON.parse(enContent);
enObj.CARTELS_WELCOME_DESC = "Welcome to the cartel.";
fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2));

console.log('CartelView fixes applied');
