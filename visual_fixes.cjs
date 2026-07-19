const fs = require('fs');
const path = require('path');

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

// 1. Remove glow effect from Gun button and make it clean/premium
const oldButton = `<button 
                onClick={() => setIsCreateOpen(true)} 
                className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-4 sm:right-10 z-[1000] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/80 backdrop-blur-xl border-2 border-red-900/50 shadow-[0_0_30px_rgba(220,38,38,0.3)] flex items-center justify-center text-red-500 hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
            >
                <div className="absolute inset-0 bg-red-600/10 rounded-full animate-pulse pointer-events-none"></div>
                <Icons.Gun className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            </button>`;

const newButton = `<button 
                onClick={() => setIsCreateOpen(true)} 
                className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] right-4 sm:right-10 z-[1000] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 rounded-full pointer-events-none"></div>
                <Icons.Gun className="w-7 h-7 sm:w-8 sm:h-8 text-white z-10" />
            </button>`;

cartelsContent = cartelsContent.replace(oldButton, newButton);

// 2. Add weapons background to Cartels Explore page
const oldMainDiv = `<div className="w-full h-full flex flex-col relative z-10 pt-safe mt-[80px] sm:mt-0">`;
const newMainDiv = `<div className="fixed inset-0 pointer-events-none opacity-20 z-0 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595590424283-b8f1784cb2c2?q=80&w=1080&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>
            <div className="w-full h-full flex flex-col relative z-10 pt-safe mt-[80px] sm:mt-0">`;

if (cartelsContent.includes(oldMainDiv)) {
    cartelsContent = cartelsContent.replace(oldMainDiv, newMainDiv);
}

fs.writeFileSync(cartelsPath, cartelsContent);
console.log('Cartels.jsx styles updated');

// 3. Hide Stories bar when in Cartels
const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

appContent = appContent.replace(
    "{activeTab !== 'search' && <StoriesBar",
    "{activeTab !== 'search' && activeTab !== 'cartels' && <StoriesBar"
);

// 4. Prevent socket from injecting cartel posts into global feed!
appContent = appContent.replace(
    "socket.on('post.created', (newPost) => {",
    "socket.on('post.created', (newPost) => {\n            if (newPost.cartelId) return; // Hide cartel posts from global socket feed"
);

// Check handleCreatePost error logging
appContent = appContent.replace(
    "const detail = err.response?.data?.detail || err.response?.data?.message || err.response?.data?.error || err.message;",
    "const detail = err.response?.data?.detail || err.response?.data?.message || err.response?.data?.error || err.message;\n            console.error('API ERROR DETAILED:', err.response?.data, err);"
);

fs.writeFileSync(appPath, appContent);
console.log('App.jsx styles and socket updated');
