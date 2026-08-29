import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { 
    ClassicTemplate, 
    EcommerceTemplate, 
    AgencyTemplate, 
    LuxuryTemplate, 
    SaasTemplate, 
    NewspaperTemplate, 
    RestaurantTemplate, 
    TechnologyTemplate, 
    FootballTemplate, 
    BettingTemplate, 
    CorporateTemplate, 
    CreativeTemplate, 
    FitnessTemplate, 
    PortfolioTemplate, 
    RealEstateTemplate, 
    GamingTemplate 
} from './WebsiteTemplates';

const XIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

const TiktokIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.36a6.34 6.34 0 0 0-5.74 2.8 6.34 6.34 0 0 0 .89 7.9 6.34 6.34 0 0 0 8.04-.3 6.33 6.33 0 0 0 2.35-4.83V9.12a8.28 8.28 0 0 0 4.57 1.34V7.01a4.83 4.83 0 0 1-.85-.32z"/>
    </svg>
);

export const PublicWebsiteViewer = ({ config }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [zoomImage, setZoomImage] = useState(null);
    const [buyerEmail, setBuyerEmail] = useState('');
    const [buyerPhone, setBuyerPhone] = useState('');
    const [orderComplete, setOrderComplete] = useState(false);

    if (!config) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Website not found</div>;

    const themeColors = {
        gold: { primary: '#D4AF37', bg: '#09090b', card: '#111113' },
        blue: { primary: '#1D9BF0', bg: '#001018', card: '#001824' },
        pink: { primary: '#e83c74', bg: '#17050d', card: '#210712' },
        green: { primary: '#2fd840', bg: '#041206', card: '#061c09' },
        red: { primary: '#ef4444', bg: '#140505', card: '#1f0707' },
        cyberpunk: { primary: '#FCE205', bg: '#0D0221', card: '#1A0738' },
        neon: { primary: '#00FFFF', bg: '#000510', card: '#001020' },
        darkglass: { primary: '#A78BFA', bg: '#050505', card: 'rgba(255,255,255,0.03)' },
        emerald: { primary: '#10b981', bg: '#02120a', card: '#052414' },
        midnight: { primary: '#6366f1', bg: '#0a0a0a', card: '#111111' },
        rose: { primary: '#f43f5e', bg: '#1a050a', card: '#2b0912' },
        amber: { primary: '#f59e0b', bg: '#140c01', card: '#241602' }
    };

    const activeTheme = themeColors[config.palette] || themeColors.gold;

    const handleOpenProduct = (product) => {
        setSelectedProduct(product);
        const sizes = product.sizes || product.clothingSizes || product.shoeSizes || [];
        setSelectedSize(sizes.length > 0 ? sizes[0] : null);
        setOrderComplete(false);
    };

    const handleStripeCheckout = (product) => {
        let stripeUrl = product.stripeLink || product.buyLink;
        if (selectedSize && product.sizeLinks && product.sizeLinks[selectedSize]) {
            stripeUrl = product.sizeLinks[selectedSize];
        }
        if (stripeUrl) {
            const finalUrl = stripeUrl.startsWith('http') ? stripeUrl : `https://${stripeUrl}`;
            window.open(finalUrl, '_blank', 'noopener,noreferrer');
        }
    };

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
            <nav className={`sticky top-0 z-30 shrink-0 w-full px-4 sm:px-6 md:px-12 py-3.5 sm:py-4 flex items-center justify-between ${config.palette === 'light' ? 'border-b border-black/10' : 'border-b border-white/10'}`}
                 style={{
                     background: config.palette === 'light' 
                         ? 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.85) 100%)'
                         : 'linear-gradient(135deg, rgba(15,15,20,0.8) 0%, rgba(5,5,10,0.85) 100%)',
                     backdropFilter: 'blur(28px) saturate(180%)',
                     WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                     boxShadow: config.palette === 'light'
                         ? '0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)'
                         : '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
                 }}
            >
                <div className="flex items-center gap-3">
                    {config.logo ? (
                        <img src={config.logo} alt="Logo" className="h-8 sm:h-9 w-auto object-contain drop-shadow-lg" />
                    ) : (
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center font-black text-white shadow-lg">
                            {config.businessName?.charAt(0) || 'W'}
                        </div>
                    )}
                    <span className="font-black tracking-tight text-base sm:text-lg drop-shadow-md truncate max-w-[200px] sm:max-w-none">{config.businessName}</span>
                </div>
                <div className="flex items-center gap-4 sm:gap-8 text-xs sm:text-sm font-bold opacity-80">
                    {config.hasStore && config.products?.length > 0 && (
                        <a href="#shop" className="hover:opacity-100 transition-opacity flex items-center gap-1.5 font-black uppercase text-[11px] tracking-wider" style={{ color: activeTheme.primary }}>
                            <Icons.ShoppingBag className="w-3.5 h-3.5" />
                            <span>Store</span>
                        </a>
                    )}
                    <div className="hidden md:flex gap-8">
                        {config.navLink1 !== '' && <a href="#services" className="hover:opacity-100 transition-opacity">{config.navLink1 ?? 'Υπηρεσίες'}</a>}
                        {config.navLink2 !== '' && <a href="#about" className="hover:opacity-100 transition-opacity">{config.navLink2 ?? 'Σχετικά'}</a>}
                        {config.navLink3 !== '' && <a href="#contact" className="hover:opacity-100 transition-opacity">{config.navLink3 ?? 'Επικοινωνία'}</a>}
                    </div>
                </div>
            </nav>

            {/* Render Template Body based on config.template */}
            {(() => {
                const tmplProps = { config, activeTheme, setZoomImage };
                switch (config.template) {
                    case 'ecommerce': return <EcommerceTemplate {...tmplProps} />;
                    case 'agency': return <AgencyTemplate {...tmplProps} />;
                    case 'luxury': return <LuxuryTemplate {...tmplProps} />;
                    case 'saas': return <SaasTemplate {...tmplProps} />;
                    case 'newspaper': return <NewspaperTemplate {...tmplProps} />;
                    case 'restaurant': return <RestaurantTemplate {...tmplProps} />;
                    case 'technology': return <TechnologyTemplate {...tmplProps} />;
                    case 'football': return <FootballTemplate {...tmplProps} />;
                    case 'betting': return <BettingTemplate {...tmplProps} />;
                    case 'corporate': return <CorporateTemplate {...tmplProps} />;
                    case 'creative': return <CreativeTemplate {...tmplProps} />;
                    case 'fitness': return <FitnessTemplate {...tmplProps} />;
                    case 'portfolio': return <PortfolioTemplate {...tmplProps} />;
                    case 'realestate': return <RealEstateTemplate {...tmplProps} />;
                    case 'gaming': return <GamingTemplate {...tmplProps} />;
                    case 'classic':
                    default:
                        return <ClassicTemplate {...tmplProps} />;
                }
            })()}

            {/* Shop Section is globally available below any template if products exist */}
            {config.hasStore && config.products && config.products.length > 0 && (
                <div id="shop" className={`w-full px-4 sm:px-6 md:px-12 py-16 sm:py-24 border-t ${config.palette === 'light' ? 'border-black/5' : 'border-white/5'}`}>
                    <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                        <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-white/10 border border-white/15 mb-3 inline-block" style={{ color: activeTheme.primary }}>
                            ★ Official Catalog ★
                        </span>
                        <h3 className="break-words hyphens-auto text-3xl sm:text-5xl font-black tracking-tight mb-3">Our Products</h3>
                        <p className="break-words hyphens-auto opacity-70 text-sm sm:text-base">Premium selection available with instant online checkout.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
                        {config.products.map(product => {
                            const sizes = product.sizes || product.clothingSizes || product.shoeSizes || [];
                            const hasStripe = !!(product.stripeLink || product.buyLink);

                            return (
                                <div 
                                    key={product.id || product.name} 
                                    className="group rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col border border-white/10" 
                                    style={{ backgroundColor: activeTheme.card }}
                                >
                                    <div 
                                        className="w-full aspect-square overflow-hidden relative bg-black/40 cursor-pointer"
                                        onClick={() => product.image && setZoomImage(product.image)}
                                    >
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Icons.ShoppingBag className="w-12 h-12 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute top-3.5 right-3.5 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-lg">
                                            <span className="text-white font-black text-sm sm:text-base">€{product.price}</span>
                                        </div>
                                        {product.badge && (
                                            <div className="absolute top-3.5 left-3.5 bg-[var(--builder-primary)] text-black px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider shadow-md">
                                                {product.badge}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 sm:p-6 flex-1 flex flex-col">
                                        <h4 className="text-lg sm:text-xl font-bold mb-1.5 tracking-tight">{product.name}</h4>
                                        {product.desc && (
                                            <p className="text-xs text-white/60 mb-3 line-clamp-2">{product.desc}</p>
                                        )}
                                        
                                        {/* Available Sizes Pill Tags */}
                                        {sizes.length > 0 && (
                                            <div className="mb-4">
                                                <div className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1.5">Sizes:</div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {sizes.map((s, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/80">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex-1"></div>
                                        
                                        <div className="flex gap-2 mt-auto pt-2">
                                            <button 
                                                onClick={() => handleOpenProduct(product)}
                                                className="flex-1 py-3.5 rounded-2xl font-black uppercase tracking-wider text-xs transition-all hover:scale-102 flex items-center justify-center gap-1.5 shadow-lg"
                                                style={{ 
                                                    backgroundColor: activeTheme.primary, 
                                                    color: '#000' 
                                                }}
                                            >
                                                <Icons.ShoppingBag className="w-3.5 h-3.5" />
                                                <span>{hasStripe ? 'Buy (Stripe)' : 'Order Now'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* About and Contact Sections */}
            {config.aboutText && (
                <div id="about" className={`w-full px-4 sm:px-6 md:px-12 py-16 ${config.palette === 'light' ? 'bg-white' : 'bg-transparent'}`}>
                    {config.navLink2 !== '' && <h3 className="text-3xl sm:text-4xl font-black mb-6 text-center tracking-tight">{config.navLink2 ?? 'Σχετικά'}</h3>}
                    <p className="text-center max-w-2xl mx-auto opacity-75 leading-relaxed text-base sm:text-lg break-words hyphens-auto">
                        {config.aboutText}
                    </p>
                </div>
            )}

            {(config.contactEmail || config.contactPhone) && (
                <div id="contact" className={`w-full px-4 sm:px-6 md:px-12 py-16 ${config.palette === 'light' ? 'bg-black/5' : 'bg-white/[0.02]'}`}>
                    {config.navLink3 !== '' && <h3 className="text-3xl sm:text-4xl font-black mb-10 text-center tracking-tight">{config.navLink3 ?? 'Επικοινωνία'}</h3>}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 max-w-2xl mx-auto">
                        {config.contactEmail && (
                            <a href={`mailto:${config.contactEmail}`} className="w-full sm:w-auto flex items-center gap-3 p-4 rounded-2xl border border-white/10 hover:border-white/25 transition-colors" style={{ backgroundColor: activeTheme.card }}>
                                <Icons.Mail className="w-5 h-5 opacity-60" style={{ color: activeTheme.primary }} />
                                <span className="font-bold text-sm sm:text-base truncate">{config.contactEmail}</span>
                            </a>
                        )}
                        {config.contactPhone && (
                            <a href={`tel:${config.contactPhone}`} className="w-full sm:w-auto flex items-center gap-3 p-4 rounded-2xl border border-white/10 hover:border-white/25 transition-colors" style={{ backgroundColor: activeTheme.card }}>
                                <Icons.Phone className="w-5 h-5 opacity-60" style={{ color: activeTheme.primary }} />
                                <span className="font-bold text-sm sm:text-base">{config.contactPhone}</span>
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Footer with TikTok and all social icons */}
            <footer className={`w-full px-6 md:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-6 ${config.palette === 'light' ? 'border-t border-black/5' : 'border-t border-white/10'}`}>
                <div className="text-xs sm:text-sm font-bold opacity-60 text-center md:text-left">
                    © {new Date().getFullYear()} {config.businessName}. All rights reserved.
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 opacity-75">
                    {config.socialX && (
                        <a href={config.socialX} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 hover:scale-110 transition-all p-2 rounded-full bg-white/5 hover:bg-white/10" title="X / Twitter">
                            <XIcon className="w-5 h-5" />
                        </a>
                    )}
                    {config.socialInstagram && (
                        <a href={config.socialInstagram} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 hover:scale-110 transition-all p-2 rounded-full bg-white/5 hover:bg-white/10" title="Instagram">
                            <Icons.Instagram className="w-5 h-5" />
                        </a>
                    )}
                    {config.socialTiktok && (
                        <a href={config.socialTiktok} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 hover:scale-110 transition-all p-2 rounded-full bg-white/5 hover:bg-white/10" title="TikTok">
                            <TiktokIcon className="w-5 h-5" />
                        </a>
                    )}
                    {config.socialLinkedin && (
                        <a href={config.socialLinkedin} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 hover:scale-110 transition-all p-2 rounded-full bg-white/5 hover:bg-white/10" title="LinkedIn">
                            <Icons.Linkedin className="w-5 h-5" />
                        </a>
                    )}
                    {config.socialYoutube && (
                        <a href={config.socialYoutube} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 hover:scale-110 transition-all p-2 rounded-full bg-white/5 hover:bg-white/10" title="YouTube">
                            <Icons.Youtube className="w-5 h-5" />
                        </a>
                    )}
                    {config.socialFacebook && (
                        <a href={config.socialFacebook} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 hover:scale-110 transition-all p-2 rounded-full bg-white/5 hover:bg-white/10" title="Facebook">
                            <Icons.Facebook className="w-5 h-5" />
                        </a>
                    )}
                    {config.socialWhatsapp && (
                        <a href={config.socialWhatsapp.startsWith('http') ? config.socialWhatsapp : `https://wa.me/${config.socialWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 hover:scale-110 transition-all p-2 rounded-full bg-white/5 hover:bg-white/10" title="WhatsApp">
                            <Icons.MessageCircle className="w-5 h-5" />
                        </a>
                    )}
                </div>
            </footer>

            {/* Buy Modal with Size Selector and Stripe Link Integration */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="absolute inset-0 bg-black/85 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/15 flex flex-col max-h-[92dvh] overflow-y-auto no-scrollbar"
                            style={{ backgroundColor: activeTheme.card, color: config.palette === 'light' ? '#000' : '#fff' }}
                        >
                            {!orderComplete ? (
                                <div className="p-6 sm:p-8">
                                    <div className="flex justify-between items-start mb-5">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block">Checkout</span>
                                            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Complete Order</h3>
                                        </div>
                                        <button onClick={() => setSelectedProduct(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
                                            <Icons.X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 mb-6 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                                        {selectedProduct.image && (
                                            <img src={selectedProduct.image} alt="Product" className="w-16 h-16 rounded-xl object-cover" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-base truncate">{selectedProduct.name}</h4>
                                            <p className="opacity-80 font-mono font-bold text-sm text-[var(--builder-primary)]">€{selectedProduct.price}</p>
                                        </div>
                                    </div>

                                    {/* Size Selector if product has sizes */}
                                    {(selectedProduct.sizes || selectedProduct.clothingSizes || selectedProduct.shoeSizes)?.length > 0 && (
                                        <div className="mb-6">
                                            <label className="text-xs font-black uppercase tracking-wider text-white/70 mb-2.5 block flex items-center justify-between">
                                                <span>Select Size:</span>
                                                <span className="text-[var(--builder-primary)] font-bold">{selectedSize || 'Required'}</span>
                                            </label>
                                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                                {(selectedProduct.sizes || selectedProduct.clothingSizes || selectedProduct.shoeSizes).map((sz, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setSelectedSize(sz)}
                                                        className={`py-2 rounded-xl text-xs font-black transition-all border ${
                                                            selectedSize === sz 
                                                                ? 'bg-[var(--builder-primary)] text-black border-transparent shadow-lg scale-105' 
                                                                : 'bg-white/5 border-white/10 hover:border-white/30 text-white/80'
                                                        }`}
                                                    >
                                                        {sz}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Stripe Direct Link Button if configured */}
                                    {(selectedProduct.stripeLink || selectedProduct.buyLink) ? (
                                        <div className="space-y-4 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => handleStripeCheckout(selectedProduct)}
                                                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm transition-all hover:scale-102 flex items-center justify-center gap-2 shadow-xl"
                                                style={{ 
                                                    backgroundColor: activeTheme.primary, 
                                                    color: '#000' 
                                                }}
                                            >
                                                <Icons.CreditCard className="w-4 h-4" />
                                                <span>Pay With Stripe (€{selectedProduct.price})</span>
                                            </button>
                                            <div className="text-center text-[10px] text-white/40 uppercase tracking-widest font-mono">
                                                Secured by Stripe Official Payment Protocol
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 mb-6">
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1.5 block">Your Email</label>
                                                <input 
                                                    type="email" 
                                                    value={buyerEmail}
                                                    onChange={(e) => setBuyerEmail(e.target.value)}
                                                    placeholder="john@example.com"
                                                    className="w-full min-w-0 box-border bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--builder-primary)] text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1.5 block">Phone Number (Optional)</label>
                                                <input 
                                                    type="text" 
                                                    value={buyerPhone}
                                                    onChange={(e) => setBuyerPhone(e.target.value)}
                                                    placeholder="+30 69..."
                                                    className="w-full min-w-0 box-border bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--builder-primary)] text-white"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (!buyerEmail.includes('@')) return;
                                                    setOrderComplete(true);
                                                    setTimeout(() => {
                                                        setSelectedProduct(null);
                                                        setOrderComplete(false);
                                                        setBuyerEmail('');
                                                        setBuyerPhone('');
                                                    }, 3500);
                                                }}
                                                disabled={!buyerEmail}
                                                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-40 shadow-lg mt-2"
                                                style={{ 
                                                    backgroundColor: activeTheme.primary, 
                                                    color: '#000' 
                                                }}
                                            >
                                                Confirm Order (€{selectedProduct.price})
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 sm:p-12 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${activeTheme.primary}20`, color: activeTheme.primary }}>
                                        <Icons.Check className="w-10 h-10" />
                                    </div>
                                    <h3 className="break-words hyphens-auto text-2xl font-black mb-2">Order Confirmed!</h3>
                                    <p className="opacity-70 text-sm leading-relaxed max-w-xs">
                                        Receipt sent to {buyerEmail}. {selectedSize && `Size: ${selectedSize}.`} The store manager will fulfill your order shortly.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* FULL SCREEN IMAGE ZOOM MODAL */}
            {zoomImage && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setZoomImage(null)}
                >
                    <button 
                        onClick={() => setZoomImage(null)} 
                        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 z-50 text-white"
                    >
                        <Icons.X className="w-6 h-6" />
                    </button>
                    <img 
                        src={zoomImage} 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl"
                        alt="Zoomed"
                    />
                </div>
            )}
        </div>
    );
};
