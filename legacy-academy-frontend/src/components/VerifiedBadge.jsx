import React from 'react';

const VerifiedBadge = ({ isFounder, className = "w-4 h-4", forceGold = false, isUser = false, user, badgeColor: badgeColorProp }) => {
    // If user settings specify showBadge is false, don't show the badge
    if (user && user.settings && user.settings.showBadge === false) {
        return null;
    }

    // Check role from user object if available, otherwise fall back to isFounder
    const resolvedRole = user?.role || (isFounder && !isUser ? 'Founder' : 'User');
    const isGold = (resolvedRole === 'Founder' || forceGold);
    let isHolo = false;
    let isMetallic = false;

    // Default colors — gold for founders, blue for everyone else
    let baseColor = isGold ? '#F6E27A' : '#2F80ED';
    let darkColor  = isGold ? '#CB9B51' : '#1CB5E0';
    let gradId     = isGold ? 'vb_gold3DGrad' : 'vb_blue3DGrad';

    // Custom badge color — works for ALL users (founders and regular)
    const customColor = badgeColorProp || user?.settings?.badgeColor;
    if (customColor) {
        if (customColor === 'gold')          { baseColor = '#F6E27A'; darkColor = '#CB9B51'; gradId = 'vb_gold3DGrad'; }
        else if (customColor === 'crimson')  { baseColor = '#FF0844'; darkColor = '#93001E'; gradId = 'vb_crimson3DGrad'; }
        else if (customColor === 'neon-purple') { baseColor = '#B026FF'; darkColor = '#590FB7'; gradId = 'vb_purple3DGrad'; }
        else if (customColor === 'blue')     { baseColor = '#2F80ED'; darkColor = '#1CB5E0'; gradId = 'vb_blue3DGrad'; }
        else if (customColor === 'holographic') isHolo = true;
        else if (['metal-blue', 'platinum', 'obsidian-gold', 'diamond', 'liquid-gold', 'live-gold'].includes(customColor)) {
            isMetallic = true;
        }
    }

    const BADGE_PATH = "M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.706 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z";

    if (isMetallic) {
        let stops;
        let gradIdName;
        const customColor = user?.settings?.badgeColor;

        if (customColor === 'metal-blue') {
            gradIdName = "vb_metalBlueGrad";
            stops = [
                { offset: "0%", color: "#0F2027" },
                { offset: "25%", color: "#203A43" },
                { offset: "50%", color: "#00E1FF" },
                { offset: "75%", color: "#2C5364" },
                { offset: "100%", color: "#0F2027" }
            ];
        } else if (customColor === 'platinum') {
            gradIdName = "vb_platinumGrad";
            stops = [
                { offset: "0%", color: "#8A9193" },
                { offset: "25%", color: "#CECECE" },
                { offset: "50%", color: "#F5F5F5" },
                { offset: "75%", color: "#CECECE" },
                { offset: "100%", color: "#8A9193" }
            ];
        } else if (customColor === 'obsidian-gold') {
            gradIdName = "vb_obsidianGoldGrad";
            stops = [
                { offset: "0%", color: "#0A0A0A" },
                { offset: "25%", color: "#222222" },
                { offset: "50%", color: "#FFD700" },
                { offset: "75%", color: "#222222" },
                { offset: "100%", color: "#0A0A0A" }
            ];
        } else if (customColor === 'diamond') {
            gradIdName = "vb_diamondGrad";
            stops = [
                { offset: "0%", color: "#00E5FF" },
                { offset: "25%", color: "#007BFF" },
                { offset: "50%", color: "#FFFFFF" },
                { offset: "75%", color: "#00E5FF" },
                { offset: "100%", color: "#0056B3" }
            ];
        } else if (customColor === 'liquid-gold') {
            gradIdName = "vb_liquidGoldGrad";
            stops = [
                { offset: "0%", color: "#B8860B" },
                { offset: "25%", color: "#FFD700" },
                { offset: "50%", color: "#FFA500" },
                { offset: "75%", color: "#FFDF00" },
                { offset: "100%", color: "#B8860B" }
            ];
        } else {
            gradIdName = "vb_metalGoldGrad";
            stops = [
                { offset: "0%", color: "#bf953f" },
                { offset: "25%", color: "#fcf6ba" },
                { offset: "50%", color: "#b38728" },
                { offset: "75%", color: "#fbf5b7" },
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
                <circle cx="11" cy="11" r="6" fill="#ffffff" />
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
                <circle cx="11" cy="11" r="6" fill="#ffffff" />
                <path
                    fill="url(#vb_holoGrad)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="0.5"
                    d={BADGE_PATH}
                />
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
            <circle cx="11" cy="11" r="6" fill="#ffffff" />
            <path
                fill={`url(#${gradId})`}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.5"
                d={BADGE_PATH}
            />
        </svg>
    );
};

export default VerifiedBadge;
export { VerifiedBadge };
