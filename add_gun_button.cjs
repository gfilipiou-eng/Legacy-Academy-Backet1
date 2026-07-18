const fs = require('fs');
const path = require('path');

const iconsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Icons.jsx');
let iconsContent = fs.readFileSync(iconsPath, 'utf8');

const gunIcon = `
    Gun: (props) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 8H20C21.1 8 22 8.9 22 10V12C22 13.1 21.1 14 20 14H18V18C18 19.1 17.1 20 16 20H12C10.9 20 10 19.1 10 18V14H4C2.9 14 2 13.1 2 12V10C2 8.9 2.9 8 4 8H8Z" strokeWidth="1.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 14V18" strokeWidth="1.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14V18" strokeWidth="1.5" />
            <circle cx="18" cy="11" r="1" fill="currentColor" />
            <line x1="2" y1="11" x2="6" y2="11" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
`;

if (!iconsContent.includes('Gun: (props)')) {
    iconsContent = iconsContent.replace(
        "export const Icons = {",
        "export const Icons = {\n" + gunIcon
    );
    fs.writeFileSync(iconsPath, iconsContent);
    console.log('Icons.Gun added');
}

// In App.jsx, I hid the global floating button when activeTab === 'cartels'
// Now, let's put a custom floating button INSIDE CartelsExplore.jsx
const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

// Replace the top right "Create" button with nothing or keep it, but add a floating button.
const floatingCreateCartelButton = `
            {/* MAFIA STYLE FLOATING ADD GROUP BUTTON */}
            <button 
                onClick={() => setIsCreateOpen(true)} 
                className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-4 sm:right-10 z-[1000] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/80 backdrop-blur-xl border-2 border-red-900/50 shadow-[0_0_30px_rgba(220,38,38,0.3)] flex items-center justify-center text-red-500 hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
            >
                <div className="absolute inset-0 bg-red-600/10 rounded-full animate-pulse pointer-events-none"></div>
                <Icons.Gun className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            </button>
`;

if (!cartelsContent.includes('MAFIA STYLE FLOATING ADD GROUP BUTTON')) {
    cartelsContent = cartelsContent.replace(
        "{isCreateModalOpen && (",
        floatingCreateCartelButton + "\n            <AnimatePresence>\n                {isCreateModalOpen && ("
    );
    fs.writeFileSync(cartelsPath, cartelsContent);
    console.log('CartelsExplore updated with floating gun button');
}

