import React, { useState } from 'react';
import { Icons } from './Icons';

const content = {
    en: {
        ios: {
            title: 'Add to Home Screen',
            subtitle: 'Install Legacy on your iOS device for native fullscreen performance and instant access.',
            steps: [
                {
                    title: 'Open in Safari',
                    desc: 'Make sure you are browsing this site in Safari on your iPhone or iPad.',
                },
                {
                    title: 'Tap the Share Button',
                    desc: 'Tap the Share icon at the bottom of your browser.',
                    hasShareIcon: true,
                },
                {
                    title: 'Choose "Add to Home Screen"',
                    desc: 'Scroll down and select "Add to Home Screen".',
                },
                {
                    title: 'Tap "Add"',
                    desc: 'Tap "Add" at the top right of your screen.',
                },
            ],
            cta: "Got it, let's go",
        },
        android: {
            title: 'Add to Home Screen',
            subtitle: 'Install Legacy on your Android device for native fullscreen performance and instant access.',
            steps: [
                {
                    title: 'Open in Chrome or Edge',
                    desc: 'Browse this site in Chrome, Edge, or Samsung Internet on your Android.',
                },
                {
                    title: 'Tap the 3-Dot Menu',
                    desc: 'Tap the 3-dot overflow menu at the top right of the browser.',
                    hasOverflowMenu: true,
                },
                {
                    title: 'Choose "Install app" / "Add to Home Screen"',
                    desc: 'Scroll and select "Install app" or "Add to Home Screen".',
                },
                {
                    title: 'Tap "Install"',
                    desc: 'Confirm with "Install" — the app icon will appear on your home screen.',
                },
            ],
            cta: "Got it, let's go",
        },
    },
    el: {
        ios: {
            title: 'Προσθήκη στην Αρχική',
            subtitle: 'Εγκατάστησε το Legacy στη συσκευή σου iOS για πλήρη οθόνη και άμεση πρόσβαση.',
            steps: [
                {
                    title: 'Άνοιξε με Safari',
                    desc: 'Βεβαιώσου ότι χρησιμοποιείς το Safari στο iPhone ή iPad σου.',
                },
                {
                    title: 'Πάτα το κουμπί Κοινής Χρήσης',
                    desc: 'Πάτα το εικονίδιο κοινής χρήσης στο κάτω μέρος του προγράμματος περιήγησης.',
                    hasShareIcon: true,
                },
                {
                    title: 'Επίλεξε "Προσθήκη στην Αρχική Οθόνη"',
                    desc: 'Κάνε scroll και επίλεξε "Προσθήκη στην Αρχική Οθόνη".',
                },
                {
                    title: 'Πάτα "Προσθήκη"',
                    desc: 'Πάτα "Προσθήκη" πάνω δεξιά στην οθόνη σου.',
                },
            ],
            cta: 'Εντάξει, πάμε!',
        },
        android: {
            title: 'Προσθήκη στην Αρχική',
            subtitle: 'Εγκατάστησε το Legacy στη συσκευή σου Android για πλήρη οθόνη και άμεση πρόσβαση.',
            steps: [
                {
                    title: 'Άνοιξε με Chrome ή Edge',
                    desc: 'Χρησιμοποίησε Chrome, Edge ή Samsung Internet στο Android σου.',
                },
                {
                    title: 'Πάτα το μενού 3 τελειών',
                    desc: 'Πάτα το μενού 3 τελειών πάνω δεξιά στον browser.',
                    hasOverflowMenu: true,
                },
                {
                    title: 'Επίλεξε "Εγκατάσταση εφαρμογής"',
                    desc: 'Κάνε scroll και επίλεξε "Install app" ή "Προσθήκη στην Αρχική Οθόνη".',
                },
                {
                    title: 'Πάτα "Εγκατάσταση"',
                    desc: 'Επιβεβαίωσε με "Install" — το εικονίδιο θα εμφανιστεί στην αρχική.',
                },
            ],
            cta: 'Εντάξει, πάμε!',
        },
    },
};

export default function IosInstallModal({ isOpen, onClose }) {
    const [lang, setLang] = useState('en');
    const [platform, setPlatform] = useState('ios');

    if (!isOpen) return null;

    const t = content[lang]?.[platform] || content.en[platform];

    return (
        <div
            className="fixed inset-0 z-[6000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            {/* Modal Container */}
            <div
                className="relative bg-[#1c1c1e] border border-white/10 rounded-[32px] md:rounded-[36px] max-w-[460px] w-full max-h-[92dvh] overflow-y-auto no-scrollbar shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    type="button"
                    aria-label="Close"
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                >
                    <Icons.X className="w-4 h-4" />
                </button>

                {/* Language Toggle */}
                <div className="absolute top-4 left-4 z-20 flex gap-1.5">
                    <button
                        onClick={() => setLang('en')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${lang === 'en' ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLang('el')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${lang === 'el' ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                    >
                        EL
                    </button>
                </div>

                <div className="p-5 sm:p-7 flex flex-col items-center text-center pt-14 sm:pt-14">
                    {/* Platform Segmented Switch */}
                    <div className="mb-5 w-full flex items-center justify-center">
                        <div className="inline-flex rounded-full bg-[#2c2c2e] p-0.5 gap-0.5">
                            <button
                                type="button"
                                onClick={() => setPlatform('ios')}
                                className={`px-4 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${platform === 'ios' ? 'bg-white text-black shadow-sm' : 'text-white/70 hover:text-white'}`}
                            >
                                <svg viewBox="0 0 384 512" className="w-3 h-3 fill-current">
                                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                                </svg>
                                iOS
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlatform('android')}
                                className={`px-4 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${platform === 'android' ? 'bg-white text-black shadow-sm' : 'text-white/70 hover:text-white'}`}
                            >
                                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                                    <path d="M17.6 9.48l1.84-3.18a.4.4 0 1 0-.69-.4L16.87 9.2A11.43 11.43 0 0 0 12 8.5c-1.73 0-3.37.26-4.87.7L5.25 5.9a.4.4 0 1 0-.69.4l1.84 3.18A11.1 11.1 0 0 0 2.4 17.5h19.2a11.1 11.1 0 0 0-4-8.02ZM7.33 17.3A1 1 0 1 1 7 15.6a1 1 0 0 1 .33 1.7Zm9.34 0A1 1 0 1 1 17 15.6a1 1 0 0 1 .33 1.7Zm-8.22-3.17L8 10.8a8.13 8.13 0 0 1 8 0l-.45 3.34a.25.25 0 0 1-.25.21H8.72a.25.25 0 0 1-.25-.21Z" />
                                </svg>
                                Android
                            </button>
                        </div>
                    </div>

                    {/* Header Icon Badge */}
                    <div className="relative mb-4 mt-2">
                        <div className="w-16 h-16 rounded-2xl bg-[#2c2c2e] flex items-center justify-center">
                            {platform === 'ios' ? (
                                <svg className="w-8 h-8 fill-white" viewBox="0 0 384 512">
                                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                                    <path d="M17.6 9.48l1.84-3.18a.4.4 0 1 0-.69-.4L16.87 9.2A11.43 11.43 0 0 0 12 8.5c-1.73 0-3.37.26-4.87.7L5.25 5.9a.4.4 0 1 0-.69.4l1.84 3.18A11.1 11.1 0 0 0 2.4 17.5h19.2a11.1 11.1 0 0 0-4-8.02ZM7.33 17.3A1 1 0 1 1 7 15.6a1 1 0 0 1 .33 1.7Zm9.34 0A1 1 0 1 1 17 15.6a1 1 0 0 1 .33 1.7Zm-8.22-3.17L8 10.8a8.13 8.13 0 0 1 8 0l-.45 3.34a.25.25 0 0 1-.25.21H8.72a.25.25 0 0 1-.25-.21Z" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Title & Tagline */}
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        {t.title}
                    </h2>
                    <p className="text-[12px] sm:text-[13px] text-white/70 font-medium max-w-[340px] leading-relaxed mb-6">
                        {t.subtitle}
                    </p>

                    {/* 4 Step Visual Walkthrough */}
                    <div className="w-full space-y-3 text-left mb-6">
                        {t.steps.map((step, i) => (
                            <div key={i} className="p-3.5 rounded-xl bg-[#2c2c2e] flex items-start gap-3.5">
                                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[13px] font-semibold text-white flex items-center gap-2">
                                        {step.title}
                                        {step.hasShareIcon && (
                                            <span className="inline-flex items-center justify-center w-5 h-5">
                                                <svg className="w-4 h-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
                                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                                    <polyline points="16 6 12 2 8 6" />
                                                    <line x1="12" y1="2" x2="12" y2="15" />
                                                </svg>
                                            </span>
                                        )}
                                        {step.hasOverflowMenu && (
                                            <span className="inline-flex items-center justify-center w-5 h-5 gap-[2px]">
                                                <span className="w-[3px] h-[3px] rounded-full bg-current" />
                                                <span className="w-[3px] h-[3px] rounded-full bg-current" />
                                                <span className="w-[3px] h-[3px] rounded-full bg-current" />
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-white/60 mt-1 leading-relaxed">
                                        {step.desc}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Close / Action Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold text-[13px] bg-white text-black hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        <span>{t.cta}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
