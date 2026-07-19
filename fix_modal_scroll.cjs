const fs = require('fs');
const path = require('path');

// 1. Fix CreateCartelModal in Cartels.jsx
const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

const oldModalWrapper = `<div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 pt-[100px] pb-[100px]">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]">`;

const newModalWrapper = `<div className="fixed inset-0 z-[2000] overflow-y-auto bg-black/80 backdrop-blur-md pb-[120px] pt-[80px] sm:py-10">
            <div className="min-h-full flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl mt-4 mb-auto sm:my-auto">`;

cartelsContent = cartelsContent.replace(oldModalWrapper, newModalWrapper);
fs.writeFileSync(cartelsPath, cartelsContent);


// 2. Fix EditCartelModal in CartelView.jsx
const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cvContent = fs.readFileSync(cartelViewPath, 'utf8');

const oldEditWrapper = `<div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 pt-[100px] pb-[100px]">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]">`;

const newEditWrapper = `<div className="fixed inset-0 z-[20000] overflow-y-auto bg-black/80 backdrop-blur-md pb-[120px] pt-[80px] sm:py-10">
            <div className="min-h-full flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl mt-4 mb-auto sm:my-auto">`;

cvContent = cvContent.replace(oldEditWrapper, newEditWrapper);
fs.writeFileSync(cartelViewPath, cvContent);

console.log('Fixed modal scrolling and padding for mobile');
