import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { ClassicTemplate, NewspaperTemplate, RestaurantTemplate, TechnologyTemplate, FootballTemplate, BettingTemplate } from './WebsiteTemplates';

const XIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

export const PublicWebsiteViewer = ({ config }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [zoomImage, setZoomImage] = useState(null);
    const [buyerEmail, setBuyerEmail] = useState('');
    const [orderComplete, setOrderComplete] = useState(false);
    const [activeTab, setActiveTab] = useState('newest');

    if (!config) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Website not found</div>;

    const themeColors = {
        gold: { primary: '#D4AF37', bg: '#09090b', card: '#111113' },
        blue: { primary: '#1D9BF0', bg: '#001018', card: '#001824' },
        pink: { primary: '#e83c74', bg: '#17050d', card: '#210712' },
        green: { primary: '#2fd840', bg: '#041206', card: '#061c09' },
        red: { primary: '#ef4444', bg: '#140505', card: '#1f0707' },
        cyberpunk: { primary: '#FCE205', bg: '#0D0221', card: '#1A0738' },
        neon: { primary: '#00FFFF', bg: '#000510', card: '#001020' },
        minimal: { primary: '#FFFFFF', bg: '#121212', card: '#1A1A1A' },
        darkglass: { primary: '#A78BFA', bg: '#050505', card: 'rgba(255,255,255,0.03)' }
    };

    const activeTheme = themeColors[config.palette] || themeColors.gold;

    return (
        <div 
            className="h-[100dvh] w-full flex flex-col font-sans overflow-y-auto overflow-x-hidden"
            style={{ 
                fontFamily: config.font || 'Inter',
                backgroundColor: activeTheme.bg,
                color: config.palette === 'light' ? '#000' : '#fff',
                '--builder-primary': activeTheme?.primary || '#D4AF37'
            }}
        >
            {/* Navbar */}
            <nav className={`shrink-0 w-full px-6 md:px-12 py-6 flex items-center justify-between ${config.palette === 'light' ? 'border-b border-black/5' : 'border-b border-white/5'}`}>
                <div className="flex items-center gap-3">
                    {config.logo ? (
                        <img src={config.logo} alt="Logo" className="h-8 w-auto object-contain drop-shadow-lg" />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center font-black text-white shadow-lg">
                            {config.businessName?.charAt(0) || 'W'}
                        </div>
                    )}
                    <span className="font-black tracking-tight text-lg drop-shadow-md">{config.businessName}</span>
                </div>
                <div className="hidden md:flex gap-8 text-sm font-bold opacity-70">
                    {config.navLink1 !== '' && <a href="#services" className="hover:opacity-100 transition-opacity">{config.navLink1 ?? 'Υπηρεσίες'}</a>}
                    {config.navLink2 !== '' && <a href="#about" className="hover:opacity-100 transition-opacity">{config.navLink2 ?? 'Σχετικά'}</a>}
                    {config.navLink3 !== '' && <a href="#contact" className="hover:opacity-100 transition-opacity">{config.navLink3 ?? 'Επικοινωνία'}</a>}
                </div>
            </nav>

            {/* Render Template Body based on config.template */}
            {(() => {
                const tmplProps = { config, activeTheme, setZoomImage };
                switch (config.template) {
                    case 'newspaper': return <NewspaperTemplate {...tmplProps} />;
                    case 'restaurant': return <RestaurantTemplate {...tmplProps} />;
                    case 'technology': return <TechnologyTemplate {...tmplProps} />;
                    case 'football': return <FootballTemplate {...tmplProps} />;
                    case 'betting': return <BettingTemplate {...tmplProps} />;
                    case 'classic':
                    default:
                        return <ClassicTemplate {...tmplProps} />;
                }
            })()}

            {/* Shop Section is globally available below any template if products exist */}
            {config.hasStore && config.products && config.products.length > 0 && (
                <div id="shop" className={`w-full px-6 md:px-12 py-24 border-t ${config.palette === 'light' ? 'border-black/5' : 'border-white/5'}`}>
                    <h3 className="break-words hyphens-auto text-4xl font-black mb-4 text-center tracking-tight">Our Products</h3>
                    <p className="break-words hyphens-auto text-center opacity-60 max-w-2xl mx-auto mb-16">Premium selection of our best items.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                        {config.products.map(product => (
                            <div key={product.id} className="group rounded-3xl overflow-hidden shadow-2xl transition-all hover:-translate-y-2 flex flex-col" style={{ backgroundColor: activeTheme.card }}>
                                <div className="w-full aspect-square overflow-hidden relative bg-black/20">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Icons.Image className="w-12 h-12 opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                        <span className="break-words hyphens-auto text-white font-black">€{product.price}</span>
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

            {/* About and Contact Sections appended globally if defined */}
            {config.aboutText && (
                <div id="about" className={`w-full px-6 md:px-12 py-16 ${config.palette === 'light' ? 'bg-white' : 'bg-transparent'}`}>
                    {config.navLink2 !== '' && <h3 className="text-4xl font-black mb-8 text-center tracking-tight">{config.navLink2 ?? 'Σχετικά'}</h3>}
                    <p className="text-center max-w-2xl mx-auto opacity-70 leading-relaxed text-lg break-words hyphens-auto">
                        {config.aboutText}
                    </p>
                </div>
            )}

            {(config.contactEmail || config.contactPhone) && (
                <div id="contact" className={`w-full px-6 md:px-12 py-16 ${config.palette === 'light' ? 'bg-black/5' : 'bg-white/[0.02]'}`}>
                    {config.navLink3 !== '' && <h3 className="text-4xl font-black mb-12 text-center tracking-tight">{config.navLink3 ?? 'Επικοινωνία'}</h3>}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-2xl mx-auto">
                        {config.contactEmail && (
                            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: activeTheme.card }}>
                                <Icons.Mail className="w-5 h-5 opacity-50" />
                                <span className="font-bold">{config.contactEmail}</span>
                            </div>
                        )}
                        {config.contactPhone && (
                            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: activeTheme.card }}>
                                <Icons.Phone className="w-5 h-5 opacity-50" />
                                <span className="font-bold">{config.contactPhone}</span>
                            </div>
                        )}
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
                                        <h3 className="break-words hyphens-auto text-2xl font-black">Complete Purchase</h3>
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
                                            <p className="break-words hyphens-auto opacity-70 font-mono">€{selectedProduct.price}</p>
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
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--builder-primary)]"
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
                                    <h3 className="break-words hyphens-auto text-2xl font-black mb-2">Order Confirmed!</h3>
                                    <p className="break-words hyphens-auto opacity-70">A receipt has been sent to {buyerEmail}. The store owner will contact you shortly.</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* FULL SCREEN IMAGE ZOOM MODAL FOR PUBLIC VIEWER */}
            {zoomImage && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setZoomImage(null)}
                >
                    <button 
                        onClick={() => setZoomImage(null)} 
                        className="absolute top-4 right-4 p-3 bg-transparent hover:bg-white/10 hover:scale-105 active:scale-95 rounded-full transition-all duration-300 z-50 group"
                    >
                        <Icons.X className="w-6 h-6 text-red-500 group-hover:text-red-400 group-hover:rotate-90 transition-all duration-300" />
                    </button>
                    <img 
                        src={zoomImage} 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                        alt="Zoomed"
                    />
                </div>
            )}
        </div>
    );
};
