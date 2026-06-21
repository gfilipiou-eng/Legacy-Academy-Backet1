const fs = require('fs');
const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add Notification request on first click
const notifCode = `
    // AUTO-REQUEST NOTIFICATIONS ON FIRST CLICK
    useEffect(() => {
        const askForNotifs = () => {
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
            document.removeEventListener('click', askForNotifs);
            document.removeEventListener('touchstart', askForNotifs);
        };
        document.addEventListener('click', askForNotifs);
        document.addEventListener('touchstart', askForNotifs);
        return () => {
            document.removeEventListener('click', askForNotifs);
            document.removeEventListener('touchstart', askForNotifs);
        };
    }, []);
`;
// Inject inside App component just after auto-language detection
code = code.replace(
    /(\/\/\s*AUTO-LANGUAGE DETECTION[\s\S]*?\}, \[user\?\.settings\?\.language\]\);)/,
    `$1\n${notifCode}\n`
);

// 2. Remove silver, bronze, green from verified badge and add metal-blue
code = code.replace(
    /else if \(customColor === 'silver'\) \{ baseColor = '#E0E0E0'; darkColor = '#888888'; gradId = 'silver3DGrad'; \}\s*else if \(customColor === 'bronze'\) \{ baseColor = '#CD7F32'; darkColor = '#8B4513'; gradId = 'bronze3DGrad'; \}\s*else if \(customColor === 'neon-green'\) \{ baseColor = '#39FF14'; darkColor = '#008000'; gradId = 'green3DGrad'; \}/,
    `else if (customColor === 'metal-blue') { baseColor = '#00B4DB'; darkColor = '#0083B0'; gradId = 'metalBlueGrad'; isMetallic = true; }`
);

// 3. Remove silver, bronze, green from settings options and add metal-blue
code = code.replace(
    /\{\s*id: 'silver',\s*label: 'Silver',\s*color: '#C0C0C0'\s*\},[\s\S]*?\{\s*id: 'neon-green',\s*label: 'Green',\s*color: '#39FF14'\s*\}/,
    `{ id: 'metal-blue', label: 'Metal Blue', color: '#0083B0' }`
);

// 4. In VerifiedBadge, change the metal gradient colors to support metal-blue when customColor='metal-blue'
// Wait, the metal gradient is hardcoded to gold:
// <linearGradient id="metalGoldGrad" ...
// We can change isMetallic to check if it's 'live-gold' or 'metal-blue' and use different stops.
// Let's replace the whole isMetallic block.

const newMetallicBlock = `
    if (isMetallic) {
        const stops = customColor === 'metal-blue' 
            ? [
                { offset: "0%", color: "#005C97" },
                { offset: "25%", color: "#363795" },
                { offset: "50%", color: "#00B4DB" },
                { offset: "75%", color: "#0083B0" },
                { offset: "100%", color: "#005C97" }
              ]
            : [
                { offset: "0%", color: "#bf953f" },
                { offset: "25%", color: "#fcf6ba" },
                { offset: "50%", color: "#b38728" },
                { offset: "75%", color: "#fbf5b7" },
                { offset: "100%", color: "#aa771c" }
              ];
              
        return (
            <svg viewBox="0 0 22 22" className={\`\${className} shrink-0 flex-shrink-0 drop-shadow-sm\`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id={customColor === 'metal-blue' ? 'metalBlueGrad' : 'metalGoldGrad'} x1="0%" y1="0%" x2="100%" y2="100%">
                        {stops.map((stop, i) => <stop key={i} offset={stop.offset} stopColor={stop.color} />)}
                    </linearGradient>
                </defs>
                <circle cx="11" cy="11" r="6" fill="#ffffff" />
                <path fill={customColor === 'metal-blue' ? 'url(#metalBlueGrad)' : 'url(#metalGoldGrad)'} d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
            </svg>
        );
    }
`;

code = code.replace(
    /if \(isMetallic\) \{[\s\S]*?<\/svg>\n\s*\}/,
    newMetallicBlock
);

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated badges and notifications!');
