const fs = require('fs');

let code = fs.readFileSync('src/components/WebsiteBuilder/WebsiteManager.jsx', 'utf8');

const regex = /const handleDelete = async \(index, e\) => \{[\s\S]*?\n    \};\n\n    const handleCopyLink/m;

const newFn = `const handleDeletePrompt = (index, e) => {
        e.stopPropagation();
        setWebsiteToDelete(index);
    };

    const confirmDelete = async () => {
        if (websiteToDelete === null) return;
        
        const newWebsites = [...websites];
        newWebsites.splice(websiteToDelete, 1);
        setWebsiteToDelete(null);
        
        try {
            const payload = { settings: { businessWebsites: newWebsites } };
            await axios.put('/users/settings', payload);
            if (onUpdateUser) {
                onUpdateUser({
                    ...user,
                    settings: {
                        ...(user.settings || {}),
                        businessWebsites: newWebsites
                    }
                });
            }
        } catch (err) {
            console.error("Failed to delete website", err);
        }
    };

    const handleCopyLink`;

code = code.replace(regex, newFn);
fs.writeFileSync('src/components/WebsiteBuilder/WebsiteManager.jsx', code);
console.log('Fixed WebsiteManager');
