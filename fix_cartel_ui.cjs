const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'App.jsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// 1. Hide Feed Sort Tabs when activeTab === 'cartels'
appContent = appContent.replace(
    "{activeTab !== 'search' && (",
    "{activeTab !== 'search' && activeTab !== 'cartels' && ("
);

// 2. Hide Floating Create button when activeTab === 'cartels'
// It is at line 12033:
const floatingButtonTrigger = `className="fixed bottom-[calc(158px+env(safe-area-inset-bottom))] right-4 sm:right-10 z-[1000] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/40 shrink-0 flex-none backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-center text-[#ffffff] hover:scale-105 active:scale-95 transition-all duration-500 ease-out"`;

const newFloatingButtonTrigger = `className={\`fixed bottom-[calc(158px+env(safe-area-inset-bottom))] right-4 sm:right-10 z-[1000] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/40 shrink-0 flex-none backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-center text-[#ffffff] hover:scale-105 active:scale-95 transition-all duration-500 ease-out \${activeTab === 'cartels' ? 'hidden' : ''}\`}`;

if (appContent.includes(floatingButtonTrigger)) {
    appContent = appContent.replace(floatingButtonTrigger, newFloatingButtonTrigger);
    console.log('Floating button hidden for Cartels');
}

// 3. Make the floating create button look like a Mafia gun globally?
// Wait, the user said "uelo na alaji na to patas kai na einai san mafia me gun katalabes add group or private style"
// Translation: "I want it to change so you press it [the cartel button in the menu] and it's like a mafia with a gun..."
// Oh! They might not be talking about the floating create button at all.
// The user pasted the HTML of the floating create button!
// "<button class="fixed bottom...><svg...>...svg></button> uelo na alaji na to patas kai na einai san mafia me gun"
// "I want it to change so you press it and it is like a mafia with a gun"
// They want the SVG of the floating create button to be a GUN! And its style to be "mafia".
// Ah! So when they press it (or globally), they want the Create button to be a gun.
// Let's replace Icons.Pen in the floating button with a gun or crosshair or mafia icon?
// Let's create an `Icons.Gun` and replace `Icons.Pen` with it on the main floating button.

fs.writeFileSync(appPath, appContent);
console.log('App.jsx updated to hide UI artifacts');
