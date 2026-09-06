import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useTranslation } from '../../translations';
import axios from '../../api';
import { simulateAIGeneration } from './aiSimulator';
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
    GamingTemplate,
    MafiaTemplate
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

export const WebsiteBuilder = ({ initialConfig, websiteIndex, onExit, user, onUpdateUser, websitesArray }) => {
    const { t } = useTranslation();
    const [zoomImage, setZoomImage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [published, setPublished] = useState(false);
    const [activeTab, setActiveTab] = useState('newest'); // desktop, mobile

    // Mobile specific tab (form vs preview)
    const [mobileTab, setMobileTab] = useState('form');
    
    // Preview: always desktop (full size) by default - mobile frame removed from desktop
    const [previewMode, setPreviewMode] = useState('desktop');

    // AI Generator State
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    
    // Publish success state
    const [showPublishSuccess, setShowPublishSuccess] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [copyToast, setCopyToast] = useState(false);

    const handleCopyUrl = (e) => {
        if(e) e.preventDefault();
        const url = `${window.location.origin}/?site=${user?.username}&index=${websiteIndex !== undefined ? websiteIndex : (websitesArray?.length || 0)}`;
        try {
            navigator.clipboard.writeText(url);
        } catch (err) {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            } catch(e2){}
        }
        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 2000);
    };

    const existingWebsite = initialConfig || {};
    
    const [config, setConfig] = useState(() => {
        const base = existingWebsite || {};
        const normalizedProducts = (base.products || []).map(p => {
            // Use p.sizes if it is explicitly defined (even as empty array = user deleted sizes)
            // Only fall back to clothingSizes/shoeSizes if p.sizes is completely undefined/null
            let canonicalSizes;
            if (p.sizes !== undefined && p.sizes !== null) {
                canonicalSizes = Array.isArray(p.sizes) ? p.sizes : [];
            } else if (p.clothingSizes && Array.isArray(p.clothingSizes) && p.clothingSizes.length) {
                canonicalSizes = p.clothingSizes;
            } else if (p.shoeSizes && Array.isArray(p.shoeSizes) && p.shoeSizes.length) {
                canonicalSizes = p.shoeSizes;
            } else {
                canonicalSizes = [];
            }
            // Only keep sizeLinks that correspond to existing canonicalSizes
            const cleanLinks = {};
            canonicalSizes.forEach(sz => {
                if (p.sizeLinks && (sz in p.sizeLinks)) cleanLinks[sz] = p.sizeLinks[sz];
            });
            const { clothingSizes: _c, shoeSizes: _sh, sizes: _sz, sizeLinks: _sl, ...rest } = p;
            return { ...rest, sizes: canonicalSizes, sizeLinks: cleanLinks };
        });
        return {
            template: base.template || 'classic',
            businessName: base.businessName || '',
            slogan: base.slogan || '',
            description: base.description || '',
            logo: base.logo || '',
            coverImage: base.coverImage || '',
            palette: base.palette || 'gold',
            font: base.font || 'Inter',
            ctaText: base.ctaText || '',
            ctaLink: base.ctaLink || '',
            navLink1: base.navLink1 || '',
            navLink2: base.navLink2 || '',
            navLink3: base.navLink3 || '',
            featuresTitle: base.featuresTitle || '',
            features: base.features || [],
            aboutText: base.aboutText || '',
            contactEmail: base.contactEmail || '',
            contactPhone: base.contactPhone || '',
            socialX: base.socialX || '',
            socialInstagram: base.socialInstagram || '',
            socialLinkedin: base.socialLinkedin || '',
            socialTiktok: base.socialTiktok || '',
            socialYoutube: base.socialYoutube || '',
            socialFacebook: base.socialFacebook || '',
            socialWhatsapp: base.socialWhatsapp || '',
            hasStore: base.hasStore !== undefined ? base.hasStore : false,
            showAgencyStats: base.showAgencyStats !== undefined ? base.showAgencyStats : true,
            agencyStats: base.agencyStats || [],
            products: normalizedProducts,
            isDraft: base.isDraft !== undefined ? base.isDraft : false
        };
    });

    const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

    const updateProduct = (pIdx, updater) => setConfig(prev => {
        const next = { ...prev, products: [...(prev.products || [])] };
        next.products[pIdx] = updater({ ...(next.products[pIdx] || {}) });
        if ('clothingSizes' in next.products[pIdx]) delete next.products[pIdx].clothingSizes;
        if ('shoeSizes' in next.products[pIdx]) delete next.products[pIdx].shoeSizes;
        return next;
    });

    // Shared image compression helper — converts a File to a compressed JPEG data URL
    // maxWidth: max pixel width, quality: JPEG quality 0-1
    const compressImageFile = (file, maxWidth = 800, quality = 0.75) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (event) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    const handleImageUpload = (e, key, maxWidth) => {
        const file = e.target.files[0];
        if (!file) return;

        // Immediately show a local object-URL preview (fast, no memory overhead)
        const objectUrl = URL.createObjectURL(file);
        updateConfig(key, objectUrl);

        compressImageFile(file, maxWidth, 0.85).then(dataUrl => {
            updateConfig(key, dataUrl);
            if (e && e.target) e.target.value = '';
            // Delay revoke so any in-flight renders using the blob URL finish first
            setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
        }).catch(() => {
            // On error keep the objectUrl preview — not ideal but won't crash
        });
    };

    const handlePublish = async (isDraftParam, quiet = false) => {
        if (!user?._id) return;
        if (!quiet) {
            setSaving(true);
            pendingExplicitActionRef.current = true;
        }
        try {
            // Use passed isDraftParam, or fallback to current config.isDraft, or default to false (live)
            const currentIsDraft = config.isDraft !== undefined ? config.isDraft : false;
            const finalIsDraft = isDraftParam !== undefined ? isDraftParam : currentIsDraft;
            
            const newWebsites = [...(websitesArray || [])];
            // Sanitize products: clean up old clothingSizes/shoeSizes and keep only sizes array + valid sizeLinks
            const sanitizedProducts = (config.products || []).map(p => {
                const sizesArray = Array.isArray(p.sizes) ? p.sizes.filter(Boolean) : [];
                const cleanSizeLinks = {};
                sizesArray.forEach(sz => {
                    if (p.sizeLinks && (sz in p.sizeLinks)) cleanSizeLinks[sz] = p.sizeLinks[sz];
                });
                const { clothingSizes: _c, shoeSizes: _sh, sizes: _sz, sizeLinks: _sl, ...rest } = p;
                return { ...rest, sizes: sizesArray, sizeLinks: cleanSizeLinks };
            });
            const updatedConfig = { 
                ...config, 
                products: sanitizedProducts,
                lastUpdated: new Date(), 
                isDraft: finalIsDraft 
            };
            
            if (websiteIndex !== undefined && websiteIndex !== null && websiteIndex < newWebsites.length) {
                newWebsites[websiteIndex] = updatedConfig;
            } else {
                newWebsites.push(updatedConfig);
            }

            const payload = { settings: { businessWebsites: newWebsites } };
            const res = await axios.put('/users/settings', payload);
            
            // Update local config to remember the draft status so auto-save doesn't overwrite it
            setConfig(prev => ({ ...prev, lastUpdated: updatedConfig.lastUpdated, isDraft: finalIsDraft, products: sanitizedProducts }));
            
            if (onUpdateUser) {
                onUpdateUser({
                    ...user,
                    settings: {
                        ...(user.settings || {}),
                        businessWebsites: newWebsites
                    }
                });
            }
            
            if (!quiet) {
                setPublished(true);
                if (finalIsDraft) {
                    setShowSaveSuccess(true);
                    setTimeout(() => setShowSaveSuccess(false), 3000);
                } else {
                    setShowPublishSuccess(true);
                }
                setTimeout(() => setPublished(false), 3000);
            }
        } catch (e) {
            console.error("Failed to publish website", e);
        } finally {
            if (!quiet) setSaving(false);
        }
    };

    const pendingExplicitActionRef = useRef(false);

    // Auto-save debounced
    useEffect(() => {
        if (!config || Object.keys(config).length === 0) return;
        // ✅ Protect Save/Publish race:
        // When user just clicked Save Draft / Publish Live explicitly,
        // skip the next auto-save tick so config.isDraft never flips back.
        if (pendingExplicitActionRef.current === true) {
            pendingExplicitActionRef.current = false;
            return;
        }
        const timer = setTimeout(() => {
            handlePublish(undefined, true);
        }, 3000);
        return () => clearTimeout(timer);
    }, [config]);

    const handleAIGenerate = () => {
        if (!aiPrompt.trim()) return;
        setIsGeneratingAI(true);
        // Simulate network delay for AI thinking
        setTimeout(() => {
            const aiData = simulateAIGeneration(aiPrompt);
            setConfig(prev => ({ ...prev, ...aiData }));
            setIsGeneratingAI(false);
            // On mobile, auto-switch to preview so they see the magic
            if (window.innerWidth < 768) {
                setMobileTab('preview');
            }
        }, 2000);
    };

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
        amber: { primary: '#f59e0b', bg: '#140c01', card: '#241602' },
        mafia: { primary: '#C9A961', bg: '#0a0a0a', card: '#151515' },
        light: { primary: '#1f2937', bg: '#ffffff', card: '#f8fafc' },
        charcoal: { primary: '#4b5563', bg: '#0b0b0f', card: '#15151a' }
    };

    // Ensure palette is valid, fallback to gold if invalid
    const resolvedPalette = themeColors[config.palette] ? config.palette : 'gold';
    const activeTheme = themeColors[resolvedPalette];

    return (
        <>
        <div className="fixed inset-0 z-[5000] bg-black flex flex-col md:flex-row font-sans w-full h-[100dvh] sm:h-screen overscroll-none touch-none" style={{ '--builder-primary': activeTheme?.primary || '#D4AF37' }}>
            
            {/* MOBILE TABS (Only visible on small screens) */}
            <div className="md:hidden flex border-b border-white/10 shrink-0 bg-[#09090b] z-30 pt-safe shadow-lg">
                <button 
                    onClick={() => setMobileTab('form')}
                    className={`flex-1 py-3.5 text-[12px] font-bold uppercase tracking-wider transition-colors ${mobileTab === 'form' ? 'text-[var(--builder-primary)] border-b-2 border-[var(--builder-primary)] bg-white/5' : 'text-gray-500'}`}
                >
                    Edit Details
                </button>
                <button 
                    onClick={() => setMobileTab('preview')}
                    className={`flex-1 py-3.5 text-[12px] font-bold uppercase tracking-wider transition-colors ${mobileTab === 'preview' ? 'text-[var(--builder-primary)] border-b-2 border-[var(--builder-primary)] bg-white/5' : 'text-gray-500'}`}
                >
                    Live Preview
                </button>
            </div>

            {/* ACTION BAR (Fixed at bottom for both PC and Mobile) */}
            <div className="fixed bottom-0 left-0 w-full p-4 z-[4000] flex gap-3 shadow-[0_-20px_40px_rgba(0,0,0,0.9)] pb-[calc(1rem+env(safe-area-inset-bottom))]"
                 style={{
                     background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(5,5,5,0.98) 100%)',
                     backdropFilter: 'blur(30px) saturate(180%)',
                     WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                     borderTop: '1px solid rgba(255,255,255,0.12)',
                     boxShadow: '0 -20px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)'
                 }}
            >
                <button 
                    onClick={() => handlePublish(true)}
                    onTouchEnd={(e) => { e.preventDefault(); handlePublish(true); }}
                    disabled={saving}
                    className="flex-1 py-3.5 rounded-xl border border-white/20 text-white font-bold text-[12px] uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation cursor-pointer"
                >
                    <Icons.Save className="w-4 h-4" /> {t('wb_saveDraft', 'Save Draft')}
                </button>
                <button 
                    onClick={() => handlePublish(false)}
                    onTouchEnd={(e) => { e.preventDefault(); handlePublish(false); }}
                    className="flex-1 py-3.5 rounded-xl bg-[var(--builder-primary)] text-white font-black text-[12px] uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg touch-manipulation cursor-pointer"
                >
                    <Icons.Globe className="w-4 h-4" /> {saving ? t('wb_publishing', 'Publishing...') : t('wb_publishLive', 'Publish Live')}
                </button>
            </div>

            {/* LEFT SIDEBAR - Form Inputs */}
            <div className={`website-builder-panel w-full md:w-[400px] flex-1 min-h-0 flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] shrink-0 ${mobileTab === 'preview' ? 'hidden md:flex' : 'flex'}`}
                 style={{
                     background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%), rgba(9,9,11,0.95)',
                     backdropFilter: 'blur(28px) saturate(180%)',
                     WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                     borderRight: '1px solid rgba(255,255,255,0.12)'
                 }}
            >
                {/* Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0"
                     style={{
                         background: 'rgba(255,255,255,0.03)',
                         boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.05)'
                     }}
                >
                    <div className="flex items-center gap-3">
                        <button onClick={onExit} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors -ml-2">
                            <Icons.ArrowLeft className="w-5 h-5 text-white/70" />
                        </button>
                        <span className="text-[var(--builder-primary)] font-black uppercase tracking-widest text-[11px]">
                            Website Setup
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain p-6 pb-40 custom-scrollbar space-y-8 touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                    
                    {/* AI Generator */}
                    <div className="bg-[var(--builder-primary)]/10 border border-[var(--builder-primary)]/30 p-5 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--builder-primary)] to-transparent" />
                        <div className="flex items-center gap-2 mb-3">
                            <Icons.Sparkles className="w-4 h-4 text-[var(--builder-primary)]" />
                            <h3 className="text-[12px] font-black uppercase tracking-wider text-[var(--builder-primary)]">AI Website Generator</h3>
                        </div>
                        <p className="text-xs text-white/60 mb-3 leading-relaxed">
                            {t('AI_BUILDER_DESC', 'Describe your business in any language, and our AI will build your website instantly.')}
                        </p>
                        <textarea 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="e.g. A premium fitness gym in Athens, Greece"
                            rows="2"
                            className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md resize-none mb-3"
                        />
                        <button 
                            onClick={handleAIGenerate}
                            disabled={isGeneratingAI || !aiPrompt.trim()}
                            className="w-full py-3 rounded-xl bg-[var(--builder-primary)] text-white font-black text-[11px] uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isGeneratingAI ? (
                                <>
                                    <Icons.Loader className="w-4 h-4 animate-spin" /> 
                                    {t('AI_GENERATING', 'Generating Magic...')}
                                </>
                            ) : (
                                <>
                                    <Icons.Zap className="w-4 h-4" /> 
                                    {t('GENERATE_NOW', 'Generate Now')}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2"><Icons.Building className="w-3 h-3" /> Basic Info</div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">{t('wb_businessName', 'Business Name')}</label>
                            <input 
                                type="text" 
                                value={config.businessName || ''}
                                onChange={(e) => updateConfig('businessName', e.target.value)}
                                placeholder="e.g. Acme Corp"
                                className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Catchy Slogan</label>
                            <input 
                                type="text" 
                                value={config.slogan || ''}
                                onChange={(e) => updateConfig('slogan', e.target.value)}
                                placeholder="e.g. Building the future."
                                className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">{t('wb_description', 'Description')}</label>
                            <textarea 
                                value={config.description || ''}
                                onChange={(e) => updateConfig('description', e.target.value)}
                                placeholder="e.g. We provide premium services..."
                                rows="3"
                                className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md resize-none"
                            />
                        </div>
                        <div className="pt-2 border-t border-white/5">
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">{t('wb_navLinks', 'Navigation Links')}</label>
                            <div className="flex gap-2">
                                <input type="text" value={config.navLink1 || ''} onChange={(e) => updateConfig('navLink1', e.target.value)} className="w-1/3 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-3 py-2.5 text-white text-xs outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="Link 1" />
                                <input type="text" value={config.navLink2 || ''} onChange={(e) => updateConfig('navLink2', e.target.value)} className="w-1/3 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-3 py-2.5 text-white text-xs outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="Link 2" />
                                <input type="text" value={config.navLink3 || ''} onChange={(e) => updateConfig('navLink3', e.target.value)} className="w-1/3 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-3 py-2.5 text-white text-xs outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="Link 3" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide block">Features / Posts</label>
                                <button 
                                    onClick={() => updateConfig('features', [...(config.features || []), { title: 'New Post', desc: '', image: '' }])}
                                    className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full uppercase tracking-widest font-bold transition-colors"
                                >
                                    + Add Post
                                </button>
                            </div>
                            <input 
                                type="text" 
                                value={config.featuresTitle || ''}
                                onChange={(e) => updateConfig('featuresTitle', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md mb-3"
                                placeholder="Section Title (e.g. Why Choose Us)"
                            />
                            <div className="space-y-3">
                                {config.features?.map((feat, idx) => (
                                    <div key={idx} className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-2 relative group">
                                        <button 
                                            onClick={() => {
                                                const updated = [...config.features];
                                                updated.splice(idx, 1);
                                                updateConfig('features', updated);
                                            }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 z-10"
                                        >
                                            <Icons.X className="w-3 h-3" />
                                        </button>
                                        <input 
                                            type="text" 
                                            value={feat.title}
                                            onChange={(e) => {
                                                const updated = [...config.features];
                                                updated[idx].title = e.target.value;
                                                updateConfig('features', updated);
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[var(--builder-primary)] transition-colors" 
                                            placeholder={t('wb_ph_title', 'Title')} 
                                        />
                                        <textarea 
                                            value={feat.desc}
                                            onChange={(e) => {
                                                const updated = [...config.features];
                                                updated[idx].desc = e.target.value;
                                                updateConfig('features', updated);
                                            }}
                                            rows="2"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[var(--builder-primary)] transition-colors resize-none" 
                                            placeholder={t('wb_ph_description', 'Description')} 
                                        />
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] text-white/40 uppercase font-bold">Image (Optional)</span>
                                            <label className="cursor-pointer text-[10px] text-[var(--builder-primary)] hover:underline flex items-center gap-1 font-bold uppercase tracking-wider">
                                                <Icons.Upload className="w-3 h-3" /> Upload
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    compressImageFile(file, 600, 0.75).then(dataUrl => {
                                                        const updated = [...config.features];
                                                        updated[idx].image = dataUrl;
                                                        updateConfig('features', updated);
                                                        if (e && e.target) e.target.value = '';
                                                    }).catch(() => {});
                                                }} />
                                            </label>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <input 
                                                type="text" 
                                                value={feat.linkText || ''}
                                                onChange={(e) => {
                                                    const updated = [...config.features];
                                                    updated[idx].linkText = e.target.value;
                                                    updateConfig('features', updated);
                                                }}
                                                className="w-1/3 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[var(--builder-primary)] transition-colors" 
                                                placeholder="Btn Text" 
                                            />
                                            <input 
                                                type="text" 
                                                value={feat.link || ''}
                                                onChange={(e) => {
                                                    const updated = [...config.features];
                                                    updated[idx].link = e.target.value;
                                                    updateConfig('features', updated);
                                                }}
                                                className="w-2/3 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[var(--builder-primary)] transition-colors" 
                                                placeholder="Btn URL (https://...)" 
                                            />
                                        </div>
                                        {feat.image && (
                                            <div className="w-full h-16 rounded overflow-hidden mt-1 relative group/img">
                                                <img src={feat.image} alt="Feature" className="w-full h-full object-contain opacity-80" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-2 border-t border-white/5">
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">About Section Text</label>
                            <textarea 
                                value={config.aboutText || ''}
                                onChange={(e) => updateConfig('aboutText', e.target.value)}
                                rows="3"
                                className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md resize-none"
                            />
                        </div>
                    </div>

                    {/* Media */}
                    <div className="space-y-4">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 pt-4 border-t border-white/10"><Icons.Image className="w-3 h-3" /> Media & Images</div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 flex items-center justify-between">
                                Logo
                                <div className="flex items-center gap-3">
                                    {config.logo && (
                                        <button onClick={() => updateConfig('logo', '')} className="text-red-400 hover:underline text-[10px] font-bold uppercase">Remove</button>
                                    )}
                                    <label className="cursor-pointer text-[var(--builder-primary)] hover:underline flex items-center gap-1">
                                        <Icons.Upload className="w-3 h-3" /> Upload
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo', 300)} />
                                    </label>
                                </div>
                            </label>
                            {config.logo && (config.logo.startsWith('data:image') || config.logo.startsWith('blob:')) ? (
                                <div className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl px-4 py-3 text-white/50 text-sm italic flex items-center justify-between">
                                    <span>Uploaded Image</span>
                                    <img src={config.logo} alt="Preview" className="h-6 w-auto object-contain rounded" />
                                </div>
                            ) : (
                                <input 
                                    type="text" 
                                    value={config.logo || ''}
                                    onChange={(e) => updateConfig('logo', e.target.value)}
                                    placeholder="https:// or Base64"
                                    className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md"
                                />
                            )}
                        </div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 flex items-center justify-between">
                                Cover / Hero Image
                                <div className="flex items-center gap-3">
                                    {config.coverImage && (
                                        <button onClick={() => updateConfig('coverImage', '')} className="text-red-400 hover:underline text-[10px] font-bold uppercase">Remove</button>
                                    )}
                                    <label className="cursor-pointer text-[var(--builder-primary)] hover:underline flex items-center gap-1">
                                        <Icons.Upload className="w-3 h-3" /> Upload
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'coverImage', 1400)} />
                                    </label>
                                </div>
                            </label>
                            {config.coverImage && (config.coverImage.startsWith('data:image') || config.coverImage.startsWith('blob:')) ? (
                                <div className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl px-4 py-3 text-white/50 text-sm italic flex items-center justify-between">
                                    <span>Uploaded Image</span>
                                    <img src={config.coverImage} alt="Preview" className="h-6 w-auto object-cover rounded" />
                                </div>
                            ) : (
                                <input 
                                    type="text" 
                                    value={config.coverImage || ''}
                                    onChange={(e) => updateConfig('coverImage', e.target.value)}
                                    placeholder="https:// or Base64"
                                    className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md"
                                />
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="space-y-4">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 pt-4 border-t border-white/10"><Icons.MousePointerClick className="w-3 h-3" /> Action Button</div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">{t('wb_buttonText', 'Button Text')}</label>
                                <input 
                                    type="text" 
                                    value={config.ctaText || ''}
                                    onChange={(e) => updateConfig('ctaText', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">{t('wb_buttonLink', 'Button Link')}</label>
                                <input 
                                    type="text" 
                                    value={config.ctaLink || ''}
                                    onChange={(e) => updateConfig('ctaLink', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Agency Stats Section (Agency template only) */}
                    {config.template === 'agency' && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Icons.TrendingUp className="w-3.5 h-3.5 text-[var(--builder-primary)]" />
                                    <span>Agency Stats (Revenue / Reach / Satisfaction / ROI)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updateConfig('showAgencyStats', !(config.showAgencyStats !== false ? true : false))}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                        config.showAgencyStats !== false
                                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                            : 'bg-white/5 border-white/10 text-white/50'
                                    }`}
                                >
                                    {config.showAgencyStats !== false ? 'Stats Visible' : 'Stats Hidden'}
                                </button>
                            </div>

                            {config.showAgencyStats !== false && (
                                <div className="space-y-3 pt-1">
                                    {[
                                        { key: 'statRevenue', label: 'Client Revenue', defaultLabel: 'Client Revenue', defaultVal: '$50M+' },
                                        { key: 'statCountries', label: 'Global Reach', defaultLabel: 'Global Reach', defaultVal: '48+ Countries' },
                                        { key: 'statSatisfaction', label: 'Client Satisfaction', defaultLabel: 'Client Satisfaction', defaultVal: '99.8%' },
                                        { key: 'statRoi', label: 'ROI Guarantee', defaultLabel: 'ROI Guarantee', defaultVal: '3.5x Avg' }
                                    ].map((s) => {
                                        const arr = config.agencyStats || [];
                                        const defaults = [
                                            { label: 'Client Revenue', val: '$50M+' },
                                            { label: 'Global Reach', val: '48+ Countries' },
                                            { label: 'Client Satisfaction', val: '99.8%' },
                                            { label: 'ROI Guarantee', val: '3.5x Avg' }
                                        ];
                                        const idx = ['statRevenue', 'statCountries', 'statSatisfaction', 'statRoi'].indexOf(s.key);
                                        const cur = arr[idx] || defaults[idx];
                                        return (
                                            <div key={s.key} className="flex flex-col sm:flex-row gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                                                <div className="flex-1">
                                                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1 block">Label · {s.label}</label>
                                                    <input
                                                        type="text"
                                                        value={cur.label}
                                                        onChange={(e) => {
                                                            const next = [...(config.agencyStats || defaults)];
                                                            next[idx] = { ...next[idx], label: e.target.value };
                                                            updateConfig('agencyStats', next);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[var(--builder-primary)] transition-all"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1 block">Value</label>
                                                    <input
                                                        type="text"
                                                        value={cur.val}
                                                        onChange={(e) => {
                                                            const next = [...(config.agencyStats || defaults)];
                                                            next[idx] = { ...next[idx], val: e.target.value };
                                                            updateConfig('agencyStats', next);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[var(--builder-primary)] transition-all font-black"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Store & Products Section (Shopify / Stripe Links & Size Selectors) */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Icons.ShoppingBag className="w-3.5 h-3.5 text-[var(--builder-primary)]" />
                                <span>Store & Products (Shopify / Stripe)</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => updateConfig('hasStore', !config.hasStore)}
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                    config.hasStore 
                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                                        : 'bg-white/5 border-white/10 text-white/50'
                                }`}
                            >
                                {config.hasStore ? 'Store Active' : 'Store Disabled'}
                            </button>
                        </div>

                        {config.hasStore && (
                            <div className="space-y-4 pt-1">
                                <p className="text-[11px] text-white/50 leading-relaxed">
                                    Add products, clothing/shoe sizes, and Stripe payment links (e.g. <span className="text-[var(--builder-primary)] font-mono">https://buy.stripe.com/...</span>) for direct checkout.
                                </p>

                                <div className="space-y-3">
                                    {(config.products || []).map((prod, pIdx) => (
                                        <div key={prod.id || pIdx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 relative group">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-black uppercase text-[var(--builder-primary)]">Product #{pIdx + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = (config.products || []).filter((_, i) => i !== pIdx);
                                                        updateConfig('products', updated);
                                                    }}
                                                    className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Icons.Trash2 className="w-3 h-3" /> Remove
                                                </button>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <input
                                                    type="text"
                                                    value={prod.name || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(config.products || [])];
                                                        updated[pIdx].name = e.target.value;
                                                        updateConfig('products', updated);
                                                    }}
                                                    placeholder="Product Name (e.g. Oversized Tee)"
                                                    className="sm:flex-[2] w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-[var(--builder-primary)]"
                                                />
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-[var(--builder-primary)] font-black text-sm">€</span>
                                                    <input
                                                        type="number"
                                                        value={prod.price || ''}
                                                        onChange={(e) => {
                                                            const updated = [...(config.products || [])];
                                                            updated[pIdx].price = Number(e.target.value);
                                                            updateConfig('products', updated);
                                                        }}
                                                        placeholder="Price"
                                                        className="sm:flex-1 w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-[var(--builder-primary)]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Stripe Checkout Link */}
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-white/50 flex items-center gap-1">
                                                    <Icons.CreditCard className="w-3 h-3 text-[var(--builder-primary)]" /> Stripe Payment / Checkout Link
                                                </label>
                                                <input
                                                    type="text"
                                                    value={prod.stripeLink || prod.buyLink || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(config.products || [])];
                                                        updated[pIdx].stripeLink = e.target.value;
                                                        updateConfig('products', updated);
                                                    }}
                                                    placeholder="https://buy.stripe.com/..."
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[var(--builder-primary)] font-mono"
                                                />
                                            </div>

                                            {/* Image URL / Upload */}
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-white/50 flex items-center justify-between">
                                                    <span>Product Image</span>
                                                    <label className="cursor-pointer text-[var(--builder-primary)] text-[10px] font-bold uppercase flex items-center gap-1">
                                                        <Icons.Upload className="w-3 h-3" /> Upload
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            className="hidden" 
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    compressImageFile(file, 800, 0.75).then(dataUrl => {
                                                                        const updated = [...(config.products || [])];
                                                                        updated[pIdx].image = dataUrl;
                                                                        updateConfig('products', updated);
                                                                        if (e && e.target) e.target.value = '';
                                                                    }).catch(() => {});
                                                                }
                                                            }} 
                                                        />
                                                    </label>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={prod.image || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(config.products || [])];
                                                        updated[pIdx].image = e.target.value;
                                                        updateConfig('products', updated);
                                                    }}
                                                    placeholder="Image URL (https://...)"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[var(--builder-primary)]"
                                                />
                                            </div>

                                            {/* Size Options (Clothing / Shoes / Custom) */}
                                            <div className="space-y-1.5 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] uppercase font-bold text-white/50">Size Options</label>
                                                    <div className="flex gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                            updateProduct(pIdx, (p) => {
                                                                const newSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
                                                                const oldSizes = (p.sizes || []).concat(p.clothingSizes || [], p.shoeSizes || []);
                                                                const newSizeLinks = {};
                                                                newSizes.forEach(sz => { newSizeLinks[sz] = (p.sizeLinks || {})[sz] || ''; });
                                                                const out = { ...p, sizes: newSizes, sizeLinks: newSizeLinks };
                                                                delete out.clothingSizes;
                                                                delete out.shoeSizes;
                                                                return out;
                                                            });
                                                        }}
                                                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] font-bold text-white/70 cursor-pointer"
                                                        >
                                                            + Clothes (XS-XXL)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                updateProduct(pIdx, (p) => {
                                                                    const newSizes = ['EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'];
                                                                    const newSizeLinks = {};
                                                                    newSizes.forEach(sz => { newSizeLinks[sz] = (p.sizeLinks || {})[sz] || ''; });
                                                                    const out = { ...p, sizes: newSizes, sizeLinks: newSizeLinks };
                                                                    delete out.clothingSizes;
                                                                    delete out.shoeSizes;
                                                                    return out;
                                                                });
                                                            }}
                                                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] font-bold text-white/70 cursor-pointer"
                                                        >
                                                            + Shoes (39-45)
                                                        </button>
                                                    </div>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={(prod.sizes || []).join(', ')}
                                                    onChange={(e) => {
                                                        const newSizes = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                                        updateProduct(pIdx, (p) => {
                                                            const newSizeLinks = {};
                                                            newSizes.forEach(sz => { newSizeLinks[sz] = (p.sizeLinks || {})[sz] || ''; });
                                                            const out = { ...p, sizes: newSizes, sizeLinks: newSizeLinks };
                                                            delete out.clothingSizes;
                                                            delete out.shoeSizes;
                                                            return out;
                                                        });
                                                    }}
                                                    placeholder="S, M, L or 42, 43, 44"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[var(--builder-primary)]"
                                                />
                                            </div>

                                            {/* Size-Specific Links */}
                                            {prod.sizes && prod.sizes.length > 0 && (
                                                <div className="space-y-2 mt-3 pt-3 border-t border-white/10">
                                                    <label className="text-[10px] uppercase font-bold text-white/50">Stripe Link Per Size (Overrides general link)</label>
                                                    {prod.sizes.map((s, sIdx) => (
                                                        <div key={sIdx} className="flex items-center gap-2">
                                                            <div className="w-16 shrink-0 text-center px-2 py-1.5 bg-white/10 rounded-lg font-bold text-[10px] text-white/80 overflow-hidden truncate">
                                                                {s}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={(prod.sizeLinks && prod.sizeLinks[s]) || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...(config.products || [])];
                                                                    if (!updated[pIdx].sizeLinks) updated[pIdx].sizeLinks = {};
                                                                    updated[pIdx].sizeLinks[s] = e.target.value;
                                                                    updateConfig('products', updated);
                                                                }}
                                                                placeholder={`Link for size ${s}`}
                                                                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-[var(--builder-primary)] font-mono"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Badge */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={prod.badge || ''}
                                                    onChange={(e) => {
                                                        const updated = [...(config.products || [])];
                                                        updated[pIdx].badge = e.target.value;
                                                        updateConfig('products', updated);
                                                    }}
                                                    placeholder="Badge (e.g. Best Seller / New Drop)"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[var(--builder-primary)]"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newProd = {
                                                id: Date.now().toString(),
                                                name: 'New Product Item',
                                                price: 49,
                                                stripeLink: '',
                                                image: '',
                                                sizes: [],
                                                badge: 'NEW'
                                            };
                                            updateConfig('products', [...(config.products || []), newProd]);
                                        }}
                                        className="w-full py-3 rounded-xl border border-dashed border-white/20 hover:border-[var(--builder-primary)] text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all bg-white/[0.02] cursor-pointer"
                                    >
                                        <Icons.Plus className="w-4 h-4" /> Add Product
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contact Information (moved below Products for better mobile layout) */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Icons.Mail className="w-3.5 h-3.5 text-[var(--builder-primary)]" />
                            <span>Contact & Social Information</span>
                        </div>
                        <div className="space-y-3 pt-1">
                            <div>
                                <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Contact Information</label>
                                <div className="flex flex-col gap-2">
                                    <input 
                                        type="text" 
                                        value={config.contactEmail || ''}
                                        onChange={(e) => updateConfig('contactEmail', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" 
                                        placeholder="Email Address" 
                                    />
                                    <input 
                                        type="text" 
                                        value={config.contactPhone || ''}
                                        onChange={(e) => updateConfig('contactPhone', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" 
                                        placeholder="Phone Number" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Social Links (Leave empty to hide)</label>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <XIcon className="w-4 h-4 text-white/50 shrink-0" />
                                        <input type="text" value={config.socialX || ''} onChange={(e) => updateConfig('socialX', e.target.value)} className="flex-1 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="X (Twitter) URL" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Icons.Instagram className="w-4 h-4 text-white/50 shrink-0" />
                                        <input type="text" value={config.socialInstagram || ''} onChange={(e) => updateConfig('socialInstagram', e.target.value)} className="flex-1 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="Instagram URL" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Icons.Linkedin className="w-4 h-4 text-white/50 shrink-0" />
                                        <input type="text" value={config.socialLinkedin || ''} onChange={(e) => updateConfig('socialLinkedin', e.target.value)} className="flex-1 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="LinkedIn URL" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TiktokIcon className="w-4 h-4 text-white/50 shrink-0" />
                                        <input type="text" value={config.socialTiktok || ''} onChange={(e) => updateConfig('socialTiktok', e.target.value)} className="flex-1 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="TikTok URL" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Icons.Youtube className="w-4 h-4 text-white/50 shrink-0" />
                                        <input type="text" value={config.socialYoutube || ''} onChange={(e) => updateConfig('socialYoutube', e.target.value)} className="flex-1 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="YouTube URL" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Icons.Facebook className="w-4 h-4 text-white/50 shrink-0" />
                                        <input type="text" value={config.socialFacebook || ''} onChange={(e) => updateConfig('socialFacebook', e.target.value)} className="flex-1 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="Facebook URL" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Icons.MessageCircle className="w-4 h-4 text-white/50 shrink-0" />
                                        <input type="text" value={config.socialWhatsapp || ''} onChange={(e) => updateConfig('socialWhatsapp', e.target.value)} className="flex-1 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="WhatsApp Number/URL" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Design */}
                    <div className="space-y-6">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 pt-4 border-t border-white/10"><Icons.Palette className="w-3 h-3" /> Aesthetics</div>
                        
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-3 block">Website Template</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                                {['classic', 'ecommerce', 'agency', 'luxury', 'saas', 'corporate', 'creative', 'fitness', 'newspaper', 'restaurant', 'technology', 'football', 'betting', 'portfolio', 'realestate', 'gaming', 'mafia'].map(tmpl => (
                                    <button
                                        key={tmpl}
                                        onClick={() => updateConfig('template', tmpl)}
                                        className={`w-full text-center px-2 py-3 rounded-xl border transition-all text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${config.template === tmpl ? 'border-[var(--builder-primary)] bg-[var(--builder-primary)]/10 text-white' : 'border-white/10 bg-white/5 hover:border-white/30 text-white/50 hover:bg-white/5'}`}
                                    >
                                        {tmpl}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-3 block">Color Theme</label>
                            <div className="flex flex-wrap items-center gap-3">
                                {Object.keys(themeColors).map(c => (
                                    <button 
                                        key={c}
                                        type="button"
                                        onClick={() => updateConfig('palette', c)}
                                        className={`shrink-0 w-10 h-10 rounded-full border-2 transition-all ${config.palette === c ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                        style={{ backgroundColor: themeColors[c].primary }}
                                        title={c.charAt(0).toUpperCase() + c.slice(1)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-3 block">{t('wb_typography', 'Typography')}</label>
                            <div className="space-y-2">
                                {['Inter', 'Roboto', 'Oswald', 'Space Grotesk', 'Playfair Display', 'Outfit', 'Montserrat', 'Syne', 'Cinzel', 'Roboto Mono', 'DM Sans'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => updateConfig('font', f)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-xs font-bold ${config.font === f ? 'border-[var(--builder-primary)] bg-[var(--builder-primary)]/10 text-white' : 'border-white/10 bg-white/5 hover:border-white/30 text-white/50 hover:bg-white/5'}`}
                                        style={{ fontFamily: f }}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="h-10" /> {/* Bottom Padding */}
                </div>
            </div>

            {/* MAIN CANVAS - Live Preview */}
            <div className={`flex-1 bg-[#121214] flex flex-col relative overflow-hidden ${mobileTab === 'form' ? 'hidden md:flex' : 'flex'}`}>
                {/* Desktop Top Bar: simple title, no mobile switcher */}
                <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-[#0a0a0c] border-b border-white/10 z-20 shrink-0 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Live Preview:</span>
                        {config.businessName && (
                            <span className="text-xs font-bold text-white max-w-[300px] truncate">{config.businessName}</span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        Desktop Full View
                    </span>
                </div>

                {/* Workspace / Live Preview - Always full size, no phone frame */}
                <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar relative pb-32 w-full touch-pan-y bg-[#0c0c0e]" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {/* The Website Preview Container - Full width always on desktop, natural full width on mobile */}
                    <motion.div 
                        layout
                        className={`w-full md:max-w-7xl md:mx-auto md:my-6 md:rounded-2xl md:border md:border-white/10 relative z-10 flex flex-col shadow-2xl overflow-x-hidden ${resolvedPalette === 'light' ? 'shadow-white/5' : ''}`}
                        style={{ 
                            fontFamily: config.font,
                            backgroundColor: activeTheme.bg,
                            color: resolvedPalette === 'light' ? '#000' : '#fff',
                            minHeight: 'calc(100vh - 140px)'
                        }}
                    >
                        <div className="flex-1 flex flex-col w-full overflow-x-hidden relative">
                            {/* Global Navbar */}
                            <nav className={`absolute top-0 left-0 right-0 z-50 w-full px-4 sm:px-6 md:px-12 py-4 sm:py-5 md:py-6 flex items-center justify-between ${resolvedPalette === 'light' ? 'border-b border-black/5' : 'border-b border-white/5'}`}>
                            <div className="flex items-center gap-3 min-w-0">
                                {config.logo ? (
                                    <img src={config.logo} alt="Logo" className="h-7 sm:h-8 w-auto object-contain drop-shadow-lg shrink-0" />
                                ) : (
                                    <span className="font-black tracking-tight text-base sm:text-lg drop-shadow-md truncate">{config.businessName}</span>
                                )}
                            </div>
                            <div className="hidden md:flex gap-6 sm:gap-8 text-sm font-bold opacity-70">
                                {config.navLink1 !== '' && <a href="#services" onClick={e=>e.preventDefault()} className="hover:opacity-100 transition-opacity whitespace-nowrap">{config.navLink1 ?? 'Υπηρεσίες'}</a>}
                                {config.navLink2 !== '' && <a href="#about" onClick={e=>e.preventDefault()} className="hover:opacity-100 transition-opacity whitespace-nowrap">{config.navLink2 ?? 'Σχετικά'}</a>}
                                {config.navLink3 !== '' && <a href="#contact" onClick={e=>e.preventDefault()} className="hover:opacity-100 transition-opacity whitespace-nowrap">{config.navLink3 ?? 'Επικοινωνία'}</a>}
                            </div>
                        </nav>

                        {/* Render Template Body based on config.template */}
                        {(() => {
                            const tmplProps = { config, activeTheme, setZoomImage, resolvedPalette };
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
                                case 'mafia': return <MafiaTemplate {...tmplProps} />;
                                case 'classic':
                                default:
                                    return <ClassicTemplate {...tmplProps} />;
                            }
                        })()}

                        {/* Shop Section is globally available below any template if products exist */}
                        {config.hasStore && config.products && config.products.length > 0 && (
                            <div id="shop" className={`w-full px-4 sm:px-6 md:px-12 py-12 sm:py-16 md:py-24 border-t ${resolvedPalette === 'light' ? 'border-black/5' : 'border-white/5'}`}>
                                <h3 className="break-words hyphens-auto text-2xl sm:text-3xl md:text-4xl font-black mb-2 sm:mb-3 text-center tracking-tight">Our Products</h3>
                                <p className="break-words hyphens-auto text-center opacity-60 max-w-2xl mx-auto mb-8 sm:mb-12 text-xs sm:text-sm">Premium selection of our best items.</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
                                    {config.products.map(product => {
                                        const sizes = product.sizes || product.clothingSizes || product.shoeSizes || [];
                                        const hasStripe = !!(product.stripeLink || product.buyLink);

                                        return (
                                            <div key={product.id} className={`group rounded-3xl overflow-hidden shadow-2xl transition-all hover:-translate-y-2 flex flex-col ${resolvedPalette === 'light' ? 'border border-black/10' : 'border border-white/10'}`} style={{ backgroundColor: activeTheme.card }}>
                                                <div className={`w-full aspect-square overflow-hidden relative ${resolvedPalette === 'light' ? 'bg-black/5' : 'bg-black/20'}`}>
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Icons.ShoppingBag className={`w-12 h-12 ${resolvedPalette === 'light' ? 'opacity-10' : 'opacity-20'}`} />
                                                        </div>
                                                    )}
                                                    <div className={`absolute top-3 sm:top-4 right-3 sm:right-4 ${resolvedPalette === 'light' ? 'bg-black/80' : 'bg-black/60'} backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full ${resolvedPalette === 'light' ? 'border border-black/10' : 'border border-white/10'}`}>
                                                        <span className="break-words hyphens-auto text-white font-black text-[11px] sm:text-sm">€{product.price}</span>
                                                    </div>
                                                    {product.badge && (
                                                        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-[var(--builder-primary)] text-black px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider shadow-sm">
                                                            {product.badge}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                                                    <h4 className="text-sm sm:text-base md:text-lg font-bold mb-1">{product.name}</h4>
                                                    {sizes.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                                                            {sizes.slice(0, 4).map((s, idx) => (
                                                                <span key={idx} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${resolvedPalette === 'light' ? 'bg-black/5 border border-black/10 text-black/60' : 'bg-white/5 border border-white/10 text-white/60'}`}>
                                                                    {s}
                                                                </span>
                                                            ))}
                                                            {sizes.length > 4 && <span className={`text-[9px] font-bold self-center ${resolvedPalette === 'light' ? 'text-black/40' : 'text-white/40'}`}>+{sizes.length - 4}</span>}
                                                        </div>
                                                    )}
                                                    <div className="flex-1"></div>
                                                    <button 
                                                        onClick={e=>e.preventDefault()}
                                                        className="w-full py-2.5 sm:py-3 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-[11px] transition-all mt-auto flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                                                        style={{ backgroundColor: activeTheme.primary, color: resolvedPalette === 'light' ? '#fff' : '#000' }}
                                                    >
                                                        <Icons.ShoppingBag className="w-3.5 h-3.5" />
                                                        <span>{hasStripe ? 'Buy (Stripe)' : 'Buy Now'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* About and Contact Sections appended globally if defined */}
                        {config.aboutText && (
                            <div id="about" className={`w-full px-4 sm:px-6 md:px-12 py-12 sm:py-16 ${resolvedPalette === 'light' ? 'bg-white' : 'bg-transparent'}`}>
                                {config.navLink2 !== '' && <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6 sm:mb-8 text-center tracking-tight">{config.navLink2 ?? 'Σχετικά'}</h3>}
                                <p className="text-center max-w-2xl mx-auto opacity-70 leading-relaxed text-base sm:text-lg break-words hyphens-auto">
                                    {config.aboutText}
                                </p>
                            </div>
                        )}

                        {(config.contactEmail || config.contactPhone) && (
                            <div id="contact" className={`w-full px-4 sm:px-6 md:px-12 py-12 sm:py-16 ${resolvedPalette === 'light' ? 'bg-black/5' : 'bg-white/[0.02]'}`}>
                                {config.navLink3 !== '' && <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mb-8 sm:mb-12 text-center tracking-tight">{config.navLink3 ?? 'Επικοινωνία'}</h3>}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 max-w-2xl mx-auto w-full">
                                    {config.contactEmail && (
                                        <a href={`mailto:${config.contactEmail}`} className={`w-full sm:w-auto flex items-center gap-3 p-4 rounded-2xl transition-colors ${resolvedPalette === 'light' ? 'hover:bg-black/5' : 'hover:bg-white/5'}`} style={{ backgroundColor: activeTheme.card }}>
                                            <Icons.Mail className="w-5 h-5 opacity-50" />
                                            <span className="font-bold text-sm sm:text-base truncate max-w-[240px]">{config.contactEmail}</span>
                                        </a>
                                    )}
                                    {config.contactPhone && (
                                        <a href={`tel:${config.contactPhone}`} className={`w-full sm:w-auto flex items-center gap-3 p-4 rounded-2xl transition-colors ${resolvedPalette === 'light' ? 'hover:bg-black/5' : 'hover:bg-white/5'}`} style={{ backgroundColor: activeTheme.card }}>
                                            <Icons.Phone className="w-5 h-5 opacity-50" />
                                            <span className="font-bold text-sm sm:text-base">{config.contactPhone}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <footer className={`relative z-10 w-full px-4 sm:px-6 md:px-12 py-8 sm:py-12 flex flex-col md:flex-row items-center justify-between gap-4 ${resolvedPalette === 'light' ? 'border-t border-black/5' : 'border-t border-white/5'}`}>
                            <div className={`text-xs sm:text-sm font-bold opacity-50 text-center md:text-left`}>© {new Date().getFullYear()} {config.businessName}. All rights reserved.</div>
                            <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-4 opacity-75`}>
                                {config.socialX && (
                                    <a href={config.socialX} onClick={e=>e.preventDefault()} className={`hover:opacity-100 transition-opacity p-2 rounded-full ${resolvedPalette === 'light' ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'}`}>
                                        <XIcon className="w-4 h-4" />
                                    </a>
                                )}
                                {config.socialInstagram && (
                                    <a href={config.socialInstagram} onClick={e=>e.preventDefault()} className={`hover:opacity-100 transition-opacity p-2 rounded-full ${resolvedPalette === 'light' ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'}`}>
                                        <Icons.Instagram className="w-4 h-4" />
                                    </a>
                                )}
                                {config.socialTiktok && (
                                    <a href={config.socialTiktok} onClick={e=>e.preventDefault()} className={`hover:opacity-100 transition-opacity p-2 rounded-full ${resolvedPalette === 'light' ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'}`}>
                                        <TiktokIcon className="w-4 h-4" />
                                    </a>
                                )}
                                {config.socialLinkedin && (
                                    <a href={config.socialLinkedin} onClick={e=>e.preventDefault()} className={`hover:opacity-100 transition-opacity p-2 rounded-full ${resolvedPalette === 'light' ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'}`}>
                                        <Icons.Linkedin className="w-4 h-4" />
                                    </a>
                                )}
                                {config.socialYoutube && (
                                    <a href={config.socialYoutube} onClick={e=>e.preventDefault()} className={`hover:opacity-100 transition-opacity p-2 rounded-full ${resolvedPalette === 'light' ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'}`}>
                                        <Icons.Youtube className="w-4 h-4" />
                                    </a>
                                )}
                                {config.socialFacebook && (
                                    <a href={config.socialFacebook} onClick={e=>e.preventDefault()} className={`hover:opacity-100 transition-opacity p-2 rounded-full ${resolvedPalette === 'light' ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'}`}>
                                        <Icons.Facebook className="w-4 h-4" />
                                    </a>
                                )}
                                {config.socialWhatsapp && (
                                    <a href={config.socialWhatsapp} onClick={e=>e.preventDefault()} className={`hover:opacity-100 transition-opacity p-2 rounded-full ${resolvedPalette === 'light' ? 'bg-black/5 hover:bg-black/10' : 'bg-white/5 hover:bg-white/10'}`}>
                                        <Icons.MessageCircle className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </footer>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>

        
            {/* Save Success Toast */}
            {showSaveSuccess && (
                <div className="fixed top-4 right-4 z-[5000] bg-green-500/20 border border-green-500/50 backdrop-blur-xl text-green-400 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <Icons.CheckCircle className="w-6 h-6" />
                    <div>
                        <div className="font-bold">Draft Saved</div>
                        <div className="text-sm opacity-80">You can continue editing safely.</div>
                    </div>
                </div>
            )}

            {/* Publish Success Modal */}
        <AnimatePresence>
            {showPublishSuccess && (
                <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-[#111113] border border-[var(--builder-primary)]/50 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--builder-primary)] to-transparent" />
                        <div className="w-20 h-20 mx-auto bg-[var(--builder-primary)]/10 rounded-full flex items-center justify-center mb-6">
                            <Icons.CheckCircle className="w-10 h-10 text-[var(--builder-primary)]" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">Website Published!</h2>
                        <p className="text-gray-400 text-sm mb-8">Your automated website is now live and can be shared with the world.</p>
                        
                        <div className="bg-black border border-white/10 rounded-xl p-4 flex items-center justify-between mb-8 relative">
                            {copyToast && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider shadow-xl animate-fade-in whitespace-nowrap">
                                    {t('LINK_COPIED', 'Copied to clipboard!')}
                                </div>
                            )}
                            <span className="text-xs text-white/80 font-mono truncate mr-4">
                                {window.location.origin}/?site={user?.username}&index={websiteIndex !== undefined ? websiteIndex : (websitesArray?.length || 0)}
                            </span>
                            <button 
                                type="button"
                                onClick={handleCopyUrl}
                                onTouchEnd={handleCopyUrl}
                                className={`w-8 h-8 shrink-0 rounded-md flex items-center justify-center transition-all touch-manipulation ${copyToast ? 'bg-green-500/20 text-green-400' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                            >
                                {copyToast ? <Icons.Check className="w-4 h-4" /> : <Icons.Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        
                        <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); setShowPublishSuccess(false); }}
                            onTouchEnd={(e) => { e.preventDefault(); setShowPublishSuccess(false); }}
                            className="w-full py-4 rounded-xl bg-[var(--builder-primary)] text-white font-black text-xs uppercase tracking-wider hover:opacity-90 transition-opacity touch-manipulation"
                        >
                            {t('CONTINUE_EDITING', 'Continue Editing')}
                        </button>
                    </motion.div>
                </div>
            )}
            {/* FULL SCREEN IMAGE ZOOM MODAL FOR BUILDER */}
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
        </AnimatePresence>
        </>
    );
};
