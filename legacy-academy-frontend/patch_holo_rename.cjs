const fs = require('fs');

// ── 1. Update VerifiedBadge: beautiful animated holographic badge
let badge = fs.readFileSync('src/components/VerifiedBadge.jsx', 'utf8');

const oldHolo = `    if (isHolo) {
        return (
            <svg viewBox="0 0 22 22" className={\`\${className} shrink-0 flex-shrink-0\`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="vb_holoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff007f" />
                        <stop offset="25%" stopColor="#7f00ff" />
                        <stop offset="50%" stopColor="#00f0ff" />
                        <stop offset="75%" stopColor="#00ff7f" />
                        <stop offset="100%" stopColor="#ff007f" />
                    </linearGradient>
                </defs>
                <circle cx="11" cy="11" r="6" fill={checkColor} />
                <path fill="url(#vb_holoGrad)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" d={BADGE_PATH} />
            </svg>
        );
    }`;

const newHolo = `    if (isHolo) {
        return (
            <svg viewBox="0 0 22 22" className={\`\${className} shrink-0 flex-shrink-0\`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="vb_holoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF0080">
                            <animate attributeName="stopColor" values="#FF0080;#FFD700;#00FF94;#00C8FF;#A855F7;#FF0080" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="20%" stopColor="#FF8C00">
                            <animate attributeName="stopColor" values="#FF8C00;#00FF94;#00C8FF;#A855F7;#FF0080;#FF8C00" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="40%" stopColor="#FFD700">
                            <animate attributeName="stopColor" values="#FFD700;#00C8FF;#A855F7;#FF0080;#FF8C00;#FFD700" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="60%" stopColor="#00FF94">
                            <animate attributeName="stopColor" values="#00FF94;#A855F7;#FF0080;#FF8C00;#FFD700;#00FF94" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="80%" stopColor="#00C8FF">
                            <animate attributeName="stopColor" values="#00C8FF;#FF0080;#FF8C00;#FFD700;#00FF94;#00C8FF" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#A855F7">
                            <animate attributeName="stopColor" values="#A855F7;#FF8C00;#FFD700;#00FF94;#00C8FF;#A855F7" dur="4s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>
                    <filter id="vb_holoGlow">
                        <feGaussianBlur stdDeviation="0.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <circle cx="11" cy="11" r="6" fill="#000000" />
                <path fill="url(#vb_holoGrad)" d={BADGE_PATH} style={{ filter: 'drop-shadow(0 0 2px rgba(200,100,255,0.8))' }} />
            </svg>
        );
    }`;

badge = badge.replace(oldHolo, newHolo);
fs.writeFileSync('src/components/VerifiedBadge.jsx', badge);
console.log('Updated holographic badge');

// ── 2. Update App.jsx: remove live-gold + founder_gold from Founder list, rename badges
let app = fs.readFileSync('src/App.jsx', 'utf8');

// Remove "Dynamic Gold" (live-gold) and "Royal Gold" (founder_gold) from Founder list
app = app.replace(
    `                                                { id: 'founder_gold',  label: t('BADGE_ROYAL_GOLD', 'Royal Gold') },\n                                                { id: 'live-gold',     label: t('BADGE_DYNAMIC_GOLD', 'Dynamic Gold') },\n`,
    ''
);

// Rename ig_gold
app = app.replace(
    `{ id: 'ig_gold',       label: t('BADGE_IG_GOLD', 'IG Gold') }`,
    `{ id: 'ig_gold',       label: t('BADGE_EMBER_GOLD', 'Ember Gold') }`
);
// Rename x_gold
app = app.replace(
    `{ id: 'x_gold',        label: t('BADGE_X_GOLD', 'X Gold') }`,
    `{ id: 'x_gold',        label: t('BADGE_SOLAR_GOLD', 'Solar Gold') }`
);
// Rename x_blue (users)
app = app.replace(
    `{ id: 'x_blue',  label: t('BADGE_X_BLUE', 'X Blue') }`,
    `{ id: 'x_blue',  label: t('BADGE_COBALT', 'Cobalt') }`
);
// Rename ig_blue (users)
app = app.replace(
    `{ id: 'ig_blue', label: t('BADGE_IG_BLUE', 'IG Blue') }`,
    `{ id: 'ig_blue', label: t('BADGE_PRISM_BLUE', 'Prism Blue') }`
);
// Rename "Blue" user badge
app = app.replace(
    `{ id: 'blue',    label: t('BADGE_BLUE', 'Blue') }`,
    `{ id: 'blue',    label: t('BADGE_NOVA', 'Nova') }`
);

fs.writeFileSync('src/App.jsx', app);
console.log('Updated App.jsx badge names and list');
