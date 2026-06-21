const fs = require('fs');

// 1. Update App.jsx caching
const appPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');
appCode = appCode.replace(/localStorage\.setItem\('user', JSON\.stringify\(merged\)\);\s+setImgKey\(Date\.now\(\)\);/g, "localStorage.setItem('user', JSON.stringify(merged));\n            setImgKey(Date.now());\n            try { window.sessionStorage.removeItem(`public-profile-cache-v3:${updatedUser.username}`); } catch (e) {}");
fs.writeFileSync(appPath, appCode, 'utf8');

// 2. Update PublicWebsiteViewer.jsx logic
const pubPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/PublicWebsiteViewer.jsx';
let pubCode = fs.readFileSync(pubPath, 'utf8');

// Update Nav Links
pubCode = pubCode.replace(/<a href="#services" className="cursor-pointer hover:opacity-100">\{config\.navLink1 \|\| 'Services'\}<\/a>/g, "{config.navLink1 !== '' && <a href=\"#services\" className=\"cursor-pointer hover:opacity-100\">{config.navLink1 ?? 'Services'}</a>}");
pubCode = pubCode.replace(/<a href="#about" className="cursor-pointer hover:opacity-100">\{config\.navLink2 \|\| 'About'\}<\/a>/g, "{config.navLink2 !== '' && <a href=\"#about\" className=\"cursor-pointer hover:opacity-100\">{config.navLink2 ?? 'About'}</a>}");
pubCode = pubCode.replace(/<a href="#contact" className="cursor-pointer hover:opacity-100">\{config\.navLink3 \|\| 'Contact'\}<\/a>/g, "{config.navLink3 !== '' && <a href=\"#contact\" className=\"cursor-pointer hover:opacity-100\">{config.navLink3 ?? 'Contact'}</a>}");

// Update CTA Button
const ctaOld = `<a 
                        href={config.ctaLink === '#' ? '#contact' : (config.ctaLink || '#contact')}
                        className="px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all hover:scale-105 hover:shadow-2xl"
                        style={{ 
                            backgroundColor: activeTheme.primary, 
                            color: config.palette === 'light' ? '#fff' : '#000',
                            boxShadow: \`0 0 30px \${activeTheme.primary}40\`
                        }}
                    >
                        {config.ctaText || 'Get Started'}
                    </a>`;

const ctaNew = `{config.ctaText !== '' && (
                        <a 
                            href={config.ctaLink === '#' ? '#contact' : (config.ctaLink || '#contact')}
                            className="px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all hover:scale-105 hover:shadow-2xl"
                            style={{ 
                                backgroundColor: activeTheme.primary, 
                                color: config.palette === 'light' ? '#fff' : '#000',
                                boxShadow: \`0 0 30px \${activeTheme.primary}40\`
                            }}
                        >
                            {config.ctaText ?? 'Get Started'}
                        </a>
                    )}`;

pubCode = pubCode.replace(ctaOld, ctaNew);

fs.writeFileSync(pubPath, pubCode, 'utf8');
console.log('Fixed caching and rendering logic successfully!');
