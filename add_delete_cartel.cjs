const fs = require('fs');
const path = require('path');

const cartelViewPath = path.join(__dirname, 'legacy-academy-frontend', 'src', 'components', 'CartelView.jsx');
let content = fs.readFileSync(cartelViewPath, 'utf8');

const isCreatorCheck = "\n    const isCreator = user && cartel.creator && (user._id === cartel.creator._id || user._id === cartel.creator);\n";
content = content.replace(
    "const [memberCount, setMemberCount] = useState(0);",
    "const [memberCount, setMemberCount] = useState(0);" + isCreatorCheck
);

const handleDelete = `
    const handleDeleteCartel = async () => {
        if (!window.confirm("Are you sure you want to completely delete this Cartel? All posts will be lost forever.")) return;
        try {
            await axios.delete(\`/cartels/\${cartel._id}\`);
            onBack(); // Go back to cartels list
            window.location.reload(); // Quick refresh to clear it from list
        } catch (err) {
            console.error(err);
            alert("Error deleting cartel");
        }
    };
`;
content = content.replace(
    "const handleJoin = async () => {",
    handleDelete + "\n    const handleJoin = async () => {"
);

const deleteButton = `
                        {isCreator && (
                            <button onClick={handleDeleteCartel} className="absolute top-safe-4 right-4 z-10 bg-red-600/80 backdrop-blur-md rounded-xl px-3 py-2 flex items-center justify-center text-white text-xs font-bold tracking-widest hover:bg-red-500 transition">
                                {t('CARTELS_DELETE', 'Delete')}
                            </button>
                        )}
`;

content = content.replace(
    "<div className=\"absolute bottom-4 left-4 right-4 flex items-end gap-4\">",
    deleteButton + "\n                <div className=\"absolute bottom-4 left-4 right-4 flex items-end gap-4\">"
);

fs.writeFileSync(cartelViewPath, content);
console.log('CartelView delete button added');
