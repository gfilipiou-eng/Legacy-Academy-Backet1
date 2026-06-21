const fs = require('fs');
const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

// Remove animate-pulse
code = code.replace(/animate-pulse/g, '');

// Replace motion.div with div, motion.button with button
code = code.replace(/<motion\.([a-zA-Z]+)/g, '<$1');
code = code.replace(/<\/motion\.([a-zA-Z]+)>/g, '</$1>');

// Remove initial, animate, exit, layout props
code = code.replace(/\s(initial|animate|exit|layout|layoutId|whileHover|whileTap|transition)=\{[^}]+\}/g, '');
code = code.replace(/\s(layout|layoutId)="[^"]+"/g, '');
code = code.replace(/\s(layout)\s/g, ' ');

// Remove AnimatePresence completely by replacing with fragment
code = code.replace(/<AnimatePresence[^>]*>/g, '<>');
code = code.replace(/<\/AnimatePresence>/g, '</>');

fs.writeFileSync(path, code, 'utf8');
console.log('Done cleaning up loading effects and framer-motion');
