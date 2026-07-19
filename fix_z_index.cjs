const fs = require('fs');
const path = require('path');

const cvPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let cvContent = fs.readFileSync(cvPath, 'utf8');

// Change CartelView z-index from 9999 to 2000 so that CreateModal (3200) and PostDetailModal (2500) appear on top!
cvContent = cvContent.replace(
    'className="w-full h-full flex flex-col bg-[#050505] z-[9999] fixed inset-0 overflow-y-auto pb-8"',
    'className="w-full h-full flex flex-col bg-[#050505] z-[2000] fixed inset-0 overflow-y-auto pb-8"'
);

fs.writeFileSync(cvPath, cvContent);
console.log('Lowered CartelView z-index to 2000 to fix modal overlapping.');
