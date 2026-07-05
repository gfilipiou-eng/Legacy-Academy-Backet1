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
const SimpleInstaBadge = ({ className, fill, tickFill = '#000', gradientId, gradientDef }) => (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
        {gradientDef && <defs>{gradientDef}</defs>}
        <circle cx="20" cy="20" r="11" fill={tickFill} />
        <path fill={gradientId ? `url(#${gradientId})` : fill} d={INSTA_BADGE_PATH} fillRule="evenodd" />
    </svg>
);

// Elite Illuminati badge — Eye of Providence, animated blink + pulsing green glow
const IlluminatiBadge = ({ className }) => (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
        <defs>
            <clipPath id="vb_illumClip">
                <path d={INSTA_STAR_PATH} />
            </clipPath>
            <linearGradient id="vb_illumTriGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE566" />
                <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
            <radialGradient id="vb_illumEyeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00FF00" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#004400" stopOpacity="0" />
            </radialGradient>
            <filter id="vb_illumGlowF" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.2" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
        </defs>
        <g clipPath="url(#vb_illumClip)">
            {/* Dark background */}
            <rect x="0" y="0" width="40" height="40" fill="#060810" />
            {/* Subtle dark bg gradient */}
            <circle cx="20" cy="22" r="18" fill="#0D1530" />

            {/* Pulsing eye glow */}
            <ellipse cx="20" cy="22" rx="8" ry="6" fill="url(#vb_illumEyeGlow)">
                <animate attributeName="rx" values="6;10;6" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="ry" values="5;8;5" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
            </ellipse>

            {/* Pyramid / Triangle */}
            <polygon points="20,9 33,31 7,31" fill="none" stroke="url(#vb_illumTriGold)" strokeWidth="1.6" filter="url(#vb_illumGlowF)">
                <animate attributeName="stroke-opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
            </polygon>
            {/* Pyramid inner horizontal line (eye level) */}
            <line x1="10.5" y1="22" x2="29.5" y2="22" stroke="url(#vb_illumTriGold)" strokeWidth="0.7" strokeOpacity="0.4" />

            {/* Light rays from top of pyramid */}
            {[[-18,3],[-10,1],[0,-2],[10,1],[18,3]].map(([dx, dy], i) => (
                <line key={i}
                    x1={20 + dx * 0.4} y1={9 + dy * 0.4}
                    x2={20 + dx} y2={9 + dy - 3}
                    stroke="#FFE566" strokeWidth="0.8" strokeOpacity="0.6"
                    strokeLinecap="round">
                    <animate attributeName="stroke-opacity" values="0.3;0.9;0.3" dur="2.5s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
                </line>
            ))}

            {/* Eye white — animates open/close */}
            <ellipse cx="20" cy="22" rx="5.5" ry="3.8" fill="#F5FFE8" filter="url(#vb_illumGlowF)">
                {/* Blink: open most of time, close briefly */}
                <animate attributeName="ry" values="3.8;3.8;3.8;0.15;3.8;3.8" dur="5s" repeatCount="indefinite" keyTimes="0;0.5;0.7;0.75;0.8;1" />
            </ellipse>

            {/* Iris — green */}
            <circle cx="20" cy="22" r="2.6" fill="#00CC44">
                <animate attributeName="r" values="2.6;2.6;0.05;2.6;2.6" dur="5s" repeatCount="indefinite" keyTimes="0;0.7;0.75;0.8;1" />
                <animate attributeName="fill" values="#00CC44;#00FF55;#00CC44" dur="2.5s" repeatCount="indefinite" />
            </circle>
            {/* Pupil — black */}
            <circle cx="20" cy="22" r="1.3" fill="#000000">
                <animate attributeName="r" values="1.3;1.3;0.02;1.3;1.3" dur="5s" repeatCount="indefinite" keyTimes="0;0.7;0.75;0.8;1" />
            </circle>
            {/* Eye highlight */}
            <circle cx="21.5" cy="21" r="0.7" fill="white" opacity="0.85">
                <animate attributeName="opacity" values="0.85;0.85;0;0.85;0.85" dur="5s" repeatCount="indefinite" keyTimes="0;0.7;0.75;0.8;1" />
            </circle>

            {/* Bottom base glow line */}
            <line x1="7" y1="31" x2="33" y2="31" stroke="#FFE566" strokeWidth="1" strokeOpacity="0.5">
                <animate attributeName="stroke-opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" />
            </line>
        </g>
    </svg>
);
// ── MASONIC SYMBOL (Standalone) ──
const MasonicSymbol = ({ className }) => (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
        <defs>
            <linearGradient id="vb_masonicGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2A8" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#A07820" />
            </linearGradient>
            <filter id="vb_shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.8" />
            </filter>
        </defs>
        <g filter="url(#vb_shadow)">
            <path d="M20 34 L5 19 L8 16 L20 28 L32 16 L35 19 Z" fill="url(#vb_masonicGold)" />
            <path d="M20 5 L6 31 L10 31 L20 12 L30 31 L34 31 Z" fill="url(#vb_masonicGold)" />
            <circle cx="20" cy="7" r="3.5" fill="url(#vb_masonicGold)" />
            <text x="20" y="24" textAnchor="middle" fill="url(#vb_masonicGold)" fontSize="12" fontWeight="bold" fontFamily="Georgia, serif">G</text>
        </g>
    </svg>
);

// ── FOOTBALL SYMBOLS ──
const PaokSymbol = ({ className }) => (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0, filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>
        <defs>
            <clipPath id="paok_shield"><path d="M6 4 L34 4 L34 20 C34 32 20 38 20 38 C20 38 6 32 6 20 Z" /></clipPath>
        </defs>
        <g clipPath="url(#paok_shield)">
            <rect x="0" y="0" width="40" height="40" fill="#000000" />
            <rect x="8" y="16" width="6" height="24" fill="#FFFFFF" />
            <rect x="17" y="16" width="6" height="24" fill="#FFFFFF" />
            <rect x="26" y="16" width="6" height="24" fill="#FFFFFF" />
            <text x="20" y="13.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="0.5">ΠΑΟΚ</text>
        </g>
        <path d="M6 4 L34 4 L34 20 C34 32 20 38 20 38 C20 38 6 32 6 20 Z" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
);

const OlympiacosSymbol = ({ className }) => (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0, filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>
        <circle cx="20" cy="20" r="19" fill="#D30000" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="13" fill="#FFFFFF" />
        <path id="oly_arc" d="M 8 20 A 12 12 0 0 1 32 20" fill="none" />
        <text fill="#FFFFFF" fontSize="4.5" fontWeight="bold" letterSpacing="0.5">
            <textPath href="#oly_arc" startOffset="50%" textAnchor="middle">ΟΛΥΜΠΙΑΚΟΣ</textPath>
        </text>
        <path d="M16 15 C19 12 24 13 25 17 C26 21 23 25 19 26 C16 26 15 24 16 21 C14 20 14 17 16 15 Z" fill="#D30000" />
    </svg>
);

const AekSymbol = ({ className }) => (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0, filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>
        <defs>
            <clipPath id="aek_shield"><path d="M6 4 L34 4 L34 20 C34 32 20 38 20 38 C20 38 6 32 6 20 Z" /></clipPath>
            <linearGradient id="aek_gold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF000" />
                <stop offset="100%" stopColor="#D4AF37" />
            </linearGradient>
        </defs>
        <g clipPath="url(#aek_shield)">
            <rect x="0" y="0" width="40" height="40" fill="url(#aek_gold)" />
            <path d="M20 15 L11 12 L11 20 L16 22 L13 29 L20 23 L27 29 L24 22 L29 20 L29 12 Z" fill="#000000" />
            <path d="M18 9 L20 5 L22 9 Z" fill="#000000" />
            <circle cx="16" cy="14.5" r="1.5" fill="url(#aek_gold)" />
            <circle cx="24" cy="14.5" r="1.5" fill="url(#aek_gold)" />
            <text x="20" y="35" textAnchor="middle" fill="#000000" fontSize="6" fontWeight="900" fontFamily="Arial">A.E.K.</text>
        </g>
        <path d="M6 4 L34 4 L34 20 C34 32 20 38 20 38 C20 38 6 32 6 20 Z" fill="none" stroke="#000000" strokeWidth="1.5" />
    </svg>
);

const PaoSymbol = ({ className }) => (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0, filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>
        <circle cx="20" cy="20" r="19" fill="#007A33" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="16" fill="#FFFFFF" />
        <g fill="#007A33">
            <circle cx="20" cy="11.5" r="5" />
            <circle cx="12.5" cy="21" r="5" />
            <circle cx="27.5" cy="21" r="5" />
            <path d="M20 18 L17 33 L23 33 Z" />
        </g>
    </svg>
);

const ArisSymbol = ({ className }) => (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0, filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>
        <defs>
            <clipPath id="aris_shield"><path d="M8 4 L32 4 L32 22 C32 32 20 38 20 38 C20 38 8 32 8 22 Z" /></clipPath>
        </defs>
        <g clipPath="url(#aris_shield)">
            <rect x="0" y="0" width="40" height="40" fill="#FFD700" />
            <text x="20" y="14" textAnchor="middle" fill="#000000" fontSize="8" fontWeight="900" fontFamily="Arial">ΑΡΗΣ</text>
            <path d="M14 30 L16 16 C16 16 20 14 24 16 L26 30 L23 22 L17 22 Z" fill="#000000" />
        </g>
        <path d="M8 4 L32 4 L32 22 C32 32 20 38 20 38 C20 38 8 32 8 22 Z" fill="none" stroke="#000000" strokeWidth="1.5" />
    </svg>
);

const VerifiedBadge = ({ isFounder, className = "w-4 h-4", forceGold = false, isUser = false, user, badgeColor: badgeColorProp }) => {
    if (user?.settings?.showBadge === false) return null;

    const resolvedRole = user?.role || (isFounder && !isUser ? 'Founder' : 'User');
    const isGold = resolvedRole === 'Founder' || forceGold;

    let effectiveBadgeColor = badgeColorProp || user?.settings?.badgeColor;
    if (!effectiveBadgeColor) {
        effectiveBadgeColor = isGold ? 'ig_gold' : 'x_blue';
    }

    // ── ELITE ILLUMINATI (Founder only) ──
    if (effectiveBadgeColor === 'illuminati') {
        return <IlluminatiBadge className={className} />;
    }

    // ── FOOTBALL BADGES (available for ALL roles) ──
    if (effectiveBadgeColor === 'paok') {
        return <PaokSymbol className={className} />;
    }
    if (effectiveBadgeColor === 'olympiacos') {
        return <OlympiacosSymbol className={className} />;
    }
    if (effectiveBadgeColor === 'aek') {
        return <AekSymbol className={className} />;
    }
    if (effectiveBadgeColor === 'panathinaikos') {
        return <PaoSymbol className={className} />;
    }
    if (effectiveBadgeColor === 'aris') {
        return <ArisSymbol className={className} />;
    }

    // ── MASONIC BADGE (Founder only) ──
    if (effectiveBadgeColor === 'masonic') {
        return <MasonicSymbol className={className} />;
    }

    // ── USER BADGES ──
    if (!isGold) {
        if (effectiveBadgeColor === 'ig_blue') {
            return <SimpleInstaBadge className={className} fill="rgb(0,149,246)" tickFill="#000" />;
        }
        let fillColor = '#1D9BF0';
        if (effectiveBadgeColor === 'blue') fillColor = '#2F80ED';
        return (
            <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="6" fill="#000" />
                <path fill={fillColor} d={OLD_BADGE_PATH} />
            </svg>
        );
    }

    // ── SOLAR GOLD — old X-style badge (Founder) ──
    if (effectiveBadgeColor === 'x_gold') {
        return (
            <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="vb_solarGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFE566" />
                        <stop offset="40%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#FF8C00" />
                    </linearGradient>
                </defs>
                <circle cx="11" cy="11" r="6" fill="#000" />
                <path fill="url(#vb_solarGoldGrad)" d={OLD_BADGE_PATH} />
            </svg>
        );
    }

    // ── EMBER GOLD (ig_gold) ──
    if (effectiveBadgeColor === 'ig_gold' || effectiveBadgeColor === 'founder_gold') {
        return (
            <SimpleInstaBadge className={className} gradientId="vb_emberGold" tickFill="#000"
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
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="vb_dynGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF">
                            <animate attributeName="stopColor" values="#FFFFFF;#FFD700;#FF8C00;#FFD700;#FFFFFF" dur="2s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="30%" stopColor="#FFD700">
                            <animate attributeName="stopColor" values="#FFD700;#FF8C00;#FFEC6E;#FF6B00;#FFD700" dur="2s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="65%" stopColor="#FF8C00">
                            <animate attributeName="stopColor" values="#FF8C00;#FFEC6E;#FFD700;#FFFFFF;#FF8C00" dur="2s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#92400E">
                            <animate attributeName="stopColor" values="#92400E;#D97706;#92400E;#FF8C00;#92400E" dur="2s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="11" fill="#000" />
                <path fill="url(#vb_dynGold)" d={INSTA_BADGE_PATH} fillRule="evenodd" />
            </svg>
        );
    }

    // ── LIQUID GLASS GOLD (liquid-gold) ──
    if (effectiveBadgeColor === 'liquid-gold') {
        return (
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
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
                <circle cx="20" cy="20" r="11" fill="#000" />
                <path fill="url(#vb_liquidGlass)" d={INSTA_BADGE_PATH} fillRule="evenodd" />
                <path fill="url(#vb_glassSheen)" d={INSTA_BADGE_PATH} fillRule="evenodd" style={{ mixBlendMode: 'screen' }} />
            </svg>
        );
    }

    // ── NEON PURPLE ──
    if (effectiveBadgeColor === 'neon-purple') {
        return (
            <SimpleInstaBadge className={className} gradientId="vb_neonPurple" tickFill="#000"
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
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
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
                <circle cx="20" cy="20" r="11" fill="#000" />
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
    return <SimpleInstaBadge className={className} fill="#EAB308" tickFill="#000" />;
};

export const AvatarFounderBadge = ({ className = "w-4 h-4 sm:w-5 sm:h-5" }) => (
    <VerifiedBadge isFounder={true} className={className} badgeColor="ig_gold" />
);

export default VerifiedBadge;
export { VerifiedBadge };
