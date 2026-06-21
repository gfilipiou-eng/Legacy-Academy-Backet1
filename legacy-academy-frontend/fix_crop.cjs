const fs = require('fs');

function processFile(path) {
    let code = fs.readFileSync(path, 'utf8');

    // 1. Replace object-cover with object-contain for feature and product images
    code = code.replace(/<img src=\{feat\.image\}.*?object-cover.*?\/>/g, (match) => match.replace('object-cover', 'object-contain'));
    code = code.replace(/<img src=\{product\.image\}.*?object-cover.*?\/>/g, (match) => match.replace('object-cover', 'object-contain'));

    // 2. Fix the titles (featuresTitle, navLink2 as About title, navLink3 as Contact title)
    // In PublicWebsiteViewer.jsx:
    code = code.replace(/<h3[^>]*>\{config\.featuresTitle \|\| 'Features'\}<\/h3>/g, 
        "{config.featuresTitle !== '' && <h3 className=\"text-4xl font-black mb-16 text-center tracking-tight\">{config.featuresTitle ?? 'Features'}</h3>}");
        
    code = code.replace(/<h3[^>]*>\{config\.navLink2 \|\| 'About'\}<\/h3>/g, 
        "{config.navLink2 !== '' && <h3 className=\"text-4xl font-black mb-8 text-center tracking-tight\">{config.navLink2 ?? 'About'}</h3>}");
        
    code = code.replace(/<h3[^>]*>\{config\.navLink3 \|\| 'Contact'\}<\/h3>/g, 
        "{config.navLink3 !== '' && <h3 className=\"text-4xl font-black mb-12 text-center tracking-tight\">{config.navLink3 ?? 'Contact'}</h3>}");

    // In WebsiteBuilder.jsx preview:
    code = code.replace(/<h3[^>]*>\{config\.featuresTitle \|\| 'Features'\}<\/h3>/g, 
        "{config.featuresTitle !== '' && <h3 className=\"text-2xl font-black mb-10 text-center\">{config.featuresTitle ?? 'Features'}</h3>}");
        
    code = code.replace(/<h3[^>]*>\{config\.navLink2 \|\| 'About'\}<\/h3>/g, 
        "{config.navLink2 !== '' && <h3 className=\"text-2xl font-black mb-6 text-center\">{config.navLink2 ?? 'About'}</h3>}");
        
    code = code.replace(/<h3[^>]*>\{config\.navLink3 \|\| 'Contact'\}<\/h3>/g, 
        "{config.navLink3 !== '' && <h3 className=\"text-2xl font-black mb-8 text-center\">{config.navLink3 ?? 'Contact'}</h3>}");

    fs.writeFileSync(path, code, 'utf8');
}

processFile('c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/PublicWebsiteViewer.jsx');
processFile('c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteBuilder.jsx');

console.log('Fixed object-cover and hidable titles');
