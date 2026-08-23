import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useTranslation } from '../../translations';
import { WebsiteBuilder } from './WebsiteBuilder';
import axios from '../../api';

export const WebsiteManager = ({ onBack, user, onUpdateUser }) => {
    const { t } = useTranslation();
    const [activeWebsiteIndex, setActiveWebsiteIndex] = useState(null);
    const [websiteToDelete, setWebsiteToDelete] = useState(null);
    const [showCopyToast, setShowCopyToast] = useState(false);

    // Ensure it's an array
    let websites = [];
    if (user?.settings?.businessWebsites && Array.isArray(user.settings.businessWebsites)) {
        websites = user.settings.businessWebsites;
    } else if (user?.settings?.businessWebsite) {
        // Migration from old object to array
        websites = [user.settings.businessWebsite];
    }

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
    const activePalette = websites.length > 0 ? (websites[0].palette || 'blue') : 'blue';
    const builderPrimary = themeColors[activePalette]?.primary || '#1D9BF0';

    const handleCreateNew = () => {
        if (websites.length >= 2) return;
        setActiveWebsiteIndex(websites.length); // Next index
    };

    const handleDeletePrompt = (index, e) => {
        e.stopPropagation();
        setWebsiteToDelete(index);
    };

    const confirmDelete = async () => {
        if (websiteToDelete === null) return;
        
        const newWebsites = [...websites];
        newWebsites.splice(websiteToDelete, 1);
        setWebsiteToDelete(null);
        
        try {
            const payload = { settings: { businessWebsites: newWebsites } };
            await axios.put('/users/settings', payload);
            if (onUpdateUser) {
                onUpdateUser({
                    ...user,
                    settings: {
                        ...(user.settings || {}),
                        businessWebsites: newWebsites
                    }
                });
            }
        } catch (err) {
            console.error("Failed to delete website", err);
        }
    };

    const handleCopyLink = async (index, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const url = `${window.location.origin}/?site=${user?.username}&index=${index}`;
        try {
            await navigator.clipboard.writeText(url);
        } catch (err) {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            } catch (e2) {
                console.error('Copy fallback failed', e2);
            }
        }
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 3000);
    };

    if (activeWebsiteIndex !== null) {
        return (
            <WebsiteBuilder 
                websiteIndex={activeWebsiteIndex}
                initialConfig={websites[activeWebsiteIndex] || null}
                onExit={() => setActiveWebsiteIndex(null)}
                user={user}
                onUpdateUser={onUpdateUser}
                websitesArray={websites}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[5000] bg-[#050505] flex flex-col items-center justify-start overflow-y-auto pt-safe">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--builder-primary)]/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="w-full max-w-4xl p-6 md:p-12 relative z-10">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="w-10 h-10 shrink-0 rounded-full hover:bg-white/10 flex items-center justify-center transition-all"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                                    backdropFilter: 'blur(24px)',
                                    WebkitBackdropFilter: 'blur(24px)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
                                }}
                        >
                            <Icons.ArrowLeft className="w-5 h-5 text-white/70" />
                        </button>
                        <h1 className="text-3xl font-black text-white">{t('MY_WEBSITES', 'My Websites')}</h1>
                    </div>
                    <div className="text-sm font-bold text-gray-500 px-4 py-2 rounded-full"
                         style={{
                             background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                             backdropFilter: 'blur(24px)',
                             WebkitBackdropFilter: 'blur(24px)',
                             border: '1px solid rgba(255,255,255,0.12)',
                             boxShadow: '0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
                         }}
                    >
                        {websites.length} / 2 {t('SAVED', 'Saved')}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {websites.map((site, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => setActiveWebsiteIndex(idx)}
                            type="button"
                            className="rounded-3xl p-6 flex flex-col justify-between group cursor-pointer hover:border-[var(--builder-primary)] transition-all hover:-translate-y-1 text-left touch-manipulation appearance-none"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%), rgba(10,10,12,0.95)',
                                backdropFilter: 'blur(28px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                boxShadow: '0 4px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                            }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr flex items-center justify-center font-black text-white text-xl" style={{ backgroundColor: site.palette === 'gold' ? '#D4AF37' : '#1D9BF0' }}>
                                    {site.businessName?.charAt(0) || 'W'}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-green-500 px-3 py-1 rounded-full flex items-center gap-1"
                                      style={{
                                          background: 'rgba(34,197,94,0.12)',
                                          backdropFilter: 'blur(20px)',
                                          border: '1px solid rgba(34,197,94,0.25)'
                                      }}
                                >
                                    <Icons.Globe className="w-3 h-3" /> {t('PUBLISHED', 'Published')}
                                </span>
                            </div>
                            <div className="flex-1 flex flex-col items-start gap-2 min-w-0 mb-6">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-black text-white truncate">{site.businessName || t('UNTITLED', 'Untitled')}</h3>
                                    {site.isDraft && <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-[10px] font-black uppercase rounded border border-gray-500/30">DRAFT</span>}
                                </div>
                                <p className="text-sm text-white/50 truncate w-full text-left">{site.slogan || t('NO_SLOGAN', 'No slogan yet')}</p>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t w-full" style={{borderColor: 'rgba(255,255,255,0.12)'}}>
                                <button type="button" onClick={(e) => handleCopyLink(idx, e)} onTouchEnd={(e) => { e.preventDefault(); handleCopyLink(idx, e); }} className="flex-1 py-2 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-2 touch-manipulation"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                            backdropFilter: 'blur(24px)',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                        }}
                                >
                                    <Icons.Link className="w-4 h-4" /> {t('COPY_LINK', 'Copy Link')}
                                </button>
                                <button type="button" onClick={(e) => handleDeletePrompt(idx, e)} onTouchEnd={(e) => { e.preventDefault(); handleDeletePrompt(idx, e); }} className="px-4 py-2 rounded-lg text-xs font-bold text-red-500 transition-all touch-manipulation relative z-20"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.05) 100%)',
                                            backdropFilter: 'blur(24px)',
                                            border: '1px solid rgba(239,68,68,0.25)'
                                        }}
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </button>
                    ))}

                    {websites.length < 2 && (
                        <button 
                            type="button"
                            onClick={handleCreateNew}
                            onTouchEnd={(e) => { e.preventDefault(); handleCreateNew(); }}
                            className="rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[250px] group w-full touch-manipulation appearance-none"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%), rgba(10,10,12,0.9)',
                                backdropFilter: 'blur(28px)',
                                WebkitBackdropFilter: 'blur(28px)',
                                border: '2px dashed rgba(255,255,255,0.12)',
                            }}
                        >
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                                 style={{
                                     background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                                     border: '1px solid rgba(255,255,255,0.15)',
                                     boxShadow: '0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
                                 }}
                            >
                                <Icons.Plus className="w-8 h-8 text-white/50 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{t('CREATE_NEW_WEBSITE', 'Create New Website')}</h3>
                            <p className="text-sm text-gray-500">{t('CREATE_LIMIT_MSG', 'You can create up to {{count}} more').replace('{{count}}', 2 - websites.length)}</p>
                        </button>
                    )}
                </div>
            </div>


            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {websiteToDelete !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[6000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
                        onClick={() => setWebsiteToDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0c] border border-red-500/30 rounded-3xl w-full max-w-sm p-6 sm:p-8 flex flex-col items-center shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden text-center"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
                            
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                                <Icons.AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>

                            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Delete Website?</h3>
                            <p className="text-sm text-gray-400 font-bold mb-8">
                                This action is permanent and cannot be undone. Are you absolutely sure?
                            </p>

                            <div className="flex w-full gap-3">
                                <button
                                    type="button"
                                    onClick={() => setWebsiteToDelete(null)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[11px] uppercase tracking-wider transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-[11px] uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                                >
                                    Destroy
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Toast for Copy Link */}
            <AnimatePresence>
                {showCopyToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[3000] bg-[var(--builder-primary)] text-black px-6 py-3 rounded-full font-black text-sm flex items-center gap-2 shadow-2xl"
                    >
                        <Icons.Check className="w-4 h-4" />
                        {t('LINK_COPIED', 'Link Copied!')}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
