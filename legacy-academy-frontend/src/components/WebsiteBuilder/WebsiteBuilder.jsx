import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useTranslation } from '../../translations';

export const WebsiteBuilder = ({ templateId, onExit }) => {
    const { t } = useTranslation();
    const [activePanel, setActivePanel] = useState('elements');

    return (
        <div className="absolute inset-0 z-50 bg-black flex overflow-hidden">
            {/* LEFT SIDEBAR - Tools & Settings */}
            <div className="w-72 bg-[#09090b] border-r border-white/10 flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 shrink-0 bg-white/[0.02]">
                    <span className="text-[var(--gold-primary)] font-black uppercase tracking-widest text-xs">
                        Legacy Builder
                    </span>
                    <button onClick={onExit} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Icons.X className="w-4 h-4 text-white/70" />
                    </button>
                </div>

                <div className="flex border-b border-white/10">
                    <button 
                        onClick={() => setActivePanel('elements')}
                        className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${activePanel === 'elements' ? 'text-[var(--gold-primary)] border-b-2 border-[var(--gold-primary)]' : 'text-gray-500 hover:text-white'}`}
                    >
                        Elements
                    </button>
                    <button 
                        onClick={() => setActivePanel('theme')}
                        className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${activePanel === 'theme' ? 'text-[var(--gold-primary)] border-b-2 border-[var(--gold-primary)]' : 'text-gray-500 hover:text-white'}`}
                    >
                        Theme
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {activePanel === 'elements' ? (
                        <div className="space-y-4">
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Layout</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 cursor-grab hover:bg-white/10 hover:border-[var(--gold-primary)]/50 transition-colors">
                                    <Icons.Layout className="w-5 h-5 text-white/70" />
                                    <span className="text-[10px] text-white font-medium">Section</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 cursor-grab hover:bg-white/10 hover:border-[var(--gold-primary)]/50 transition-colors">
                                    <Icons.Columns className="w-5 h-5 text-white/70" />
                                    <span className="text-[10px] text-white font-medium">Columns</span>
                                </div>
                            </div>

                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 mt-6">Basic</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 cursor-grab hover:bg-white/10 hover:border-[var(--gold-primary)]/50 transition-colors">
                                    <Icons.Type className="w-5 h-5 text-white/70" />
                                    <span className="text-[10px] text-white font-medium">Heading</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 cursor-grab hover:bg-white/10 hover:border-[var(--gold-primary)]/50 transition-colors">
                                    <Icons.Image className="w-5 h-5 text-white/70" />
                                    <span className="text-[10px] text-white font-medium">Image</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 cursor-grab hover:bg-white/10 hover:border-[var(--gold-primary)]/50 transition-colors">
                                    <Icons.MousePointerClick className="w-5 h-5 text-white/70" />
                                    <span className="text-[10px] text-white font-medium">Button</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Color Palette</div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-black border-2 border-white" />
                                    <div className="w-8 h-8 rounded-full bg-white border border-white/20" />
                                    <div className="w-8 h-8 rounded-full bg-[var(--gold-primary)] border border-white/20" />
                                    <div className="w-8 h-8 rounded-full bg-blue-500 border border-white/20" />
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Typography</div>
                                <select className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[var(--gold-primary)]">
                                    <option>Inter (Modern)</option>
                                    <option>Playfair Display (Serif)</option>
                                    <option>Roboto Mono (Code)</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN CANVAS */}
            <div className="flex-1 bg-[#0f0f12] flex flex-col relative overflow-hidden">
                {/* Top Toolbar */}
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4 bg-black/50 border border-white/10 rounded-lg p-1">
                        <button className="px-3 py-1.5 rounded-md bg-white/10 text-white text-xs font-bold flex items-center gap-2 shadow-sm">
                            <Icons.Monitor className="w-3.5 h-3.5" /> Desktop
                        </button>
                        <button className="px-3 py-1.5 rounded-md text-gray-500 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors">
                            <Icons.Smartphone className="w-3.5 h-3.5" /> Mobile
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-colors">
                            Preview
                        </button>
                        <button className="px-5 py-2 rounded-xl bg-[var(--gold-primary)] text-black font-black text-xs uppercase tracking-wider hover:bg-[var(--gold-hover)] transition-colors shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                            Publish
                        </button>
                    </div>
                </div>

                {/* Workspace / Live Preview */}
                <div className="flex-1 overflow-auto p-8 flex justify-center items-start custom-scrollbar relative">
                    {/* Background Dots */}
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    
                    {/* The Website Canvas */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-4xl min-h-[800px] bg-black border border-white/10 rounded-sm shadow-2xl relative z-10 flex flex-col items-center justify-center"
                    >
                        {/* Placeholder Content */}
                        <div className="text-center p-12">
                            <Icons.PlusCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <h2 className="text-white font-bold text-xl mb-2">Empty Template ({templateId})</h2>
                            <p className="text-gray-500 text-sm">Drag and drop elements here to build your page.</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
