import React, { useRef, useState, useEffect } from 'react';
import { Icons } from './Icons';

let globalActiveAudio = null;

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
            if (globalActiveAudio === audioRef.current) {
                globalActiveAudio = null;
            }
        } else {
            if (globalActiveAudio && globalActiveAudio !== audioRef.current) {
                globalActiveAudio.pause();
                globalActiveAudio.currentTime = 0;
            }
            globalActiveAudio = audioRef.current;
            audioRef.current.play();
        }
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                if (globalActiveAudio === audioRef.current) {
                    globalActiveAudio = null;
                }
            }
        };
    }, []);

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
        <div className="flex items-center gap-3 bg-[#121212]/90 border border-white/10 hover:border-white/20 rounded-xl p-2.5 w-full max-w-[320px] shadow-2xl transition-all select-none group/voice" onClick={(e) => e.stopPropagation()}>
            {/* Spotify Album Art */}
            <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 relative">
                <Icons.Music className={`w-5 h-5 text-gray-400 ${isPlaying ? 'text-[var(--gold-primary)] animate-pulse' : ''}`} />
            </div>

            {/* Track metadata and seeker */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white truncate">{t('VOICE_NOTE', 'Voice Briefing')}</span>
                    <span className="text-[9px] font-bold text-gray-500 font-mono tracking-wider shrink-0">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>

                {/* Seeker Bar */}
                <div
                    className="h-1.5 w-full bg-white/10 rounded-full relative cursor-pointer group/seek flex items-center"
                    onClick={handleSeek}
                >
                    <div
                        className="absolute h-full rounded-full bg-[var(--gold-primary)]"
                        style={{ width: `${progress}%` }}
                    />
                    <div
                        className="absolute w-2 h-2 rounded-full bg-white opacity-0 group-hover/seek:opacity-100 transition-opacity"
                        style={{ left: `calc(${progress}% - 4px)` }}
                    />
                </div>
            </div>

            {/* Play/Pause Button */}
            <button
                type="button"
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shrink-0 transition-transform cursor-pointer"
            >
                {isPlaying ? <Icons.Pause className="w-4 h-4 fill-current text-black" /> : <Icons.Play className="w-4 h-4 fill-current text-black ml-0.5" />}
            </button>

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
