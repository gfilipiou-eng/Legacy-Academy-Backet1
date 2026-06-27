import React from 'react';

const FounderCrownBadge = ({ className }) => (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0 flex-shrink-0 drop-shadow-[0_2px_6px_rgba(234,179,8,0.5)]`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
        <defs>
            <linearGradient id="founderMajesticGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF7D6" />
                <stop offset="25%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#EAB308" />
                <stop offset="75%" stopColor="#CA8A04" />
                <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
            <linearGradient id="founderMajesticBase" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EAB308" />
                <stop offset="50%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
            <filter id="crownGlow">
                <feGaussianBlur stdDeviation="0.5" result="blur" />
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        <path fill="url(#founderMajesticGrad)" filter="url(#crownGlow)" d="M2 15l2.5-9 3.5 5.5L12 3l4 8.5 3.5-5.5L22 15H2z" />
        <path fill="url(#founderMajesticBase)" filter="url(#crownGlow)" d="M4 16h16l1.5 4H2.5L4 16z" />
        <path fill="#FEF08A" d="M4 16h16v1H4v-1z" opacity="0.8" />
        <circle cx="4.5" cy="4.5" r="1.5" fill="#FFF7D6" filter="url(#crownGlow)" />
        <circle cx="12" cy="1.5" r="1.5" fill="#FFF7D6" filter="url(#crownGlow)" />
        <circle cx="19.5" cy="4.5" r="1.5" fill="#FFF7D6" filter="url(#crownGlow)" />
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

    const BADGE_PATH = "M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z";

    if (isSolid) {
        if (effectiveBadgeColor === 'founder_gold') {
            return <FounderCrownBadge className={className} />;
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
    <FounderCrownBadge className={className} />
);
