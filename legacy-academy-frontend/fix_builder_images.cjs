const fs = require('fs');
const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteBuilder.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Fix Cover Image
const coverTarget = `<div className="flex-1 w-full z-10">
                                <div className={\`w-full aspect-square md:aspect-video max-h-[600px] object-cover rounded-[30px] overflow-hidden shadow-2xl relative \${config.palette === 'light' ? 'border-4 border-white' : 'border-4 border-white/5'}\`}>
                                    <img src={config.coverImage} alt="Cover" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>
                            </div>`;
const coverReplacement = `<div className="flex-1 w-full z-10 flex justify-center items-center">
                                <img 
                                    src={config.coverImage} 
                                    alt="Cover" 
                                    className={\`max-w-full w-auto h-auto max-h-[400px] md:max-h-[600px] rounded-[30px] shadow-2xl \${config.palette === 'light' ? 'border-4 border-white' : 'border-4 border-white/10'}\`} 
                                />
                            </div>`;
code = code.replace(coverTarget, coverReplacement);

// 2. Fix Feature Image
const featureTarget = `<div className="-mx-8 -mt-8 mb-4 h-40 overflow-hidden relative">
                                                    <img src={feat.image} alt={feat.title} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                                </div>`;
const featureReplacement = `<div className="-mx-8 -mt-8 mb-4 flex justify-center items-center bg-black/5 overflow-hidden">
                                                    <img src={feat.image} alt={feat.title} className="max-w-full max-h-[200px] w-auto h-auto object-contain transition-transform duration-700 group-hover:scale-105" />
                                                </div>`;
code = code.replace(featureTarget, featureReplacement);

fs.writeFileSync(path, code, 'utf8');
console.log('Fixed images in WebsiteBuilder');
