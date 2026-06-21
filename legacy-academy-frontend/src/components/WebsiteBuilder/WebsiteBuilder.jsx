import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useTranslation } from '../../translations';
import axios from '../../api';
import { simulateAIGeneration } from './aiSimulator';

const XIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

export const WebsiteBuilder = ({ initialConfig, websiteIndex, onExit, user, onUpdateUser, websitesArray }) => {
    const { t } = useTranslation();
    const [saving, setSaving] = useState(false);
    const [published, setPublished] = useState(false);
    const [previewMode, setPreviewMode] = useState('desktop'); // desktop, mobile

    // Mobile specific tab (form vs preview)
    const [mobileTab, setMobileTab] = useState('form');

    // AI Generator State
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    
    // Publish success state
    const [showPublishSuccess, setShowPublishSuccess] = useState(false);
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
    
    const [config, setConfig] = useState({
        businessName: existingWebsite.businessName || user?.username || 'My Business',
        slogan: existingWebsite.slogan ?? 'Building the future of digital excellence.',
        description: existingWebsite.description ?? 'We provide premium services to help your business grow and achieve unprecedented success in the modern digital landscape.',
        logo: existingWebsite.logo || '',
        coverImage: existingWebsite.coverImage || 'https://res.cloudinary.com/ddehek3eo/image/upload/v1781296353/legacyacademy/g2cp4zxk3ro1vqxrnwkt.jpg',
        palette: existingWebsite.palette || 'gold',
        font: existingWebsite.font || 'Inter',
        ctaText: existingWebsite.ctaText ?? 'Get in Touch',
        ctaLink: existingWebsite.ctaLink ?? '#',
        navLink1: existingWebsite.navLink1 ?? 'Services',
        navLink2: existingWebsite.navLink2 ?? 'About',
        navLink3: existingWebsite.navLink3 ?? 'Contact',
        featuresTitle: existingWebsite.featuresTitle ?? 'Why Choose Us',
        features: existingWebsite.features || [
            { title: 'Premium Quality 1', desc: 'We deliver nothing but the absolute best results for our clients.' },
            { title: 'Premium Quality 2', desc: 'We deliver nothing but the absolute best results for our clients.' },
            { title: 'Premium Quality 3', desc: 'We deliver nothing but the absolute best results for our clients.' }
        ],
        aboutText: existingWebsite.aboutText ?? 'We are a leading agency specializing in high-end digital solutions. Our team is dedicated to pushing the boundaries of what is possible on the web.',
        contactEmail: existingWebsite.contactEmail ?? 'contact@example.com',
        contactPhone: existingWebsite.contactPhone ?? '+1 (555) 123-4567',
        socialX: existingWebsite.socialX ?? 'https://x.com',
        socialInstagram: existingWebsite.socialInstagram ?? 'https://instagram.com',
        socialLinkedin: existingWebsite.socialLinkedin ?? 'https://linkedin.com',
        hasStore: existingWebsite.hasStore || false,
        products: existingWebsite.products || []
    });

    const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

    const handleImageUpload = (e, key, maxWidth) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress to WebP or JPEG
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                updateConfig(key, dataUrl);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handlePublish = async (isDraft = false) => {
        if (!user?._id) return;
        setSaving(true);
        try {
            const newWebsites = [...(websitesArray || [])];
            const updatedConfig = { ...config, lastUpdated: new Date(), isDraft };
            
            if (websiteIndex !== undefined && websiteIndex !== null && websiteIndex < newWebsites.length) {
                newWebsites[websiteIndex] = updatedConfig;
            } else {
                newWebsites.push(updatedConfig);
            }

            const payload = { settings: { businessWebsites: newWebsites } };
            const res = await axios.put('/users/settings', payload);
            
            if (onUpdateUser) {
                onUpdateUser({
                    ...user,
                    settings: {
                        ...(user.settings || {}),
                        businessWebsites: newWebsites
                    }
                });
            }
            
            setPublished(true);
            setShowPublishSuccess(true);
            setTimeout(() => setPublished(false), 3000);
        } catch (e) {
            console.error("Failed to publish website", e);
        } finally {
            setSaving(false);
        }
    };

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
        red: { primary: '#ef4444', bg: '#140505', card: '#1f0707' }
    };

    const activeTheme = themeColors[config.palette];

    return (
        <>
        <div className="fixed inset-0 z-[3000] bg-black flex flex-col md:flex-row font-sans w-full h-[100dvh] sm:h-screen overscroll-none touch-none" style={{ '--builder-primary': activeTheme?.primary || '#D4AF37' }}>
            
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
            <div className="fixed bottom-0 left-0 w-full bg-[#050505] border-t border-white/10 p-4 z-[4000] flex gap-3 shadow-[0_-20px_40px_rgba(0,0,0,0.9)] pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
                <button 
                    onClick={() => handlePublish(true)}
                    disabled={saving}
                    className="flex-1 py-3.5 rounded-xl border border-white/20 text-white font-bold text-[12px] uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Icons.Save className="w-4 h-4" /> Save Draft
                </button>
                <button 
                    onClick={() => handlePublish(false)}
                    className="flex-1 py-3.5 rounded-xl bg-[var(--builder-primary)] text-white font-black text-[12px] uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                >
                    <Icons.Globe className="w-4 h-4" /> {saving ? 'Publishing...' : 'Publish Live'}
                </button>
            </div>

            {/* LEFT SIDEBAR - Form Inputs */}
            <div className={`w-full md:w-[400px] bg-[#09090b] border-r border-white/10 flex-1 min-h-0 flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] shrink-0 ${mobileTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-white/[0.02]">
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
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Business Name</label>
                            <input 
                                type="text" 
                                value={config.businessName || ''}
                                onChange={(e) => updateConfig('businessName', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Catchy Slogan</label>
                            <input 
                                type="text" 
                                value={config.slogan || ''}
                                onChange={(e) => updateConfig('slogan', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Description</label>
                            <textarea 
                                value={config.description || ''}
                                onChange={(e) => updateConfig('description', e.target.value)}
                                rows="3"
                                className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md resize-none"
                            />
                        </div>
                        <div className="pt-2 border-t border-white/5">
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Navigation Links</label>
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
                                            placeholder="Title" 
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
                                            placeholder="Description" 
                                        />
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] text-white/40 uppercase font-bold">Image (Optional)</span>
                                            <label className="cursor-pointer text-[10px] text-[var(--builder-primary)] hover:underline flex items-center gap-1 font-bold uppercase tracking-wider">
                                                <Icons.Upload className="w-3 h-3" /> Upload
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        const updated = [...config.features];
                                                        updated[idx].image = event.target.result;
                                                        updateConfig('features', updated);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }} />
                                            </label>
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
                        <div className="pt-2 border-t border-white/5">
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Contact Information</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={config.contactEmail || ''}
                                    onChange={(e) => updateConfig('contactEmail', e.target.value)}
                                    className="w-1/2 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" 
                                    placeholder="Email Address" 
                                />
                                <input 
                                    type="text" 
                                    value={config.contactPhone || ''}
                                    onChange={(e) => updateConfig('contactPhone', e.target.value)}
                                    className="w-1/2 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" 
                                    placeholder="Phone Number" 
                                />
                            </div>
                        </div>
                        <div className="pt-2 border-t border-white/5">
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Social Links (Leave empty to hide)</label>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <XIcon className="w-4 h-4 text-white/50" />
                                    <input type="text" value={config.socialX || ''} onChange={(e) => updateConfig('socialX', e.target.value)} className="flex-1 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="X (Twitter) URL" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icons.Instagram className="w-4 h-4 text-white/50" />
                                    <input type="text" value={config.socialInstagram || ''} onChange={(e) => updateConfig('socialInstagram', e.target.value)} className="flex-1 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="Instagram URL" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icons.Linkedin className="w-4 h-4 text-white/50" />
                                    <input type="text" value={config.socialLinkedin || ''} onChange={(e) => updateConfig('socialLinkedin', e.target.value)} className="flex-1 bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md" placeholder="LinkedIn URL" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="space-y-4">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 pt-4 border-t border-white/10"><Icons.Image className="w-3 h-3" /> Media & Images</div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 flex items-center justify-between">
                                Logo
                                <label className="cursor-pointer text-[var(--builder-primary)] hover:underline flex items-center gap-1">
                                    <Icons.Upload className="w-3 h-3" /> Upload
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo', 300)} />
                                </label>
                            </label>
                            <input 
                                type="text" 
                                value={config.logo || ''}
                                onChange={(e) => updateConfig('logo', e.target.value)}
                                placeholder="https:// or Base64"
                                className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 flex items-center justify-between">
                                Cover / Hero Image
                                <label className="cursor-pointer text-[var(--builder-primary)] hover:underline flex items-center gap-1">
                                    <Icons.Upload className="w-3 h-3" /> Upload
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'coverImage', 1000)} />
                                </label>
                            </label>
                            <input 
                                type="text" 
                                value={config.coverImage || ''}
                                onChange={(e) => updateConfig('coverImage', e.target.value)}
                                placeholder="https:// or Base64"
                                className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md"
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="space-y-4">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 pt-4 border-t border-white/10"><Icons.MousePointerClick className="w-3 h-3" /> Action Button</div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Button Text</label>
                                <input 
                                    type="text" 
                                    value={config.ctaText || ''}
                                    onChange={(e) => updateConfig('ctaText', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Button Link</label>
                                <input 
                                    type="text" 
                                    value={config.ctaLink || ''}
                                    onChange={(e) => updateConfig('ctaLink', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 shadow-sm rounded-xl focus:ring-2 focus:ring-[var(--builder-primary)]/20 hover:bg-white/10 hover:border-white/20 px-4 py-3 text-white text-sm outline-none focus:border-[var(--builder-primary)] transition-all backdrop-blur-md"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Design */}
                    <div className="space-y-6">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 pt-4 border-t border-white/10"><Icons.Palette className="w-3 h-3" /> Aesthetics</div>
                        
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-3 block">Color Theme</label>
                            <div className="flex items-center gap-3">
                                {Object.keys(themeColors).map(c => (
                                    <button 
                                        key={c}
                                        type="button"
                                        onClick={() => updateConfig('palette', c)}
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${config.palette === c ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                        style={{ backgroundColor: themeColors[c].primary }}
                                        title={c.charAt(0).toUpperCase() + c.slice(1)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-3 block">Typography</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Inter', 'Playfair Display', 'Space Mono', 'Outfit'].map(f => (
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
            <div className={`flex-1 bg-[#151518] flex-col relative overflow-hidden ${mobileTab === 'form' ? 'hidden md:flex' : 'flex'}`}>
                {/* Workspace / Live Preview */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-0 md:p-8 flex justify-center items-start custom-scrollbar relative pb-32 w-full touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {/* The Website Preview Container */}
                    <motion.div 
                        layout
                        className={`shadow-2xl relative z-10 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-500 ${previewMode === 'mobile' ? 'w-full md:w-[375px] h-full md:h-[812px] md:mt-4 md:rounded-[40px] md:border-8 md:border-gray-900' : 'w-full max-w-6xl h-full md:rounded-2xl md:border md:border-white/10'}`}
                        style={{ 
                            fontFamily: config.font,
                            backgroundColor: activeTheme.bg,
                            color: config.palette === 'light' ? '#000' : '#fff'
                        }}
                    >
                        {/* Auto-Generated Website Layout */}
                        
                        {/* Navbar */}
                        <nav className={`w-full px-6 md:px-12 py-6 flex items-center justify-between ${config.palette === 'light' ? 'border-b border-black/5' : 'border-b border-white/5'}`}>
                            <div className="flex items-center gap-3">
                                {config.logo ? (
                                    <img src={config.logo} alt="Logo" className="h-8 w-auto object-contain drop-shadow-lg" />
                                ) : (
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center font-black text-white shadow-lg">
                                        {config.businessName.charAt(0)}
                                    </div>
                                )}
                                <span className="font-black tracking-tight text-lg drop-shadow-md">{config.businessName}</span>
                            </div>
                            <div className="hidden md:flex gap-8 text-sm font-bold opacity-70">
                                {config.navLink1 !== '' && <a href="#services" className="hover:opacity-100 transition-opacity">{config.navLink1 ?? 'Services'}</a>}
                                {config.navLink2 !== '' && <a href="#about" className="hover:opacity-100 transition-opacity">{config.navLink2 ?? 'About'}</a>}
                                {config.navLink3 !== '' && <a href="#contact" className="hover:opacity-100 transition-opacity">{config.navLink3 ?? 'Contact'}</a>}
                            </div>
                        </nav>

                        {/* Hero Section */}
                        <div className="w-full flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-12 py-12 md:py-24 gap-12 relative">
                            {/* Decorative Blur */}
                            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ backgroundColor: activeTheme.primary }} />
                            
                            <div className="flex-1 flex flex-col items-start z-10">
                                <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight mb-6" style={{ fontFamily: config.font }}>
                                    {config.slogan}
                                </h1>
                                <p className={`text-lg md:text-xl mb-10 leading-relaxed max-w-lg ${config.palette === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {config.description}
                                </p>
                                {config.ctaText !== '' && (
                                    <a 
                                        href={config.ctaLink === '#' ? '#contact' : config.ctaLink}
                                        className="px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all hover:scale-105 hover:shadow-2xl active:scale-95"
                                        style={{ 
                                            backgroundColor: activeTheme.primary, 
                                            color: config.palette === 'light' ? '#fff' : '#000',
                                            boxShadow: `0 0 30px ${activeTheme.primary}40`
                                        }}
                                    >
                                        {config.ctaText ?? 'Get in Touch'}
                                    </a>
                                )}
                            </div>

                            <div className="flex-1 w-full z-10">
                                <div className={`w-full aspect-square md:aspect-video max-h-[600px] object-cover rounded-[30px] overflow-hidden shadow-2xl relative ${config.palette === 'light' ? 'border-4 border-white' : 'border-4 border-white/5'}`}>
                                    <img src={config.coverImage} alt="Cover" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>
                            </div>
                        </div>

                        {/* Feature Cards / Posts */}
                        {config.features && config.features.length > 0 && (
                            <div id="services" className={`w-full px-6 md:px-12 py-16 ${config.palette === 'light' ? 'bg-black/5' : 'bg-white/[0.02]'}`}>
                                {config.featuresTitle !== '' && <h3 className="text-4xl font-black mb-16 text-center tracking-tight">{config.featuresTitle ?? 'Features'}</h3>}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {config.features?.map((feat, idx) => (
                                        <div key={idx} className="p-8 rounded-2xl flex flex-col gap-4 transition-all hover:-translate-y-2 overflow-hidden relative group" style={{ backgroundColor: activeTheme.card }}>
                                            {feat.image ? (
                                                <div className="-mx-8 -mt-8 mb-4 h-40 overflow-hidden relative">
                                                    <img src={feat.image} alt={feat.title} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${activeTheme.primary}20`, color: activeTheme.primary }}>
                                                    <Icons.Star className="w-6 h-6" />
                                                </div>
                                            )}
                                            <h4 className="text-xl font-bold relative z-10">{feat.title}</h4>
                                            <p className="opacity-60 text-sm leading-relaxed relative z-10">{feat.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* About Section */}
                        {config.aboutText && (
                            <div id="about" className={`w-full px-6 md:px-12 py-16 ${config.palette === 'light' ? 'bg-white' : 'bg-transparent'}`}>
                                {config.navLink2 !== '' && <h3 className="text-4xl font-black mb-8 text-center tracking-tight">{config.navLink2 ?? 'About'}</h3>}
                                <p className="text-center max-w-2xl mx-auto opacity-70 leading-relaxed text-lg">
                                    {config.aboutText}
                                </p>
                            </div>
                        )}

                        {/* Contact Section */}
                        {(config.contactEmail || config.contactPhone) && (
                            <div id="contact" className={`w-full px-6 md:px-12 py-16 ${config.palette === 'light' ? 'bg-black/5' : 'bg-white/[0.02]'}`}>
                                {config.navLink3 !== '' && <h3 className="text-4xl font-black mb-12 text-center tracking-tight">{config.navLink3 ?? 'Contact'}</h3>}
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
                        <footer className={`w-full px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4 ${config.palette === 'light' ? 'border-t border-black/5' : 'border-t border-white/5'}`}>
                            <div className="text-sm font-bold opacity-50">© {new Date().getFullYear()} {config.businessName}. All rights reserved.</div>
                            <div className="flex gap-4 opacity-50">
                                <Icons.Twitter className="w-5 h-5" />
                                <Icons.Instagram className="w-5 h-5" />
                                <Icons.Linkedin className="w-5 h-5" />
                            </div>
                        </footer>

                    </motion.div>
                </div>
            </div>
        </div>

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
        </AnimatePresence>
        </>
    );
};
