const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'VoiceNotePlayer.jsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('globalActiveAudio')) {
  // Add a global tracker outside the component
  content = content.replace(
    "export const VoiceNotePlayer",
    "let globalActiveAudio = null;\n\nexport const VoiceNotePlayer"
  );

  // Update togglePlay to handle global muting
  content = content.replace(
    /const togglePlay = \(e\) => \{[\s\S]*?\}\s*;/m,
    `const togglePlay = (e) => {
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
    };`
  );

  // Add cleanup effect
  content = content.replace(
    "const handlePlay = () => setIsPlaying(true);",
    `useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                if (globalActiveAudio === audioRef.current) {
                    globalActiveAudio = null;
                }
            }
        };
    }, []);\n\n    const handlePlay = () => setIsPlaying(true);`
  );

  fs.writeFileSync(file, content);
  console.log("VoiceNotePlayer updated");
} else {
  console.log("VoiceNotePlayer already updated");
}
