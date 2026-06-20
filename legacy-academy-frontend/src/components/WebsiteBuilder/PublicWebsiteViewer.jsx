import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

const XIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

export const PublicWebsiteViewer = ({ config }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [buyerEmail, setBuyerEmail] = useState('');
    const [orderComplete, setOrderComplete] = useState(false);

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
                    <a href="#services" className="cursor-pointer hover:opacity-100">{config.navLink1 || 'Services'}</a>
                    <a href="#about" className="cursor-pointer hover:opacity-100">{config.navLink2 || 'About'}</a>
                    <a href="#contact" className="cursor-pointer hover:opacity-100">{config.navLink3 || 'Contact'}</a>
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
                        href={config.ctaLink === '#' ? '#contact' : (config.ctaLink || '#contact')}
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
            {/* Feature Cards / Posts */}
            {config.features && config.features.length > 0 && (
                <div id="services" className={`w-full px-6 md:px-12 py-24 ${config.palette === 'light' ? 'bg-black/5' : 'bg-white/[0.02]'}`}>
                    <h3 className="text-4xl font-black mb-16 text-center tracking-tight">{config.featuresTitle || 'Features'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {config.features.map((feat, idx) => (
                            <div key={idx} className="p-10 rounded-3xl flex flex-col gap-6 transition-all hover:-translate-y-2 overflow-hidden relative group" style={{ backgroundColor: activeTheme.card }}>
                                {feat.image ? (
                                    <div className="-mx-10 -mt-10 mb-2 h-48 overflow-hidden relative">
                                        <img src={feat.image} alt={feat.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${activeTheme.primary}20`, color: activeTheme.primary }}>
                                        <Icons.Star className="w-8 h-8" />
                                    </div>
                                )}
                                <h4 className="text-2xl font-bold relative z-10">{feat.title}</h4>
                                <p className="opacity-60 text-base leading-relaxed relative z-10">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* About Section */}
            {config.aboutText && (
                <div id="about" className={`w-full px-6 md:px-12 py-24 ${config.palette === 'light' ? 'bg-white' : 'bg-transparent'}`}>
                    <h3 className="text-4xl font-black mb-8 text-center tracking-tight">{config.navLink2 || 'About'}</h3>
                    <p className="text-center max-w-3xl mx-auto opacity-70 leading-relaxed text-xl">
                        {config.aboutText}
                    </p>
                </div>
            )}

            {/* Contact Section */}
            {(config.contactEmail || config.contactPhone) && (
                <div id="contact" className={`w-full px-6 md:px-12 py-24 ${config.palette === 'light' ? 'bg-black/5' : 'bg-white/[0.02]'}`}>
                    <h3 className="text-4xl font-black mb-12 text-center tracking-tight">{config.navLink3 || 'Contact'}</h3>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-3xl mx-auto">
                        {config.contactEmail && (
                            <div className="flex items-center gap-4 p-6 rounded-2xl w-full md:w-auto justify-center shadow-xl" style={{ backgroundColor: activeTheme.card }}>
                                <Icons.Mail className="w-6 h-6 opacity-50" />
                                <span className="font-bold text-lg">{config.contactEmail}</span>
                            </div>
                        )}
                        {config.contactPhone && (
                            <div className="flex items-center gap-4 p-6 rounded-2xl w-full md:w-auto justify-center shadow-xl" style={{ backgroundColor: activeTheme.card }}>
                                <Icons.Phone className="w-6 h-6 opacity-50" />
                                <span className="font-bold text-lg">{config.contactPhone}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Shop Section */}
            {config.hasStore && config.products && config.products.length > 0 && (
                <div id="shop" className={`w-full px-6 md:px-12 py-24 border-t ${config.palette === 'light' ? 'border-black/5' : 'border-white/5'}`}>
                    <h3 className="text-4xl font-black mb-4 text-center tracking-tight">Our Products</h3>
                    <p className="text-center opacity-60 max-w-2xl mx-auto mb-16">Premium selection of our best items.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                        {config.products.map(product => (
                            <div key={product.id} className="group rounded-3xl overflow-hidden shadow-2xl transition-all hover:-translate-y-2 flex flex-col" style={{ backgroundColor: activeTheme.card }}>
                                <div className="w-full aspect-square overflow-hidden relative bg-black/20">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Icons.Image className="w-12 h-12 opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                        <span className="text-white font-black">€{product.price}</span>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h4 className="text-xl font-bold mb-4">{product.name}</h4>
                                    <div className="flex-1"></div>
                                    <button 
                                        onClick={() => setSelectedProduct(product)}
                                        className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-colors mt-auto"
                                        style={{ 
                                            backgroundColor: activeTheme.primary, 
                                            color: config.palette === 'light' ? '#fff' : '#000' 
                                        }}
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className={`w-full px-6 md:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-4 ${config.palette === 'light' ? 'border-t border-black/5' : 'border-t border-white/5'}`}>
                <div className="text-sm font-bold opacity-50">© {new Date().getFullYear()} {config.businessName}. All rights reserved.</div>
                <div className="flex gap-6 opacity-50">
                    {config.socialX && (
                        <a href={config.socialX} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                            <XIcon className="w-6 h-6" />
                        </a>
                    )}
                    {config.socialInstagram && (
                        <a href={config.socialInstagram} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                            <Icons.Instagram className="w-6 h-6" />
                        </a>
                    )}
                    {config.socialLinkedin && (
                        <a href={config.socialLinkedin} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
                            <Icons.Linkedin className="w-6 h-6" />
                        </a>
                    )}
                </div>
            </footer>

            {/* Buy Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
                            style={{ backgroundColor: activeTheme.card, color: config.palette === 'light' ? '#000' : '#fff' }}
                        >
                            {!orderComplete ? (
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-2xl font-black">Complete Purchase</h3>
                                        <button onClick={() => setSelectedProduct(null)} className="opacity-50 hover:opacity-100">
                                            <Icons.X className="w-6 h-6" />
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mb-8 p-4 rounded-xl" style={{ backgroundColor: config.palette === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
                                        {selectedProduct.image && (
                                            <img src={selectedProduct.image} alt="Product" className="w-16 h-16 rounded-lg object-cover" />
                                        )}
                                        <div>
                                            <h4 className="font-bold">{selectedProduct.name}</h4>
                                            <p className="opacity-70 font-mono">€{selectedProduct.price}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div>
                                            <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2 block">Your Email</label>
                                            <input 
                                                type="email" 
                                                value={buyerEmail}
                                                onChange={(e) => setBuyerEmail(e.target.value)}
                                                placeholder="john@example.com"
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold-primary)]"
                                                style={{ color: 'inherit' }}
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => {
                                            if (!buyerEmail.includes('@')) return;
                                            setOrderComplete(true);
                                            // In a real app, this would send an email via backend.
                                            // For now we simulate success.
                                            setTimeout(() => {
                                                setSelectedProduct(null);
                                                setOrderComplete(false);
                                                setBuyerEmail('');
                                            }, 3000);
                                        }}
                                        disabled={!buyerEmail}
                                        className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ 
                                            backgroundColor: activeTheme.primary, 
                                            color: config.palette === 'light' ? '#fff' : '#000' 
                                        }}
                                    >
                                        Pay €{selectedProduct.price}
                                    </button>
                                </div>
                            ) : (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${activeTheme.primary}20`, color: activeTheme.primary }}>
                                        <Icons.Check className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2">Order Confirmed!</h3>
                                    <p className="opacity-70">A receipt has been sent to {buyerEmail}. The store owner will contact you shortly.</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
