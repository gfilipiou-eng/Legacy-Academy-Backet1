import React from 'react';
import * as Icons from 'lucide-react';

const renderFeatures = (features, activeTheme, setZoomImage) => {
    if (!features || features.length === 0) return null;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feat, idx) => (
                <div 
                    key={idx} 
                    className="p-6 md:p-8 rounded-3xl flex flex-col gap-4 transition-all duration-300 hover:-translate-y-2.5 overflow-hidden relative group border border-white/10 shadow-xl backdrop-blur-md" 
                    style={{ backgroundColor: activeTheme.card }}
                >
                    {feat.badge && (
                        <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/15 border border-white/20 text-white backdrop-blur-md">
                            {feat.badge}
                        </div>
                    )}
                    {feat.image && (
                        <div 
                            className="-mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-3 h-52 sm:h-60 flex justify-center items-center overflow-hidden cursor-pointer relative group/img bg-black/40" 
                            onClick={() => setZoomImage && setZoomImage(feat.image)}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                            <img src={feat.image} className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110 z-0" alt="blur-bg" />
                            <img src={feat.image} alt={feat.title} className="relative z-10 w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-108" />
                        </div>
                    )}
                    <h4 className="text-xl md:text-2xl font-black tracking-tight">{feat.title}</h4>
                    <p className="opacity-70 text-sm md:text-base leading-relaxed">{feat.desc}</p>
                    {feat.link && feat.link.trim() !== '' && (
                        <a 
                            href={feat.link.startsWith('http') ? feat.link : `https://${feat.link}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="mt-auto px-6 py-3.5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider text-center transition-all hover:scale-102 hover:shadow-lg flex items-center justify-center gap-2" 
                            style={{ backgroundColor: activeTheme.primary, color: '#000' }}
                        >
                            <span>{feat.linkText || 'Learn More'}</span>
                            <Icons.ArrowRight className="w-4 h-4" />
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
    <div className="w-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-16">
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center py-8 md:py-20 gap-8 md:gap-16">
            <div className="flex-1 flex flex-col items-start z-10 text-left">
                {config.businessName && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest mb-6" style={{ color: activeTheme.primary }}>
                    {config.businessName}
                </div>
                )}
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-[1.1] tracking-tight mb-6 break-words hyphens-auto w-full">
                    {config.slogan || ''}
                </h1>
                <p className="text-base sm:text-lg md:text-xl mb-8 md:mb-10 leading-relaxed max-w-xl opacity-75 break-words hyphens-auto w-full">
                    {config.description}
                </p>
                {config.ctaText && (
                    <a 
                        href={config.ctaLink || '#'} 
                        target={config.ctaLink?.startsWith('http') ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        className="px-8 py-4 sm:px-10 sm:py-5 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm transition-all hover:scale-105 shadow-2xl flex items-center gap-3" 
                        style={{ backgroundColor: activeTheme.primary, color: '#000' }}
                    >
                        <span>{config.ctaText}</span>
                        <Icons.ArrowRight className="w-4 h-4" />
                    </a>
                )}
            </div>
            {config.coverImage && (
                <div className="flex-1 w-full flex justify-center mt-4 md:mt-0">
                    <div className="relative w-full max-w-lg aspect-[4/3] md:aspect-square group cursor-pointer" onClick={() => setZoomImage && setZoomImage(config.coverImage)}>
                        <img src={config.coverImage} className="relative w-full h-full object-cover rounded-[2rem] border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-102" alt="Cover" />
                    </div>
                </div>
            )}
        </div>
        {config.features?.length > 0 && (
            <div id="services" className="py-12 md:py-20 border-t border-white/10">
                {config.featuresTitle && <h3 className="text-3xl md:text-5xl font-black mb-12 text-center tracking-tight">{config.featuresTitle}</h3>}
                {renderFeatures(config.features, activeTheme, setZoomImage)}
            </div>
        )}
    </div>
);

// ==========================================
// 2. E-COMMERCE / STORE TEMPLATE (Apparel, Sneakers, Products with Sizes)
// ==========================================
export const EcommerceTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-12">
        {/* Banner Hero */}
        <div className="relative w-full rounded-[2.5rem] overflow-hidden border border-white/10 bg-gradient-to-br from-neutral-900 to-black p-6 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 mb-12 shadow-2xl">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
            <div className="relative z-10 flex-1 flex flex-col items-start text-left max-w-xl">
                <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-white/10 border border-white/20 mb-4 flex items-center gap-2" style={{ color: activeTheme.primary }}>
                    <Icons.ShoppingBag className="w-3.5 h-3.5" /> {config.businessName || 'STORE'}
                </span>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-[1.05] mb-4">
                    {config.slogan || ''}
                </h1>
                <p className="text-sm sm:text-base md:text-lg opacity-75 mb-8 leading-relaxed">
                    {config.description || ''}
                </p>
                {config.ctaText && (
                    <a 
                        href={config.ctaLink || '#shop'} 
                        className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm transition-all hover:scale-105 flex items-center gap-2.5 shadow-xl"
                        style={{ backgroundColor: activeTheme.primary, color: '#000' }}
                    >
                        <Icons.Zap className="w-4 h-4" />
                        <span>{config.ctaText}</span>
                    </a>
                )}
            </div>
            {config.coverImage && (
                <div className="relative z-10 w-full md:w-1/2 max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/10 group cursor-pointer" onClick={() => setZoomImage && setZoomImage(config.coverImage)}>
                    <img src={config.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108" alt="Store Spotlight" />
                </div>
            )}
        </div>

        {/* Features / Highlights */}
        {config.features?.length > 0 && (
            <div id="services" className="py-12">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                    <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">{config.featuresTitle}</h3>
                    {config.businessName && <span className="text-xs font-bold opacity-50 uppercase tracking-widest">{config.businessName}</span>}
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto mb-16 md:mb-24 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest mb-6" style={{ color: activeTheme.primary }}>
                <Icons.Briefcase className="w-3.5 h-3.5" /> {config.businessName}
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight leading-[1.05] mb-6">
                {config.slogan || ''}
            </h1>
            <p className="text-base sm:text-xl opacity-75 max-w-2xl leading-relaxed mb-10">
                {config.description}
            </p>
            {config.ctaText && (
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <a 
                        href={config.ctaLink || '#contact'} 
                        className="px-10 py-4.5 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm transition-all hover:scale-105 shadow-2xl flex items-center gap-2"
                        style={{ backgroundColor: activeTheme.primary, color: '#000', boxShadow: `0 10px 30px ${activeTheme.primary}40` }}
                    >
                        <span>{config.ctaText}</span>
                        <Icons.ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            )}
        </div>

        {/* Stats Grid */}
        {config.showAgencyStats !== false && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-20">
                {(config.agencyStats && config.agencyStats.length === 4
                    ? config.agencyStats
                    : [
                        { label: 'Client Revenue', val: '$50M+' },
                        { label: 'Global Reach', val: '48+ Countries' },
                        { label: 'Client Satisfaction', val: '99.8%' },
                        { label: 'ROI Guarantee', val: '3.5x Avg' }
                    ]
                ).map((stat, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 text-center backdrop-blur-md">
                        <div className="text-2xl sm:text-4xl font-black tracking-tight mb-1" style={{ color: activeTheme.primary }}>{stat.val}</div>
                        <div className="text-xs uppercase tracking-widest opacity-60 font-bold">{stat.label}</div>
                    </div>
                ))}
            </div>
        )}

        {config.coverImage && (
            <div className="w-full h-72 sm:h-96 md:h-[480px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-20 relative group cursor-pointer" onClick={() => setZoomImage && setZoomImage(config.coverImage)}>
                <img src={config.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Agency Hero" />
            </div>
        )}

        {config.features?.length > 0 && (
            <div id="services" className="py-12">
                <h3 className="text-3xl sm:text-5xl font-black text-center mb-16 tracking-tight">{config.featuresTitle}</h3>
                {renderFeatures(config.features, activeTheme, setZoomImage)}
            </div>
        )}
    </div>
);

// ==========================================
// 4. LUXURY VIP GOODS TEMPLATE (Gold Accents, Watches, High-End)
// ==========================================
export const LuxuryTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 md:py-24" style={{ fontFamily: 'Cinzel, serif, Playfair Display' }}>
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20">
            {config.businessName && (
            <div className="text-[10px] sm:text-xs tracking-[0.4em] uppercase font-bold text-[#D4AF37] mb-4">
                {config.businessName}
            </div>
            )}
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-[0.1em] mb-6 leading-tight">
                {config.slogan || ''}
            </h1>
            <p className="text-base sm:text-xl text-white/80 font-light max-w-2xl leading-relaxed mb-10 tracking-wide font-sans">
                {config.description}
            </p>
            {config.ctaText && (
                <a 
                    href={config.ctaLink || '#'} 
                    className="px-10 py-4 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all duration-500 uppercase tracking-[0.3em] text-xs font-bold rounded-full font-sans"
                >
                    {config.ctaText}
                </a>
            )}
        </div>

        {config.coverImage && (
            <div className="w-full h-80 sm:h-[500px] rounded-[2rem] overflow-hidden border border-[#D4AF37]/30 mb-24 relative group cursor-pointer" onClick={() => setZoomImage && setZoomImage(config.coverImage)}>
                <img src={config.coverImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Luxury Showcase" />
            </div>
        )}

        {config.features?.length > 0 && (
            <div id="services" className="py-12 border-t border-[#D4AF37]/20 font-sans">
                {config.featuresTitle && <h3 className="text-2xl sm:text-4xl font-bold uppercase tracking-[0.2em] text-center mb-16 font-['Cinzel',serif]">{config.featuresTitle}</h3>}
                {renderFeatures(config.features, activeTheme, setZoomImage)}
            </div>
        )}
    </div>
);

// ==========================================
// 5. SAAS & AI TECH TEMPLATE
// ==========================================
export const SaasTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 md:py-20 font-sans">
        <div className="text-center max-w-4xl mx-auto mb-16 flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
                {config.slogan || ''}
            </h1>
            <p className="text-base sm:text-lg md:text-xl opacity-75 max-w-2xl leading-relaxed mb-10 px-4">
                {config.description}
            </p>
            {config.ctaText && (
                <a 
                    href={config.ctaLink || '#'} 
                    className="px-8 sm:px-10 py-4 sm:py-4.5 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm transition-all hover:scale-105 shadow-2xl flex items-center gap-2"
                    style={{ backgroundColor: activeTheme.primary, color: '#000' }}
                >
                    <Icons.Zap className="w-4 h-4" />
                    <span>{config.ctaText}</span>
                </a>
            )}
        </div>

        {config.coverImage && (
            <div className="w-full max-w-5xl mx-auto h-64 sm:h-96 md:h-[500px] rounded-[24px] sm:rounded-[36px] overflow-hidden border border-white/15 shadow-2xl mb-16 sm:mb-20 relative group cursor-pointer" onClick={() => setZoomImage && setZoomImage(config.coverImage)}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                <img src={config.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="SaaS Dashboard" />
            </div>
        )}

        {config.features?.length > 0 && (
            <div id="services" className="py-12">
                <h3 className="text-3xl sm:text-5xl font-black text-center mb-16 tracking-tight">{config.featuresTitle}</h3>
                {renderFeatures(config.features, activeTheme, setZoomImage)}
            </div>
        )}
    </div>
);

// ==========================================
// 6. NEWSPAPER TEMPLATE
// ==========================================
export const NewspaperTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full max-w-5xl mx-auto border-x border-current px-4 sm:px-8 md:px-12 py-8" style={{ borderColor: `${activeTheme.primary}40` }}>
        <div className="border-b-4 border-current pb-8 mb-8 flex flex-col items-center text-center">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter w-full break-words hyphens-auto" style={{ fontFamily: 'Times New Roman, serif' }}>{config.slogan || ''}</h1>
            <p className="mt-4 text-sm sm:text-xl font-bold uppercase tracking-widest opacity-80 border-y border-current py-2 w-full break-words hyphens-auto">{config.description}</p>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-[2] border-r-0 md:border-r border-current pr-0 md:pr-8">
                {config.coverImage && <img src={config.coverImage} className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-700 mb-6 cursor-pointer" onClick={() => setZoomImage && setZoomImage(config.coverImage)} alt="Headline" />}
                {config.features?.slice(0,1).map((feat, i) => (
                    <div key={i}>
                        <h2 className="text-2xl sm:text-4xl font-black mb-4 leading-tight w-full break-words hyphens-auto">{feat.title}</h2>
                        <p className="text-base sm:text-lg leading-relaxed opacity-80 mb-6 text-justify w-full break-words hyphens-auto">{feat.desc}</p>
                    </div>
                ))}
            </div>
            <div className="flex-1 flex flex-col gap-6">
                {config.features?.slice(1).map((feat, i) => (
                    <div key={i} className="border-b border-current pb-6 last:border-0">
                        {feat.image && <img src={feat.image} className="w-full h-32 object-cover grayscale hover:grayscale-0 transition-all mb-3 cursor-pointer" onClick={() => setZoomImage && setZoomImage(feat.image)} alt="Thumb" />}
                        <h4 className="text-lg sm:text-xl font-bold mb-2 leading-tight w-full break-words hyphens-auto">{feat.title}</h4>
                        <p className="text-sm opacity-70 text-justify w-full break-words hyphens-auto">{feat.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ==========================================
// 7. RESTAURANT & HOSPITALITY TEMPLATE
// ==========================================
export const RestaurantTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full">
        <div className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center justify-center text-center px-4 sm:px-6 py-16">
            <div className="absolute inset-0 bg-black/60 z-10" />
            {config.coverImage && <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="Restaurant Cover" />}
            <div className="relative z-20 flex flex-col items-center max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-widest uppercase mb-4 text-white w-full break-words hyphens-auto" style={{ fontFamily: 'Playfair Display, serif' }}>{config.slogan || ''}</h1>
                <div className="w-24 h-1 mb-6" style={{ backgroundColor: activeTheme.primary }} />
                <p className="text-base sm:text-xl text-white/80 max-w-2xl font-light italic w-full break-words hyphens-auto">{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="mt-8 border border-white text-white px-8 py-3 uppercase tracking-[0.2em] text-xs hover:bg-white hover:text-black transition-colors rounded-full">{config.ctaText}</a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-16 md:py-24 max-w-5xl mx-auto px-4 sm:px-6 text-center">
                <h3 className="text-2xl sm:text-4xl tracking-widest uppercase mb-12 sm:mb-16 w-full break-words hyphens-auto" style={{ fontFamily: 'Playfair Display, serif' }}>{config.featuresTitle}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {config.features.map((feat, i) => (
                        <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                            {feat.image && <img src={feat.image} className="w-24 h-24 rounded-full object-cover mb-4 shadow-lg border-2 cursor-pointer" onClick={() => setZoomImage && setZoomImage(feat.image)} style={{ borderColor: activeTheme.primary }} alt={feat.title} />}
                            <h4 className="text-xl font-bold mb-2 uppercase tracking-wide w-full break-words hyphens-auto">{feat.title}</h4>
                            <p className="text-sm opacity-70 italic leading-relaxed w-full break-words hyphens-auto">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

// ==========================================
// 8. TECHNOLOGY TEMPLATE
// ==========================================
export const TechnologyTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 font-mono">
        <div className="flex flex-col items-center text-center mb-16 md:mb-24 relative">
            <div className="absolute inset-0 opacity-10 blur-3xl rounded-full" style={{ background: `linear-gradient(to bottom, ${activeTheme.primary}, transparent)` }} />
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter mb-6 uppercase shadow-[var(--builder-primary)] text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 w-full break-words hyphens-auto">{config.slogan || ''}</h1>
            {config.description && (
                <p className="text-sm sm:text-lg opacity-70 max-w-2xl border-l-2 pl-4 text-left w-full break-words hyphens-auto" style={{ borderColor: activeTheme.primary }}>{config.description}</p>
            )}
            {config.ctaText && (
                <a href={config.ctaLink || '#'} className="mt-8 px-8 py-3 text-black font-black uppercase text-sm hover:scale-105 transition-transform" style={{ backgroundColor: activeTheme.primary, boxShadow: `0 0 20px ${activeTheme.primary}80` }}>
                    [ {config.ctaText} ]
                </a>
            )}
        </div>
        {config.coverImage && (
            <div className="w-full h-64 md:h-96 border border-white/20 relative overflow-hidden mb-16 md:mb-24 group cursor-pointer" onClick={() => setZoomImage && setZoomImage(config.coverImage)}>
                <div className="absolute inset-0 opacity-20 mix-blend-overlay group-hover:opacity-0 transition-opacity z-10" style={{ backgroundColor: activeTheme.primary }} />
                <img src={config.coverImage} className="w-full h-full object-cover" alt="Tech Base" />
            </div>
        )}
        {config.features?.length > 0 && (
            <div>
                <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-2xl font-black uppercase w-full break-words hyphens-auto">{config.featuresTitle}</h3>
                    <div className="flex-1 h-px border-t border-dashed" style={{ borderColor: activeTheme.primary }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {config.features.map((feat, i) => (
                        <div key={i} className="border border-white/10 bg-black/50 p-6 relative group transition-colors hover:border-current" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div className="text-[10px] mb-2" style={{ color: activeTheme.primary }}>0x{i.toString(16).padStart(4, '0')}</div>
                            <h4 className="text-xl font-bold mb-2 w-full break-words hyphens-auto">{feat.title}</h4>
                            <p className="text-sm opacity-60 w-full break-words hyphens-auto">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

// ==========================================
// 9. FOOTBALL & SPORTS TEMPLATE
// ==========================================
export const FootballTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    return (
    <div className="w-full max-w-7xl mx-auto">
        <div className="relative w-full h-[50vh] sm:h-[60vh] overflow-hidden flex flex-col justify-end p-6 sm:p-8 md:p-16" style={{ backgroundColor: activeTheme.bg }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
            {config.coverImage && <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-80 z-0 scale-105" alt="Stadium" />}
            <div className="relative z-20 w-full flex flex-col items-start border-l-8 pl-4 sm:pl-6" style={{ borderColor: activeTheme.primary }}>
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg mb-2 w-full break-words hyphens-auto">{config.slogan || ''}</h1>
                <p className="text-base sm:text-xl md:text-2xl font-bold text-white/90 uppercase tracking-wide w-full break-words hyphens-auto">{config.description}</p>
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-12 px-4 sm:px-6">
                <div className="w-full flex justify-between items-end border-b-4 pb-2 mb-8" style={{ borderColor: activeTheme.primary }}>
                    <h3 className="text-2xl sm:text-4xl font-black uppercase italic w-full break-words hyphens-auto">{config.featuresTitle}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {config.features.map((feat, i) => (
                        <div key={i} className="p-1 relative overflow-hidden group cursor-pointer rounded-xl border" style={{ backgroundColor: activeTheme.card, borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }} onClick={() => setZoomImage && setZoomImage(feat.image)}>
                            {feat.image && <img src={feat.image} className="w-full h-48 object-cover mb-2 group-hover:scale-105 transition-transform duration-300 rounded" alt="Player/News" />}
                            <div className="p-4 h-full rounded">
                                <h4 className="font-black uppercase italic text-lg sm:text-xl mb-1 w-full break-words hyphens-auto">{feat.title}</h4>
                                <p className="text-xs opacity-70 w-full break-words hyphens-auto">{feat.desc}</p>
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
    const borderColor = isLight ? '#d1d5db' : '#333';
    const divideColor = isLight ? '#e5e7eb' : '#333';
    const rowHover = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)';
    const btnBg = isLight ? 'rgba(0,0,0,0.08)' : '#333';
    const btnHover = isLight ? 'rgba(0,0,0,0.14)' : '#444';
    return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8" style={{ fontFamily: 'Roboto, sans-serif' }}>
        <div className="rounded-2xl overflow-hidden mb-8 border" style={{ backgroundColor: cardBg, borderColor }}>
            <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ borderColor, backgroundColor: headerBg }}>
                <h1 className="text-xl sm:text-2xl font-black uppercase flex items-center gap-3 w-full break-words hyphens-auto leading-tight">
                    <div className="w-3 h-3 rounded-full animate-pulse shrink-0" style={{ backgroundColor: activeTheme.primary }} />
                    <span>{config.slogan || ''}</span>
                </h1>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="w-full sm:w-auto px-8 py-3 sm:py-2.5 text-center rounded-xl font-black uppercase text-sm sm:text-xs shrink-0 transition-transform hover:scale-105" style={{ backgroundColor: activeTheme.primary, color: '#000' }}>
                        {config.ctaText}
                    </a>
                )}
            </div>
            <div className="p-6 flex flex-col md:flex-row items-center gap-8">
                <p className="text-base sm:text-lg flex-1 w-full break-words hyphens-auto opacity-80">{config.description}</p>
                {config.coverImage && <img src={config.coverImage} className="w-full md:w-1/3 rounded-xl border cursor-pointer" style={{ borderColor }} onClick={() => setZoomImage && setZoomImage(config.coverImage)} alt="Promo" />}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor }}>
                <div className="p-4 border-b" style={{ borderColor, backgroundColor: headerBg }}>
                    <h3 className="font-bold uppercase w-full break-words hyphens-auto">{config.featuresTitle}</h3>
                </div>
                <div style={{ '--divide-color': divideColor }}>
                    {config.features.map((feat, i) => (
                        <div key={i} className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t" style={{ borderColor: divideColor }}>
                            <div className="flex-1 w-full">

                                <h4 className="font-bold text-base sm:text-lg w-full break-words hyphens-auto">{feat.title}</h4>
                                <p className="text-sm w-full break-words hyphens-auto opacity-60">{feat.desc}</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto shrink-0">
                                <button className="flex-1 md:w-20 py-3 rounded-xl font-bold transition-colors" style={{ backgroundColor: btnBg }}>1</button>
                                <button className="flex-1 md:w-20 py-3 rounded-xl font-bold transition-colors" style={{ backgroundColor: btnBg }}>X</button>
                                <button className="flex-1 md:w-20 py-3 rounded-xl font-bold transition-colors" style={{ backgroundColor: btnBg }}>2</button>
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
    <div className="w-full rounded-3xl overflow-hidden my-4" style={{ backgroundColor: activeTheme.bg, color: isLight ? '#111827' : '#fff' }}>
        <div className="w-full py-16 md:py-24 px-6 md:px-12 text-center flex flex-col items-center" style={{ backgroundColor: isLight ? '#0f172a' : '#111827' }}>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight text-white">{config.slogan || ''}</h1>
            <p className="text-base sm:text-xl opacity-80 max-w-2xl mb-10 text-white/90">{config.description}</p>
            {config.ctaText && (
                <a href={config.ctaLink || '#'} className="px-8 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors" style={{ backgroundColor: activeTheme.primary, color: isLight ? '#fff' : '#000' }}>
                    {config.ctaText}
                </a>
            )}
        </div>
        {config.coverImage && (
            <div className="-mt-12 md:-mt-16 max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
                <img src={config.coverImage} className="w-full h-64 sm:h-80 object-cover rounded-2xl shadow-2xl cursor-pointer" onClick={() => setZoomImage && setZoomImage(config.coverImage)} alt="Corporate Hero" />
            </div>
        )}
        {config.features?.length > 0 && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
                <h3 className="text-2xl sm:text-3xl font-bold mb-12 sm:mb-16 text-center" style={{ color: isLight ? '#111827' : undefined }}>{config.featuresTitle}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                    {config.features.map((feat, i) => (
                        <div key={i} className="p-6 md:p-8 rounded-2xl hover:shadow-xl transition-shadow border" style={{ backgroundColor: activeTheme.card, borderColor: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.1)' }}>
                            {feat.image && <img src={feat.image} className="w-16 h-16 object-cover rounded-xl mb-6 cursor-pointer" onClick={() => setZoomImage && setZoomImage(feat.image)} alt={feat.title} />}
                            <h4 className="text-xl font-bold mb-3" style={{ color: isLight ? '#111827' : undefined }}>{feat.title}</h4>
                            <p className="leading-relaxed text-sm" style={{ color: isLight ? '#4b5563' : undefined, opacity: isLight ? 1 : 0.7 }}>{feat.desc}</p>
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
    <div className="w-full min-h-screen" style={{ backgroundColor: activeTheme.bg, color: textColor }}>
        <div className="flex flex-col md:flex-row min-h-[70vh] md:min-h-[80vh]">
            <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 md:p-24 z-10 relative">
                <div className="absolute top-0 left-0 w-32 h-32 opacity-20 rounded-full blur-3xl" style={{ backgroundColor: activeTheme.primary }}></div>
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black mb-6 md:mb-8 leading-[0.95] tracking-tighter" style={{ mixBlendMode: isLight ? 'normal' : 'difference', color: textColor }}>{config.slogan || ''}</h1>
                <p className="text-lg sm:text-xl md:text-2xl font-light opacity-80 max-w-md mb-8 md:mb-12">{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="w-max px-8 py-3.5 sm:px-10 sm:py-4 rounded-full text-xs sm:text-sm font-black uppercase tracking-widest hover:scale-105 transition-transform" style={{ backgroundColor: isLight ? '#000' : textColor, color: isLight ? textColor : activeTheme.bg }}>
                        {config.ctaText}
                    </a>
                )}
            </div>
            {config.coverImage && (
                <div className="flex-1 relative overflow-hidden min-h-[300px] cursor-pointer" onClick={() => setZoomImage && setZoomImage(config.coverImage)}>
                    <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-105 hover:scale-100" alt="Creative" />
                </div>
            )}
        </div>
        {config.features?.length > 0 && (
            <div className="py-16 md:py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
                <h3 className="text-3xl sm:text-5xl font-black mb-12 sm:mb-16 lowercase tracking-tight" style={{ color: textColor }}>{config.featuresTitle}</h3>
                <div className="flex flex-col gap-8 md:gap-12">
                    {config.features.map((feat, i) => (
                        <div key={i} className="flex flex-col md:flex-row gap-6 md:gap-8 items-center group">
                            <div className="flex-1 w-full">
                                <h4 className="text-2xl sm:text-3xl font-bold mb-3 group-hover:translate-x-2 transition-transform" style={{ color: activeTheme.primary }}>{feat.title}</h4>
                                <p className="text-base sm:text-lg opacity-70 max-w-lg">{feat.desc}</p>
                            </div>
                            {feat.image && (
                                <div className="flex-1 w-full overflow-hidden rounded-3xl cursor-pointer" onClick={() => setZoomImage && setZoomImage(feat.image)}>
                                    <img src={feat.image} className="w-full h-48 sm:h-64 object-cover group-hover:scale-108 transition-transform duration-700" alt={feat.title} />
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
    <div className="w-full uppercase" style={{ backgroundColor: activeTheme.bg, color: isLight ? '#000' : '#fff' }}>
        <div className="relative min-h-[70vh] md:min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-6 py-20 overflow-hidden">
            {config.coverImage && <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Fitness Hero" />}
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${activeTheme.bg}, transparent)` }}></div>
            <div className="relative z-10 max-w-5xl">
                <h1 className={`text-4xl sm:text-7xl md:text-9xl font-black italic tracking-tighter mb-4 text-transparent bg-clip-text ${isLight ? 'bg-gradient-to-r from-black to-gray-500' : 'bg-gradient-to-r from-white to-gray-500'}`}>{config.slogan || ''}</h1>
                <p className="text-base sm:text-xl md:text-2xl font-bold tracking-widest mb-8 md:mb-10" style={{ color: activeTheme.primary }}>{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="inline-block px-8 sm:px-12 py-4 sm:py-5 font-black text-lg sm:text-xl tracking-widest skew-x-[-10deg] hover:scale-110 transition-transform rounded" style={{ backgroundColor: activeTheme.primary, color: '#000' }}>
                        <div className="skew-x-[10deg]">{config.ctaText}</div>
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
                <h3 className="text-3xl sm:text-5xl font-black italic tracking-tighter mb-12 sm:mb-16 text-center">{config.featuresTitle}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {config.features.map((feat, i) => (
                        <div key={i} className="relative h-80 sm:h-96 group overflow-hidden rounded-2xl cursor-pointer" style={{ backgroundColor: activeTheme.card }} onClick={() => setZoomImage && setZoomImage(feat.image)}>
                            {feat.image && <img src={feat.image} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-20 transition-opacity duration-500" alt={feat.title} />}
                            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end transform translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
                                <h4 className="text-2xl sm:text-3xl font-black italic mb-2" style={{ color: activeTheme.primary }}>{feat.title}</h4>
                                <p className="text-xs sm:text-sm font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{feat.desc}</p>
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
export const PortfolioTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-24 font-sans text-white">
        <div className="flex flex-col mb-16 md:mb-32">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 md:mb-8 max-w-3xl">{config.slogan || ''}</h1>
            <p className="text-lg sm:text-2xl font-light opacity-60 max-w-2xl mb-8 md:mb-12">{config.description}</p>
            <div className="flex items-center gap-4 sm:gap-6">
                {config.coverImage && <img src={config.coverImage} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-lg border border-white/20 cursor-pointer" onClick={() => setZoomImage && setZoomImage(config.coverImage)} alt="Profile" />}
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="px-6 py-3 sm:px-8 sm:py-3.5 rounded-full font-semibold text-xs sm:text-sm transition-all hover:-translate-y-1" style={{ backgroundColor: activeTheme.primary, color: '#000', boxShadow: `0 10px 20px ${activeTheme.primary}40` }}>
                        {config.ctaText}
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12">{config.featuresTitle}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12">
                    {config.features.map((feat, i) => (
                        <div key={i} className="group cursor-pointer" onClick={() => setZoomImage && setZoomImage(feat.image)}>
                            {feat.image && (
                                <div className="overflow-hidden rounded-2xl mb-4 sm:mb-6 bg-gray-100 dark:bg-gray-800 aspect-[4/3]">
                                    <img src={feat.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={feat.title} />
                                </div>
                            )}
                            <h4 className="text-xl sm:text-2xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4" style={{ decorationColor: activeTheme.primary }}>{feat.title}</h4>
                            <p className="opacity-70 text-sm sm:text-base">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

// ==========================================
// 15. REAL ESTATE TEMPLATE
// ==========================================
export const RealEstateTemplate = ({ config, activeTheme, setZoomImage, resolvedPalette }) => {
    const isLight = resolvedPalette === 'light';
    return (
    <div className="w-full rounded-3xl overflow-hidden my-4" style={{ backgroundColor: activeTheme.bg, color: isLight ? '#0f172a' : '#fff' }}>
        <div className="relative min-h-[60vh] sm:min-h-[75vh] flex items-center justify-center">
            {config.coverImage && <img src={config.coverImage} className={`absolute inset-0 w-full h-full object-cover ${isLight ? 'brightness-50' : 'brightness-50'}`} alt="Property Hero" />}
            <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl py-12">
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif mb-6 leading-tight drop-shadow-lg text-white">{config.slogan || ''}</h1>
                <p className="text-base sm:text-xl text-white/90 mb-8 md:mb-10 font-light drop-shadow">{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="inline-block px-8 sm:px-10 py-3.5 sm:py-4 font-bold uppercase tracking-widest text-xs sm:text-sm hover:bg-gray-100 transition-colors shadow-xl rounded-xl" style={{ backgroundColor: activeTheme.primary, color: '#000' }}>
                        {config.ctaText}
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-16 md:py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
                <div className="text-center mb-12 sm:mb-16">
                    <h3 className="text-2xl sm:text-4xl font-serif mb-4" style={{ color: isLight ? '#0f172a' : undefined }}>{config.featuresTitle}</h3>
                    <div className={`w-16 h-1 mx-auto ${isLight ? 'bg-slate-800' : 'bg-white'}`} style={{ backgroundColor: isLight ? '#0f172a' : activeTheme.primary }}></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {config.features.map((feat, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow group border" style={{ backgroundColor: activeTheme.card, borderColor: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.1)' }}>
                            {feat.image && (
                                <div className="relative h-56 sm:h-64 overflow-hidden cursor-pointer" onClick={() => setZoomImage && setZoomImage(feat.image)}>
                                    <img src={feat.image} className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700" alt={feat.title} />
                                    <div className="absolute top-4 right-4 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded" style={{ backgroundColor: activeTheme.primary, color: '#000' }}>Featured</div>
                                </div>
                            )}
                            <div className="p-6">
                                <h4 className="text-xl font-bold mb-2" style={{ color: isLight ? '#0f172a' : undefined }}>{feat.title}</h4>
                                <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: isLight ? '#475569' : undefined, opacity: isLight ? 1 : 0.7 }}>{feat.desc}</p>
                                <div className="text-sm font-bold uppercase tracking-wider" style={{ color: activeTheme.primary }}>View Details &rarr;</div>
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
    return (
    <div className="w-full font-sans overflow-hidden" style={{ backgroundColor: activeTheme.bg, color: isLight ? '#000' : '#fff' }}>
        <div className="relative min-h-[70vh] md:min-h-screen flex items-center justify-center py-20">
            {config.coverImage && (
                <>
                    <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Game Hero" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${activeTheme.bg} 0%, ${activeTheme.bg}80 40%, transparent 100%)` }}></div>
                </>
            )}
            <div className="relative z-10 text-center px-4 sm:px-6 flex flex-col items-center max-w-5xl">
                {config.businessName && <div className="mb-6 px-4 py-1.5 border-2 text-xs font-black uppercase tracking-[0.3em] backdrop-blur-sm rounded" style={{ borderColor: activeTheme.primary, color: activeTheme.primary }}>{config.businessName}</div>}
                <h1 className="text-4xl sm:text-7xl md:text-8xl font-black uppercase italic tracking-tighter mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{config.slogan || ''}</h1>
                <p className="text-base sm:text-xl max-w-2xl mb-10 opacity-70">{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="relative group px-10 py-4 font-black uppercase tracking-widest overflow-hidden rounded-xl">
                        <div className="absolute inset-0 transition-transform group-hover:scale-105" style={{ backgroundColor: activeTheme.primary }}></div>
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <span className="relative z-10 text-black">{config.ctaText}</span>
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-16 md:py-24 px-4 sm:px-6 max-w-6xl mx-auto relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg max-h-lg opacity-20 blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: activeTheme.primary }}></div>
                <h3 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-12 sm:mb-16 text-center">{config.featuresTitle}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 relative z-10">
                    {config.features.map((feat, i) => (
                        <div key={i} className="border p-6 sm:p-8 rounded-2xl backdrop-blur-md transition-colors group" style={{ backgroundColor: activeTheme.card, borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
                            {feat.image && <img src={feat.image} className="w-full h-48 object-cover rounded-xl mb-6 group-hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={() => setZoomImage && setZoomImage(feat.image)} alt={feat.title} />}
                            <h4 className="text-xl sm:text-2xl font-bold uppercase tracking-wider mb-3" style={{ color: activeTheme.primary }}>{feat.title}</h4>
                            <p className="leading-relaxed text-sm sm:text-base opacity-60">{feat.desc}</p>
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
    return (
    <div className="w-full font-sans overflow-hidden relative" style={{ backgroundColor: activeTheme.bg, color: isLight ? '#000' : '#fff' }}>
        <div className="relative min-h-[75vh] md:min-h-screen flex items-center justify-center py-24 px-4 sm:px-6">
            {config.coverImage && (
                <>
                    <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${activeTheme.bg} 0%, ${activeTheme.bg}b0 50%, ${activeTheme.bg} 100%)` }}></div>
                </>
            )}
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top, ${activeTheme.primary}1f, transparent 60%)` }} />
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(to right, ${activeTheme.primary}99, ${activeTheme.primary}, ${activeTheme.primary}99)` }} />

            <div className="relative z-10 flex flex-col items-center text-center max-w-5xl">
                {config.businessName && <div className="mb-10 px-5 py-1.5 rounded-full backdrop-blur-sm text-[11px] sm:text-xs font-black uppercase tracking-[0.35em] border" style={{ borderColor: `${activeTheme.primary}80`, backgroundColor: `${activeTheme.primary}10`, color: activeTheme.primary }}>
                    {config.businessName}
                </div>}

                <h1 className="text-5xl sm:text-7xl md:text-[120px] font-black uppercase leading-[0.92] tracking-tighter mb-6 break-words hyphens-auto"
                    style={{
                        fontFamily: "'Syne', 'Impact', sans-serif",
                        textShadow: `4px 4px 0 rgba(0,0,0,0.8), 0 0 40px ${activeTheme.primary}40`
                    }}>
                    {config.slogan || ''}
                </h1>

                <p className="text-base sm:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed tracking-wide opacity-70">
                    {config.description}
                </p>

                {config.ctaText && (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a href={config.ctaLink || '#'}
                           className="relative group px-8 sm:px-10 py-4 rounded-none border-2 font-black uppercase text-sm tracking-[0.25em] overflow-hidden transition-all"
                           style={{
                               borderColor: activeTheme.primary,
                               backgroundColor: activeTheme.primary,
                               color: '#000',
                               clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)'
                           }}>
                            <span className="relative z-10">{config.ctaText}</span>
                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
                        </a>
                    </div>
                )}
            </div>
        </div>

        {config.features?.length > 0 && (
            <div className="py-20 md:py-28 px-4 sm:px-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-[2px] w-16 sm:w-24" style={{ backgroundColor: activeTheme.primary }} />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.4em] opacity-50">
                        {config.featuresTitle}
                    </h3>
                    <div className="h-[2px] flex-1 opacity-10" style={{ backgroundColor: isLight ? '#000' : '#fff' }} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                    {config.features.map((feat, i) => (
                        <div key={i}
                             className="relative group border p-6 sm:p-7 overflow-hidden transition-all"
                             style={{
                                 backgroundColor: activeTheme.card,
                                 borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                                 clipPath: i % 2 === 0
                                    ? 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)'
                                    : 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))'
                             }}>
                            <div className="absolute top-4 right-4 text-5xl font-black select-none opacity-5"
                                 style={{ fontFamily: "'Syne', sans-serif" }}>
                                {String(i + 1).padStart(2, '0')}
                            </div>
                            {feat.image && (
                                <img src={feat.image}
                                     className="w-full h-48 sm:h-56 object-cover mb-6 grayscale-[30%] group-hover:grayscale-0 transition-all duration-500 cursor-pointer"
                                     onClick={() => setZoomImage && setZoomImage(feat.image)}
                                     alt={feat.title} />
                            )}
                            <div className="mb-3 w-10 h-[2px]" style={{ backgroundColor: activeTheme.primary }} />
                            <h4 className="text-xl sm:text-2xl font-black uppercase tracking-wider mb-3"
                                style={{ fontFamily: "'Syne', sans-serif" }}>
                                {feat.title}
                            </h4>
                            <p className="leading-relaxed text-sm sm:text-[15px] opacity-60">
                                {feat.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="w-full h-1" style={{ background: `linear-gradient(to right, transparent, ${activeTheme.primary}66, transparent)` }} />
    </div>
    );
};

