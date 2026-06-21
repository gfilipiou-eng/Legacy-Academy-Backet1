const fs = require('fs');
let code = fs.readFileSync('src/components/WebsiteBuilder/WebsiteBuilder.jsx', 'utf8');
code = code.replace(/const handlePublish = async \(\) => \{/, 'const handlePublish = async (isDraft = false) => {');
code = code.replace(/const updatedConfig = \{ \.\.\.config, lastUpdated: new Date\(\) \};/, 'const updatedConfig = { ...config, lastUpdated: new Date(), isDraft };');
code = code.replace(/value=\{config\.([a-zA-Z0-9_]+)\}/g, "value={config.$1 || ''}");

const newButtons = `
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handlePublish(true)}
                            disabled={saving}
                            className="px-4 py-1.5 rounded-full border border-white/20 text-white font-black text-[10px] uppercase tracking-wider hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            {saving ? <Icons.Loader className="w-3 h-3 animate-spin" /> : (config.isDraft ? <Icons.Check className="w-3 h-3" /> : t('SAVE_DRAFT', 'Save Draft'))}
                        </button>
                        <button 
                            onClick={() => handlePublish(false)}
                            disabled={saving}
                            className="px-4 py-1.5 rounded-full bg-[var(--gold-primary)] text-black font-black text-[10px] uppercase tracking-wider hover:bg-[var(--gold-hover)] shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2"
                        >
                            {saving ? <Icons.Loader className="w-3 h-3 animate-spin" /> : (published && !config.isDraft ? <Icons.Check className="w-3 h-3" /> : 'Publish')}
                        </button>
                    </div>
`;

const searchStr = `<button 
                            onClick={handlePublish}
                            disabled={saving}
                            className="px-4 py-1.5 rounded-full bg-[var(--gold-primary)] text-black font-black text-[10px] uppercase tracking-wider hover:bg-[var(--gold-hover)] shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all flex items-center gap-2"
                        >
                            {saving ? <Icons.Loader className="w-3 h-3 animate-spin" /> : (published ? <Icons.Check className="w-3 h-3" /> : 'Publish')}
                        </button>`;

code = code.split(searchStr).join(newButtons);

fs.writeFileSync('src/components/WebsiteBuilder/WebsiteBuilder.jsx', code);
console.log('Fixed WebsiteBuilder syntax correctly');
