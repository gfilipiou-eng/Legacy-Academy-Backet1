
const CommentComposeModal = ({ isOpen, onClose, onSubmit, value, onChange, onAudioSubmit, t, loading }) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef(null);
    const [audioBlob, setAudioBlob] = useState(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorder.current.ondataavailable = e => chunks.push(e.data);
            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setIsRecording(false);
            };
            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (e) { alert("Mic required"); }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (audioBlob) {
            onAudioSubmit(audioBlob);
            setAudioBlob(null);
        } else {
            onSubmit(value);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl animate-pop-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black italic text-white">{t('ENGAGE')}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Icons.X className="w-6 h-6 text-gray-400" /></button>
                </div>

                {audioBlob ? (
                    <div className="flex items-center justify-between p-4 bg-[var(--gold-primary)]/10 border border-[var(--gold-primary)]/30 rounded-2xl mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-[var(--gold-primary)] animate-pulse shadow-[0_0_10px_var(--gold-glow)]" />
                            <span className="text-xs font-black text-[var(--gold-primary)] uppercase tracking-widest">{t('VOICE_NOTE_READY')}</span>
                        </div>
                        <button onClick={() => setAudioBlob(null)} className="p-2 hover:bg-white/5 rounded-full"><Icons.Trash className="w-5 h-5 text-red-500" /></button>
                    </div>
                ) : isRecording ? (
                    <div className="flex items-center justify-between p-6 bg-red-500/10 border border-red-500/30 rounded-2xl mb-6 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-red-500 animate-ping" />
                            <span className="text-sm font-black text-red-500 uppercase tracking-widest">{t('RECORDING')}...</span>
                        </div>
                        <button onClick={stopRecording} className="px-6 py-2 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg  transition-all">{t('STOP')}</button>
                    </div>
                ) : (
                    <textarea
                        autoFocus
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={t('WRITE_COMMENT')}
                        className="w-full h-40 bg-black/50 border border-white/10 rounded-2xl p-4 text-lg text-white font-medium resize-none focus:border-[var(--gold-primary)] outline-none mb-6 placeholder-gray-600"
                    />
                )}

                <div className="flex items-center gap-3">
                    {!audioBlob && !isRecording && (
                        <button
                            type="button"
                            onClick={startRecording}
                            className="p-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-[var(--gold-primary)] hover:border-[var(--gold-primary)]/30 transition-all hover:bg-white/10 "
                        >
                            <Icons.Mic className="w-6 h-6" />
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={(audioBlob ? false : !value.trim()) || loading}
                        className="flex-1 py-4 bg-[var(--gold-primary)] text-black font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-[var(--gold-primary)]/20 hover:opacity-90  disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Icons.Send className="w-5 h-5" />}
                        {t('SEND_COMMENT')}
                    </button>
                </div>
            </div>
        </div>
    );
};
