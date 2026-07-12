const BASE_URL = 'https://legacy-academy-backet1.onrender.com';

const resolveMediaUrl = (path, width = null, isAvatar = false, isPoster = false, isCover = false, cacheKey = null) => {
    if (!path) return '';
    let url = path;
    if (!path.startsWith('http') && !path.startsWith('blob:')) {
        url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    }
    // CLEANUP: If URL is just 'undefined' or 'null' as string (backend artifacts), treat as null
    let cleanUrl = String(url || '').trim();
    if (!cleanUrl || cleanUrl === 'undefined' || cleanUrl === 'null' || cleanUrl === '[object Object]') return null;

    // Strip legacy t= timestamps from URL that break Cloudinary caching/transforms
    cleanUrl = cleanUrl.replace(/([?&])t=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');
    url = cleanUrl;
    // AUTO-OPTIMIZE CLOUDINARY
    if (cleanUrl.includes('cloudinary.com') && cleanUrl.includes('/upload/')) {
        const parts = cleanUrl.split('/upload/');
        if (parts.length < 2) return cleanUrl; // Ensure there's a path after /upload/
        // Only inject if not already transformed
        if (!parts[1].startsWith('c_') && !parts[1].startsWith('w_') && !parts[1].startsWith('so_') && !parts[1].startsWith('q_')) {
            const isVideo = cleanUrl.includes('/video/upload/');

            // 4K Background Support: Keep high quality for cover images
            if (isCover) {
                url = cleanUrl.replace(/\/upload\/.*?(v\d+\/)/i, '/upload/w_2000,c_limit,q_auto:best/$1');
            } else {
                let transform = '';
                // SAVE CREDITS: Use 'q_auto' (Balanced) for high visual fidelity with storage savings
                // Increased widths to avoid pixelation on high-PPI displays
                if (isPoster && isVideo) {
                    transform = `so_0.0,f_auto,q_auto:best,w_1200,c_limit`;
                    parts[1] = parts[1].replace(/\.(mp4|mov|webm|m4v)$/i, '.jpg');
                } else if (isAvatar && isVideo) {
                    // Animated avatars: WebP (animated) + 500px
                    transform = `w_500,h_500,c_fill,so_0,eo_2,q_auto:best,f_webp,fl_animated`;
                    parts[1] = parts[1].replace(/\.(mp4|mov|webm|m4v)$/i, '.webp');
                } else if (isAvatar) {
                    // f_auto = let Cloudinary pick best format; background handled via CSS
                    transform = `w_800,h_800,c_fill,g_face,q_auto:best,f_auto`;
                } else if (width === 2000 || isCover) {
                    // Founder 4K Background / High-Res Cover
                    transform = `w_3000,c_limit,q_auto:best,${isVideo ? 'vc_auto' : 'f_auto'}`;
                } else if (width && !isNaN(width)) {
                    transform = `w_${Math.min(width, 2400)},c_limit,q_auto:best,${isVideo ? 'vc_auto' : 'f_auto'}`;
                } else {
                    // Default: 2400px max, best quality — crisp on all monitors
                    transform = `c_limit,w_2400,q_auto:best,f_auto`;
                }

                url = parts[0] + '/upload/' + transform + '/' + parts[1];
            }
        }
    }

    // Add cache-busting parameter if provided
    if (cacheKey && url && !url.startsWith('blob:')) {
        const sep = url.includes('?') ? '&' : '?';
        url = `${url}${sep}v=${cacheKey}`;
    }

    return url;
};

console.log("Result:", resolveMediaUrl("https://res.cloudinary.com/ddehek3eo/image/upload/w_800,h_800,c_fill,g_face,q_auto:best,f_auto/v1782046386/legacyacademy/nijmmqtuy3fkpbdlk4w9.png?t=1783863915804", 300, true));
