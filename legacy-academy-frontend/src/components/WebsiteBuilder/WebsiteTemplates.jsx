import React from 'react';
import * as Icons from 'lucide-react';

const renderFeatures = (features, activeTheme, setZoomImage) => {
    if (!features || features.length === 0) return null;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {features.map((feat, idx) => (
                <div 
                    key={idx} 
                    className="p-6 md:p-7 rounded-[22px] flex flex-col gap-4 transition-all duration-400 hover:-translate-y-2 overflow-hidden relative group border shadow-2xl backdrop-blur-xl" 
                    style={{ 
                        backgroundColor: activeTheme.card, 
                        borderColor: 'rgba(255,255,255,0.08)',
                        boxShadow: `0 1px 0 rgba(255,255,255,0.06) inset, 0 10px 40px -12px rgba(0,0,0,0.6)`
                    }}
                >
                    {/* Accent glow in corner */}
                    <div 
                        className="absolute -top-16 -right-16 w-44 h-44 rounded-full opacity-20 blur-[60px] pointer-events-none group-hover:opacity-40 transition-opacity duration-700"
                        style={{ backgroundColor: activeTheme.primary }}
                    />
                    {feat.badge && (
                        <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-xl border"
                            style={{ 
                                backgroundColor: `${activeTheme.primary}22`, 
                                borderColor: `${activeTheme.primary}55`,
                                color: activeTheme.primary
                            }}>
                            {feat.badge}
                        </div>
                    )}
                    {feat.image && (
                        <div 
                            className="-mx-6 md:-mx-7 -mt-6 md:-mt-7 mb-3 h-52 sm:h-60 flex justify-center items-center overflow-hidden cursor-pointer relative group/img" 
                            onClick={() => setZoomImage && setZoomImage(feat.image)}
                        >
                            <div className="absolute inset-0 z-10 transition-opacity duration-500 group-hover/img:opacity-100 opacity-80"
                                style={{ backgroundImage: `linear-gradient(to top, ${activeTheme.card}ff 0%, transparent 55%)` }}
                            />
                            <img src={feat.image} className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-125 z-0" alt="ambient" />
                            <img src={feat.image} alt={feat.title} className="relative z-10 w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110" loading="lazy" decoding="async" />
                        </div>
                    )}
                    <div className="relative z-10 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2.5">
                            <span className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: activeTheme.primary }} />
                            <h4 className="text-[19px] md:text-xl font-black tracking-tight leading-tight">{feat.title}</h4>
                        </div>
                        <p className="opacity-70 text-[14.5px] leading-relaxed">{feat.desc}</p>
                    </div>
                    {feat.link && feat.link.trim() !== '' && (
                        <a 
                            href={feat.link.startsWith('http') ? feat.link : `https://${feat.link}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="relative z-10 mt-1 group/btn px-5 py-3 rounded-[16px] font-black text-[12px] md:text-[13px] uppercase tracking-[0.14em] text-center transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 self-start w-full sm:w-auto border" 
                            style={{ 
                                backgroundColor: activeTheme.primary, 
                                color: '#000',
                                borderColor: `${activeTheme.primary}cc`,
                                boxShadow: `0 10px 30px -10px ${activeTheme.primary}99`
                            }}
                        >
                            <span>{feat.linkText || 'Learn More'}</span>
                            <Icons.ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                        </a>
                    )}
                </div>
            ))}
        </div>
    );
};

// ==========================================
// 1. CLASSIC TEMPLATE
// ==========================================
export const ClassicTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-10 md:py-20">
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center py-10 md:py-24 gap-10 md:gap-16 relative">
            {/* Decorative background orbs */}
            <div className="absolute top-12 left-0 w-72 h-72 rounded-full opacity-20 blur-[100px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
            <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10 blur-[120px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />

            <div className="flex-1 flex flex-col items-start z-10 text-left relative">
                {config.businessName && (
                <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] mb-7 border backdrop-blur-xl"
                    style={{
                        backgroundColor: `${activeTheme.primary}12`,
                        borderColor: `${activeTheme.primary}33`,
                        color: activeTheme.primary
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: activeTheme.primary }} />
                    {config.businessName}
                </div>
                )}
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black leading-[1.02] tracking-tight mb-7 break-words hyphens-auto w-full">
                    {config.slogan || ''}
                </h1>
                <div className="w-16 h-1 rounded-full mb-7" style={{ backgroundColor: activeTheme.primary }} />
                <p className="text-[17px] sm:text-lg md:text-xl mb-9 leading-relaxed max-w-xl opacity-75 break-words hyphens-auto w-full">
                    {config.description}
                </p>
                {config.ctaText && (
                    <div className="flex flex-wrap items-center gap-3.5">
                        <a 
                            href={config.ctaLink || '#'} 
                            target={config.ctaLink?.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            className="group px-8 py-4.5 sm:px-11 sm:py-5 rounded-[18px] font-black uppercase tracking-[0.14em] text-[12px] sm:text-sm transition-all duration-300 hover:-translate-y-0.5 shadow-2xl flex items-center gap-3 border" 
                            style={{
                                backgroundColor: activeTheme.primary,
                                color: '#000',
                                borderColor: `${activeTheme.primary}aa`,
                                boxShadow: `0 18px 45px -15px ${activeTheme.primary}a8`
                            }}
                        >
                            <span>{config.ctaText}</span>
                            <Icons.ArrowRight className="w-4.5 h-4.5 transition-transform duration-300 group-hover:translate-x-1" />
                        </a>
                    </div>
                )}
            </div>
            {config.coverImage && (
                <div className="flex-1 w-full flex justify-center mt-4 md:mt-0 relative z-10 group">
                    <div className="absolute inset-0 -z-10 max-w-lg aspect-[4/3] md:aspect-square rounded-[2rem] opacity-50 blur-3xl"
                        style={{ backgroundColor: activeTheme.primary }}
                    />
                    <div className="relative w-full max-w-lg aspect-[4/3] md:aspect-square cursor-pointer" onClick={() => setZoomImage && setZoomImage(config.coverImage)}>
                        <div className="absolute inset-0 rounded-[2rem] opacity-60 border"
                            style={{ borderColor: `${activeTheme.primary}40`, transform: 'translate(14px, 14px)' }}
                        />
                        <img src={config.coverImage} className="relative w-full h-full object-cover rounded-[2rem] border shadow-2xl transition-all duration-700 group-hover:scale-[1.015]" style={{ borderColor: 'rgba(255,255,255,0.1)' }} alt="Cover" loading="lazy" decoding="async" />
                    </div>
                </div>
            )}
        </div>
        {config.features?.length > 0 && (
            <div id="services" className="py-14 md:py-24 border-t border-white/5 relative">
                <div className="max-w-3xl mx-auto text-center mb-14 md:mb-20">
                    {config.featuresTitle && (
                        <div className="flex flex-col items-center gap-4">
                            <h3 className="text-[32px] md:text-[56px] font-black text-center tracking-tight leading-[1.05]">{config.featuresTitle}</h3>
                            <div className="w-14 h-1 rounded-full" style={{ backgroundColor: activeTheme.primary }} />
                        </div>
                    )}
                </div>
                {renderFeatures(config.features, activeTheme, setZoomImage)}
            </div>
        )}
    </div>
);

// ==========================================
// 2. E-COMMERCE / STORE TEMPLATE (Apparel, Sneakers, Products with Sizes)
// ==========================================
export const EcommerceTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-14 relative overflow-hidden">
        {/* Ambient background blobs */}
        <div className="absolute -top-20 -left-24 w-[28rem] h-[28rem] rounded-full opacity-[0.15] blur-[120px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
        <div className="absolute top-1/3 -right-28 w-[26rem] h-[26rem] rounded-full opacity-[0.12] blur-[120px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />

        {/* Banner Hero */}
        <div className="relative w-full rounded-[2.5rem] overflow-hidden border shadow-2xl p-6 sm:p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 mb-14 md:mb-20 z-10"
            style={{
                backgroundImage: `linear-gradient(135deg, ${activeTheme.bg} 0%, ${activeTheme.card} 55%, ${activeTheme.bg} 100%)`,
                borderColor: 'rgba(255,255,255,0.1)',
                boxShadow: `0 20px 60px -25px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.06) inset`
            }}
        >
            <div className="absolute inset-0 pointer-events-none opacity-60"
                style={{ backgroundImage: `radial-gradient(circle at 12% 20%, ${activeTheme.primary}1f 0%, transparent 55%)` }}
            />
            <div className="relative z-10 flex-1 flex flex-col items-start text-left max-w-2xl">
                {config.businessName && (
                <span className="px-4 py-1.5 rounded-full text-[11px] font-black tracking-[0.14em] uppercase mb-5 inline-flex items-center gap-2 backdrop-blur-xl border"
                    style={{
                        backgroundColor: `${activeTheme.primary}14`,
                        borderColor: `${activeTheme.primary}3c`,
                        color: activeTheme.primary
                    }}>
                    <Icons.ShoppingBag className="w-3.5 h-3.5" /> {config.businessName}
                </span>
                )}
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tight leading-[1.02] mb-5">
                    {config.slogan || ''}
                </h1>
                <div className="w-14 h-1 rounded-full mb-5" style={{ backgroundColor: activeTheme.primary }} />
                <p className="text-sm sm:text-base md:text-lg opacity-75 mb-8 leading-relaxed max-w-xl">
                    {config.description || ''}
                </p>
                {config.ctaText && (
                    <a 
                        href={config.ctaLink || '#shop'} 
                        className="group px-8 py-4.5 rounded-[18px] font-black uppercase tracking-[0.14em] text-[12px] sm:text-sm transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2.5 shadow-2xl border"
                        style={{
                            backgroundColor: activeTheme.primary,
                            color: '#000',
                            borderColor: `${activeTheme.primary}aa`,
                            boxShadow: `0 18px 45px -15px ${activeTheme.primary}b0`
                        }}
                    >
                        <Icons.Zap className="w-4.5 h-4.5" />
                        <span>{config.ctaText}</span>
                        <Icons.ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                )}
            </div>
            {config.coverImage && (
                <div className="relative z-10 w-full md:w-[44%] max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border group cursor-pointer"
                    onClick={() => setZoomImage && setZoomImage(config.coverImage)}
                    style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                >
                    <div className="absolute -inset-6 opacity-60 blur-2xl rounded-full pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
                    <img src={config.coverImage} className="relative z-10 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-108" alt="Store Spotlight" loading="lazy" decoding="async" />
                </div>
            )}
        </div>

        {/* Features / Highlights */}
        {config.features?.length > 0 && (
            <div id="services" className="py-10 md:py-16 relative z-10">
                <div className="flex items-end justify-between mb-10 md:mb-14 pb-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="flex flex-col gap-2.5">
                        <h3 className="text-[28px] sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-none">{config.featuresTitle || 'Collections'}</h3>
                        <p className="text-xs sm:text-sm opacity-60 tracking-wide">Handpicked favorites & signature drops</p>
                    </div>
                    {config.businessName && <span className="hidden sm:block text-[11px] font-black opacity-60 uppercase tracking-[0.16em]">{config.businessName}</span>}
                </div>
                {renderFeatures(config.features, activeTheme, setZoomImage)}
            </div>
        )}
    </div>
);

// ==========================================
// 3. AGENCY & BUSINESS TEMPLATE
// ==========================================
export const AgencyTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-14 md:py-24 relative overflow-hidden">
        {/* Hero background atmosphere */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-10 left-1/4 w-[32rem] h-[32rem] rounded-full opacity-[0.14] blur-[130px]" style={{ backgroundColor: activeTheme.primary }} />
            <div className="absolute bottom-0 right-8 w-[26rem] h-[26rem] rounded-full opacity-[0.1] blur-[110px]" style={{ backgroundColor: activeTheme.primary }} />
        </div>

        <div className="text-center max-w-4xl mx-auto mb-16 md:mb-24 flex flex-col items-center relative z-10">
            {config.businessName && (
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.18em] mb-7 border backdrop-blur-xl"
                style={{
                    backgroundColor: `${activeTheme.primary}10`,
                    borderColor: `${activeTheme.primary}33`,
                    color: activeTheme.primary
                }}>
                <Icons.Briefcase className="w-3.5 h-3.5" /> {config.businessName}
            </div>
            )}
            <h1 className="text-4xl sm:text-6xl md:text-[88px] font-black tracking-tight leading-[1.02] mb-7">
                {config.slogan || ''}
            </h1>
            <div className="w-20 h-[3px] rounded-full mb-8" style={{ background: `linear-gradient(90deg, transparent, ${activeTheme.primary}, transparent)` }} />
            <p className="text-[17px] sm:text-xl opacity-75 max-w-2xl leading-relaxed mb-11">
                {config.description}
            </p>
            {config.ctaText && (
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <a 
                        href={config.ctaLink || '#contact'} 
                        className="group px-11 py-5 rounded-[18px] font-black uppercase tracking-[0.14em] text-[12px] sm:text-sm transition-all duration-300 hover:-translate-y-0.5 shadow-2xl flex items-center gap-2.5 border"
                        style={{
                            backgroundColor: activeTheme.primary,
                            color: '#000',
                            borderColor: `${activeTheme.primary}cc`,
                            boxShadow: `0 20px 55px -15px ${activeTheme.primary}b0`
                        }}
                    >
                        <span>{config.ctaText}</span>
                        <Icons.ArrowRight className="w-4.5 h-4.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                </div>
            )}
        </div>

        {/* Stats Grid */}
        {config.showAgencyStats !== false && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16 md:mb-24 relative z-10">
                {(config.agencyStats && config.agencyStats.length === 4
                    ? config.agencyStats
                    : [
                        { label: 'Client Revenue', val: '$50M+' },
                        { label: 'Global Reach', val: '48+ Countries' },
                        { label: 'Client Satisfaction', val: '99.8%' },
                        { label: 'ROI Guarantee', val: '3.5x Avg' }
                    ]
                ).map((stat, i) => (
                    <div key={i}
                        className="p-6 md:p-7 rounded-[24px] text-center backdrop-blur-2xl border relative overflow-hidden group transition-all duration-500 hover:-translate-y-1"
                        style={{
                            backgroundColor: `${activeTheme.card}`,
                            borderColor: 'rgba(255,255,255,0.08)',
                            boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 18px 40px -22px rgba(0,0,0,0.6)'
                        }}
                    >
                        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-[0.15] blur-3xl pointer-events-none group-hover:opacity-[0.35] transition-opacity duration-500"
                            style={{ backgroundColor: activeTheme.primary }}
                        />
                        <div className="relative z-10 flex flex-col gap-1.5">
                            <div className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none mb-1" style={{ color: activeTheme.primary }}>{stat.val}</div>
                            <div className="w-10 h-[2px] rounded-full mx-auto my-1.5" style={{ backgroundColor: `${activeTheme.primary}66` }} />
                            <div className="text-[11px] sm:text-xs uppercase tracking-[0.16em] opacity-70 font-bold leading-snug">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {config.coverImage && (
            <div className="w-full h-72 sm:h-96 md:h-[520px] rounded-[32px] overflow-hidden border shadow-2xl mb-20 md:mb-28 relative group cursor-pointer z-10"
                onClick={() => setZoomImage && setZoomImage(config.coverImage)}
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
                <div className="absolute inset-0 z-10 pointer-events-none"
                    style={{ backgroundImage: `linear-gradient(to top, ${activeTheme.bg}cc 0%, transparent 55%), radial-gradient(circle at 20% 20%, ${activeTheme.primary}1a 0%, transparent 60%)` }}
                />
                <img src={config.coverImage} className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" alt="Agency Hero" loading="lazy" decoding="async" />
            </div>
        )}

        {config.features?.length > 0 && (
            <div id="services" className="py-12 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
                    <h3 className="text-3xl sm:text-5xl md:text-6xl font-black text-center tracking-tight mb-5 leading-[1.05]">{config.featuresTitle}</h3>
                    <div className="w-16 h-1 rounded-full mx-auto" style={{ backgroundColor: activeTheme.primary }} />
                </div>
                {renderFeatures(config.features, activeTheme, setZoomImage)}
            </div>
        )}
    </div>
);

// ==========================================
// 4. LUXURY VIP GOODS TEMPLATE (Gold Accents, Watches, High-End)
// ==========================================
export const LuxuryTemplate = ({ config, activeTheme, setZoomImage }) => {
    const GOLD = '#D4AF37';
    const GOLD_SOFT = 'rgba(212, 175, 55, 0.22)';
    const GOLD_EDGE = 'rgba(212, 175, 55, 0.48)';
    const GOLD_GLOW = 'rgba(212, 175, 55, 0.16)';
    return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-14 md:py-28 relative overflow-hidden" style={{ fontFamily: 'Cinzel, "Playfair Display", serif' }}>
        {/* Soft gold atmosphere */}
        <div className="absolute top-0 left-1/3 w-[24rem] h-[24rem] rounded-full opacity-[0.14] blur-[130px] pointer-events-none" style={{ backgroundColor: GOLD }} />
        <div className="absolute bottom-0 right-10 w-[28rem] h-[28rem] rounded-full opacity-[0.11] blur-[140px] pointer-events-none" style={{ backgroundColor: GOLD }} />

        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20 md:mb-28 relative z-10">
            {config.businessName && (
            <div className="flex flex-col items-center gap-3 mb-8">
                <div className="flex items-center gap-4 opacity-80">
                    <span className="w-16 md:w-24 h-[1px]" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
                    <span className="text-[11px] sm:text-xs tracking-[0.42em] uppercase font-black" style={{ color: GOLD }}>{config.businessName}</span>
                    <span className="w-16 md:w-24 h-[1px]" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
                </div>
            </div>
            )}
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-[0.08em] mb-8 leading-[1.04]" style={{ color: isNaN ? '#000' : '#fff' }}>
                {config.slogan || ''}
            </h1>
            <div className="w-16 md:w-20 h-[1px] mb-8" style={{ backgroundColor: GOLD }} />
            <p className="text-[17px] sm:text-xl max-w-2xl leading-[1.85] mb-11 font-sans font-light opacity-80 tracking-wide">
                {config.description}
            </p>
            {config.ctaText && (
                <a 
                    href={config.ctaLink || '#'} 
                    className="group relative px-11 py-5 uppercase tracking-[0.22em] text-[11px] sm:text-xs font-black transition-all duration-500 font-sans overflow-hidden"
                    style={{
                        backgroundColor: 'transparent',
                        border: `1px solid ${GOLD_EDGE}`,
                        color: GOLD,
                        clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                        boxShadow: `0 0 0 0 ${GOLD_GLOW}`
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.color = '#0a0a0a'; e.currentTarget.style.boxShadow = `0 18px 45px -12px ${GOLD}`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = GOLD; e.currentTarget.style.boxShadow = 'none'; }}
                >
                    <span className="relative z-10 tracking-[0.24em]">{config.ctaText}</span>
                </a>
            )}
        </div>

        {config.coverImage && (
            <div className="w-full h-80 sm:h-[520px] md:h-[620px] rounded-[2.5rem] overflow-hidden relative group cursor-pointer mb-24 md:mb-28 z-10"
                onClick={() => setZoomImage && setZoomImage(config.coverImage)}
                style={{
                    border: `1px solid ${GOLD_EDGE}`,
                    boxShadow: `0 30px 90px -35px rgba(0,0,0,0.8), 0 0 80px -40px ${GOLD}`
                }}
            >
                <div className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                        backgroundImage: `
                            linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 65%),
                            radial-gradient(circle at 80% 20%, ${GOLD_SOFT} 0%, transparent 55%),
                            radial-gradient(circle at 10% 80%, ${GOLD_GLOW} 0%, transparent 55%)
                        `
                    }}
                />
                <div className="absolute inset-0 z-10 pointer-events-none rounded-[2.5rem]" style={{
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)'
                }} />
                <img src={config.coverImage} className="w-full h-full object-cover transition-transform duration-[1400ms] group-hover:scale-105" alt="Luxury Showcase" loading="lazy" decoding="async" />
            </div>
        )}

        {config.features?.length > 0 && (
            <div id="services" className="py-16 relative z-10" style={{ borderTop: `1px solid ${GOLD_SOFT}` }}>
                {config.featuresTitle && (
                    <div className="flex flex-col items-center gap-5 mb-14 md:mb-20">
                        <h3 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-[0.18em] text-center" style={{ fontFamily: 'Cinzel, "Playfair Display", serif' }}>{config.featuresTitle}</h3>
                        <div className="w-14 h-[1px]" style={{ backgroundColor: GOLD }} />
                    </div>
                )}
                <div className="font-sans">{renderFeatures(config.features, activeTheme, setZoomImage)}</div>
            </div>
        )}
    </div>
    );
};

// ==========================================
// 5. SAAS & AI TECH TEMPLATE
// ==========================================
export const SaasTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-14 md:py-24 relative overflow-hidden">
        {/* Subtle tech ambient */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full opacity-[0.12] blur-[140px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
        <div className="absolute bottom-0 right-0 w-[26rem] h-[26rem] rounded-full opacity-[0.1] blur-[130px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />

        <div className="text-center max-w-4xl mx-auto mb-16 md:mb-24 flex flex-col items-center relative z-10">
            <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.16em] mb-7 border backdrop-blur-2xl"
                style={{
                    backgroundColor: `${activeTheme.primary}0f`,
                    borderColor: `${activeTheme.primary}33`,
                    color: activeTheme.primary
                }}
            >
                <Icons.Zap className="w-3.5 h-3.5" />
                {config.businessName || 'AI Powered Platform'}
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight leading-[1.02] mb-7 max-w-5xl w-full"
                style={{
                    background: `linear-gradient(180deg, #fff 0%, #fff 55%, rgba(255,255,255,0.68) 100%)`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent'
                }}
            >
                {config.slogan || ''}
            </h1>
            <div className="w-14 h-[3px] rounded-full mb-7" style={{ background: `linear-gradient(90deg, transparent, ${activeTheme.primary}, transparent)` }} />
            <p className="text-[17px] sm:text-xl opacity-75 max-w-2xl leading-relaxed mb-10 px-2">
                {config.description}
            </p>
            {config.ctaText && (
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <a 
                        href={config.ctaLink || '#'} 
                        className="group px-9 py-5 sm:px-11 sm:py-5 rounded-[18px] font-black uppercase tracking-[0.14em] text-[12px] sm:text-sm transition-all duration-300 hover:-translate-y-0.5 shadow-2xl flex items-center gap-2.5 border"
                        style={{
                            backgroundColor: activeTheme.primary,
                            color: '#000',
                            borderColor: `${activeTheme.primary}c8`,
                            boxShadow: `0 22px 60px -18px ${activeTheme.primary}b0`
                        }}
                    >
                        <Icons.Zap className="w-4.5 h-4.5" />
                        <span>{config.ctaText}</span>
                        <Icons.ArrowRight className="w-4.5 h-4.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                </div>
            )}
        </div>

        {config.coverImage && (
            <div className="w-full max-w-5xl mx-auto h-64 sm:h-96 md:h-[540px] rounded-[28px] sm:rounded-[36px] overflow-hidden relative group cursor-pointer mb-16 sm:mb-24 z-10 border shadow-2xl"
                onClick={() => setZoomImage && setZoomImage(config.coverImage)}
                style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            >
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.16em] border backdrop-blur-2xl"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.48)',
                        borderColor: 'rgba(255,255,255,0.12)',
                        color: '#fff'
                    }}
                >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: activeTheme.primary }} />
                    Live
                </div>
                <div className="absolute inset-0 z-10 pointer-events-none"
                    style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, transparent 65%), radial-gradient(circle at 20% 10%, ${activeTheme.primary}1a 0%, transparent 55%)` }}
                />
                <img src={config.coverImage} className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" alt="SaaS Dashboard" loading="lazy" decoding="async" />
            </div>
        )}

        {config.features?.length > 0 && (
            <div id="services" className="py-10 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
                    <h3 className="text-3xl sm:text-5xl md:text-6xl font-black text-center mb-5 tracking-tight leading-[1.05]">{config.featuresTitle}</h3>
                    <div className="w-14 h-1 rounded-full mx-auto" style={{ backgroundColor: activeTheme.primary }} />
                </div>
                {renderFeatures(config.features, activeTheme, setZoomImage)}
            </div>
        )}
    </div>
);

// ==========================================
// 6. NEWSPAPER TEMPLATE
// ==========================================
export const NewspaperTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    const ink = isLight ? '#0a0a0a' : '#f3f3f3';
    const inkSoft = isLight ? '#2a2a2a' : '#dcdcdc';
    const lineColor = isLight ? 'rgba(0,0,0,0.82)' : 'rgba(255,255,255,0.78)';
    const lineSoft = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
    const sectionBg = isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.025)';
    return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-16 relative" style={{ color: ink }}>
        {/* Masthead date strip */}
        <div className="flex items-center justify-between py-2 mb-3 text-[11px] uppercase tracking-[0.2em] font-bold opacity-70 border-y" style={{ borderColor: lineSoft }}>
            <span className="hidden sm:block">Vol. I · No. 1</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="hidden sm:block" style={{ color: activeTheme.primary }}>PRICE $0.00</span>
        </div>

        {/* Masthead */}
        <div className="flex flex-col items-center text-center pt-5 pb-8 mb-6 border-b-4 relative" style={{ borderColor: lineColor }}>
            {config.businessName && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[10px] px-4 py-0.5 text-[10px] font-black uppercase tracking-[0.28em]"
                    style={{ backgroundColor: activeTheme.primary, color: isLight ? '#fff' : '#000' }}
                >
                    {config.businessName}
                </div>
            )}
            <h1 className="text-5xl sm:text-7xl md:text-[96px] font-black uppercase leading-none tracking-tighter w-full break-words hyphens-auto mt-4" style={{ fontFamily: '"Times New Roman", "Playfair Display", Georgia, serif' }}>{config.slogan || ''}</h1>
            <div className="mt-5 text-sm sm:text-lg font-bold uppercase tracking-[0.18em] py-2.5 w-full border-y" style={{ color: inkSoft, borderColor: lineColor }}>
                <span className="break-words hyphens-auto">{config.description}</span>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            <div className="flex-[2] md:border-r md:pr-10 md:pb-2" style={{ borderColor: lineSoft }}>
                {config.coverImage && (
                    <div className="relative mb-7 group cursor-pointer overflow-hidden rounded-sm" onClick={() => setZoomImage && setZoomImage(config.coverImage)}>
                        <img src={config.coverImage} className={`w-full h-auto transition-all duration-500 ${isLight ? '' : ''}`} style={{ filter: isLight ? 'contrast(1.04) saturate(0.05)' : 'contrast(1.04) saturate(0.08) brightness(1.02)' }} alt="Headline" loading="lazy" decoding="async" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ mixBlendMode: 'multiply', backgroundColor: `${activeTheme.primary}16` }} />
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] z-10" style={{ backgroundColor: lineColor, color: isLight ? '#fff' : '#0a0a0a' }}>Front Page</div>
                    </div>
                )}
                {config.features?.slice(0,1).map((feat, i) => (
                    <article key={i} className="mb-2">
                        <div className="text-[11px] uppercase tracking-[0.2em] font-black mb-2" style={{ color: activeTheme.primary }}>Exclusive</div>
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 leading-[1.08] w-full break-words hyphens-auto tracking-tight" style={{ fontFamily: '"Times New Roman", Georgia, serif' }}>{feat.title}</h2>
                        <div className="flex items-center gap-3 mb-5 pb-5 border-b text-[11px] uppercase tracking-[0.18em] font-bold opacity-70" style={{ borderColor: lineSoft }}>
                            <span>By Staff Report</span>
                            <span>·</span>
                            <span>{Math.floor(2 + Math.random()*8)} min read</span>
                        </div>
                        <p className="text-[17px] leading-[1.95] text-justify w-full break-words hyphens-auto" style={{ color: inkSoft, fontFamily: 'Georgia, serif' }}>{feat.desc}</p>
                    </article>
                ))}
            </div>
            <div className="flex-1 flex flex-col gap-6 md:gap-7">
                {config.features?.slice(1).map((feat, i) => (
                    <article key={i} className="border-b pb-6 last:border-0 last:pb-0 group" style={{ borderColor: lineSoft }}>
                        {feat.image && (
                            <div className="w-full overflow-hidden mb-3 cursor-pointer relative" onClick={() => setZoomImage && setZoomImage(feat.image)}>
                                <img src={feat.image} className="w-full h-36 sm:h-44 object-cover transition-all duration-500 group-hover:scale-[1.03]" style={{ filter: isLight ? 'saturate(0.04) contrast(1.03)' : 'saturate(0.08) contrast(1.03) brightness(1.02)' }} alt="Thumb" loading="lazy" decoding="async" />
                            </div>
                        )}
                        <div className="text-[10px] uppercase tracking-[0.22em] font-black mb-1.5 opacity-70" style={{ color: activeTheme.primary }}>
                            {['World', 'Business', 'Politics', 'Culture', 'Sports'][i % 5]}
                        </div>
                        <h4 className="text-lg sm:text-2xl font-bold mb-2 leading-[1.2] w-full break-words hyphens-auto" style={{ fontFamily: '"Times New Roman", Georgia, serif' }}>{feat.title}</h4>
                        <p className="text-[14.5px] leading-[1.8] text-justify w-full break-words hyphens-auto" style={{ color: inkSoft, fontFamily: 'Georgia, serif' }}>{feat.desc}</p>
                    </article>
                ))}
            </div>
        </div>
    </div>
    );
};

// ==========================================
// 7. RESTAURANT & HOSPITALITY TEMPLATE
// ==========================================
export const RestaurantTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    const warmGold = isLight ? '#b0864f' : '#d9b17a';
    return (
    <div className="w-full relative overflow-hidden">
        <div className="relative min-h-[65vh] sm:min-h-[75vh] flex items-center justify-center text-center px-4 sm:px-6 py-24 md:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-black/65 z-10" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.72) 100%)` }} />
            {config.coverImage && <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="Restaurant Cover" loading="lazy" decoding="async" />}
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none"
                style={{ backgroundImage: `radial-gradient(circle at 30% 20%, ${activeTheme.primary}1f 0%, transparent 55%), radial-gradient(circle at 70% 80%, ${warmGold}2a 0%, transparent 55%)` }}
            />
            <div className="relative z-20 flex flex-col items-center max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-7 opacity-90">
                    <span className="w-12 md:w-20 h-[1px]" style={{ background: `linear-gradient(to right, transparent, ${warmGold})` }} />
                    {config.businessName && <span className="text-[11px] sm:text-xs tracking-[0.42em] uppercase font-black" style={{ color: warmGold }}>{config.businessName}</span>}
                    <span className="w-12 md:w-20 h-[1px]" style={{ background: `linear-gradient(to left, transparent, ${warmGold})` }} />
                </div>
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-light tracking-widest uppercase mb-6 text-white w-full break-words hyphens-auto leading-[1.06]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{config.slogan || ''}</h1>
                <div className="w-20 h-1 mb-7" style={{ backgroundColor: warmGold }} />
                <p className="text-base sm:text-xl md:text-[22px] text-white/85 max-w-2xl font-light italic w-full break-words hyphens-auto leading-relaxed" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'}
                        className="group mt-10 px-10 py-4.5 uppercase tracking-[0.24em] text-[11px] sm:text-xs font-black transition-all duration-500 border backdrop-blur-sm rounded-none"
                        style={{
                            backgroundColor: 'transparent',
                            borderColor: `${warmGold}aa`,
                            color: warmGold,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = warmGold; e.currentTarget.style.color = '#0a0a0a'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = warmGold; }}
                    >
                        {config.ctaText}
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-20 md:py-28 max-w-6xl mx-auto px-4 sm:px-6 text-center relative">
                <div className="absolute top-20 left-1/4 w-[20rem] h-[20rem] rounded-full opacity-[0.07] blur-[130px] pointer-events-none" style={{ backgroundColor: warmGold }} />
                <div className="flex flex-col items-center gap-4 mb-14 md:mb-20 relative z-10">
                    <div className="text-[11px] uppercase tracking-[0.3em] font-black opacity-80" style={{ color: warmGold }}>Our Selection</div>
                    <h3 className="text-3xl sm:text-5xl md:text-6xl tracking-widest uppercase w-full break-words hyphens-auto leading-[1.05]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{config.featuresTitle}</h3>
                    <div className="w-16 h-1" style={{ backgroundColor: warmGold }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 md:gap-y-10 relative z-10">
                    {config.features.map((feat, i) => (
                        <div key={i} className="flex flex-col items-center text-center p-7 md:p-9 rounded-[2rem] border backdrop-blur-xl group relative overflow-hidden transition-all duration-500 hover:-translate-y-1"
                            style={{
                                backgroundColor: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.025)',
                                borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                                boxShadow: '0 18px 45px -28px rgba(0,0,0,0.6)'
                            }}
                        >
                            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-[0.15] blur-3xl pointer-events-none group-hover:opacity-[0.3] transition-opacity duration-500" style={{ backgroundColor: warmGold }} />
                            {feat.image && (
                                <div className="relative mb-5">
                                    <div className="absolute inset-0 rounded-full opacity-50 blur-xl pointer-events-none" style={{ backgroundColor: warmGold }} />
                                    <img src={feat.image} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-xl border-2 cursor-pointer z-10 transition-transform duration-700 group-hover:scale-105"
                                        onClick={() => setZoomImage && setZoomImage(feat.image)}
                                        style={{ borderColor: warmGold }}
                                        alt={feat.title}
                                        loading="lazy" decoding="async"
                                    />
                                </div>
                            )}
                            <h4 className="text-xl sm:text-2xl font-bold mb-2 uppercase tracking-wide w-full break-words hyphens-auto" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{feat.title}</h4>
                            <div className="w-10 h-[1.5px] mb-3" style={{ backgroundColor: warmGold }} />
                            <p className="text-sm sm:text-base opacity-80 italic leading-relaxed w-full break-words hyphens-auto max-w-sm">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
    );
};

// ==========================================
// 8. TECHNOLOGY TEMPLATE
// ==========================================
export const TechnologyTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-14 md:py-24 relative overflow-hidden">
        {/* Ambient tech glow */}
        <div className="absolute top-10 left-1/4 w-[34rem] h-[34rem] rounded-full opacity-[0.1] blur-[140px] pointer-events-none" style={{ background: `linear-gradient(180deg, ${activeTheme.primary}, transparent)` }} />
        <div className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] rounded-full opacity-[0.07] blur-[130px] pointer-events-none" style={{ background: `linear-gradient(0deg, ${activeTheme.primary}, transparent)` }} />

        <div className="flex flex-col items-center text-center mb-16 md:mb-24 relative z-10">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.18em] mb-7 border backdrop-blur-xl"
                style={{
                    backgroundColor: `${activeTheme.primary}0e`,
                    borderColor: `${activeTheme.primary}35`,
                    color: activeTheme.primary,
                    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace'
                }}
            >
                <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: activeTheme.primary }} />
                {config.businessName || 'system://init'}
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter mb-7 uppercase leading-[1.02] w-full break-words hyphens-auto max-w-5xl"
                style={{
                    background: `linear-gradient(180deg, ${isLight ? '#0a0a0a' : '#ffffff'} 0%, ${isLight ? '#0a0a0a' : '#ffffff'} 50%, ${activeTheme.primary} 100%)`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent'
                }}
            >
                {config.slogan || ''}
            </h1>
            <div className="w-14 h-[3px] rounded-full mb-7" style={{ background: `linear-gradient(90deg, transparent, ${activeTheme.primary}, transparent)` }} />
            {config.description && (
                <div className="max-w-3xl w-full">
                    <div className="flex w-full gap-4 items-start">
                        <span className="block w-[3px] shrink-0 rounded-full mt-1 self-stretch" style={{ background: `linear-gradient(180deg, ${activeTheme.primary}, transparent)`, width: '3px' }} />
                        <p className="text-[17px] sm:text-lg opacity-80 leading-relaxed text-left w-full break-words hyphens-auto" style={{ fontFamily: 'ui-sans-serif, system-ui' }}>{config.description}</p>
                    </div>
                </div>
            )}
            {config.ctaText && (
                <a href={config.ctaLink || '#'}
                    className="group mt-10 px-10 py-5 font-black uppercase tracking-[0.18em] text-[12px] sm:text-sm transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-3 border backdrop-blur-xl"
                    style={{
                        backgroundColor: activeTheme.primary,
                        color: '#000',
                        borderColor: `${activeTheme.primary}cc`,
                        boxShadow: `0 24px 65px -20px ${activeTheme.primary}a8`,
                        clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)'
                    }}
                >
                    <Icons.Terminal className="w-4.5 h-4.5 shrink-0" />
                    <span className="tracking-[0.18em]">[ {config.ctaText} ]</span>
                </a>
            )}
        </div>
        {config.coverImage && (
            <div className="w-full h-64 md:h-[500px] rounded-[28px] relative overflow-hidden mb-16 md:mb-24 group cursor-pointer z-10 border shadow-2xl"
                onClick={() => setZoomImage && setZoomImage(config.coverImage)}
                style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)' }}
            >
                <div className="absolute top-0 left-0 right-0 h-11 flex items-center gap-2 px-4 z-20 border-b backdrop-blur-xl"
                    style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.42)', borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }}
                >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
                    <div className="ml-3 text-[11px] font-mono opacity-70 truncate">/production/stack.run</div>
                </div>
                <div className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-500"
                    style={{
                        background: `
                            linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 55%),
                            repeating-linear-gradient(90deg, ${activeTheme.primary}12 0px, ${activeTheme.primary}12 1px, transparent 1px, transparent 60px),
                            repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 60px)
                        `,
                        opacity: 0.7,
                        mixBlendMode: 'overlay'
                    }}
                />
                <img src={config.coverImage} className="w-full h-full object-cover pt-11 transition-transform duration-[1200ms] group-hover:scale-105" alt="Tech Base" loading="lazy" decoding="async" />
            </div>
        )}
        {config.features?.length > 0 && (
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10 md:mb-14 pb-4 border-b" style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                    <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight w-full break-words hyphens-auto flex items-center gap-3" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
                        <span className="text-[13px] md:text-sm opacity-60 shrink-0">►</span>
                        {config.featuresTitle}
                    </h3>
                    <div className="flex-1 h-px border-t border-dashed" style={{ borderColor: activeTheme.primary }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                    {config.features.map((feat, i) => (
                        <div key={i} className="p-6 md:p-7 rounded-[22px] relative group transition-all duration-500 hover:-translate-y-1 border backdrop-blur-2xl overflow-hidden"
                            style={{
                                backgroundColor: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.03)',
                                borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
                            }}
                        >
                            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-[0.14] blur-3xl pointer-events-none group-hover:opacity-[0.3] transition-opacity duration-500" style={{ backgroundColor: activeTheme.primary }} />
                            <div className="text-[10px] md:text-[11px] mb-3 font-black tracking-[0.18em] uppercase flex items-center gap-2" style={{ color: activeTheme.primary, fontFamily: 'ui-monospace, Menlo, monospace' }}>
                                <span>0x{i.toString(16).padStart(4, '0')}</span>
                            </div>
                            <h4 className="text-xl md:text-2xl font-black mb-3 w-full break-words hyphens-auto tracking-tight leading-tight">{feat.title}</h4>
                            <p className="text-sm opacity-75 leading-relaxed w-full break-words hyphens-auto">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
    );
};

// ==========================================
// 9. FOOTBALL & SPORTS TEMPLATE
// ==========================================
export const FootballTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    return (
    <div className="w-full max-w-7xl mx-auto relative overflow-hidden">
        {/* Stadium Hero */}
        <div className="relative w-full min-h-[55vh] sm:min-h-[65vh] md:h-[68vh] overflow-hidden flex flex-col justify-end p-6 sm:p-10 md:p-16 z-10" style={{ backgroundColor: activeTheme.bg }}>
            {/* Scanline atmosphere */}
            <div className="absolute inset-0 z-10 pointer-events-none" style={{
                backgroundImage: `
                    linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.75) 100%),
                    repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)
                `
            }} />
            {config.coverImage && <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover z-0 scale-100" alt="Stadium" loading="lazy" decoding="async" />}
            <div className="absolute top-0 left-0 right-0 z-10 p-6 sm:p-10 md:px-16 md:pt-14 flex items-center justify-between">
                {config.businessName && (
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.18em] border backdrop-blur-xl"
                        style={{
                            backgroundColor: `${activeTheme.primary}22`,
                            borderColor: `${activeTheme.primary}55`,
                            color: '#fff'
                        }}
                    >
                        <Icons.Trophy className="w-3.5 h-3.5 shrink-0" />
                        {config.businessName}
                    </div>
                )}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.16em] backdrop-blur-xl border"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: activeTheme.primary }} />
                    Live
                </div>
            </div>
            <div className="relative z-20 w-full flex flex-col items-start">
                <div className="flex items-center gap-3 mb-4">
                    <span className="block w-1.5 h-16 md:h-24 rounded-full shrink-0" style={{ backgroundColor: activeTheme.primary }} />
                    <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] mb-2 opacity-90" style={{ color: '#fff' }}>Match Day</div>
                        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-[1.02] mb-2 w-full break-words hyphens-auto" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}>{config.slogan || ''}</h1>
                        <p className="text-base sm:text-xl md:text-2xl font-bold text-white/92 uppercase tracking-wide w-full break-words hyphens-auto mt-3">{config.description}</p>
                    </div>
                </div>
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-14 md:py-20 px-4 sm:px-6 md:px-8 relative">
                <div className="w-full flex justify-between items-end border-b-4 pb-3 mb-10 md:mb-14" style={{ borderColor: activeTheme.primary }}>
                    <div className="flex flex-col items-start gap-2">
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] opacity-65">Latest Squad</div>
                        <h3 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase italic w-full break-words hyphens-auto leading-none">{config.featuresTitle}</h3>
                    </div>
                    <span className="hidden sm:block text-[11px] font-black uppercase tracking-[0.22em] opacity-60">Season 2025</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
                    {config.features.map((feat, i) => (
                        <div key={i} className="group cursor-pointer rounded-[20px] relative overflow-hidden border backdrop-blur-xl transition-all duration-500 hover:-translate-y-1"
                            style={{
                                backgroundColor: activeTheme.card,
                                borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                                boxShadow: '0 16px 40px -22px rgba(0,0,0,0.6)'
                            }}
                            onClick={() => setZoomImage && setZoomImage(feat.image)}
                        >
                            <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full opacity-[0.18] blur-3xl pointer-events-none group-hover:opacity-[0.35] transition-opacity duration-500" style={{ backgroundColor: activeTheme.primary }} />
                            {feat.image && (
                                <div className="relative overflow-hidden">
                                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-[0.18em]"
                                        style={{ backgroundColor: activeTheme.primary, color: '#000' }}
                                    >#{String(i+1).padStart(2,'0')}</div>
                                    <img src={feat.image} className="w-full h-52 sm:h-56 object-cover transition-transform duration-[900ms] group-hover:scale-108" alt="Player/News" loading="lazy" decoding="async" />
                                </div>
                            )}
                            <div className="p-5 md:p-6 relative z-10">
                                <h4 className="font-black uppercase italic text-lg sm:text-xl mb-1.5 w-full break-words hyphens-auto leading-tight">{feat.title}</h4>
                                <div className="w-8 h-[2px] rounded-full mb-2.5" style={{ backgroundColor: activeTheme.primary }} />
                                <p className="text-xs sm:text-[13px] opacity-70 w-full break-words hyphens-auto leading-relaxed">{feat.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
    );
};

// ==========================================
// 10. BETTING & SPORTSBOOK TEMPLATE
// ==========================================
export const BettingTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    const cardBg = activeTheme.card;
    const headerBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
    const borderColor = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
    const divideColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    const btnBg = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)';
    return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10 md:py-16 relative overflow-hidden" style={{ fontFamily: '"Inter", Roboto, system-ui, sans-serif' }}>
        <div className="absolute top-10 left-1/4 w-[22rem] h-[22rem] rounded-full opacity-[0.13] blur-[130px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />

        {/* Hero Promo Card */}
        <div className="rounded-[28px] overflow-hidden mb-10 border relative z-10 shadow-2xl backdrop-blur-xl" style={{ backgroundColor: cardBg, borderColor }}>
            {/* Striped header accent */}
            <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${activeTheme.primary} 0%, ${activeTheme.primary}cc 50%, ${activeTheme.primary} 100%)` }} />
            <div className="p-5 sm:p-7 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5" style={{ borderColor, backgroundColor: headerBg }}>
                <div className="flex-1 flex flex-col gap-2">
                    <h1 className="text-xl sm:text-3xl font-black uppercase flex items-center gap-3 w-full break-words hyphens-auto leading-tight tracking-tight">
                        <span className="relative flex items-center justify-center shrink-0">
                            <span className="absolute w-5 h-5 rounded-full animate-ping opacity-40" style={{ backgroundColor: activeTheme.primary }} />
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: activeTheme.primary }} />
                        </span>
                        <span>{config.slogan || ''}</span>
                    </h1>
                    {config.businessName && (
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-65 flex items-center gap-2">
                        <Icons.Coins className="w-3.5 h-3.5" style={{ color: activeTheme.primary }} /> {config.businessName}
                        </span>
                    )}
                </div>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="w-full sm:w-auto px-8 py-3.5 text-center rounded-[14px] font-black uppercase text-[12px] tracking-[0.14em] shrink-0 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 shadow-xl border"
                        style={{
                            backgroundColor: activeTheme.primary,
                            color: '#000',
                            borderColor: `${activeTheme.primary}c0`,
                            boxShadow: `0 18px 45px -15px ${activeTheme.primary}90`
                        }}
                    >
                        <Icons.Zap className="w-4 h-4" /> {config.ctaText}
                    </a>
                )}
            </div>
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 md:gap-10">
                <div className="flex-1 flex flex-col gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] w-max backdrop-blur-xl border"
                        style={{
                            backgroundColor: `${activeTheme.primary}18`,
                            borderColor: `${activeTheme.primary}35`,
                            color: activeTheme.primary
                        }}
                    >
                        Welcome Bonus
                    </div>
                    <p className="text-[17px] sm:text-xl flex-1 w-full break-words hyphens-auto opacity-85 leading-relaxed">{config.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {['Live Odds', 'Fast Payout', '24/7 Support', 'SSL Secured'].map(tag=>(<span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] border" style={{ backgroundColor: btnBg, borderColor, opacity: 0.75 }}><span className="w-1 h-1 rounded-full" style={{ backgroundColor: activeTheme.primary }} />{tag}</span>))}
                    </div>
                </div>
                {config.coverImage && (
                    <div className="w-full md:w-[38%] max-w-sm aspect-[4/3] rounded-[18px] overflow-hidden border group cursor-pointer relative"
                        style={{ borderColor, boxShadow: '0 16px 50px -20px rgba(0,0,0,0.6)' }}
                        onClick={() => setZoomImage && setZoomImage(config.coverImage)}
                    >
                        <img src={config.coverImage} className="w-full h-full object-cover transition-transform duration-[1000ms] group-hover:scale-108" alt="Promo" loading="lazy" decoding="async" />
                    </div>
                )}
            </div>
        </div>

        {/* Match Odds Grid */}
        {config.features?.length > 0 && (
            <div className="rounded-[28px] border overflow-hidden relative z-10 shadow-2xl backdrop-blur-xl" style={{ backgroundColor: cardBg, borderColor }}>
                <div className="p-5 sm:p-7 border-b flex items-center justify-between" style={{ borderColor, backgroundColor: headerBg }}>
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em]"
                            style={{ backgroundColor: `${activeTheme.primary}1a`, color: activeTheme.primary }}>
                        <Icons.Swords className="w-3 h-3" /> Today's Matches
                    </span>
                    <h3 className="font-black uppercase w-full break-words hyphens-auto tracking-wide text-lg sm:text-xl leading-tight">{config.featuresTitle}</h3>
                </div>
                <div>
                    {config.features.map((feat, i) => (
                        <div key={i} className="p-4 sm:p-6 flex flex-col md:flex-row items-center md:items-center justify-between gap-5 border-t transition-colors hover:bg-white/[0.02]"
                             style={{ borderColor: divideColor }}
                             onMouseEnter={(e)=>{e.currentTarget.style.backgroundColor=isLight?'rgba(0,0,0,0.02)':'rgba(255,255,255,0.025)'}}
                             onMouseLeave={(e)=>{e.currentTarget.style.backgroundColor='transparent'}}
                        >
                            <div className="flex-1 w-full flex flex-col gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">Match {String(i+1).padStart(2,'0')}</span>
                                    <span className="w-1 h-1 rounded-full opacity-40" style={{ backgroundColor: divideColor }} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70 flex items-center gap-1">
                                        <Icons.Clock className="w-3 h-3" style={{ color: activeTheme.primary }} /> 90'
                                    </span>
                                </div>
                                <h4 className="font-black text-lg sm:text-2xl w-full break-words hyphens-auto leading-tight tracking-tight">{feat.title}</h4>
                                <p className="text-sm w-full break-words hyphens-auto opacity-65 leading-relaxed">{feat.desc}</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto shrink-0 md:ml-2">
                                {[
                                    {k: '1', label: 'Home' },
                                    {k: 'X', label: 'Draw' },
                                    {k: '2', label: 'Away' },
                                ].map((o) => (
                                    <button key={o.k}
                                        className="group flex-1 md:w-20 py-3.5 rounded-[12px] font-black transition-all duration-200 border text-center relative overflow-hidden hover:-translate-y-0.5 hover:shadow-xl"
                                        style={{
                                            backgroundColor: btnBg,
                                            borderColor: 'transparent',
                                            border: `1px solid transparent`
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = activeTheme.primary;
                                            e.currentTarget.style.color = '#000';
                                            e.currentTarget.style.borderColor = `${activeTheme.primary}90`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = btnBg;
                                            e.currentTarget.style.color = '';
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }}
                                    >
                                        <div className="flex flex-col items-center leading-tight">
                                            <span className="text-[17px] sm:text-xl font-black tracking-tight">{o.k}</span>
                                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] opacity-70 mt-0.5">{o.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
    );
};

// ==========================================
// 11. CORPORATE TEMPLATE
// ==========================================
export const CorporateTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    return (
    <div className="w-full rounded-[32px] overflow-hidden my-2 md:my-5 relative shadow-2xl" style={{ backgroundColor: activeTheme.bg, color: isLight ? '#0f172a' : '#fff' }}>
        {/* Ambient inside */}
        <div className="w-full py-20 md:py-32 px-6 md:px-14 text-center flex flex-col items-center relative overflow-hidden" style={{ backgroundColor: isLight ? '#0f172a' : '#111827' }}>
            <div className="absolute top-10 left-1/4 w-[22rem] h-[22rem] rounded-full opacity-[0.18] blur-[120px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
            <div className="absolute bottom-0 right-1/4 w-[24rem] h-[24rem] rounded-full opacity-[0.12] blur-[130px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
            {config.businessName && (
                <div className="relative z-10 inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.18em] mb-7 border backdrop-blur-xl"
                    style={{
                        backgroundColor: `${activeTheme.primary}18`,
                        borderColor: `${activeTheme.primary}45`,
                        color: activeTheme.primary
                    }}
                >
                    <Icons.Building2 className="w-3.5 h-3.5 shrink-0" />
                    {config.businessName}
                </div>
            )}
            <h1 className="relative z-10 text-3xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-7 max-w-5xl leading-[1.05] text-white">{config.slogan || ''}</h1>
            <div className="relative z-10 w-16 h-[3px] rounded-full mb-7" style={{ background: `linear-gradient(90deg, transparent, ${activeTheme.primary}, transparent)` }} />
            <p className="relative z-10 text-[17px] sm:text-xl opacity-85 max-w-2xl mb-11 text-white/90 leading-relaxed">{config.description}</p>
            {config.ctaText && (
                <a href={config.ctaLink || '#'}
                    className="relative z-10 group px-9 py-4.5 rounded-[16px] text-sm font-black uppercase tracking-[0.14em] transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2.5 border shadow-2xl"
                    style={{
                        backgroundColor: activeTheme.primary,
                        color: isLight ? '#fff' : '#000',
                        borderColor: `${activeTheme.primary}cc`,
                        boxShadow: `0 22px 55px -18px ${activeTheme.primary}90`
                    }}
                >
                    <span>{config.ctaText}</span>
                    <Icons.ArrowRight className="w-4.5 h-4.5 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
            )}
        </div>
        {config.coverImage && (
            <div className="-mt-14 md:-mt-20 max-w-5xl mx-auto px-4 sm:px-6 relative z-20">
                <div className="absolute inset-0 blur-2xl opacity-40 rounded-[1.7rem] max-w-5xl mx-auto pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
                <div className="relative rounded-[28px] overflow-hidden border shadow-2xl group cursor-pointer" style={{ borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}
                    onClick={() => setZoomImage && setZoomImage(config.coverImage)}
                >
                    <img src={config.coverImage} className="w-full h-64 sm:h-80 md:h-[420px] object-cover transition-transform duration-[1200ms] group-hover:scale-105" alt="Corporate Hero" loading="lazy" decoding="async" />
                </div>
            </div>
        )}
        {config.features?.length > 0 && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
                    <h3 className="text-2xl sm:text-4xl md:text-5xl font-black mb-5 text-center leading-[1.05] tracking-tight" style={{ color: isLight ? '#0f172a' : undefined }}>{config.featuresTitle}</h3>
                    <div className="w-14 h-1 rounded-full mx-auto" style={{ backgroundColor: activeTheme.primary }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-7">
                    {config.features.map((feat, i) => (
                        <div key={i} className="p-6 md:p-8 rounded-[24px] hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border backdrop-blur-xl group relative overflow-hidden"
                            style={{
                                backgroundColor: activeTheme.card,
                                borderColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)'
                            }}
                        >
                            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-[0.14] blur-3xl pointer-events-none group-hover:opacity-[0.32] transition-opacity duration-500" style={{ backgroundColor: activeTheme.primary }} />
                            {feat.image && (
                                <div className="relative mb-7">
                                    <img src={feat.image} className="w-16 h-16 object-cover rounded-[18px] cursor-pointer relative z-10 transition-transform duration-500 group-hover:scale-105 shadow-lg border"
                                        onClick={() => setZoomImage && setZoomImage(feat.image)}
                                        alt={feat.title}
                                        style={{ borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}
                                        loading="lazy" decoding="async"
                                    />
                                </div>
                            )}
                            <h4 className="relative z-10 text-xl md:text-2xl font-black mb-3 tracking-tight leading-tight" style={{ color: isLight ? '#0f172a' : undefined }}>{feat.title}</h4>
                            <p className="relative z-10 leading-relaxed text-sm md:text-base" style={{ color: isLight ? '#475569' : undefined, opacity: isLight ? 1 : 0.72 }}>{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
    );
};

// ==========================================
// 12. CREATIVE TEMPLATE
// ==========================================
export const CreativeTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    const textColor = isLight ? '#000' : '#fff';
    return (
    <div className="w-full min-h-screen relative overflow-hidden" style={{ backgroundColor: activeTheme.bg, color: textColor }}>
        <div className="flex flex-col md:flex-row min-h-[70vh] md:min-h-[82vh]">
            <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 md:p-24 z-10 relative">
                <div className="absolute top-10 left-10 w-52 h-52 opacity-[0.22] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: activeTheme.primary }}></div>
                <div className="absolute bottom-0 left-10 w-72 h-72 opacity-[0.14] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: activeTheme.primary }}></div>
                <div className="max-w-xl relative z-10">
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-8 border backdrop-blur-xl w-max"
                        style={{
                            backgroundColor: `${activeTheme.primary}10`,
                            borderColor: `${activeTheme.primary}38`,
                            color: activeTheme.primary
                        }}
                    >
                        <Icons.Sparkles className="w-3.5 h-3.5 shrink-0" />
                        {config.businessName || 'Creative Studio'}
                    </div>
                    <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-7 md:mb-9 leading-[0.96] tracking-tighter" style={{ color: textColor }}>{config.slogan || ''}</h1>
                    <div className="w-14 h-1 rounded-full mb-7" style={{ backgroundColor: activeTheme.primary }} />
                    <p className="text-lg sm:text-xl md:text-2xl font-light opacity-80 max-w-md mb-9 md:mb-12 leading-relaxed">{config.description}</p>
                    {config.ctaText && (
                        <div className="flex flex-wrap items-center gap-3">
                            <a href={config.ctaLink || '#'} className="group w-max px-9 py-4.5 sm:px-11 sm:py-5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2.5 border backdrop-blur-xl"
                                style={{
                                    backgroundColor: isLight ? '#0a0a0a' : textColor,
                                    color: isLight ? textColor : activeTheme.bg,
                                    borderColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)'
                                }}
                            >
                                <span>{config.ctaText}</span>
                                <Icons.ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                        </div>
                    )}
                </div>
            </div>
            {config.coverImage && (
                <div className="flex-1 relative overflow-hidden min-h-[340px] md:min-h-[600px] cursor-pointer group" onClick={() => setZoomImage && setZoomImage(config.coverImage)}>
                    <div className="absolute -top-0 right-0 w-64 h-64 opacity-[0.25] blur-3xl rounded-full pointer-events-none z-10" style={{ backgroundColor: activeTheme.primary, top: '-40px', right: '-20px' }} />
                    <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover transition-all duration-[1200ms]" alt="Creative" loading="lazy" decoding="async"
                        style={{ filter: isLight ? 'saturate(0.85) contrast(1.03)' : 'saturate(0.88) contrast(1.02) brightness(1.01)' }}
                    />
                </div>
            )}
        </div>
        {config.features?.length > 0 && (
            <div className="py-20 md:py-32 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto relative">
                <div className="flex items-end justify-between mb-14 md:mb-20 pb-5 border-b" style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                    <div className="flex flex-col gap-3">
                        <div className="text-[11px] font-black uppercase tracking-[0.24em] opacity-60">Selected Works</div>
                        <h3 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none" style={{ color: textColor }}>{config.featuresTitle}</h3>
                    </div>
                    <span className="hidden sm:block text-[11px] font-black uppercase tracking-[0.22em] opacity-60">{String(config.features.length).padStart(2,'0')} Projects</span>
                </div>
                <div className="flex flex-col gap-10 md:gap-16">
                    {config.features.map((feat, i) => (
                        <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-7 md:gap-12 items-start md:items-center group relative`}>
                            <div className="flex-1 w-full relative">
                                <div className="text-[11px] font-black uppercase tracking-[0.24em] mb-4" style={{ color: activeTheme.primary }}>
                                    Project · {String(i + 1).padStart(2, '0')}
                                </div>
                                <h4 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 leading-[1.06] tracking-tight" style={{ color: activeTheme.primary }}>{feat.title}</h4>
                                <p className="text-base sm:text-lg opacity-75 max-w-xl leading-relaxed mb-6">{feat.desc}</p>
                                <a className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] group/btn border-b pb-1 transition-colors"
                                    style={{ borderColor: activeTheme.primary, color: activeTheme.primary }}
                                >
                                    View Case
                                    <Icons.ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                                </a>
                            </div>
                            {feat.image && (
                                <div className="flex-1 w-full overflow-hidden rounded-[28px] cursor-pointer relative border shadow-2xl group/img"
                                    onClick={() => setZoomImage && setZoomImage(feat.image)}
                                    style={{ borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}
                                >
                                    <img src={feat.image} className="w-full h-52 sm:h-72 md:h-80 object-cover transition-transform duration-[1000ms]" alt={feat.title} loading="lazy" decoding="async" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
    );
};

// ==========================================
// 13. FITNESS TEMPLATE
// ==========================================
export const FitnessTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    return (
    <div className="w-full uppercase relative overflow-hidden" style={{ backgroundColor: activeTheme.bg, color: isLight ? '#000' : '#fff' }}>
        <div className="relative min-h-[72vh] md:min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-6 py-28 overflow-hidden">
            {config.coverImage && <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Fitness Hero" loading="lazy" decoding="async" />}
            <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 100%), linear-gradient(0deg, ${activeTheme.bg} 0%, rgba(0,0,0,0.05) 60%)` }}></div>
            <div className="absolute top-10 left-1/4 w-[22rem] h-[22rem] rounded-full opacity-[0.2] blur-[130px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
            <div className="relative z-10 max-w-5xl flex flex-col items-center">
                {config.businessName && (
                    <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.22em] mb-8 border backdrop-blur-xl"
                        style={{
                            backgroundColor: `${activeTheme.primary}1c`,
                            borderColor: `${activeTheme.primary}55`,
                            color: activeTheme.primary
                        }}
                    >
                        <Icons.Dumbbell className="w-4 h-4 shrink-0" /> {config.businessName}
                    </div>
                )}
                <h1 className={`text-4xl sm:text-7xl md:text-9xl font-black italic tracking-tighter mb-5 text-transparent bg-clip-text leading-[0.95] ${isLight ? 'bg-gradient-to-r from-black to-gray-600' : 'bg-gradient-to-r from-white via-white to-gray-400'}`}
                    style={{
                        textShadow: isLight ? '0 10px 40px rgba(0,0,0,0.15)' : '0 10px 50px rgba(0,0,0,0.4)'
                    }}
                >{config.slogan || ''}</h1>
                <div className="w-20 h-[3px] rounded-full mb-5" style={{ background: `linear-gradient(90deg, transparent, ${activeTheme.primary}, transparent)` }} />
                <p className="text-base sm:text-xl md:text-2xl font-black tracking-widest mb-10 md:mb-12" style={{ color: activeTheme.primary }}>{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'}
                        className="group inline-block px-10 sm:px-14 py-5 sm:py-6 font-black text-base sm:text-2xl tracking-widest skew-x-[-10deg] transition-all duration-300 hover:scale-105 rounded-none border relative overflow-hidden"
                        style={{
                            backgroundColor: activeTheme.primary,
                            color: '#000',
                            borderColor: `${activeTheme.primary}cc`,
                            boxShadow: `0 25px 70px -20px ${activeTheme.primary}b0`
                        }}
                    >
                        <div className="skew-x-[10deg] flex items-center gap-3">
                            <Icons.Flame className="w-5 h-5 shrink-0" />
                            {config.ctaText}
                        </div>
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-20 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
                    <div className="text-[11px] font-black uppercase tracking-[0.24em] mb-5 opacity-70">Training Programs</div>
                    <h3 className="text-3xl sm:text-5xl md:text-6xl font-black italic tracking-tighter mb-5 text-center leading-[1.02]">{config.featuresTitle}</h3>
                    <div className="w-16 h-1 rounded-full mx-auto" style={{ backgroundColor: activeTheme.primary }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
                    {config.features.map((feat, i) => (
                        <div key={i} className="relative h-80 sm:h-96 group overflow-hidden rounded-[24px] cursor-pointer border transition-all duration-500 hover:-translate-y-1 shadow-2xl"
                            style={{
                                backgroundColor: activeTheme.card,
                                borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
                            }}
                            onClick={() => setZoomImage && setZoomImage(feat.image)}
                        >
                            {feat.image && <img src={feat.image} className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:opacity-25 transition-opacity duration-600" alt={feat.title} loading="lazy" decoding="async" />}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-0"></div>
                            <div className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-[0.2em]"
                                style={{ backgroundColor: activeTheme.primary, color: '#000' }}>
                                <span>{String(i+1).padStart(2,'0')}</span>
                            </div>
                            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end z-10 transform group-hover:translate-y-0 translate-y-10 transition-transform duration-600">
                                <div className="w-12 h-[3px] rounded-full mb-4" style={{ backgroundColor: activeTheme.primary }} />
                                <h4 className="text-2xl sm:text-4xl font-black italic mb-2.5 tracking-tight" style={{ color: activeTheme.primary, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{feat.title}</h4>
                                <p className="text-xs sm:text-sm font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 leading-relaxed text-white/90">{feat.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
    );
};

// ==========================================
// 14. PORTFOLIO TEMPLATE
// ==========================================
export const PortfolioTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    const textColor = isLight ? '#0a0a0a' : '#ffffff';
    return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-16 md:py-32 relative overflow-hidden" style={{ color: textColor }}>
        {/* Background orbs */}
        <div className="absolute -top-10 -left-10 w-[26rem] h-[26rem] rounded-full opacity-[0.14] blur-[130px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[24rem] rounded-full opacity-[0.1] blur-[120px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />

        <div className="flex flex-col mb-16 md:mb-32 relative z-10">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-8 border backdrop-blur-xl w-max"
                style={{
                    backgroundColor: `${activeTheme.primary}0e`,
                    borderColor: `${activeTheme.primary}3a`,
                    color: activeTheme.primary
                }}
            >
                <Icons.User className="w-3.5 h-3.5 shrink-0" />
                {config.businessName || 'Portfolio 2025'}
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight mb-7 md:mb-9 max-w-4xl leading-[1.03]" style={{ color: textColor }}>{config.slogan || ''}</h1>
            <div className="w-16 h-1 rounded-full mb-7 md:mb-9" style={{ backgroundColor: activeTheme.primary }} />
            <p className="text-lg sm:text-2xl font-light opacity-72 max-w-2xl mb-9 md:mb-11 leading-relaxed">{config.description}</p>
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                {config.coverImage && (
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-xl opacity-60 pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
                        <img src={config.coverImage}
                            className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full object-cover shadow-2xl border-2.5 cursor-pointer transition-transform duration-500 hover:scale-105"
                            onClick={() => setZoomImage && setZoomImage(config.coverImage)}
                            alt="Profile"
                            style={{ borderColor: isLight ? '#fff' : 'rgba(255,255,255,0.28)' }}
                            loading="lazy" decoding="async"
                        />
                    </div>
                )}
                {config.ctaText && (
                    <a href={config.ctaLink || '#'}
                        className="group px-8 py-4 sm:px-10 sm:py-4.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-[0.18em] transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2.5 border backdrop-blur-xl shadow-xl"
                        style={{
                            backgroundColor: activeTheme.primary,
                            color: isLight ? '#fff' : '#000',
                            borderColor: `${activeTheme.primary}c0`,
                            boxShadow: `0 18px 45px -15px ${activeTheme.primary}a0`
                        }}
                    >
                        <span>{config.ctaText}</span>
                        <Icons.ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="relative z-10">
                <div className="flex items-end justify-between mb-12 md:mb-16 pb-5 border-b" style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                    <div className="flex flex-col gap-2">
                        <div className="text-[11px] font-black uppercase tracking-[0.24em] opacity-60">Selected Work</div>
                        <h3 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none" style={{ color: textColor }}>{config.featuresTitle}</h3>
                    </div>
                    <span className="hidden sm:block text-[11px] font-black uppercase tracking-[0.2em] opacity-60">{String(config.features.length).padStart(2,'0')} / ∞</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 md:gap-10">
                    {config.features.map((feat, i) => (
                        <div key={i} className="group cursor-pointer relative flex flex-col" onClick={() => setZoomImage && setZoomImage(feat.image)}>
                            {feat.image && (
                                <div className="overflow-hidden rounded-[26px] mb-5 border shadow-2xl bg-gray-100 dark:bg-gray-800 aspect-[4/3] relative"
                                    style={{ borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}
                                >
                                    <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur-xl border"
                                        style={{
                                            backgroundColor: 'rgba(0,0,0,0.45)',
                                            borderColor: 'rgba(255,255,255,0.14)',
                                            color: '#fff'
                                        }}
                                    >
                                        <span>№</span>
                                        <span>{String(i+1).padStart(2,'0')}</span>
                                    </div>
                                    <img src={feat.image} className="w-full h-full object-cover transition-transform duration-[1000ms]" alt={feat.title} loading="lazy" decoding="async" />
                                </div>
                            )}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <h4 className="text-xl sm:text-2xl md:text-3xl font-black mb-2 group-hover:underline decoration-2 underline-offset-[6px] tracking-tight leading-tight"
                                        style={{
                                            textDecorationColor: activeTheme.primary,
                                            textUnderlineOffset: '6px'
                                        }}
                                    >{feat.title}</h4>
                                    <p className="opacity-72 text-sm sm:text-base leading-relaxed max-w-xl">{feat.desc}</p>
                                </div>
                                <span className="shrink-0 mt-1 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:shadow-xl backdrop-blur-xl"
                                    style={{
                                        backgroundColor: `${activeTheme.primary}14`,
                                        borderColor: `${activeTheme.primary}45`,
                                        color: activeTheme.primary
                                    }}
                                >
                                    <Icons.ArrowUpRight className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
    );
};

// ==========================================
// 15. REAL ESTATE TEMPLATE
// ==========================================
export const RealEstateTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    const soft = isLight ? '#0f172a' : '#ffffff';
    return (
    <div className="w-full rounded-[32px] overflow-hidden my-2 md:my-5 relative shadow-2xl" style={{ backgroundColor: activeTheme.bg, color: isLight ? '#0f172a' : '#fff' }}>
        <div className="relative min-h-[60vh] sm:min-h-[78vh] flex items-center justify-center overflow-hidden">
            <div className="absolute -top-20 -left-20 w-[30rem] h-[30rem] rounded-full opacity-[0.22] blur-[140px] pointer-events-none z-20" style={{ backgroundColor: activeTheme.primary }} />
            {config.coverImage && (
                <img src={config.coverImage}
                    className={`absolute inset-0 w-full h-full object-cover ${isLight ? 'brightness-50' : 'brightness-50'}`}
                    alt="Property Hero"
                    loading="lazy" decoding="async"
                />
            )}
            <div className="absolute inset-0 z-10 pointer-events-none" style={{
                backgroundImage: `
                    linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%),
                    radial-gradient(circle at 10% 20%, ${activeTheme.primary}22 0%, transparent 55%),
                    radial-gradient(circle at 80% 80%, ${activeTheme.primary}1a 0%, transparent 55%)
                `
            }} />
            <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl py-16 flex flex-col items-center">
                {config.businessName && (
                    <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-8 border backdrop-blur-xl"
                        style={{
                            backgroundColor: `${activeTheme.primary}1c`,
                            borderColor: `${activeTheme.primary}55`,
                            color: activeTheme.primary
                        }}
                    >
                        <Icons.Home className="w-3.5 h-3.5 shrink-0" />
                        {config.businessName}
                    </div>
                )}
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-7 leading-[1.04] tracking-tight drop-shadow-lg text-white" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{config.slogan || ''}</h1>
                <div className="w-16 h-1 rounded-full mb-7" style={{ backgroundColor: activeTheme.primary }} />
                <p className="text-base sm:text-xl md:text-2xl text-white/92 mb-10 md:mb-12 font-light leading-relaxed max-w-3xl drop-shadow">{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'}
                        className="group inline-block px-9 sm:px-11 py-4.5 sm:py-5 font-black uppercase tracking-[0.16em] text-[12px] sm:text-sm hover:translate-y-0 transition-all duration-300 hover:-translate-y-0.5 shadow-2xl rounded-[18px] flex items-center gap-3 border backdrop-blur-xl"
                        style={{
                            backgroundColor: activeTheme.primary,
                            color: '#000',
                            borderColor: `${activeTheme.primary}cc`,
                            boxShadow: `0 22px 65px -20px ${activeTheme.primary}b0`
                        }}
                    >
                        <Icons.MapPin className="w-4.5 h-4.5 shrink-0" />
                        <span>{config.ctaText}</span>
                        <Icons.ArrowRight className="w-4.5 h-4.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-20 md:py-32 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto relative">
                <div className="absolute top-20 right-1/4 w-[22rem] h-[22rem] rounded-full opacity-[0.1] blur-[130px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
                <div className="text-center mb-14 md:mb-20 relative z-10">
                    <div className="text-[11px] font-black uppercase tracking-[0.24em] mb-4 opacity-70">Featured Listings</div>
                    <h3 className="text-2xl sm:text-4xl md:text-6xl font-black mb-5 tracking-tight leading-[1.04]" style={{ color: isLight ? '#0f172a' : undefined, fontFamily: '"Playfair Display", Georgia, serif' }}>{config.featuresTitle}</h3>
                    <div className="w-16 h-1 rounded-full mx-auto" style={{ backgroundColor: isLight ? '#0f172a' : activeTheme.primary }}></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
                    {config.features.map((feat, i) => (
                        <div key={i} className="rounded-[28px] overflow-hidden shadow-xl group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 border backdrop-blur-xl relative"
                            style={{
                                backgroundColor: activeTheme.card,
                                borderColor: isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.1)'
                            }}
                        >
                            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-[0.16] blur-3xl pointer-events-none group-hover:opacity-[0.3] transition-opacity duration-500" style={{ backgroundColor: activeTheme.primary }} />
                            {feat.image && (
                                <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden cursor-pointer" onClick={() => setZoomImage && setZoomImage(feat.image)}>
                                    <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] rounded-full shadow-xl"
                                        style={{ backgroundColor: activeTheme.primary, color: '#000' }}
                                    >
                                        <Icons.Star className="w-3 h-3" />
                                        Featured
                                    </div>
                                    <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] rounded-full backdrop-blur-xl border shadow-xl"
                                        style={{
                                            backgroundColor: 'rgba(0,0,0,0.5)',
                                            borderColor: 'rgba(255,255,255,0.12)',
                                            color: '#fff'
                                        }}
                                    >№ {String(i+1).padStart(2,'0')}</div>
                                    <img src={feat.image} className="w-full h-full object-cover transition-transform duration-[1000ms]" alt={feat.title} loading="lazy" decoding="async" />
                                </div>
                            )}
                            <div className="p-6 md:p-7 relative z-10">
                                <div className="w-10 h-[2px] rounded-full mb-4" style={{ backgroundColor: activeTheme.primary }} />
                                <h4 className="text-xl md:text-2xl font-black mb-3 tracking-tight leading-tight" style={{ color: isLight ? '#0f172a' : undefined }}>{feat.title}</h4>
                                <p className="text-sm md:text-[15px] leading-relaxed mb-5 line-clamp-3" style={{ color: isLight ? '#475569' : undefined, opacity: isLight ? 1 : 0.75 }}>{feat.desc}</p>
                                <a className="group/cta inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] transition-colors"
                                    style={{ color: activeTheme.primary }}
                                >
                                    View Details
                                    <Icons.ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
    );
};

// ==========================================
// 16. GAMING TEMPLATE
// ==========================================
export const GamingTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    const textColor = isLight ? '#0a0a0a' : '#ffffff';
    return (
    <div className="w-full font-sans overflow-hidden relative" style={{ backgroundColor: activeTheme.bg, color: textColor }}>
        <div className="relative min-h-[72vh] md:min-h-screen flex items-center justify-center py-20 overflow-hidden">
            {config.coverImage && (
                <>
                    <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Game Hero" loading="lazy" decoding="async" />
                    <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(180deg, ${activeTheme.bg}ee 0%, ${activeTheme.bg}aa 40%, transparent 65%, ${activeTheme.bg} 100%)` }}></div>
                </>
            )}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-80" style={{
                backgroundImage: `
                    repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 5px),
                    repeating-linear-gradient(90deg, ${activeTheme.primary}08 0px, ${activeTheme.primary}08 1px, transparent 1px, transparent 5px)
                `
            }} />
            <div className="absolute top-10 left-1/4 w-[26rem] h-[26rem] rounded-full opacity-[0.18] blur-[140px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
            <div className="absolute bottom-10 right-1/4 w-[22rem] h-[22rem] rounded-full opacity-[0.14] blur-[130px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
            <div className="absolute inset-x-0 top-0 h-1 z-10" style={{
                background: `linear-gradient(90deg, transparent 0%, ${activeTheme.primary} 50%, transparent 100%)`
            }} />

            <div className="relative z-10 text-center px-4 sm:px-6 flex flex-col items-center max-w-5xl">
                {config.businessName && (
                    <div className="mb-8 px-5 py-2 border-[1.5px] text-[11px] font-black uppercase tracking-[0.28em] backdrop-blur-xl rounded-full flex items-center gap-2.5"
                        style={{
                            borderColor: `${activeTheme.primary}80`,
                            backgroundColor: `${activeTheme.primary}15`,
                            color: activeTheme.primary
                        }}
                    >
                        <Icons.Gamepad2 className="w-4 h-4 shrink-0" />
                        {config.businessName}
                    </div>
                )}
                <h1 className="text-4xl sm:text-7xl md:text-9xl font-black uppercase italic tracking-tighter mb-7 leading-[0.95]"
                    style={{
                        color: textColor,
                        textShadow: `0 0 24px ${activeTheme.primary}66, 0 4px 40px rgba(0,0,0,0.35)`
                    }}
                >{config.slogan || ''}</h1>
                <div className="w-16 h-[3px] rounded-full mb-7" style={{ background: `linear-gradient(90deg, transparent, ${activeTheme.primary}, transparent)` }} />
                <p className="text-base sm:text-xl md:text-2xl max-w-2xl mb-10 md:mb-12 opacity-78 leading-relaxed">{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'}
                        className="group relative px-11 sm:px-14 py-5 sm:py-5.5 font-black uppercase tracking-[0.18em] overflow-hidden rounded-[16px] transition-all duration-300 hover:-translate-y-0.5 shadow-2xl flex items-center gap-3 border backdrop-blur-xl"
                        style={{
                            backgroundColor: activeTheme.primary,
                            color: '#000',
                            borderColor: `${activeTheme.primary}d0`,
                            boxShadow: `0 28px 70px -20px ${activeTheme.primary}b0`,
                            clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)'
                        }}
                    >
                        <Icons.Play className="w-5 h-5 fill-current shrink-0" />
                        <span className="relative z-10 tracking-[0.2em]">{config.ctaText}</span>
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-20 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl max-h-2xl opacity-20 blur-[120px] rounded-full pointer-events-none" style={{ backgroundColor: activeTheme.primary }}></div>
                <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20 relative z-10">
                    <div className="text-[11px] font-black uppercase tracking-[0.24em] mb-5 opacity-70">Latest Drops</div>
                    <h3 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase italic tracking-tighter mb-5 text-center leading-[1.03]">{config.featuresTitle}</h3>
                    <div className="w-14 h-1 rounded-full mx-auto" style={{ backgroundColor: activeTheme.primary }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 relative z-10">
                    {config.features.map((feat, i) => (
                        <div key={i} className="border-[1.5px] p-5 md:p-7 rounded-[26px] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 group relative overflow-hidden"
                            style={{
                                backgroundColor: activeTheme.card,
                                borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'
                            }}
                        >
                            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-[0.16] blur-3xl pointer-events-none group-hover:opacity-[0.35] transition-opacity duration-500" style={{ backgroundColor: activeTheme.primary }} />
                            <div className="absolute top-4 right-4 text-[11px] font-black uppercase tracking-[0.24em] opacity-60" style={{ color: activeTheme.primary }}>Lv.{String(i+1).padStart(2,'0')}</div>
                            {feat.image && (
                                <div className="relative w-full overflow-hidden rounded-[18px] border shadow-2xl group/img cursor-pointer mb-6"
                                    onClick={() => setZoomImage && setZoomImage(feat.image)}
                                    style={{ borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}
                                >
                                    <img src={feat.image} className="w-full h-48 sm:h-56 md:h-64 object-cover transition-transform duration-[900ms]" alt={feat.title} loading="lazy" decoding="async" />
                                </div>
                            )}
                            <div className="w-10 h-[2px] rounded-full mb-4 relative z-10" style={{ backgroundColor: activeTheme.primary }} />
                            <h4 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-[0.06em] mb-3 relative z-10 leading-tight" style={{ color: activeTheme.primary }}>{feat.title}</h4>
                            <p className="leading-relaxed text-sm md:text-base opacity-72 relative z-10">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
    );
};

// ==========================================
// MAFIA / GTA THEME (Gangster Los Santos Style)
// ==========================================
export const MafiaTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    const textColor = isLight ? '#0a0a0a' : '#ffffff';
    return (
    <div className="w-full font-sans overflow-hidden relative" style={{ backgroundColor: activeTheme.bg, color: textColor }}>
        <div className="relative min-h-[78vh] md:min-h-screen flex items-center justify-center py-24 px-4 sm:px-6 overflow-hidden">
            {config.coverImage && (
                <>
                    <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" loading="lazy" decoding="async" />
                    <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(180deg, ${activeTheme.bg} 0%, ${activeTheme.bg}c8 50%, ${activeTheme.bg} 100%)` }}></div>
                </>
            )}
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top, ${activeTheme.primary}2a 0%, transparent 60%)` }} />
            <div className="absolute inset-x-0 top-0 h-1 z-10" style={{ background: `linear-gradient(to right, ${activeTheme.primary}88, ${activeTheme.primary}, ${activeTheme.primary}88)` }} />
            <div className="absolute inset-0 z-0 pointer-events-none opacity-70" style={{
                backgroundImage: `
                    repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 80px),
                    repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 80px)
                `
            }} />
            <div className="absolute top-10 left-1/4 w-[28rem] h-[28rem] rounded-full opacity-[0.2] blur-[140px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
            <div className="absolute bottom-10 right-1/4 w-[24rem] h-[24rem] rounded-full opacity-[0.14] blur-[130px] pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />

            <div className="relative z-10 flex flex-col items-center text-center max-w-5xl">
                {config.businessName && (
                    <div className="mb-10 px-6 py-2 rounded-full backdrop-blur-xl text-[11px] sm:text-xs font-black uppercase tracking-[0.32em] border flex items-center gap-2.5"
                        style={{
                            borderColor: `${activeTheme.primary}70`,
                            backgroundColor: `${activeTheme.primary}18`,
                            color: activeTheme.primary
                        }}
                    >
                        <Icons.Shield className="w-4 h-4 shrink-0" />
                        {config.businessName}
                    </div>
                )}

                <h1 className="text-5xl sm:text-7xl md:text-[128px] font-black uppercase leading-[0.9] tracking-tighter mb-7 break-words hyphens-auto max-w-6xl"
                    style={{
                        fontFamily: "'Syne', 'Impact', 'Oswald', sans-serif",
                        textShadow: `6px 6px 0 rgba(0,0,0,0.7), 0 0 50px ${activeTheme.primary}66`,
                        color: textColor
                    }}>
                    {config.slogan || ''}
                </h1>
                <div className="w-20 h-[3px] rounded-full mb-8" style={{ background: `linear-gradient(90deg, transparent, ${activeTheme.primary}, transparent)` }} />

                <p className="text-base sm:text-lg md:text-2xl max-w-3xl mb-11 leading-relaxed tracking-wide opacity-78">
                    {config.description}
                </p>

                {config.ctaText && (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a href={config.ctaLink || '#'}
                           className="group relative px-10 sm:px-12 py-5 rounded-none border-[1.5px] font-black uppercase text-sm tracking-[0.22em] overflow-hidden transition-all duration-300 hover:-translate-y-0.5 shadow-2xl"
                           style={{
                               borderColor: activeTheme.primary,
                               backgroundColor: activeTheme.primary,
                               color: '#000',
                               clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                               boxShadow: `0 28px 70px -22px ${activeTheme.primary}a0`
                           }}
                        >
                            <span className="relative z-10 flex items-center gap-2.5 tracking-[0.24em]">
                                <Icons.Key className="w-4.5 h-4.5 shrink-0" />
                                {config.ctaText}
                            </span>
                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        </a>
                    </div>
                )}
            </div>
        </div>

        {config.features?.length > 0 && (
            <div className="py-20 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto relative">
                <div className="flex items-center gap-4 mb-10 md:mb-14 pb-5 border-b" style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                    <div className="h-[2px] w-16 sm:w-28 rounded-full" style={{ backgroundColor: activeTheme.primary }} />
                    <div className="flex flex-col gap-1.5 flex-1">
                        <span className="text-[11px] font-black uppercase tracking-[0.36em] opacity-60">Operations</span>
                        <h3 className="text-lg sm:text-3xl md:text-4xl font-black tracking-tight leading-none" style={{ fontFamily: "'Syne', 'Impact', sans-serif" }}>
                            {config.featuresTitle}
                        </h3>
                    </div>
                    <span className="hidden sm:block text-[11px] font-black uppercase tracking-[0.22em] opacity-60">{String(config.features.length).padStart(2,'0')} Cases</span>
                    <div className="h-[2px] w-16 sm:w-28 rounded-full opacity-40" style={{ backgroundColor: isLight ? '#000' : '#fff' }} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
                    {config.features.map((feat, i) => (
                        <div key={i}
                             className="relative group border-[1.5px] p-6 sm:p-7 overflow-hidden transition-all duration-500 hover:-translate-y-1 backdrop-blur-xl"
                             style={{
                                 backgroundColor: activeTheme.card,
                                 borderColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
                                 clipPath: i % 2 === 0
                                    ? 'polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)'
                                    : 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))',
                                 boxShadow: '0 18px 50px -30px rgba(0,0,0,0.6)'
                             }}
                        >
                            <div className="absolute top-4 right-5 text-6xl md:text-7xl font-black select-none opacity-[0.06]"
                                 style={{ fontFamily: "'Syne', sans-serif" }}>
                                {String(i + 1).padStart(2, '0')}
                            </div>
                            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-[0.15] blur-3xl pointer-events-none group-hover:opacity-[0.3] transition-opacity duration-500" style={{ backgroundColor: activeTheme.primary }} />
                            {feat.image && (
                                <div className="relative overflow-hidden rounded-[18px] mb-6 border cursor-pointer shadow-xl group/img"
                                    onClick={() => setZoomImage && setZoomImage(feat.image)}
                                    style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)' }}
                                >
                                    <img src={feat.image}
                                         className="w-full h-48 sm:h-56 md:h-60 object-cover transition-all duration-500"
                                         style={{ filter: 'saturate(0.75) contrast(1.04)' }}
                                         onClick={() => setZoomImage && setZoomImage(feat.image)}
                                         alt={feat.title}
                                         loading="lazy" decoding="async"
                                    />
                                </div>
                            )}
                            <div className="mb-4 w-11 h-[2.5px] rounded-full relative z-10" style={{ backgroundColor: activeTheme.primary }} />
                            <h4 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-[0.08em] mb-3 relative z-10 leading-tight"
                                style={{ fontFamily: "'Syne', 'Impact', sans-serif" }}>
                                {feat.title}
                            </h4>
                            <p className="leading-relaxed text-sm sm:text-[15px] opacity-74 relative z-10">
                                {feat.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="w-full h-1" style={{ background: `linear-gradient(to right, transparent, ${activeTheme.primary}88, transparent)` }} />
    </div>
    );
};

