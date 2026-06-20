import React from 'react';
import * as Icons from 'lucide-react';

export const PublicWebsiteViewer = ({ config }) => {
    if (!config) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Website not found</div>;

    const themeColors = {
        gold: { primary: '#D4AF37', bg: '#09090b', card: '#111113' },
        blue: { primary: '#1D9BF0', bg: '#001018', card: '#001824' },
        pink: { primary: '#e83c74', bg: '#17050d', card: '#210712' },
        green: { primary: '#2fd840', bg: '#041206', card: '#061c09' },
        light: { primary: '#111111', bg: '#f8f9fa', card: '#ffffff' }
    };

    const activeTheme = themeColors[config.palette] || themeColors.gold;

    return (
        <div 
            className="min-h-screen w-full flex flex-col font-sans overflow-y-auto overflow-x-hidden"
            style={{ 
                fontFamily: config.font || 'Inter',
                backgroundColor: activeTheme.bg,
                color: config.palette === 'light' ? '#000' : '#fff'
            }}
        >
            {/* Navbar */}
            <nav className={`w-full px-6 md:px-12 py-6 flex items-center justify-between ${config.palette === 'light' ? 'border-b border-black/5' : 'border-b border-white/5'}`}>
                <div className="flex items-center gap-3">
                    {config.logo ? (
                        <img src={config.logo} alt="Logo" className="h-8 w-auto object-contain" />
                    ) : (
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center font-black text-white">
                            {config.businessName?.charAt(0) || 'W'}
                        </div>
                    )}
                    <span className="font-black tracking-tight text-lg">{config.businessName}</span>
                </div>
                <div className="hidden md:flex gap-8 text-sm font-bold opacity-70">
                    <span className="cursor-pointer hover:opacity-100">Services</span>
                    <span className="cursor-pointer hover:opacity-100">About</span>
                    <span className="cursor-pointer hover:opacity-100">Contact</span>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="w-full flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-12 py-12 md:py-24 gap-12 relative min-h-[80vh]">
                {/* Decorative Blur */}
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
                
                <div className="flex-1 flex flex-col items-start z-10 max-w-2xl">
                    <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight mb-6">
                        {config.slogan}
                    </h1>
                    <p className={`text-lg md:text-2xl mb-10 leading-relaxed ${config.palette === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {config.description}
                    </p>
                    <a 
                        href={config.ctaLink || '#'}
                        className="px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all hover:scale-105 hover:shadow-2xl"
                        style={{ 
                            backgroundColor: activeTheme.primary, 
                            color: config.palette === 'light' ? '#fff' : '#000',
                            boxShadow: `0 0 30px ${activeTheme.primary}40`
                        }}
                    >
                        {config.ctaText || 'Get Started'}
                    </a>
                </div>

                <div className="flex-1 w-full z-10">
                    <div className={`w-full aspect-square md:aspect-[4/5] rounded-[30px] overflow-hidden shadow-2xl relative ${config.palette === 'light' ? 'border-4 border-white' : 'border-4 border-white/5'}`}>
                        <img src={config.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                </div>
            </div>

            {/* Feature Cards */}
            <div className={`w-full px-6 md:px-12 py-24 ${config.palette === 'light' ? 'bg-black/5' : 'bg-white/[0.02]'}`}>
                <h3 className="text-4xl font-black mb-16 text-center tracking-tight">Why Choose Us</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="p-10 rounded-3xl flex flex-col gap-6 transition-all hover:-translate-y-2" style={{ backgroundColor: activeTheme.card }}>
                            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${activeTheme.primary}20`, color: activeTheme.primary }}>
                                <Icons.Star className="w-8 h-8" />
                            </div>
                            <h4 className="text-2xl font-bold">Premium Quality {i}</h4>
                            <p className="opacity-60 text-base leading-relaxed">We deliver nothing but the absolute best results for our clients, ensuring perfection in every detail.</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className={`w-full px-6 md:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-4 ${config.palette === 'light' ? 'border-t border-black/5' : 'border-t border-white/5'}`}>
                <div className="text-sm font-bold opacity-50">© {new Date().getFullYear()} {config.businessName}. All rights reserved.</div>
                <div className="flex gap-6 opacity-50">
                    <Icons.Twitter className="w-6 h-6 cursor-pointer hover:opacity-100" />
                    <Icons.Instagram className="w-6 h-6 cursor-pointer hover:opacity-100" />
                    <Icons.Linkedin className="w-6 h-6 cursor-pointer hover:opacity-100" />
                </div>
            </footer>
        </div>
    );
};
