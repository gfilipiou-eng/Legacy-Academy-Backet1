const fs = require('fs');
const p = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/CartelView.jsx';
let code = fs.readFileSync(p, 'utf8');

const replacement = `const executeJoin = async (enteredPin = '') => {
        try {
            const res = await axios.post(\`/cartels/\${liveCartel._id}/join\`, { pin: enteredPin });
            const action = res.data; // "Joined cartel" or "Left cartel"
            const currentUserId = currentUser._id || currentUser.userId;
            
            let updatedMembers = [...liveCartel.members];
            if (action === "Joined cartel") {
                if (!updatedMembers.some(m => (m._id || m) === currentUserId)) {
                    updatedMembers.push({ _id: currentUserId, username: currentUser.username, profilePic: currentUser.profilePic });
                }
            } else {
                updatedMembers = updatedMembers.filter(m => (m._id || m) !== currentUserId);
            }
            
            const updatedCartel = { ...liveCartel, members: updatedMembers };
            setLiveCartel(updatedCartel);
            onUpdateCartel?.(updatedCartel);
            
            setIsMember(action === "Joined cartel");
            setMemberCount(updatedMembers.length);
            setShowJoinPinModal(false);
        } catch (err) {
            console.error(err);
            alert(err.response?.data || 'Error joining/leaving cartel');
        }
    };`;

code = code.replace(/const executeJoin = async \(enteredPin = ''\) => \{[\s\S]*?alert\(err\.response\?\.data \|\| 'Error joining\/leaving cartel'\);\s*\n\s*\};\s*\n\s*const handleJoin/m, replacement + '\n\n    const handleJoin');

fs.writeFileSync(p, code);
console.log('CartelView patched');
