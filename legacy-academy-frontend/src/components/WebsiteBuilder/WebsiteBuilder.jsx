import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useTranslation } from '../../translations';
import axios from '../../api';

// Generate simple unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const WebsiteBuilder = ({ templateId, onExit, user, onUpdateUser }) => {
    const { t } = useTranslation();
    const [activePanel, setActivePanel] = useState('elements');
    const [device, setDevice] = useState('desktop');
    const [saving, setSaving] = useState(false);
    const [published, setPublished] = useState(false);

    // Initial State based on template or existing user data
    const existingWebsite = user?.settings?.businessWebsite;
    
    const defaultBlocks = existingWebsite?.blocks || (templateId === 'blank' ? [] : [
        { id: generateId(), type: 'heading', content: 'Welcome to our platform' },
        { id: generateId(), type: 'paragraph', content: 'We build digital experiences that drive growth and innovation.' },
        { id: generateId(), type: 'button', content: 'Get Started', link: '#' }
    ]);

    const defaultTheme = existingWebsite?.theme || { palette: 'gold', font: 'Inter' };

    const [blocks, setBlocks] = useState(defaultBlocks);
    const [theme, setTheme] = useState(defaultTheme);

    // --- Actions ---
    const addBlock = (type) => {
        let newBlock = { id: generateId(), type };
        if (type === 'heading') newBlock.content = 'New Heading';
        if (type === 'paragraph') newBlock.content = 'Start typing your paragraph here...';
        if (type === 'button') { newBlock.content = 'Click Me'; newBlock.link = '#'; }
        if (type === 'image') newBlock.content = 'https://placehold.co/600x400/111111/D4AF37?text=Image';
        if (type === 'divider') newBlock.content = '';
        
        setBlocks([...blocks, newBlock]);
    };

    const updateBlock = (id, updates) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const removeBlock = (id) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const moveBlock = (index, dir) => {
        if (index + dir < 0 || index + dir >= blocks.length) return;
        const newBlocks = [...blocks];
        const temp = newBlocks[index];
        newBlocks[index] = newBlocks[index + dir];
        newBlocks[index + dir] = temp;
        setBlocks(newBlocks);
    };

    const handlePublish = async () => {
        if (!user?._id) return;
        setSaving(true);
        try {
            const websiteConfig = { blocks, theme, lastUpdated: new Date() };
            const payload = { settings: { businessWebsite: websiteConfig } };
            const res = await axios.put('/users/settings', payload);
            
            if (onUpdateUser) {
                onUpdateUser({
                    ...user,
                    settings: {
                        ...(user.settings || {}),
                        businessWebsite: websiteConfig
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

    // --- Renderers ---
    const renderBlockContent = (block) => {
        switch (block.type) {
            case 'heading':
                return (
                    <h2 
                        className="text-4xl font-black mb-4 outline-none"
                        style={{ color: getThemeColor(theme.palette) }}
                        contentEditable 
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlock(block.id, { content: e.target.innerText })}
                    >
                        {block.content}
                    </h2>
                );
            case 'paragraph':
                return (
                    <p 
                        className="text-lg text-white/80 leading-relaxed mb-6 outline-none"
                        contentEditable 
                        suppressContentEditableWarning
                        onBlur={(e) => updateBlock(block.id, { content: e.target.innerText })}
                    >
                        {block.content}
                    </p>
                );
            case 'button':
                return (
                    <div className="mb-6 inline-block relative group/btn">
                        <button 
                            className="px-8 py-3 rounded-full font-bold uppercase tracking-wider text-black transition-all outline-none"
                            style={{ backgroundColor: getThemeColor(theme.palette) }}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateBlock(block.id, { content: e.target.innerText })}
                        >
                            {block.content}
                        </button>
                        <div className="absolute top-full left-0 mt-2 bg-black border border-white/20 p-2 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none group-hover/btn:pointer-events-auto z-20 flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-bold">URL:</span>
                            <input 
                                type="text" 
                                value={block.link || ''}
                                onChange={(e) => updateBlock(block.id, { link: e.target.value })}
                                className="bg-white/10 text-xs text-white px-2 py-1 rounded outline-none border border-transparent focus:border-white/30 w-32"
                                placeholder="https://"
                            />
                        </div>
                    </div>
                );
            case 'image':
                return (
                    <div className="mb-6 relative group/img w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <img src={block.content} alt="Builder block" className="w-full h-auto object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <input 
                                type="text" 
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                className="bg-black/80 text-sm text-white px-4 py-2 rounded-xl outline-none border border-white/20 focus:border-[var(--gold-primary)] w-3/4 shadow-2xl"
                                placeholder="Paste Image URL..."
                            />
                        </div>
                    </div>
                );
            case 'divider':
                return <div className="w-full h-px bg-white/10 my-8" />;
            default:
                return null;
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-[#09090b] flex overflow-hidden font-sans">
            {/* LEFT SIDEBAR */}
            <div className="w-72 bg-[#09090b] border-r border-white/10 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] shrink-0">
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-5 shrink-0 bg-white/[0.02]">
                    <span className="text-[var(--gold-primary)] font-black uppercase tracking-widest text-[11px]">
                        Legacy Builder
                    </span>
                    <button onClick={onExit} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Icons.X className="w-4 h-4 text-white/70" />
                    </button>
                </div>

                <div className="flex border-b border-white/10">
                    <button 
                        onClick={() => setActivePanel('elements')}
                        className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${activePanel === 'elements' ? 'text-[var(--gold-primary)] border-b-2 border-[var(--gold-primary)] bg-white/[0.03]' : 'text-gray-500 hover:text-white hover:bg-white/[0.02]'}`}
                    >
                        Elements
                    </button>
                    <button 
                        onClick={() => setActivePanel('theme')}
                        className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${activePanel === 'theme' ? 'text-[var(--gold-primary)] border-b-2 border-[var(--gold-primary)] bg-white/[0.03]' : 'text-gray-500 hover:text-white hover:bg-white/[0.02]'}`}
                    >
                        Theme
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {activePanel === 'elements' ? (
                        <div className="space-y-6">
                            <div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Add Elements</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => addBlock('heading')} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 hover:border-[var(--gold-primary)]/50 transition-all active:scale-95 group">
                                        <Icons.Type className="w-6 h-6 text-white/50 group-hover:text-white" />
                                        <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider">Heading</span>
                                    </button>
                                    <button onClick={() => addBlock('paragraph')} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 hover:border-[var(--gold-primary)]/50 transition-all active:scale-95 group">
                                        <Icons.AlignLeft className="w-6 h-6 text-white/50 group-hover:text-white" />
                                        <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider">Text</span>
                                    </button>
                                    <button onClick={() => addBlock('image')} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 hover:border-[var(--gold-primary)]/50 transition-all active:scale-95 group">
                                        <Icons.Image className="w-6 h-6 text-white/50 group-hover:text-white" />
                                        <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider">Image</span>
                                    </button>
                                    <button onClick={() => addBlock('button')} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 hover:border-[var(--gold-primary)]/50 transition-all active:scale-95 group">
                                        <Icons.MousePointerClick className="w-6 h-6 text-white/50 group-hover:text-white" />
                                        <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider">Button</span>
                                    </button>
                                    <button onClick={() => addBlock('divider')} className="col-span-2 bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-white/10 hover:border-[var(--gold-primary)]/50 transition-all active:scale-95 group">
                                        <Icons.Minus className="w-6 h-6 text-white/50 group-hover:text-white" />
                                        <span className="text-[11px] text-white/80 font-bold uppercase tracking-wider">Divider</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Color Palette</div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { id: 'gold', color: '#D4AF37' },
                                        { id: 'blue', color: '#1D9BF0' },
                                        { id: 'pink', color: '#ff69b4' },
                                        { id: 'green', color: '#44d62c' }
                                    ].map(p => (
                                        <button 
                                            key={p.id}
                                            onClick={() => setTheme({ ...theme, palette: p.id })}
                                            className={`w-10 h-10 rounded-full border-2 transition-all mx-auto ${theme.palette === p.id ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: p.color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Typography</div>
                                <div className="space-y-2">
                                    {['Inter', 'Playfair Display', 'Space Mono'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setTheme({ ...theme, font: f })}
                                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${theme.font === f ? 'border-[var(--gold-primary)] bg-[var(--gold-primary)]/10 text-white' : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/5'}`}
                                            style={{ fontFamily: f }}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN CANVAS */}
            <div className="flex-1 bg-[#151518] flex flex-col relative overflow-hidden">
                {/* Top Toolbar */}
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b]/80 backdrop-blur-xl z-10 shadow-lg shrink-0">
                    <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-lg p-1">
                        <button 
                            onClick={() => setDevice('desktop')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${device === 'desktop' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white/80'}`}
                        >
                            <Icons.Monitor className="w-4 h-4" /> Desktop
                        </button>
                        <button 
                            onClick={() => setDevice('mobile')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${device === 'mobile' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white/80'}`}
                        >
                            <Icons.Smartphone className="w-4 h-4" /> Mobile
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <AnimatePresence>
                            {published && (
                                <motion.span 
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                    className="text-green-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mr-2"
                                >
                                    <Icons.CheckCircle className="w-4 h-4" /> Published!
                                </motion.span>
                            )}
                        </AnimatePresence>
                        <button 
                            onClick={handlePublish}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-[var(--gold-primary)] text-black font-black text-xs uppercase tracking-wider hover:bg-[var(--gold-hover)] transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] active:scale-95 flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Icons.Loader className="w-4 h-4 animate-spin" /> : <Icons.Globe className="w-4 h-4" />}
                            Publish Site
                        </button>
                    </div>
                </div>

                {/* Workspace / Live Preview */}
                <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start custom-scrollbar relative">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    
                    <motion.div 
                        layout
                        className={`bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl relative z-10 flex flex-col p-8 transition-all duration-500 ${device === 'mobile' ? 'w-[375px] min-h-[812px]' : 'w-full max-w-5xl min-h-[800px]'}`}
                        style={{ fontFamily: theme.font }}
                    >
                        {blocks.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/10 rounded-xl">
                                <Icons.LayoutTemplate className="w-16 h-16 text-white/10 mb-4" />
                                <h2 className="text-white font-bold text-xl mb-2">Blank Canvas</h2>
                                <p className="text-gray-500 text-sm">Add elements from the sidebar to start building.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col w-full h-full">
                                <AnimatePresence mode="popLayout">
                                    {blocks.map((block, index) => (
                                        <motion.div 
                                            key={block.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="relative group/block w-full py-2"
                                        >
                                            {/* Block Controls */}
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-4 opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col gap-1 z-50">
                                                <button onClick={() => moveBlock(index, -1)} className="p-1.5 bg-black border border-white/20 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Move Up">
                                                    <Icons.ChevronUp className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => removeBlock(block.id)} className="p-1.5 bg-black border border-red-500/30 rounded-md hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-colors" title="Delete">
                                                    <Icons.Trash className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => moveBlock(index, 1)} className="p-1.5 bg-black border border-white/20 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Move Down">
                                                    <Icons.ChevronDown className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Actual Block Content */}
                                            <div className="w-full border border-transparent group-hover/block:border-white/10 rounded-lg p-2 transition-colors">
                                                {renderBlockContent(block)}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

// Helper for Theme Colors
function getThemeColor(palette) {
    switch (palette) {
        case 'blue': return '#1D9BF0';
        case 'pink': return '#ff69b4';
        case 'green': return '#44d62c';
        case 'gold': 
        default: return '#D4AF37';
    }
}
