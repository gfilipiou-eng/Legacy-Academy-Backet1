import React from 'react';
// Old X/Twitter badge path (22x22 viewBox)
const OLD_BADGE_PATH = "M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z";

// Instagram star+tick badge path (40x40 viewBox) — fillRule=evenodd gives tick cutout
const INSTA_BADGE_PATH = "M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z";

// Instagram star ONLY (no tick sub-path) — used as clipPath for custom-interior badges
const INSTA_STAR_PATH = "M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Z";

// Football team badge IDs
const FOOTBALL_IDS = ['paok', 'olympiacos', 'aek', 'panathinaikos', 'aris'];

// Render a simple Instagram-star-shape badge with solid/gradient fill + tick color
const SimpleInstaBadge = ({ className, fill, tickFill = '#ffffff', gradientId, gradientDef }) => (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'hidden', display: 'inline-flex', flexShrink: 0 }}>
        {gradientDef && <defs>{gradientDef}</defs>}
        <circle cx="20" cy="20" r="10.2" fill={tickFill} />
        <path fill={gradientId ? `url(#${gradientId})` : fill} d={INSTA_BADGE_PATH} fillRule="evenodd" />
    </svg>
);



// ── MASONIC SYMBOL (Premium Seal) ──
const MasonicSymbol = ({ className }) => (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'hidden', display: 'inline-flex', flexShrink: 0 }}>
        <defs>
            <linearGradient id="vb_masonicGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2A8" />
                <stop offset="40%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#8A6517" />
            </linearGradient>
        </defs>
        
        <g transform="translate(1.5, 1.5) scale(1.1)">
            <path d="M15.4 1.5 C15.4 0.7 16 0.1 16.8 0.1 C17.6 0.1 18.2 0.7 18.2 1.5 C18.2 1.8 18.1 2.1 17.9 2.3 L25.5 22.5 L23.5 24 L16.8 6 L10.1 24 L8.1 22.5 L15.7 2.3 C15.5 2.1 15.4 1.8 15.4 1.5 Z" fill="url(#vb_masonicGold)" />
            <path d="M2.5 16 L5 14 L16.8 28.5 L28.6 14 L31.1 16 L16.8 33.5 Z" fill="url(#vb_masonicGold)" />
            <text x="17" y="20.5" textAnchor="middle" fill="url(#vb_masonicGold)" fontSize="11" fontWeight="900" fontFamily="Times New Roman, serif">G</text>
        </g>
    </svg>
);

const VerifiedBadge = ({ isFounder, className = "w-4 h-4", forceGold = false, isUser = false, user, badgeColor: badgeColorProp, showFootballText = false, hideFootball = false }) => {
    if (user?.settings?.showBadge === false) return null;

    const resolvedRole = user?.role || (isFounder && !isUser ? 'Founder' : 'User');
    const isGold = resolvedRole === 'Founder' || forceGold;

    let effectiveBadgeColor = badgeColorProp || user?.settings?.badgeColor;
    if (!effectiveBadgeColor) {
        effectiveBadgeColor = 'ig_blue'; // Prism Blue default for EVERYONE
    }

    const renderMainBadge = () => {

    // ── LEGACY MASONIC → UPGRADE to Liquid Glass Gold (seamless fallback for any users who previously had it) ──
    if (effectiveBadgeColor === 'masonic') {
        effectiveBadgeColor = 'liquid-gold';
    }

    // ── PRISM BLUE (Live Water / Sea Style) ──
    if (effectiveBadgeColor === 'ig_blue' || effectiveBadgeColor === 'prism_blue') {
        return (
            <SimpleInstaBadge className={className} gradientId="vb_prismWater" tickFill="#ffffff"
                gradientDef={
                    <linearGradient id="vb_prismWater" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00FFFF">
                            <animate attributeName="stopColor" values="#00FFFF;#00E5FF;#00BFFF;#00FFFF" dur="3s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="50%" stopColor="#0088FF">
                            <animate attributeName="stopColor" values="#0088FF;#00AAFF;#0066FF;#0088FF" dur="3s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#0033FF">
                            <animate attributeName="stopColor" values="#0033FF;#0055FF;#0011CC;#0033FF" dur="3s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>
                }
            />
        );
    }

    // ── USER BADGES ──
    if (!isGold) {
        let fillColor = '#1D9BF0';
        if (effectiveBadgeColor === 'blue') fillColor = '#2F80ED';
        return (
            <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'hidden', display: 'inline-flex', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="5.6" fill="var(--app-bg, #000000)" />
                <path fill={fillColor} d={OLD_BADGE_PATH} />
            </svg>
        );
    }

    // ── SOLAR GOLD — old X-style badge (Founder) ──
    if (effectiveBadgeColor === 'x_gold') {
        return (
            <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'hidden', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="vb_solarGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFE566" />
                        <stop offset="40%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#FF8C00" />
                    </linearGradient>
                </defs>
                <circle cx="11" cy="11" r="5.6" fill="#ffffff" />
                <path fill="url(#vb_solarGoldGrad)" d={OLD_BADGE_PATH} />
            </svg>
        );
    }

    // ── EMBER GOLD (ig_gold) ──
    if (effectiveBadgeColor === 'ig_gold' || effectiveBadgeColor === 'founder_gold') {
        return (
            <SimpleInstaBadge className={className} gradientId="vb_emberGold" tickFill="#ffffff"
                gradientDef={
                    <linearGradient id="vb_emberGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF7D6" />
                        <stop offset="25%" stopColor="#FDE047" />
                        <stop offset="55%" stopColor="#EAB308" />
                        <stop offset="80%" stopColor="#CA8A04" />
                        <stop offset="100%" stopColor="#78350F" />
                    </linearGradient>
                }
            />
        );
    }

    // ── DYNAMIC GOLD (live-gold) — animated ──
    if (effectiveBadgeColor === 'live-gold') {
        return (
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'hidden', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="vb_dynGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFD700">
                            <animate attributeName="stopColor" values="#FFD700;#FFFBE6;#FFD700;#FF8C00;#FFD700" dur="3s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="30%" stopColor="#FFFBE6">
                            <animate attributeName="stopColor" values="#FFFBE6;#FFD700;#FF8C00;#FFD700;#FFFBE6" dur="3s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="70%" stopColor="#FF8C00">
                            <animate attributeName="stopColor" values="#FF8C00;#FFD700;#FFFBE6;#FF8C00;#FF8C00" dur="3s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#D97706">
                            <animate attributeName="stopColor" values="#D97706;#FF8C00;#FFD700;#D97706;#D97706" dur="3s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="10.2" fill="#ffffff" />
                <path fill="url(#vb_dynGold)" d={INSTA_BADGE_PATH} fillRule="evenodd" />
                <g fill="white">
                    <circle cx="6" cy="8" r="1.2"><animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0s" repeatCount="indefinite" /><animate attributeName="r" values="0.5;1.4;0.5" dur="1.5s" begin="0s" repeatCount="indefinite" /></circle>
                    <circle cx="33" cy="10" r="1"><animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" /><animate attributeName="r" values="0.3;1.2;0.3" dur="2s" begin="0.5s" repeatCount="indefinite" /></circle>
                    <circle cx="8" cy="31" r="1.1"><animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="0.9s" repeatCount="indefinite" /><animate attributeName="r" values="0.4;1.3;0.4" dur="1.8s" begin="0.9s" repeatCount="indefinite" /></circle>
                    <circle cx="34" cy="30" r="0.9"><animate attributeName="opacity" values="0;1;0" dur="2.2s" begin="0.3s" repeatCount="indefinite" /><animate attributeName="r" values="0.3;1.1;0.3" dur="2.2s" begin="0.3s" repeatCount="indefinite" /></circle>
                </g>
            </svg>
        );
    }

    // ── LIQUID GLASS GOLD (liquid-gold) ──
    if (effectiveBadgeColor === 'liquid-gold') {
        return (
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'hidden', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="vb_liquidGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF9C4" />
                        <stop offset="20%" stopColor="#FFD700" stopOpacity="0.95" />
                        <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.9" />
                        <stop offset="70%" stopColor="#D97706" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#92400E" />
                    </linearGradient>
                    <linearGradient id="vb_glassSheen" x1="0%" y1="0%" x2="40%" y2="60%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
                        <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="10.2" fill="#ffffff" />
                <path fill="url(#vb_liquidGlass)" d={INSTA_BADGE_PATH} fillRule="evenodd" />
                <path fill="url(#vb_glassSheen)" d={INSTA_BADGE_PATH} fillRule="evenodd" style={{ opacity: 0.92 }} />
            </svg>
        );
    }

    // ── NEON PURPLE ──
    if (effectiveBadgeColor === 'neon-purple') {
        return (
            <SimpleInstaBadge className={className} gradientId="vb_neonPurple" tickFill="#ffffff"
                gradientDef={
                    <linearGradient id="vb_neonPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E879F9" />
                        <stop offset="50%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#6D28D9" />
                    </linearGradient>
                }
            />
        );
    }

    // ── HOLOGRAPHIC — animated rainbow + sparkle stars ──
    if (effectiveBadgeColor === 'holographic') {
        return (
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'hidden', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="vb_holoInsta" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF0080"><animate attributeName="stopColor" values="#FF0080;#FFD700;#00FF94;#00C8FF;#A855F7;#FF0080" dur="3s" repeatCount="indefinite" /></stop>
                        <stop offset="20%" stopColor="#FF8C00"><animate attributeName="stopColor" values="#FF8C00;#00FF94;#00C8FF;#A855F7;#FF0080;#FF8C00" dur="3s" repeatCount="indefinite" /></stop>
                        <stop offset="40%" stopColor="#FFD700"><animate attributeName="stopColor" values="#FFD700;#00C8FF;#A855F7;#FF0080;#FF8C00;#FFD700" dur="3s" repeatCount="indefinite" /></stop>
                        <stop offset="60%" stopColor="#00FF94"><animate attributeName="stopColor" values="#00FF94;#A855F7;#FF0080;#FF8C00;#FFD700;#00FF94" dur="3s" repeatCount="indefinite" /></stop>
                        <stop offset="80%" stopColor="#00C8FF"><animate attributeName="stopColor" values="#00C8FF;#FF0080;#FF8C00;#FFD700;#00FF94;#00C8FF" dur="3s" repeatCount="indefinite" /></stop>
                        <stop offset="100%" stopColor="#A855F7"><animate attributeName="stopColor" values="#A855F7;#FF8C00;#FFD700;#00FF94;#00C8FF;#A855F7" dur="3s" repeatCount="indefinite" /></stop>
                    </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="10.2" fill="#ffffff" />
                <path fill="url(#vb_holoInsta)" d={INSTA_BADGE_PATH} fillRule="evenodd" />
                <g fill="white">
                    <circle cx="6" cy="8" r="1.2"><animate attributeName="opacity" values="0;1;0" dur="1.5s" begin="0s" repeatCount="indefinite" /><animate attributeName="r" values="0.5;1.4;0.5" dur="1.5s" begin="0s" repeatCount="indefinite" /></circle>
                    <circle cx="33" cy="10" r="1"><animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" /><animate attributeName="r" values="0.3;1.2;0.3" dur="2s" begin="0.5s" repeatCount="indefinite" /></circle>
                    <circle cx="8" cy="31" r="1.1"><animate attributeName="opacity" values="0;1;0" dur="1.8s" begin="0.9s" repeatCount="indefinite" /><animate attributeName="r" values="0.4;1.3;0.4" dur="1.8s" begin="0.9s" repeatCount="indefinite" /></circle>
                    <circle cx="34" cy="30" r="0.9"><animate attributeName="opacity" values="0;1;0" dur="2.2s" begin="0.3s" repeatCount="indefinite" /><animate attributeName="r" values="0.3;1.1;0.3" dur="2.2s" begin="0.3s" repeatCount="indefinite" /></circle>
                    <circle cx="20" cy="4" r="1"><animate attributeName="opacity" values="0;1;0" dur="1.6s" begin="1.1s" repeatCount="indefinite" /></circle>
                </g>
            </svg>
        );
    }

    // ── BLACK & WHITE ──
    if (effectiveBadgeColor === 'black_white') {
        return <SimpleInstaBadge className={className} fill="#000000" tickFill="#ffffff" />;
    }

    // ── WHITE & BLACK ──
    if (effectiveBadgeColor === 'white_black') {
        return <SimpleInstaBadge className={className} fill="#ffffff" tickFill="#000000" />;
    }

    // ── Fallback: Ember Gold ──
        return <SimpleInstaBadge className={className} fill="#EAB308" tickFill="#ffffff" />;
    };

    return renderMainBadge();
};

export const AvatarFounderBadge = ({ className = "w-4 h-4 sm:w-5 sm:h-5" }) => (
    <VerifiedBadge isFounder={true} className={className} badgeColor="ig_gold" />
);

export default VerifiedBadge;
export { VerifiedBadge };
