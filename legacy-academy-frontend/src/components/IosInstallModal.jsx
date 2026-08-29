import React from 'react';
import { Icons } from './Icons';

export default function IosInstallModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[6000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-fade-in"
            onClick={onClose}
        >
            {/* Modal Glass Container */}
            <div 
                className="relative bg-[#070709]/90 backdrop-blur-[60px] border border-white/15 rounded-[32px] md:rounded-[36px] max-w-[460px] w-full max-h-[92dvh] overflow-y-auto no-scrollbar shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.15)] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Glass Highlights */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffd700] to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-[140px] bg-gradient-to-b from-[#ffd700]/10 via-transparent to-transparent pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    type="button"
                    aria-label="Close"
                    className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                >
                    <Icons.X className="w-4 h-4" />
                </button>

                <div className="p-5 sm:p-7 flex flex-col items-center text-center">
                    {/* Header Icon Badge */}
                    <div className="relative mb-3.5 mt-1">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
                            {/* Apple Logo SVG */}
                            <svg className="w-8 h-8 fill-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]" viewBox="0 0 170 170">
                                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12.01-14.42-5.74-8.8-10.15-18.73-13.23-29.77-3.08-11.04-4.63-21.72-4.63-32.04 0-14.65 3.69-26.69 11.08-36.14 7.39-9.44 16.71-14.28 27.97-14.51 4.58 0 9.77 1.25 15.58 3.76 5.81 2.5 9.78 3.82 11.91 3.96 1.91-.14 6.01-1.52 12.3-4.14 6.29-2.61 11.66-3.79 16.12-3.53 12.3.93 21.94 5.3 28.94 13.12-10.83 6.57-16.13 15.82-15.89 27.76.25 9.53 3.92 17.51 11.01 23.94 7.09 6.43 15.42 10.02 24.99 10.77-2.14 6.42-4.78 12.76-7.92 19.03zM119.22 31.84c0-7.39 2.68-14.45 8.04-21.19 5.36-6.73 12.18-10.65 20.46-11.75.14 1.13.21 2.22.21 3.28 0 7.39-2.78 14.56-8.34 21.52-5.56 6.96-12.38 10.89-20.46 11.8-.07-1.22-.09-2.18-.09-2.88z"/>
                            </svg>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#ffd700] text-black font-black flex items-center justify-center text-[10px] shadow-lg">
                            +
                        </div>
                    </div>

                    {/* Title & Tagline */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] text-[9px] font-black tracking-widest uppercase mb-1.5">
                        <span>📱</span> IPHONE / IPAD WEB APP
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mb-1">
                        Add to Home Screen
                    </h2>
                    <p className="text-[11px] sm:text-[12px] text-white/60 font-medium max-w-[340px] leading-relaxed mb-5">
                        Install <span className="text-[#ffd700] font-bold">Legacy Academy</span> on your iPhone in 3 quick steps for native fullscreen performance & instant access.
                    </p>

                    {/* 4 Step Visual Walkthrough */}
                    <div className="w-full space-y-2.5 text-left mb-5">
                        {/* Step 1 */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3.5 relative overflow-hidden group hover:bg-white/[0.07] transition-colors">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center shrink-0 font-black text-xs">
                                1
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-black text-white tracking-wide flex items-center gap-1.5">
                                    Open in Safari
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">Safari</span>
                                </div>
                                <div className="text-[10.5px] text-white/55 mt-0.5 leading-relaxed">
                                    Make sure you are browsing this site in Apple <strong className="text-white/80">Safari</strong> on your iPhone.
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#ffd700]/10 to-white/[0.03] border border-[#ffd700]/25 flex items-start gap-3.5 relative overflow-hidden group">
                            <div className="w-8 h-8 rounded-xl bg-[#ffd700]/20 border border-[#ffd700]/40 text-[#ffd700] flex items-center justify-center shrink-0 font-black text-xs">
                                2
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-black text-white tracking-wide flex items-center gap-1.5">
                                    Tap the Share Button
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-white/20 text-white font-bold">
                                        <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.2]" viewBox="0 0 24 24">
                                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                            <polyline points="16 6 12 2 8 6" />
                                            <line x1="12" y1="2" x2="12" y2="15" />
                                        </svg>
                                    </span>
                                </div>
                                <div className="text-[10.5px] text-white/60 mt-0.5 leading-relaxed">
                                    Tap the <strong className="text-[#ffd700]">Share icon [↑]</strong> located at the bottom bar of your Safari browser.
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3.5 relative overflow-hidden group hover:bg-white/[0.07] transition-colors">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0 font-black text-xs">
                                3
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-black text-white tracking-wide flex items-center gap-1.5">
                                    Choose "Add to Home Screen"
                                </div>
                                <div className="text-[10.5px] text-white/55 mt-0.5 leading-relaxed">
                                    Scroll down the share list and select <strong className="text-white/90">"Add to Home Screen"</strong> (➕ <span className="italic text-white/40">Προσθήκη στην οθόνη αφετηρίας</span>).
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3.5 relative overflow-hidden group hover:bg-white/[0.07] transition-colors">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-400 flex items-center justify-center shrink-0 font-black text-xs">
                                4
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-black text-white tracking-wide flex items-center gap-1.5">
                                    Tap "Add"
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">Top Right</span>
                                </div>
                                <div className="text-[10.5px] text-white/55 mt-0.5 leading-relaxed">
                                    Tap <strong className="text-white/90">"Add"</strong> at the top right of your screen. Legacy will instantly launch as an app icon on your iPhone home screen!
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* App Benefits Badge */}
                    <div className="w-full py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/5 mb-5 flex items-center justify-around text-[9px] text-white/50 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">⚡ Zero Lag</span>
                        <span className="text-white/20">•</span>
                        <span className="flex items-center gap-1">📱 Fullscreen Mode</span>
                        <span className="text-white/20">•</span>
                        <span className="flex items-center gap-1">🔥 Instant Launch</span>
                    </div>

                    {/* Close / Action Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full relative group overflow-hidden rounded-2xl py-3.5 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.2em] bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black border border-white/20 hover:opacity-95 transition-all shadow-[0_4px_20px_rgba(212,175,55,0.3)] cursor-pointer"
                    >
                        <span>GOT IT, LET'S GO</span>
                        <Icons.Check className="w-4 h-4" strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
}
