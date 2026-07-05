const fs = require('fs');

const newTemplates = `
export const CorporateTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full bg-white text-gray-900">
        <div className="w-full bg-slate-900 text-white py-24 px-6 md:px-12 text-center flex flex-col items-center">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight">{config.slogan || 'Professional Corporate Solutions'}</h1>
            <p className="text-xl opacity-80 max-w-2xl mb-10">{config.description}</p>
            {config.ctaText && (
                <a href={config.ctaLink || '#'} className="px-8 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors" style={{ backgroundColor: activeTheme.primary, color: '#fff' }}>
                    {config.ctaText}
                </a>
            )}
        </div>
        {config.coverImage && (
            <div className="-mt-16 max-w-5xl mx-auto px-6 relative z-10">
                <img src={config.coverImage} className="w-full h-80 object-cover rounded-xl shadow-2xl" alt="Corporate Hero" />
            </div>
        )}
        {config.features?.length > 0 && (
            <div className="max-w-6xl mx-auto px-6 py-24">
                <h3 className="text-3xl font-bold mb-16 text-center text-gray-900">{config.featuresTitle || 'Our Expertise'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {config.features.map((feat, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-100 p-8 rounded-xl hover:shadow-xl transition-shadow">
                            {feat.image && <img src={feat.image} className="w-16 h-16 object-cover rounded mb-6" alt={feat.title} />}
                            <h4 className="text-xl font-bold mb-3 text-gray-900">{feat.title}</h4>
                            <p className="text-gray-600 leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

export const CreativeTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full min-h-screen" style={{ backgroundColor: activeTheme.background || '#111', color: activeTheme.text || '#fff' }}>
        <div className="flex flex-col md:flex-row min-h-[80vh]">
            <div className="flex-1 flex flex-col justify-center p-12 md:p-24 z-10 relative">
                <div className="absolute top-0 left-0 w-32 h-32 opacity-20 rounded-full blur-3xl" style={{ backgroundColor: activeTheme.primary }}></div>
                <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter mix-blend-difference">{config.slogan || 'Think Different'}</h1>
                <p className="text-xl md:text-2xl font-light opacity-80 max-w-md mb-12">{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="w-max px-10 py-4 rounded-full text-sm font-black uppercase tracking-widest hover:scale-105 transition-transform" style={{ backgroundColor: activeTheme.text || '#fff', color: activeTheme.background || '#000' }}>
                        {config.ctaText}
                    </a>
                )}
            </div>
            {config.coverImage && (
                <div className="flex-1 relative overflow-hidden">
                    <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-105 hover:scale-100" alt="Creative" />
                </div>
            )}
        </div>
        {config.features?.length > 0 && (
            <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <h3 className="text-4xl md:text-5xl font-black mb-16 lowercase tracking-tight">{config.featuresTitle || 'what we do'}</h3>
                <div className="flex flex-col gap-12">
                    {config.features.map((feat, i) => (
                        <div key={i} className="flex flex-col md:flex-row gap-8 items-center group">
                            <div className="flex-1">
                                <h4 className="text-3xl font-bold mb-4 group-hover:translate-x-4 transition-transform" style={{ color: activeTheme.primary }}>{feat.title}</h4>
                                <p className="text-lg opacity-70 max-w-lg">{feat.desc}</p>
                            </div>
                            {feat.image && (
                                <div className="flex-1 w-full overflow-hidden rounded-3xl">
                                    <img src={feat.image} className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700" alt={feat.title} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

export const FitnessTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full bg-[#0a0a0a] text-white uppercase">
        <div className="relative h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">
            {config.coverImage && <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Fitness Hero" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
            <div className="relative z-10 max-w-5xl">
                <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">{config.slogan || 'NO EXCUSES'}</h1>
                <p className="text-xl md:text-2xl font-bold tracking-widest mb-10" style={{ color: activeTheme.primary }}>{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="inline-block px-12 py-5 font-black text-xl tracking-widest skew-x-[-10deg] hover:scale-110 transition-transform" style={{ backgroundColor: activeTheme.primary, color: '#000' }}>
                        <div className="skew-x-[10deg]">{config.ctaText}</div>
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-24 px-6 max-w-7xl mx-auto">
                <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter mb-16 text-center">{config.featuresTitle || 'PROGRAMS'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {config.features.map((feat, i) => (
                        <div key={i} className="relative h-96 group overflow-hidden bg-zinc-900">
                            {feat.image && <img src={feat.image} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-20 transition-opacity duration-500" alt={feat.title} />}
                            <div className="absolute inset-0 p-8 flex flex-col justify-end transform translate-y-16 group-hover:translate-y-0 transition-transform duration-500">
                                <h4 className="text-3xl font-black italic mb-2" style={{ color: activeTheme.primary }}>{feat.title}</h4>
                                <p className="text-sm font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{feat.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

export const PortfolioTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full max-w-5xl mx-auto px-6 py-24 font-sans text-white">
        <div className="flex flex-col mb-32">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-3xl">{config.slogan || 'Hello, I am a creator.'}</h1>
            <p className="text-2xl font-light opacity-60 max-w-2xl mb-12">{config.description}</p>
            <div className="flex items-center gap-6">
                {config.coverImage && <img src={config.coverImage} className="w-20 h-20 rounded-full object-cover shadow-lg" alt="Profile" />}
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="px-8 py-3 rounded-full font-semibold transition-all hover:-translate-y-1" style={{ backgroundColor: activeTheme.primary, color: '#000', boxShadow: \`0 10px 20px \${activeTheme.primary}40\` }}>
                        {config.ctaText}
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div>
                <h3 className="text-2xl font-bold mb-12">{config.featuresTitle || 'Selected Works'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {config.features.map((feat, i) => (
                        <div key={i} className="group cursor-pointer">
                            {feat.image && (
                                <div className="overflow-hidden rounded-2xl mb-6 bg-gray-100 dark:bg-gray-800 aspect-[4/3]">
                                    <img src={feat.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={feat.title} />
                                </div>
                            )}
                            <h4 className="text-2xl font-bold mb-2 group-hover:underline decoration-2 underline-offset-4" style={{ decorationColor: activeTheme.primary }}>{feat.title}</h4>
                            <p className="opacity-70">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

export const RealEstateTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full bg-[#f8f9fa] text-slate-800">
        <div className="relative h-[80vh] flex items-center justify-center">
            {config.coverImage && <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover brightness-50" alt="Property Hero" />}
            <div className="relative z-10 text-center px-6 max-w-4xl">
                <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight drop-shadow-lg">{config.slogan || 'Find Your Dream Home'}</h1>
                <p className="text-xl text-white/90 mb-10 font-light drop-shadow">{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="inline-block px-10 py-4 bg-white text-slate-900 font-bold uppercase tracking-widest text-sm hover:bg-gray-100 transition-colors shadow-xl">
                        {config.ctaText}
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h3 className="text-3xl md:text-4xl font-serif mb-4">{config.featuresTitle || 'Featured Properties'}</h3>
                    <div className="w-16 h-1 bg-slate-800 mx-auto"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {config.features.map((feat, i) => (
                        <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow group">
                            {feat.image && (
                                <div className="relative h-64 overflow-hidden">
                                    <img src={feat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={feat.title} />
                                    <div className="absolute top-4 right-4 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider" style={{ backgroundColor: activeTheme.primary }}>Featured</div>
                                </div>
                            )}
                            <div className="p-6">
                                <h4 className="text-xl font-bold mb-2">{feat.title}</h4>
                                <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">{feat.desc}</p>
                                <div className="text-sm font-bold uppercase tracking-wider" style={{ color: activeTheme.primary }}>View Details &rarr;</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

export const GamingTemplate = ({ config, activeTheme, setZoomImage }) => (
    <div className="w-full bg-[#050505] text-white font-sans overflow-hidden">
        <div className="relative min-h-screen flex items-center justify-center">
            {config.coverImage && (
                <>
                    <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Game Hero" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent"></div>
                </>
            )}
            <div className="relative z-10 text-center px-6 flex flex-col items-center">
                <div className="mb-6 px-4 py-1 border-2 text-xs font-black uppercase tracking-[0.3em] backdrop-blur-sm" style={{ borderColor: activeTheme.primary, color: activeTheme.primary }}>New Release</div>
                <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{config.slogan || 'LEVEL UP'}</h1>
                <p className="text-xl text-gray-300 max-w-2xl mb-10">{config.description}</p>
                {config.ctaText && (
                    <a href={config.ctaLink || '#'} className="relative group px-10 py-4 font-black uppercase tracking-widest overflow-hidden">
                        <div className="absolute inset-0 transition-transform group-hover:scale-105" style={{ backgroundColor: activeTheme.primary }}></div>
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                        <span className="relative z-10 text-black">{config.ctaText}</span>
                    </a>
                )}
            </div>
        </div>
        {config.features?.length > 0 && (
            <div className="py-24 px-6 max-w-6xl mx-auto relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg max-h-lg opacity-20 blur-[100px] rounded-full pointer-events-none" style={{ backgroundColor: activeTheme.primary }}></div>
                <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-16 text-center">{config.featuresTitle || 'GAME FEATURES'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {config.features.map((feat, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-colors group">
                            {feat.image && <img src={feat.image} className="w-full h-48 object-cover rounded-xl mb-6 group-hover:scale-105 transition-transform duration-500" alt={feat.title} />}
                            <h4 className="text-2xl font-bold uppercase tracking-wider mb-4" style={{ color: activeTheme.primary }}>{feat.title}</h4>
                            <p className="text-gray-400 leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);
`;

fs.appendFileSync('legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteTemplates.jsx', newTemplates);

let wbContent = fs.readFileSync('legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteBuilder.jsx', 'utf8');

wbContent = wbContent.replace(
    'import { ClassicTemplate, NewspaperTemplate, RestaurantTemplate, TechnologyTemplate, FootballTemplate, BettingTemplate } from \'./WebsiteTemplates\';',
    'import { ClassicTemplate, NewspaperTemplate, RestaurantTemplate, TechnologyTemplate, FootballTemplate, BettingTemplate, CorporateTemplate, CreativeTemplate, FitnessTemplate, PortfolioTemplate, RealEstateTemplate, GamingTemplate } from \'./WebsiteTemplates\';'
);

wbContent = wbContent.replace(
    /\{\[\'classic\', \'corporate\', \'creative\', \'fitness\', \'newspaper\', \'restaurant\', \'technology\', \'football\', \'betting\'\]\.map\(tmpl => \(/g,
    "{['classic', 'corporate', 'creative', 'fitness', 'newspaper', 'restaurant', 'technology', 'football', 'betting', 'portfolio', 'realestate', 'gaming'].map(tmpl => ("
);

wbContent = wbContent.replace(
    'case \'betting\': return <BettingTemplate {...tmplProps} />;',
    'case \'betting\': return <BettingTemplate {...tmplProps} />;\n                                case \'corporate\': return <CorporateTemplate {...tmplProps} />;\n                                case \'creative\': return <CreativeTemplate {...tmplProps} />;\n                                case \'fitness\': return <FitnessTemplate {...tmplProps} />;\n                                case \'portfolio\': return <PortfolioTemplate {...tmplProps} />;\n                                case \'realestate\': return <RealEstateTemplate {...tmplProps} />;\n                                case \'gaming\': return <GamingTemplate {...tmplProps} />;'
);

fs.writeFileSync('legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteBuilder.jsx', wbContent);

let pwvContent = fs.readFileSync('legacy-academy-frontend/src/components/WebsiteBuilder/PublicWebsiteViewer.jsx', 'utf8');

pwvContent = pwvContent.replace(
    'import { ClassicTemplate, NewspaperTemplate, RestaurantTemplate, TechnologyTemplate, FootballTemplate, BettingTemplate } from \'./WebsiteTemplates\';',
    'import { ClassicTemplate, NewspaperTemplate, RestaurantTemplate, TechnologyTemplate, FootballTemplate, BettingTemplate, CorporateTemplate, CreativeTemplate, FitnessTemplate, PortfolioTemplate, RealEstateTemplate, GamingTemplate } from \'./WebsiteTemplates\';'
);

pwvContent = pwvContent.replace(
    'case \'betting\': return <BettingTemplate {...tmplProps} />;',
    'case \'betting\': return <BettingTemplate {...tmplProps} />;\n                    case \'corporate\': return <CorporateTemplate {...tmplProps} />;\n                    case \'creative\': return <CreativeTemplate {...tmplProps} />;\n                    case \'fitness\': return <FitnessTemplate {...tmplProps} />;\n                    case \'portfolio\': return <PortfolioTemplate {...tmplProps} />;\n                    case \'realestate\': return <RealEstateTemplate {...tmplProps} />;\n                    case \'gaming\': return <GamingTemplate {...tmplProps} />;'
);

fs.writeFileSync('legacy-academy-frontend/src/components/WebsiteBuilder/PublicWebsiteViewer.jsx', pwvContent);

console.log('Done!');
