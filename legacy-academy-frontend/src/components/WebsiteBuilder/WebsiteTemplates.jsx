import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useTranslation } from '../../translations';

const TEMPLATES = [
    {
        id: 'agency',
        title: 'Digital Agency',
        description: 'Sleek, dark, and minimal. Perfect for creative portfolios and marketing agencies.',
        icon: Icons.MonitorSmartphone,
        color: 'from-blue-500/20 to-purple-500/20',
        borderColor: 'border-blue-500/30'
    },
    {
        id: 'consulting',
        title: 'Consulting',
        description: 'High-contrast, professional design built for coaches, consultants, and speakers.',
        icon: Icons.Briefcase,
        color: 'from-[var(--builder-primary)]/20 to-amber-500/20',
        borderColor: 'border-[var(--builder-primary)]/30'
    },
    {
        id: 'ecommerce',
        title: 'E-Commerce',
        description: 'Clean and product-focused layout optimized for conversions and sales.',
        icon: Icons.ShoppingBag,
        color: 'from-emerald-500/20 to-teal-500/20',
        borderColor: 'border-emerald-500/30'
    },
    {
        id: 'blank',
        title: 'Blank Canvas',
        description: 'Start entirely from scratch and build your ultimate custom experience.',
        icon: Icons.FilePlus,
        color: 'from-gray-500/20 to-gray-400/20',
        borderColor: 'border-gray-500/30'
    }
];

export const WebsiteTemplates = ({ onSelectTemplate, onBack }) => {
    const { t } = useTranslation();

    return (
        <div className="absolute inset-0 z-50 bg-black flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center px-4 md:px-8 shrink-0 bg-white/[0.02] backdrop-blur-xl z-20">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                    <Icons.ArrowLeft className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wider">{t('BACK', 'Back')}</span>
                </button>
                <div className="mx-auto flex flex-col items-center">
                    <span className="text-[var(--builder-primary)] font-black uppercase tracking-[0.2em] text-[10px] mb-0.5">
                        {t('WEBSITE_BUILDER', 'Website Builder')}
                    </span>
                    <h1 className="text-white font-bold text-lg leading-none">
                        {t('SELECT_TEMPLATE', 'Select a Template')}
                    </h1>
                </div>
                <div className="w-[70px]"></div> {/* Spacer for center alignment */}
            </div>

            {/* Content Canvas */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 relative">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--builder-primary)]/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {TEMPLATES.map((tpl, i) => {
                        const Icon = tpl.icon;
                        return (
                            <motion.div
                                key={tpl.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => onSelectTemplate(tpl.id)}
                                className={`group relative bg-white/[0.03] hover:bg-white/[0.08] border ${tpl.borderColor} hover:border-[var(--builder-primary)] rounded-2xl p-6 cursor-pointer overflow-hidden transition-all duration-500 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}
                            >
                                {/* Gradient Hover Overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${tpl.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-14 h-14 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 group-hover:border-[var(--builder-primary)]/50 transition-all duration-500">
                                        <Icon className="w-7 h-7 text-white/80 group-hover:text-[var(--builder-primary)] transition-colors duration-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2 tracking-wide group-hover:text-[var(--builder-primary)] transition-colors duration-500">
                                        {t(`TPL_${tpl.id.toUpperCase()}_TITLE`, tpl.title)}
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed flex-1 group-hover:text-white/80 transition-colors duration-500">
                                        {t(`TPL_${tpl.id.toUpperCase()}_DESC`, tpl.description)}
                                    </p>
                                    <div className="mt-6 flex items-center text-[var(--builder-primary)] font-bold text-xs uppercase tracking-widest opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                                        {t('START_BUILDING', 'Start Building')} <Icons.ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
