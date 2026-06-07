import React, { memo, useEffect, useState } from 'react';

const SIZE_MAP = {
    auth: {
        shell: 'app-logo-glass--auth',
        img: 'app-logo-glass__img--auth',
    },
    header: {
        shell: 'app-logo-glass--header',
        img: 'app-logo-glass__img--header',
    },
};

const AppLogo = memo(({ src, alt = 'Legacy Academy', variant = 'header', loading = false, className = '' }) => {
    const sizes = SIZE_MAP[variant] || SIZE_MAP.header;
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(false);
    }, [src]);

    return (
        <div className={`app-logo-glass ${sizes.shell} ${className}`}>
            <div className="app-logo-glass__glow" aria-hidden="true" />
            <div className="app-logo-glass__shine" aria-hidden="true" />
            <div className="app-logo-glass__ring" aria-hidden="true" />
            <div className="app-logo-glass__inner">
                <img
                    src={src}
                    alt={alt}
                    className={`app-logo-glass__img ${sizes.img} ${isReady ? 'app-logo-glass__img--ready' : ''} ${loading ? 'app-logo-glass__img--loading' : ''}`}
                    decoding="async"
                    fetchPriority={variant === 'auth' ? 'high' : 'auto'}
                    loading={variant === 'auth' ? 'eager' : 'lazy'}
                    onLoad={() => setIsReady(true)}
                />
            </div>
        </div>
    );
});

AppLogo.displayName = 'AppLogo';

export default AppLogo;
