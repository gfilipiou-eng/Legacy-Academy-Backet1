import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useTranslation } from '../../translations';
import axios from '../../api';

export const WebsiteBuilder = ({ templateId, onExit, user, onUpdateUser }) => {
    const { t } = useTranslation();
    const [saving, setSaving] = useState(false);
    const [published, setPublished] = useState(false);
    const [previewMode, setPreviewMode] = useState('desktop'); // desktop, mobile

    // Mobile specific tab (form vs preview)
    const [mobileTab, setMobileTab] = useState('form');

    const existingWebsite = user?.settings?.businessWebsite || {};
    
    const [config, setConfig] = useState({
        businessName: existingWebsite.businessName || user?.username || 'My Business',
        slogan: existingWebsite.slogan || 'Building the future of digital excellence.',
        description: existingWebsite.description || 'We provide premium services to help your business grow and achieve unprecedented success in the modern digital landscape.',
        logo: existingWebsite.logo || '',
        coverImage: existingWebsite.coverImage || 'https://res.cloudinary.com/ddehek3eo/image/upload/v1781296353/legacyacademy/g2cp4zxk3ro1vqxrnwkt.jpg',
        palette: existingWebsite.palette || 'gold',
        font: existingWebsite.font || 'Inter',
        ctaText: existingWebsite.ctaText || 'Get in Touch',
        ctaLink: existingWebsite.ctaLink || '#'
    });

    const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

    const handlePublish = async () => {
        if (!user?._id) return;
        setSaving(true);
        try {
            const payload = { settings: { businessWebsite: { ...config, lastUpdated: new Date() } } };
            const res = await axios.put('/users/settings', payload);
            
            if (onUpdateUser) {
                onUpdateUser({
                    ...user,
                    settings: {
                        ...(user.settings || {}),
                        businessWebsite: { ...config, lastUpdated: new Date() }
                    }
                });
            }
            
            setPublished(true);
            setTimeout(() => setPublished(false), 3000);
        } catch (e) {
            console.error("Failed to publish website", e);
        } finally {
            setSaving(false);
        }
    };

    const themeColors = {
        gold: { primary: '#D4AF37', bg: '#09090b', card: '#111113' },
        blue: { primary: '#1D9BF0', bg: '#001018', card: '#001824' },
        pink: { primary: '#e83c74', bg: '#17050d', card: '#210712' },
        green: { primary: '#2fd840', bg: '#041206', card: '#061c09' },
        light: { primary: '#111111', bg: '#f8f9fa', card: '#ffffff' }
    };

    const activeTheme = themeColors[config.palette];

    return (
        <div className="absolute inset-0 z-50 bg-[#09090b] flex flex-col md:flex-row overflow-hidden font-sans">
            
            {/* MOBILE TABS (Only visible on small screens) */}
            <div className="md:hidden flex border-b border-white/10 shrink-0 bg-black z-30 pt-2">
                <button 
                    onClick={() => setMobileTab('form')}
                    className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider transition-colors ${mobileTab === 'form' ? 'text-[var(--gold-primary)] border-b-2 border-[var(--gold-primary)]' : 'text-gray-500'}`}
                >
                    Edit Details
                </button>
                <button 
                    onClick={() => setMobileTab('preview')}
                    className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider transition-colors ${mobileTab === 'preview' ? 'text-[var(--gold-primary)] border-b-2 border-[var(--gold-primary)]' : 'text-gray-500'}`}
                >
                    Live Preview
                </button>
            </div>

            {/* LEFT SIDEBAR - Form Inputs */}
            <div className={`w-full md:w-[400px] bg-[#09090b] border-r border-white/10 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] shrink-0 ${mobileTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <button onClick={onExit} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors -ml-2">
                            <Icons.ArrowLeft className="w-5 h-5 text-white/70" />
                        </button>
                        <span className="text-[var(--gold-primary)] font-black uppercase tracking-widest text-[11px]">
                            Website Setup
                        </span>
                    </div>
                    
                    <button 
                        onClick={handlePublish}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-full bg-[var(--gold-primary)] text-black font-black text-[10px] uppercase tracking-wider hover:bg-[var(--gold-hover)] transition-all flex items-center gap-2"
                    >
                        {saving ? <Icons.Loader className="w-3 h-3 animate-spin" /> : (published ? <Icons.Check className="w-3 h-3" /> : 'Publish')}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                    
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2"><Icons.Building className="w-3 h-3" /> Basic Info</div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Business Name</label>
                            <input 
                                type="text" 
                                value={config.businessName}
                                onChange={(e) => updateConfig('businessName', e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--gold-primary)] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Catchy Slogan</label>
                            <input 
                                type="text" 
                                value={config.slogan}
                                onChange={(e) => updateConfig('slogan', e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--gold-primary)] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Description</label>
                            <textarea 
                                value={config.description}
                                onChange={(e) => updateConfig('description', e.target.value)}
                                rows="3"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--gold-primary)] transition-colors resize-none"
                            />
                        </div>
                    </div>

                    {/* Media */}
                    <div className="space-y-4">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 pt-4 border-t border-white/10"><Icons.Image className="w-3 h-3" /> Media & Images</div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Logo URL (Optional)</label>
                            <input 
                                type="text" 
                                value={config.logo}
                                onChange={(e) => updateConfig('logo', e.target.value)}
                                placeholder="https://"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--gold-primary)] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Cover / Hero Image URL</label>
                            <input 
                                type="text" 
                                value={config.coverImage}
                                onChange={(e) => updateConfig('coverImage', e.target.value)}
                                placeholder="https://"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--gold-primary)] transition-colors"
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
                                    value={config.ctaText}
                                    onChange={(e) => updateConfig('ctaText', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--gold-primary)] transition-colors"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[11px] text-white/60 font-bold uppercase tracking-wide mb-1.5 block">Button Link</label>
                                <input 
                                    type="text" 
                                    value={config.ctaLink}
                                    onChange={(e) => updateConfig('ctaLink', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[var(--gold-primary)] transition-colors"
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
                                {[
                                    { id: 'gold', color: '#D4AF37' },
                                    { id: 'blue', color: '#1D9BF0' },
                                    { id: 'pink', color: '#e83c74' },
                                    { id: 'green', color: '#2fd840' },
                                    { id: 'light', color: '#f8f9fa' }
                                ].map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => updateConfig('palette', p.id)}
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${config.palette === p.id ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105 opacity-60 hover:opacity-100'}`}
                                        style={{ backgroundColor: p.color }}
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
                                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-xs font-bold ${config.font === f ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/5'}`}
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
                {/* Desktop Toolbar */}
                <div className="hidden md:flex h-16 border-b border-white/5 items-center justify-center px-6 bg-black/40 backdrop-blur-xl z-10 shadow-lg shrink-0">
                    <div className="flex items-center gap-2 bg-black/80 border border-white/10 rounded-lg p-1">
                        <button 
                            onClick={() => setPreviewMode('desktop')}
                            className={`px-6 py-1.5 rounded-md text-[11px] uppercase tracking-wider font-bold flex items-center gap-2 transition-all ${previewMode === 'desktop' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white/80'}`}
                        >
                            <Icons.Monitor className="w-3.5 h-3.5" /> Desktop
                        </button>
                        <button 
                            onClick={() => setPreviewMode('mobile')}
                            className={`px-6 py-1.5 rounded-md text-[11px] uppercase tracking-wider font-bold flex items-center gap-2 transition-all ${previewMode === 'mobile' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white/80'}`}
                        >
                            <Icons.Smartphone className="w-3.5 h-3.5" /> Mobile
                        </button>
                    </div>
                </div>

                {/* Workspace / Live Preview */}
                <div className="flex-1 overflow-auto p-0 md:p-8 flex justify-center items-start custom-scrollbar relative">
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
                                    <img src={config.logo} alt="Logo" className="h-8 w-auto object-contain" />
                                ) : (
                                    <div className="w-8 h-8 rounded bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center font-black text-white">
                                        {config.businessName.charAt(0)}
                                    </div>
                                )}
                                <span className="font-black tracking-tight text-lg">{config.businessName}</span>
                            </div>
                            <div className="hidden md:flex gap-8 text-sm font-bold opacity-70">
                                <span>Services</span>
                                <span>About</span>
                                <span>Contact</span>
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
                                <a 
                                    href={config.ctaLink}
                                    className="px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all hover:scale-105 hover:shadow-2xl"
                                    style={{ 
                                        backgroundColor: activeTheme.primary, 
                                        color: config.palette === 'light' ? '#fff' : '#000',
                                        boxShadow: `0 0 30px ${activeTheme.primary}40`
                                    }}
                                >
                                    {config.ctaText}
                                </a>
                            </div>

                            <div className="flex-1 w-full z-10">
                                <div className={`w-full aspect-square md:aspect-[4/5] rounded-[30px] overflow-hidden shadow-2xl relative ${config.palette === 'light' ? 'border-4 border-white' : 'border-4 border-white/5'}`}>
                                    <img src={config.coverImage} alt="Cover" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>
                            </div>
                        </div>

                        {/* Feature Cards (Auto-generated mock) */}
                        <div className={`w-full px-6 md:px-12 py-16 ${config.palette === 'light' ? 'bg-black/5' : 'bg-white/[0.02]'}`}>
                            <h3 className="text-2xl font-black mb-10 text-center">Why Choose Us</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="p-8 rounded-2xl flex flex-col gap-4 transition-all hover:-translate-y-2" style={{ backgroundColor: activeTheme.card }}>
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${activeTheme.primary}20`, color: activeTheme.primary }}>
                                            <Icons.Star className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-xl font-bold">Premium Quality {i}</h4>
                                        <p className="opacity-60 text-sm leading-relaxed">We deliver nothing but the absolute best results for our clients.</p>
                                    </div>
                                ))}
                            </div>
                        </div>

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
    );
};
