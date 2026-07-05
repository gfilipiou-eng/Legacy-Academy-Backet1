import React from 'react';

// Old X/Twitter badge path (22x22 viewBox) — used for user badges + Solar Gold
const OLD_BADGE_PATH = "M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z";

// Instagram star badge path (40x40 viewBox) — used for ALL founder badges except Solar Gold
const INSTA_BADGE_PATH = "M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z";

// Renders an Instagram-shape badge (40x40 viewBox)
// tickFill = color shown through the tick cutout (fillRule=evenodd)
const InstaBadge = ({ className, tickFill = '#000', children }) => (
    <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
        <defs>{children}</defs>
        {/* circle behind the tick cutout */}
        <circle cx="20" cy="20" r="11" fill={tickFill} />
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

    // ── USER BADGES — old X-style badge shape ──
    if (!isGold) {
        let fillColor = '#1D9BF0';
        if (effectiveBadgeColor === 'blue')   fillColor = '#2F80ED';
        if (effectiveBadgeColor === 'ig_blue') fillColor = 'rgb(0,149,246)';

        return (
            <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="6" fill="#000" />
                <path fill={fillColor} d={OLD_BADGE_PATH} />
            </svg>
        );
    }

    // ── SOLAR GOLD — keep old X-style badge shape with gold fill ──
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

    // ── ALL OTHER FOUNDER BADGES — Instagram star shape ──

    // Ember Gold (ig_gold) — deep amber gradient
    if (effectiveBadgeColor === 'ig_gold' || effectiveBadgeColor === 'founder_gold') {
        return (
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="vb_emberGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF7D6" />
                        <stop offset="25%" stopColor="#FDE047" />
                        <stop offset="55%" stopColor="#EAB308" />
                        <stop offset="80%" stopColor="#CA8A04" />
                        <stop offset="100%" stopColor="#78350F" />
                    </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="11" fill="#000" />
                <path fill="url(#vb_emberGold)" d={INSTA_BADGE_PATH} fillRule="evenodd" />
            </svg>
        );
    }

    // Liquid Gold — rich molten gold
    if (effectiveBadgeColor === 'liquid-gold' || effectiveBadgeColor === 'live-gold') {
        return (
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="vb_liquidGold" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#92400E" />
                        <stop offset="25%" stopColor="#D97706" />
                        <stop offset="50%" stopColor="#FDE68A" />
                        <stop offset="75%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#92400E" />
                    </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="11" fill="#000" />
                <path fill="url(#vb_liquidGold)" d={INSTA_BADGE_PATH} fillRule="evenodd" />
            </svg>
        );
    }

    // Neon Purple
    if (effectiveBadgeColor === 'neon-purple') {
        return (
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="vb_neonPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E879F9" />
                        <stop offset="50%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#6D28D9" />
                    </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="11" fill="#000" />
                <path fill="url(#vb_neonPurple)" d={INSTA_BADGE_PATH} fillRule="evenodd" />
            </svg>
        );
    }

    // Holographic — animated rainbow
    if (effectiveBadgeColor === 'holographic') {
        return (
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id="vb_holoInsta" x1="0%" y1="0%" x2="100%" y2="100%">
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
                </defs>
                <circle cx="20" cy="20" r="11" fill="#000" />
                <path fill="url(#vb_holoInsta)" d={INSTA_BADGE_PATH} fillRule="evenodd" style={{ filter: 'drop-shadow(0 0 2px rgba(168,85,247,0.7))' }} />
            </svg>
        );
    }

    // Black & White — black badge, white tick
    if (effectiveBadgeColor === 'black_white') {
        return (
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <circle cx="20" cy="20" r="11" fill="#ffffff" />
                <path fill="#000000" d={INSTA_BADGE_PATH} fillRule="evenodd" />
            </svg>
        );
    }

    // White & Black — white badge, black tick
    if (effectiveBadgeColor === 'white_black') {
        return (
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <circle cx="20" cy="20" r="11" fill="#000000" />
                <path fill="#ffffff" d={INSTA_BADGE_PATH} fillRule="evenodd" />
            </svg>
        );
    }

    // ── Fallback: Ember Gold ──
    return (
        <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
            <defs>
                <linearGradient id="vb_fallbackGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE047" />
                    <stop offset="100%" stopColor="#CA8A04" />
                </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="11" fill="#000" />
            <path fill="url(#vb_fallbackGold)" d={INSTA_BADGE_PATH} fillRule="evenodd" />
        </svg>
    );
};

export const AvatarFounderBadge = ({ className = "w-4 h-4 sm:w-5 sm:h-5" }) => (
    <VerifiedBadge isFounder={true} className={className} badgeColor="ig_gold" />
);

export default VerifiedBadge;
export { VerifiedBadge };
