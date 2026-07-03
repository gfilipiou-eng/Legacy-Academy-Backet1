const fs = require('fs');
let code = fs.readFileSync('legacy-academy-frontend/src/components/BottomNavbar.jsx', 'utf8');

// 1. Add touchStartY and touchEndY
code = code.replace(/const touchStartX = useRef\(0\);\s*const touchEndX = useRef\(0\);/, "const touchStartX = useRef(0);\n    const touchEndX = useRef(0);\n    const touchStartY = useRef(0);\n    const touchEndY = useRef(0);");

// 2. Update handleTouchStart
code = code.replace(/touchEndX\.current = e\.targetTouches\[0\]\.clientX;/g, "touchEndX.current = e.targetTouches[0].clientX;\n        if (e.type === 'touchstart') {\n            touchStartY.current = e.targetTouches[0].clientY;\n            touchEndY.current = e.targetTouches[0].clientY;\n        } else {\n            touchEndY.current = e.targetTouches[0].clientY;\n        }");

// 3. Remove preventDefault from handleTouchMove
code = code.replace(/if \(e\.cancelable\) e\.preventDefault\(\);/g, "// removed preventDefault to allow vertical scroll");

// 4. Update handleTouchEnd to check Y distance
const yCheck = "const yDistance = Math.abs(touchStartY.current - touchEndY.current);\n        if (yDistance > 30) return;";
code = code.replace(/const isLeftSwipe = distance > minSwipeDistance;/, yCheck + "\n        const isLeftSwipe = distance > minSwipeDistance;");

// 5. Fix positioning bottom-[calc(...)]
code = code.replace(/bottom-\[calc\(158px-7rem\+env\(safe-area-inset-bottom\)\)\]/g, "bottom-0 pb-[calc(24px+env(safe-area-inset-bottom))] sm:pb-[calc(32px+env(safe-area-inset-bottom))]");

// 6. Fix framer-motion layoutId
code = code.replace(/<motion\.div[\s\S]*?layoutId="navActiveBackground"[\s\S]*?\/>/g, '<div className="absolute inset-0 bottom-nav-item-active pointer-events-none animate-in fade-in duration-300" />');

fs.writeFileSync('legacy-academy-frontend/src/components/BottomNavbar.jsx', code);
console.log('BottomNavbar.jsx patched successfully');
