import React from 'react';

const BADGE_PATH = "M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z";

const FounderPremiumBadge = ({ className }) => (
    <svg viewBox="0 0 22 22" className={`${className} shrink-0 flex-shrink-0 drop-shadow-sm`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
        <defs>
            <linearGradient id="founderPremiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF7D6" />
                <stop offset="25%" stopColor="#FDE047" />
                <stop offset="50%" stopColor="#EAB308" />
                <stop offset="75%" stopColor="#CA8A04" />
                <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
        </defs>
        <path fill="url(#founderPremiumGrad)" d="M11 0 L14 3.5 L18.5 3.5 L18.5 8 L22 11 L18.5 14 L18.5 18.5 L14 18.5 L11 22 L8 18.5 L3.5 18.5 L3.5 14 L0 11 L3.5 8 L3.5 3.5 L8 3.5 Z" />
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
    let checkColor = '#000000'; // Default checkmark is black
    
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
        else if (effectiveBadgeColor === 'black_white') { isSolid = true; solidColor = '#000000'; checkColor = '#ffffff'; } // Exception: white tick on black badge
        else if (effectiveBadgeColor === 'white_black') { isSolid = true; solidColor = '#ffffff'; checkColor = '#000000'; }
        else if (effectiveBadgeColor === 'x_gold')      { isSolid = true; solidColor = '#e6c34f'; checkColor = '#000000'; }
        else if (effectiveBadgeColor === 'founder_gold'){ isSolid = true; solidColor = '#e6c34f'; checkColor = '#000000'; }
        else if (effectiveBadgeColor === 'x_blue')      { isSolid = true; solidColor = '#1D9BF0'; checkColor = '#000000'; }
        else if (effectiveBadgeColor === 'ig_blue')     { isSolid = true; solidColor = '#0095f6'; checkColor = '#000000'; }
        else if (['metal-blue', 'obsidian-gold', 'liquid-gold', 'live-gold', 'ig_gold'].includes(effectiveBadgeColor)) {
            isMetallic = true;
        }
    }

    const BADGE_PATH_INNER = BADGE_PATH;
    const INSTA_BADGE_PATH = "M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z";

    if (effectiveBadgeColor === 'ig_blue' || effectiveBadgeColor === 'ig_gold') {
        const isIgGold = effectiveBadgeColor === 'ig_gold';
        return (
            <svg viewBox="0 0 40 40" className={`${className} shrink-0 flex-shrink-0 drop-shadow-sm`} style={{ overflow: 'visible', display: 'inline-flex', flexShrink: 0 }}>
                <circle cx="20" cy="20" r="12" fill="#ffffff" />
                {isIgGold ? (
                    <>
                        <defs>
                            <linearGradient id="founderGoldGradInsta" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFF7D6" />
                                <stop offset="25%" stopColor="#FDE047" />
                                <stop offset="50%" stopColor="#EAB308" />
                                <stop offset="75%" stopColor="#CA8A04" />
                                <stop offset="100%" stopColor="#854D0E" />
                            </linearGradient>
                        </defs>
                        <path fill="url(#founderGoldGradInsta)" d={INSTA_BADGE_PATH} fillRule="evenodd" />
                    </>
                ) : (
                    <path fill="rgb(0, 149, 246)" d={INSTA_BADGE_PATH} fillRule="evenodd" />
                )}
            </svg>
        );
    }

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
