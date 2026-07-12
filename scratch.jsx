const PostCommentInput = forwardRef(({ post, user, t, onComment }, ref) => {
    const [commentText, setCommentText] = useState('');
    const [commentAudio, setCommentAudio] = useState(null);
    const [isRecordingComment, setIsRecordingComment] = useState(false);
    
    const commentRecorderRef = useRef(null);
    const commentStreamRef = useRef(null);
    const discardRef = useRef(false);

    useImperativeHandle(ref, () => ({
        addMention: (username) => {
            setCommentText(prev => prev ? prev + ' @' + username + ' ' : '@' + username + ' ');
        }
    }));

    const stopRecording = (shouldDiscard = false) => {
        discardRef.current = shouldDiscard;
        if (commentRecorderRef.current && commentRecorderRef.current.state === 'recording') {
            commentRecorderRef.current.stop();
        } else if (shouldDiscard) {
            setCommentAudio(null);
            setIsRecordingComment(false);
        }
        if (commentStreamRef.current) {
            commentStreamRef.current.getTracks().forEach(track => track.stop());
            commentStreamRef.current = null;
        }
        if (!commentRecorderRef.current || commentRecorderRef.current.state !== 'recording') {
            setIsRecordingComment(false);
        }
    };

    const startCommentRecording = async () => {
        try {
            discardRef.current = false;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            commentStreamRef.current = stream;
            commentRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];
            commentRecorderRef.current.ondataavailable = e => chunks.push(e.data);
            commentRecorderRef.current.onstop = () => {
                if (discardRef.current) {
                    setCommentAudio(null);
                } else {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    setCommentAudio(blob);
                }
                setIsRecordingComment(false);
            };
            commentRecorderRef.current.start();
            setIsRecordingComment(true);
            setTimeout(() => { if (commentRecorderRef.current?.state === 'recording') { stopRecording(); } }, 60000);
        } catch (e) { alert("Mic denied"); }
    };

    const toggleCommentRecording = () => {
        if (isRecordingComment) {
            stopRecording();
        } else {
            startCommentRecording();
        }
    };

    return (
        <div className="flex gap-3">
            <div className="w-10 h-10 relative group shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden">
                    <ProfileAvatar user={user} />
                </div>
            </div>
            <div className="flex-1 flex flex-col gap-3">
                <div className="relative">
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={t('WRITE_COMMENT')}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-base text-white outline-none focus:border-white/40 min-h-[100px] resize-none pb-12 transition-all"
                    />
                    <div className="absolute bottom-2 left-2 flex gap-2">
                        <button onClick={toggleCommentRecording} className={`p-2 rounded-full transition-colors ${isRecordingComment ? 'bg-red-600 text-white ' : 'bg-transparent text-gray-500 hover:text-white hover:bg-white/10'}`}>
                            <Icons.Mic className="w-5 h-5" />
                        </button>
                        <button onClick={() => { if (commentText.trim()) { onComment(post._id, commentText); setCommentText(''); } }} className="p-2 bg-white text-black rounded-full hover:brightness-90 transition-colors">
                            <Icons.Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {commentAudio && (
                    <div className="p-3 bg-white/10 border border-white/30 rounded-2xl flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                            <Icons.Mic className="w-4 h-4 text-white" />
                            <span className="text-[10px] font-black text-white uppercase">VOICE READY</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setCommentAudio(null)} className="p-1.5 text-white rounded-full hover:bg-white/10 transition-colors"><Icons.Trash className="w-4 h-4" /></button>
                            <button onClick={() => { const fd = new FormData(); fd.append('file', commentAudio, 'voice.webm'); onComment(post._id, fd); setCommentAudio(null); }} className="px-4 py-1 bg-white text-black font-black text-[10px] rounded-full hover:brightness-90 transition-colors">SEND</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});
