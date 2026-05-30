import React, { useRef, useState, useEffect } from 'react';
import { Icons } from './Icons';

export const VoiceNotePlayer = ({ src, t = (k) => k }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlay = (e) => {
        if (e) e.stopPropagation();
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const dur = audioRef.current.duration;
        setCurrentTime(current);
        setProgress(dur > 0 ? (current / dur) * 100 : 0);
    };

    const handleLoadedMetadata = () => {
        if (!audioRef.current) return;
        setDuration(audioRef.current.duration);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    };

    const handleSeek = (e) => {
        if (e) e.stopPropagation();
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = percent * duration;
    };

    const formatTime = (time) => {
        if (isNaN(time) || !isFinite(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/5 hover:border-[var(--gold-primary)]/30 rounded-2xl p-2 px-3 w-full max-w-[280px] shadow-2xl transition-all group/voice" onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={togglePlay}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all shadow-none group-hover/voice:shadow-none  ${isPlaying ? 'bg-white text-black' : 'bg-[var(--gold-primary)] text-black'}`}
            >
                {isPlaying ? <Icons.Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Icons.Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-1" />}
            </button>
            <div className="flex-1 flex flex-col gap-1.5 min-w-0 pr-1">
                <div
                    className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative cursor-pointer group/seek"
                    onClick={handleSeek}
                >
                    <div
                        className={`absolute top-0 left-0 h-full transition-all ease-linear relative ${isPlaying ? 'bg-gradient-to-r from-[var(--gold-primary)] to-white' : 'bg-[var(--gold-primary)]'}`}
                        style={{ width: `${progress}%`, transitionDuration: isPlaying ? '100ms' : '300ms' }}
                    >
                        {/* Glow effect head */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[2px] opacity-70 group-hover/seek:opacity-100 transition-opacity" />
                    </div>
                </div>
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase font-bold tracking-widest font-mono">
                    <span className={isPlaying ? 'text-white' : 'text-gray-400'}>{formatTime(currentTime)}</span>
                    <div className="flex items-center gap-1 text-[var(--gold-primary)] opacity-80">
                        {isPlaying ? (
                            <div className="flex gap-0.5 items-end h-2.5 mx-0.5">
                                <div className="w-0.5 bg-[var(--gold-primary)] animate-[wave_1s_infinite_ease-in-out_0.1s] rounded-full h-1" />
                                <div className="w-0.5 bg-[var(--gold-primary)] animate-[wave_1s_infinite_ease-in-out_0.2s] rounded-full h-2.5" />
                                <div className="w-0.5 bg-[var(--gold-primary)] animate-[wave_1s_infinite_ease-in-out_0.3s] rounded-full h-1.5" />
                                <div className="w-0.5 bg-[var(--gold-primary)] animate-[wave_1s_infinite_ease-in-out_0.4s] rounded-full h-2" />
                            </div>
                        ) : (
                            <Icons.Whisper className="w-3 h-3" />
                        )}
                        <span className={`text-[10px] font-black ${isPlaying ? 'text-[var(--gold-primary)] animate-pulse' : 'text-gray-500'}`}>-{formatTime(duration - currentTime)}</span>
                    </div>
                </div>
            </div>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onPlay={handlePlay}
                onPause={handlePause}
                preload="metadata"
                className="hidden"
            />
        </div>
    );
};
