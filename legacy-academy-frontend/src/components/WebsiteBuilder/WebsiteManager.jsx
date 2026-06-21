import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useTranslation } from '../../translations';
import { WebsiteBuilder } from './WebsiteBuilder';
import axios from '../../api';

export const WebsiteManager = ({ onBack, user, onUpdateUser }) => {
    const { t } = useTranslation();
    const [activeWebsiteIndex, setActiveWebsiteIndex] = useState(null);
    const [showCopyToast, setShowCopyToast] = useState(false);

    // Ensure it's an array
    let websites = [];
    if (user?.settings?.businessWebsites && Array.isArray(user.settings.businessWebsites)) {
        websites = user.settings.businessWebsites;
    } else if (user?.settings?.businessWebsite) {
        // Migration from old object to array
        websites = [user.settings.businessWebsite];
    }

    const handleCreateNew = () => {
        if (websites.length >= 2) return;
        setActiveWebsiteIndex(websites.length); // Next index
    };

    const handleDelete = async (index, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this website?")) return;
        
        const newWebsites = [...websites];
        newWebsites.splice(index, 1);
        
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
        <div className="fixed inset-0 z-[2000] bg-[#050505] flex flex-col items-center justify-start overflow-y-auto pt-safe relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--gold-primary)]/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="w-full max-w-4xl p-6 md:p-12 relative z-10">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="w-10 h-10 shrink-0 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                            <Icons.ArrowLeft className="w-5 h-5 text-white/70" />
                        </button>
                        <h1 className="text-3xl font-black text-white">{t('MY_WEBSITES', 'My Websites')}</h1>
                    </div>
                    <div className="text-sm font-bold text-gray-500 bg-white/5 px-4 py-2 rounded-full">
                        {websites.length} / 2 {t('SAVED', 'Saved')}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {websites.map((site, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => setActiveWebsiteIndex(idx)}
                            type="button"
                            className="bg-black border border-white/10 rounded-3xl p-6 flex flex-col justify-between group cursor-pointer hover:border-[var(--gold-primary)] transition-all hover:-translate-y-1 shadow-xl text-left touch-manipulation appearance-none"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr flex items-center justify-center font-black text-white text-xl" style={{ backgroundColor: site.palette === 'gold' ? '#D4AF37' : '#1D9BF0' }}>
                                    {site.businessName?.charAt(0) || 'W'}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-green-500 bg-green-500/10 px-3 py-1 rounded-full flex items-center gap-1">
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

                            <div className="flex items-center gap-2 pt-4 border-t border-white/5 w-full">
                                <button type="button" onClick={(e) => handleCopyLink(idx, e)} onTouchEnd={(e) => { e.preventDefault(); handleCopyLink(idx, e); }} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-2 touch-manipulation">
                                    <Icons.Link className="w-4 h-4" /> {t('COPY_LINK', 'Copy Link')}
                                </button>
                                <button type="button" onClick={(e) => handleDelete(idx, e)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs font-bold text-red-500 transition-all touch-manipulation">
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
                            className="border-2 border-dashed border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-white/30 hover:bg-white/[0.02] transition-all min-h-[250px] group w-full touch-manipulation appearance-none"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Icons.Plus className="w-8 h-8 text-white/50 group-hover:text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{t('CREATE_NEW_WEBSITE', 'Create New Website')}</h3>
                            <p className="text-sm text-gray-500">{t('CREATE_LIMIT_MSG', 'You can create up to {{count}} more').replace('{{count}}', 2 - websites.length)}</p>
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Toast for Copy Link */}
            <AnimatePresence>
                {showCopyToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[3000] bg-[var(--gold-primary)] text-black px-6 py-3 rounded-full font-black text-sm flex items-center gap-2 shadow-2xl"
                    >
                        <Icons.Check className="w-4 h-4" />
                        {t('LINK_COPIED', 'Link Copied!')}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
