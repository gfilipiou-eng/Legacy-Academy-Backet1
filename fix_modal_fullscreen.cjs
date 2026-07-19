const fs = require('fs');
const path = require('path');

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

const oldCreateModal = `        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="relative w-full max-w-[420px] max-h-[88dvh] rounded-[24px] sm:rounded-3xl overflow-hidden flex flex-col bg-[#111] border border-white/10 shadow-2xl"
            >`;

const newCreateModal = `        <div className="fixed inset-0 z-[20000] flex items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md hidden sm:block" onClick={onClose} />
            <motion.div 
                initial={{ opacity: 0, y: 50 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 50 }} 
                className="relative w-full h-[100dvh] sm:h-auto sm:max-w-[420px] sm:max-h-[88dvh] rounded-none sm:rounded-3xl overflow-hidden flex flex-col bg-[#0a0a0a] sm:bg-[#111] border-0 sm:border border-white/10 shadow-2xl"
            >`;

cartelsContent = cartelsContent.replace(oldCreateModal, newCreateModal);

// Also change textarea height
cartelsContent = cartelsContent.replace(
    'className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none resize-none h-24"',
    'className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none resize-none min-h-[80px]"'
);

fs.writeFileSync(cartelsPath, cartelsContent);

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cvContent = fs.readFileSync(cartelViewPath, 'utf8');

// Revert header height to make it grand again
cvContent = cvContent.replace(
    'className="relative w-full h-32 sm:h-64 bg-black shrink-0"',
    'className="relative w-full h-48 sm:h-64 bg-black shrink-0"'
);

// Revert avatar size
cvContent = cvContent.replace(
    'className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-black border-2 border-[var(--gold-primary)] overflow-hidden shrink-0 shadow-xl"',
    'className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black border-2 border-[var(--gold-primary)] overflow-hidden shrink-0 shadow-xl"'
);

// Fix Edit Modal to be full screen on mobile
const oldEditModal = `        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="relative w-full max-w-[420px] max-h-[88dvh] rounded-[24px] sm:rounded-3xl overflow-hidden flex flex-col bg-[#111] border border-white/10 shadow-2xl"
            >`;

const newEditModal = `        <div className="fixed inset-0 z-[20000] flex items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md hidden sm:block" onClick={onClose} />
            <motion.div 
                initial={{ opacity: 0, y: 50 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 50 }} 
                className="relative w-full h-[100dvh] sm:h-auto sm:max-w-[420px] sm:max-h-[88dvh] rounded-none sm:rounded-3xl overflow-hidden flex flex-col bg-[#0a0a0a] sm:bg-[#111] border-0 sm:border border-white/10 shadow-2xl"
            >`;

cvContent = cvContent.replace(oldEditModal, newEditModal);

// Change textarea height
cvContent = cvContent.replace(
    'className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none resize-none h-24"',
    'className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[var(--gold-primary)] outline-none resize-none min-h-[80px]"'
);

fs.writeFileSync(cartelViewPath, cvContent);

console.log('Mobile modals and header updated');
