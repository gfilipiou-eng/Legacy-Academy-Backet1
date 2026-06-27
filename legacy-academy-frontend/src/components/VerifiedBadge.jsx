import React from 'react';

const FOUNDER_SEAL_PATH = "M11 0 L14 3.5 L18.5 3.5 L18.5 8 L22 11 L18.5 14 L18.5 18.5 L14 18.5 L11 22 L8 18.5 L3.5 18.5 L3.5 14 L0 11 L3.5 8 L3.5 3.5 L8 3.5 Z";
const CHECKMARK_PATH = "M9.5 15.5l-4-4 1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5z";

const FounderPremiumBadge = ({ className }) => (
    <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0 drop-shadow-[0_2px_4px_rgba(234,179,8,0.5)]`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
        <defs>
            <linearGradient id="founderPremiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF7D6" />
                <stop offset="25%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#EAB308" />
                <stop offset="75%" stopColor="#CA8A04" />
                <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
            <linearGradient id="founderPremiumBorder" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#A16207" />
                <stop offset="50%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
        </defs>
        <path fill="url(#founderPremiumBorder)" d={FOUNDER_SEAL_PATH} style={{ transform: 'scale(1.05)', transformOrigin: 'center' }} />
        <path fill="url(#founderPremiumGrad)" d={FOUNDER_SEAL_PATH} />
        <path fill="#000000" d={CHECKMARK_PATH} />
    </svg>
);

const VerifiedBadge = ({ isFounder, className = "w-4 h-4", forceGold = false, isUser = false, user, badgeColor: badgeColorProp }) => {
    // If user settings specify showBadge is false, don't show the badge
    if (user && user.settings && user.settings.showBadge === false) {
        return null;
    }

    // Check role from user object if available, otherwise fall back to isFounder
    const resolvedRole = user?.role || (isFounder && !isUser ? 'Founder' : 'User');
    const isGold = (resolvedRole === 'Founder' || forceGold);
    
    // Default colors
    let baseColor = isGold ? '#F6E27A' : '#2F80ED';
    let darkColor  = isGold ? '#CB9B51' : '#1CB5E0';
    let gradId     = isGold ? 'vb_gold3DGrad' : 'vb_blue3DGrad';
    let checkColor = '#ffffff'; // Default checkmark is white
    
    let isHolo = false;
    let isMetallic = isGold; // founders start metallic by default
    let isSolid = false;
    let solidColor = '';

    // Resolve effective badge color (prop takes priority over user settings)
    let effectiveBadgeColor = badgeColorProp || user?.settings?.badgeColor;

    // If no custom color is set, Founders default to 'founder_gold' and users default to 'x_blue'
    if (!effectiveBadgeColor) {
        if (isGold) {
            effectiveBadgeColor = 'founder_gold';
        } else {
            effectiveBadgeColor = 'x_blue';
        }
    }

    // Custom badge color
    if (effectiveBadgeColor) {
        isMetallic = false;
        if (effectiveBadgeColor === 'gold')            { baseColor = '#F6E27A'; darkColor = '#CB9B51'; gradId = 'vb_gold3DGrad'; }
        else if (effectiveBadgeColor === 'neon-purple'){ baseColor = '#B026FF'; darkColor = '#590FB7'; gradId = 'vb_purple3DGrad'; }
        else if (effectiveBadgeColor === 'blue')       { baseColor = '#2F80ED'; darkColor = '#1CB5E0'; gradId = 'vb_blue3DGrad'; }
        else if (effectiveBadgeColor === 'holographic') { isHolo = true; }
        else if (effectiveBadgeColor === 'black_white') { isSolid = true; solidColor = '#000000'; checkColor = '#ffffff'; }
        else if (effectiveBadgeColor === 'white_black') { isSolid = true; solidColor = '#ffffff'; checkColor = '#000000'; }
        else if (effectiveBadgeColor === 'x_gold')      { isSolid = true; solidColor = '#e6c34f'; checkColor = '#000000'; } // X Gold has black check
        else if (effectiveBadgeColor === 'founder_gold'){ isSolid = true; solidColor = '#e6c34f'; checkColor = 'transparent'; } // Pure gold star without inner circle
        else if (effectiveBadgeColor === 'x_blue')      { isSolid = true; solidColor = '#1D9BF0'; checkColor = '#ffffff'; } // X Blue has white check
        else if (effectiveBadgeColor === 'ig_blue')     { isSolid = true; solidColor = '#0095f6'; checkColor = '#ffffff'; } // IG Blue has white check
        else if (['metal-blue', 'obsidian-gold', 'liquid-gold', 'live-gold', 'ig_gold'].includes(effectiveBadgeColor)) {
            isMetallic = true;
        }
    }

    const BADGE_PATH_INNER = BADGE_PATH;

    if (isSolid) {
        if (effectiveBadgeColor === 'founder_gold') {
            return <FounderPremiumBadge className={className} />;
        }
        return (
            <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0 drop-shadow-sm`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                {checkColor !== 'transparent' && <circle cx="11" cy="11" r="6" fill={checkColor} />}
                <path fill={solidColor} d={BADGE_PATH} />
            </svg>
        );
    }

    if (isMetallic) {
        let stops;
        let gradIdName;
        const resolvedMetallicColor = effectiveBadgeColor || (isGold ? 'liquid-gold' : null);
        if (resolvedMetallicColor === 'metal-blue') {
            gradIdName = "vb_metalBlueGrad";
            stops = [
                { offset: "0%", color: "#0F2027" },
                { offset: "25%", color: "#203A43" },
                { offset: "50%", color: "#00E1FF" },
                { offset: "75%", color: "#2C5364" },
                { offset: "100%", color: "#0F2027" }
            ];
        } else if (resolvedMetallicColor === 'obsidian-gold') {
            gradIdName = "vb_obsidianGoldGrad";
            stops = [
                { offset: "0%", color: "#0A0A0A" },
                { offset: "25%", color: "#222222" },
                { offset: "50%", color: "#FFD700" },
                { offset: "75%", color: "#222222" },
                { offset: "100%", color: "#0A0A0A" }
            ];
        } else if (resolvedMetallicColor === 'ig_gold') {
            gradIdName = "vb_igGoldGrad";
            stops = [
                { offset: "0%", color: "#fdf497" },
                { offset: "5%", color: "#fdf497" },
                { offset: "45%", color: "#fd5949" },
                { offset: "60%", color: "#d6249f" },
                { offset: "90%", color: "#285AEB" }
            ];
        } else if (resolvedMetallicColor === 'liquid-gold') {
            gradIdName = "vb_liquidGoldGrad";
            stops = [
                { offset: "0%",   color: "#B8860B" },
                { offset: "25%",  color: "#FFD700" },
                { offset: "50%",  color: "#FFA500" },
                { offset: "75%",  color: "#FFDF00" },
                { offset: "100%", color: "#B8860B" }
            ];
        } else {
            // live-gold or unknown metallic — rich multi-stop gold
            gradIdName = "vb_metalGoldGrad";
            stops = [
                { offset: "0%",   color: "#bf953f" },
                { offset: "25%",  color: "#fcf6ba" },
                { offset: "50%",  color: "#b38728" },
                { offset: "75%",  color: "#fbf5b7" },
                { offset: "100%", color: "#aa771c" }
            ];
        }

        return (
            <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0 drop-shadow-sm`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <defs>
                    <linearGradient id={gradIdName} x1="0%" y1="0%" x2="100%" y2="100%">
                        {stops.map((stop, i) => <stop key={i} offset={stop.offset} stopColor={stop.color} />)}
                    </linearGradient>
                </defs>
                <circle cx="11" cy="11" r="6" fill={checkColor} />
                <path fill={`url(#${gradIdName})`} d={BADGE_PATH} />
            </svg>
        );
    }

    if (isHolo) {
        return (
            <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
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
    }

    return (
        <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0 drop-shadow-sm`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={darkColor} />
                    <stop offset="100%" stopColor={baseColor} />
                </linearGradient>
            </defs>
            <circle cx="11" cy="11" r="6" fill={checkColor} />
            <path fill={`url(#${gradId})`} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" d={BADGE_PATH} />
        </svg>
    );
};

export default VerifiedBadge;
export { VerifiedBadge };

export const AvatarFounderBadge = ({ className = "w-4 h-4 sm:w-5 sm:h-5" }) => (
    <FounderPremiumBadge className={className} />
);
