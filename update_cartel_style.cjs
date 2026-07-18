const fs = require('fs');
const path = require('path');

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cartelViewContent = fs.readFileSync(cartelViewPath, 'utf8');

// Replace the simple "Post to Cartel" button with a heavy Mafia style "UPLOAD" button
const oldButton = `<button onClick={() => onCreatePost(cartel._id)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center gap-3 transition-colors text-left text-white/50">
                        <div className="w-8 h-8 rounded-full bg-[var(--gold-primary)]/20 flex items-center justify-center shrink-0">
                            <Icons.Plus className="w-4 h-4 text-[var(--gold-primary)]" />
                        </div>
                        <span className="font-bold uppercase tracking-wider text-xs">Post to {cartel.name}</span>
                    </button>`;

const newButton = `<button onClick={() => onCreatePost(cartel._id)} className="w-full relative overflow-hidden rounded-2xl p-6 flex flex-col items-center justify-center gap-2 group active:scale-95 transition-all border border-red-900/50 shadow-2xl shadow-red-900/20 bg-gradient-to-b from-[#1a0505] to-[#0a0000]">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <Icons.Upload className="w-10 h-10 text-red-600 mb-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                        <span className="font-black uppercase tracking-[0.3em] text-white text-sm drop-shadow-md z-10">UPLOAD INTEL</span>
                        <span className="text-red-500/70 text-[10px] uppercase tracking-widest font-bold z-10">Secure Encrypted Channel</span>
                    </button>`;

if (cartelViewContent.includes('Post to {cartel.name}')) {
    cartelViewContent = cartelViewContent.replace(oldButton, newButton);
}

// Add the mafia background to the main div
// From: <div className="w-full h-full flex flex-col bg-[var(--app-bg)] z-30 absolute inset-0 overflow-y-auto pb-24">
// To: a div with a dark weapon/mafia style background overlay
const oldMainDiv = `<div className="w-full h-full flex flex-col bg-[var(--app-bg)] z-30 absolute inset-0 overflow-y-auto pb-24">`;
const newMainDiv = `<div className="w-full h-full flex flex-col bg-[#050505] z-30 absolute inset-0 overflow-y-auto pb-24">
            {/* Mafia / Weapons Background Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1595590424283-b8f1784cb2c2?q=80&w=1080&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>
            <div className="relative z-10 flex-1 flex flex-col">`;

if (cartelViewContent.includes(oldMainDiv)) {
    cartelViewContent = cartelViewContent.replace(oldMainDiv, newMainDiv);
    // Add the closing div right before the final closing div
    cartelViewContent = cartelViewContent.replace(/<\/div>\s*$/g, "            </div>\n        </div>");
}

fs.writeFileSync(cartelViewPath, cartelViewContent);
console.log('CartelView.jsx updated with Mafia style');
