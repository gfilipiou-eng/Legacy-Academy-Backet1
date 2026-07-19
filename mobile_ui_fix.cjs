const fs = require('fs');
const path = require('path');

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cvContent = fs.readFileSync(cartelViewPath, 'utf8');

// 1. Reduce header height from h-48 to h-32 on mobile
cvContent = cvContent.replace(
    'className="relative w-full h-48 sm:h-64 bg-black"',
    'className="relative w-full h-32 sm:h-64 bg-black shrink-0"'
);

// 2. Reduce Profile Image size on mobile from w-20 h-20 to w-16 h-16
cvContent = cvContent.replace(
    'className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black border-2 border-[var(--gold-primary)] overflow-hidden shrink-0 shadow-xl"',
    'className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-black border-2 border-[var(--gold-primary)] overflow-hidden shrink-0 shadow-xl"'
);

// 3. Improve Profile Image quality (bg-black object-center)
cvContent = cvContent.replace(
    'className="w-full h-full object-cover"',
    'className="w-full h-full object-cover object-center bg-black"'
);

// 4. Reduce title padding / font size slightly to fit better
cvContent = cvContent.replace(
    'className="text-2xl sm:text-3xl font-black text-white tracking-widest truncate shadow-black drop-shadow-md flex items-center gap-2"',
    'className="text-xl sm:text-3xl font-black text-white tracking-widest truncate shadow-black drop-shadow-md flex items-center gap-2"'
);

// 5. Join button size slightly smaller on mobile
cvContent = cvContent.replace(
    'className={`px-6 py-2.5 rounded-xl font-black  tracking-widest text-xs transition-all',
    'className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black tracking-widest text-xs transition-all'
);

fs.writeFileSync(cartelViewPath, cvContent);

const cartelsPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'Cartels.jsx');
let cartelsContent = fs.readFileSync(cartelsPath, 'utf8');

// Update Explore page image quality
cartelsContent = cartelsContent.replace(
    'className="w-full h-full object-cover"',
    'className="w-full h-full object-cover object-center bg-black"'
);

fs.writeFileSync(cartelsPath, cartelsContent);

console.log('Mobile UI layout optimized');
