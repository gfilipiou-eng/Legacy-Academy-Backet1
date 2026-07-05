const fs = require('fs');

const code = `import React from 'react';

const INSTA_BADGE_PATH = "M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z";

const VerifiedBadge = ({ isFounder, className = "w-4 h-4", forceGold = false, isUser = false, user, badgeColor: badgeColorProp }) => {
    // If user settings specify showBadge is false, don't show the badge
    if (user && user.settings && user.settings.showBadge === false) {
        return null;
    }

    // Check role from user object if available, otherwise fall back to isFounder
    const resolvedRole = user?.role || (isFounder && !isUser ? 'Founder' : 'User');
    const isGold = (resolvedRole === 'Founder' || forceGold);
    
    // Resolve effective badge color (prop takes priority over user settings)
    let effectiveBadgeColor = badgeColorProp || user?.settings?.badgeColor;

    if (!effectiveBadgeColor) {
        effectiveBadgeColor = isGold ? 'founder_gold' : 'x_blue';
    }

    // The user explicitly asked for "blue for normal user and gold for founder"
    // I will use Instagram Blue rgb(0, 149, 246) and a rich Gold.
    
    let isGoldBadge = false;
    let fillColor = "rgb(0, 149, 246)"; // Default blue

    if (effectiveBadgeColor === 'founder_gold' || effectiveBadgeColor === 'gold' || effectiveBadgeColor === 'x_gold' || effectiveBadgeColor === 'liquid-gold' || effectiveBadgeColor === 'obsidian-gold' || effectiveBadgeColor === 'metal-gold') {
        isGoldBadge = true;
    } else if (isGold) {
        isGoldBadge = true;
    }

    if (effectiveBadgeColor === 'black_white') fillColor = '#000000';
    else if (effectiveBadgeColor === 'white_black') fillColor = '#ffffff';
    else if (effectiveBadgeColor === 'neon-purple') fillColor = '#B026FF';

    return (
        <svg 
            viewBox="0 0 40 40" 
            className={\`\${className} shrink-0 flex-shrink-0\`} 
            style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}
        >
            <circle cx="20" cy="20" r="12" fill={effectiveBadgeColor === 'white_black' ? '#000000' : '#ffffff'} />
            {isGoldBadge ? (
                <>
                    <defs>
                        <linearGradient id="founderGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFF7D6" />
                            <stop offset="25%" stopColor="#FDE047" />
                            <stop offset="50%" stopColor="#EAB308" />
                            <stop offset="75%" stopColor="#CA8A04" />
                            <stop offset="100%" stopColor="#854D0E" />
                        </linearGradient>
                    </defs>
                    <path fill="url(#founderGoldGrad)" d={INSTA_BADGE_PATH} fillRule="evenodd" />
                </>
            ) : (
                <path fill={fillColor} d={INSTA_BADGE_PATH} fillRule="evenodd" />
            )}
        </svg>
    );
};

export default VerifiedBadge;
export { VerifiedBadge };
`;

fs.writeFileSync('src/components/VerifiedBadge.jsx', code);
console.log('Replaced VerifiedBadge.jsx');
