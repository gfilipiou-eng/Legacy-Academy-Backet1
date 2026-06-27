import React from 'react';
import * as Icons from 'lucide-react';

const renderFeatures = (features, activeTheme, setZoomImage) => {
    if (!features || features.length === 0) return null;
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat, idx) => (
                <div key={idx} className="p-6 rounded-2xl flex flex-col gap-4 transition-all hover:-translate-y-2 overflow-hidden relative group" style={{ backgroundColor: activeTheme.card }}>
                    {feat.image && (
                        <div className="-mx-6 -mt-6 mb-4 h-48 flex justify-center items-center overflow-hidden cursor-pointer relative group/img" onClick={() => setZoomImage && setZoomImage(feat.image)}>
                            <div className="absolute inset-0 bg-black/20 z-0"></div>
                            <img src={feat.image} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-60 scale-110 z-0" alt="blur-bg" />
                            <img src={feat.image} alt={feat.title} className="relative z-10 w-full h-full object-contain transition-transform duration-700 group-hover/img:scale-105" />
                        </div>
                    )}
                    <h4 className="text-xl font-bold">{feat.title}</h4>
                    <p className="opacity-60 text-sm leading-relaxed">{feat.desc}</p>
                    {feat.link && feat.link.trim() !== '' && (
                        <a href={feat.link.startsWith('http') ? feat.link : `https://${feat.link}`} target="_blank" rel="noopener noreferrer" className="mt-auto px-4 py-2 rounded-lg font-bold text-xs uppercase text-center transition-colors hover:opacity-80" style={{ backgroundColor: activeTheme.primary, color: '#fff' }}>
                            {feat.linkText || 'Learn More'}
                        </a>
                    )}
                </div>
            ))}
        </div>
    );
};

export const ClassicTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full flex flex-col max-w-7xl mx-auto">
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-12 py-12 md:py-24 gap-12">
            <div className="flex-1 flex flex-col items-start z-10">
                <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight mb-6 break-words hyphens-auto w-full">{config.slogan || 'Your Business Slogan'}</h1>
                <p className="text-lg md:text-xl mb-10 leading-relaxed max-w-lg opacity-70 break-words hyphens-auto w-full">{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm transition-transform hover:scale-105" style={{ backgroundColor: activeTheme.primary, color: '#fff', boxShadow: `0 0 30px ${activeTheme.primary}40` }}>
                        {config.ctaText}
                    </a>
                )}
            </div>
            {config.coverImage && (
                <div className="flex-1 w-full flex justify-center">
                    <img src={config.coverImage} className="w-full max-w-md aspect-square object-cover rounded-[2rem] shadow-2xl" alt="Cover" />
                </div>
            )}
        </div>
        {config.features?.length > 0 && (
            <div id="services" className="px-6 md:px-12 py-16">
                {config.featuresTitle && <h3 className="text-4xl font-black mb-12 text-center">{config.featuresTitle}</h3>}
                {renderFeatures(config.features, activeTheme, setZoomImage)}
            </div>
        )}
    </div>
);

export const NewspaperTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full max-w-5xl mx-auto border-x border-current px-6 md:px-12 py-8" style={{ borderColor: `${activeTheme.primary}40` }}>
        <div className="border-b-4 border-current pb-8 mb-8 flex flex-col items-center text-center">
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter w-full break-words hyphens-auto" style={{ fontFamily: 'Times New Roman, serif' }}>{config.slogan || 'THE DAILY POST'}</h1>
            <p className="mt-4 text-xl font-bold uppercase tracking-widest opacity-80 border-y border-current py-2 w-full break-words hyphens-auto">{config.description}</p>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-[2] border-r-0 md:border-r border-current pr-0 md:pr-8">
                {config.coverImage && <img src={config.coverImage} className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-700 mb-6" alt="Headline" />}
                {config.features?.slice(0,1).map((feat, i) => (
                    <div key={i}>
                        <h2 className="text-4xl font-black mb-4 leading-tight w-full break-words hyphens-auto">{feat.title}</h2>
                        <p className="text-lg leading-relaxed opacity-80 mb-6 text-justify w-full break-words hyphens-auto">{feat.desc}</p>
                    </div>
                ))}
            </div>
            <div className="flex-1 flex flex-col gap-6">
                {config.features?.slice(1).map((feat, i) => (
                    <div key={i} className="border-b border-current pb-6 last:border-0">
                        {feat.image && <img src={feat.image} className="w-full h-32 object-cover grayscale hover:grayscale-0 transition-all mb-3" alt="Thumb" />}
                        <h4 className="text-xl font-bold mb-2 leading-tight w-full break-words hyphens-auto">{feat.title}</h4>
                        <p className="text-sm opacity-70 text-justify w-full break-words hyphens-auto">{feat.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const RestaurantTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full">
        <div className="relative h-[70vh] flex items-center justify-center text-center px-6">
            <div className="absolute inset-0 bg-black/60 z-10" />
            {config.coverImage && <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover z-0" alt="Restaurant Cover" />}
            <div className="relative z-20 flex flex-col items-center">
                <h1 className="text-5xl md:text-7xl font-light tracking-widest uppercase mb-4 text-white w-full break-words hyphens-auto" style={{ fontFamily: 'Playfair Display, serif' }}>{config.slogan || 'Fine Dining'}</h1>
                <div className="w-24 h-1 mb-6" style={{ backgroundColor: activeTheme.primary }} />
                <p className="text-xl text-white/80 max-w-2xl font-light italic w-full break-words hyphens-auto">{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="mt-8 border border-white text-white px-8 py-3 uppercase tracking-[0.2em] text-xs hover:bg-white hover:text-black transition-colors">{config.ctaText}</a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-24 max-w-4xl mx-auto px-6 text-center">
                <h3 className="text-3xl tracking-widest uppercase mb-16 w-full break-words hyphens-auto" style={{ fontFamily: 'Playfair Display, serif' }}>{config.featuresTitle || 'Our Menu'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {config.features.map((feat, i) => (
                        <div key={i} className="flex flex-col items-center text-center">
                            {feat.image && <img src={feat.image} className="w-24 h-24 rounded-full object-cover mb-4 shadow-lg border-2" style={{ borderColor: activeTheme.primary }} alt={feat.title} />}
                            <h4 className="text-xl font-bold mb-2 uppercase tracking-wide w-full break-words hyphens-auto">{feat.title}</h4>
                            <p className="text-sm opacity-70 italic leading-relaxed w-full break-words hyphens-auto">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

export const TechnologyTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 font-mono">
        <div className="flex flex-col items-center text-center mb-24 relative">
            <div className="absolute inset-0 opacity-10 blur-3xl rounded-full" style={{ background: `linear-gradient(to bottom, ${activeTheme.primary}, transparent)` }} />
            <div className="inline-block border px-4 py-1 text-xs uppercase tracking-widest mb-6" style={{ borderColor: activeTheme.primary, color: activeTheme.primary, backgroundColor: `${activeTheme.primary}1a` }}>SYS_INIT_SUCCESS</div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase shadow-[var(--builder-primary)] text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 w-full break-words hyphens-auto">{config.slogan || 'NEXT_GEN_TECH'}</h1>
            <p className="text-lg opacity-70 max-w-2xl border-l-2 pl-4 text-left w-full break-words hyphens-auto" style={{ borderColor: activeTheme.primary }}>{`> ${config.description || 'System online. Ready for input.'}`}</p>
            {config.ctaText && (
                <a href={config.ctaLink || '#'} className="mt-8 px-8 py-3 text-black font-black uppercase text-sm hover:scale-105 transition-transform" style={{ backgroundColor: activeTheme.primary, boxShadow: `0 0 20px ${activeTheme.primary}80` }}>
                    [ {config.ctaText} ]
                </a>
            )}
        </div>
        {config.coverImage && (
            <div className="w-full h-64 md:h-96 border border-white/20 relative overflow-hidden mb-24 group">
                <div className="absolute inset-0 opacity-20 mix-blend-overlay group-hover:opacity-0 transition-opacity z-10" style={{ backgroundColor: activeTheme.primary }} />
                <img src={config.coverImage} className="w-full h-full object-cover" alt="Tech Base" />
                <div className="absolute bottom-4 left-4 z-20 text-[10px]" style={{ color: activeTheme.primary }}>SYS_CORE_VISUALIZATION</div>
            </div>
        )}
        {config.features?.length > 0 && (
            <div>
                <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-2xl font-black uppercase w-full break-words hyphens-auto">{config.featuresTitle || 'MODULES'}</h3>
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

export const FootballTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full max-w-7xl mx-auto">
        <div className="relative w-full h-[60vh] bg-black overflow-hidden flex flex-col justify-end p-8 md:p-16">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
            {config.coverImage && <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-80 z-0 scale-105" alt="Stadium" />}
            <div className="relative z-20 w-full flex flex-col items-start border-l-8 pl-6" style={{ borderColor: activeTheme.primary }}>
                <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg mb-2 w-full break-words hyphens-auto">{config.slogan || 'MATCH DAY'}</h1>
                <p className="text-xl md:text-2xl font-bold text-white/90 uppercase tracking-wide w-full break-words hyphens-auto">{config.description}</p>
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-12 px-6">
                <div className="w-full flex justify-between items-end border-b-4 pb-2 mb-8" style={{ borderColor: activeTheme.primary }}>
                    <h3 className="text-4xl font-black uppercase italic w-full break-words hyphens-auto">{config.featuresTitle || 'SQUAD / NEWS'}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {config.features.map((feat, i) => (
                        <div key={i} className="bg-white text-black p-1 relative overflow-hidden group cursor-pointer" onClick={() => setZoomImage && setZoomImage(feat.image)}>
                            {feat.image && <img src={feat.image} className="w-full h-48 object-cover mb-2 group-hover:scale-105 transition-transform duration-300" alt="Player/News" />}
                            <div className="p-4 bg-black text-white h-full">
                                <h4 className="font-black uppercase italic text-xl mb-1 w-full break-words hyphens-auto">{feat.title}</h4>
                                <p className="text-xs opacity-80 w-full break-words hyphens-auto">{feat.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

export const BettingTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full max-w-6xl mx-auto px-4 py-8" style={{ fontFamily: 'Roboto, sans-serif' }}>
        <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#333] mb-8">
            <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#222]">
                <h1 className="text-2xl font-black uppercase text-white flex items-center gap-2 w-full break-words hyphens-auto">
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: activeTheme.primary }} />
                    {config.slogan || 'LIVE ODDS'}
                </h1>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="px-6 py-2 rounded font-bold uppercase text-xs shrink-0" style={{ backgroundColor: activeTheme.primary, color: '#000' }}>
                        {config.ctaText}
                    </a>
                )}
            </div>
            <div className="p-6 flex flex-col md:flex-row items-center gap-8">
                <p className="text-lg text-white/80 flex-1 w-full break-words hyphens-auto">{config.description}</p>
                {config.coverImage && <img src={config.coverImage} className="w-full md:w-1/3 rounded border border-[#333]" alt="Promo" />}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-lg border border-[#333] overflow-hidden">
                <div className="bg-[#222] p-4 border-b border-[#333]">
                    <h3 className="font-bold text-white uppercase w-full break-words hyphens-auto">{config.featuresTitle || 'TOP MATCHES'}</h3>
                </div>
                <div className="divide-y divide-[#333]">
                    {config.features.map((feat, i) => (
                        <div key={i} className="p-4 hover:bg-[#222] transition-colors flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex-1 w-full">
                                <div className="text-xs mb-1" style={{ color: activeTheme.primary }}>In-Play</div>
                                <h4 className="font-bold text-white text-lg w-full break-words hyphens-auto">{feat.title}</h4>
                                <p className="text-sm text-gray-400 w-full break-words hyphens-auto">{feat.desc}</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto shrink-0">
                                <button className="flex-1 md:w-20 py-3 bg-[#333] hover:bg-[#444] rounded text-white font-bold transition-colors">1</button>
                                <button className="flex-1 md:w-20 py-3 bg-[#333] hover:bg-[#444] rounded text-white font-bold transition-colors">X</button>
                                <button className="flex-1 md:w-20 py-3 bg-[#333] hover:bg-[#444] rounded text-white font-bold transition-colors">2</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);
