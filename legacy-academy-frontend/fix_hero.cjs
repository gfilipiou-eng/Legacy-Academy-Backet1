const fs = require('fs');

function processFile(path) {
    let code = fs.readFileSync(path, 'utf8');

    // Replace hero titles in PublicWebsiteViewer and WebsiteBuilder
    const h1Regex1 = /<h1[^>]*>\{config\.heroTitle\s*\|\|\s*'Your Vision, Realized'\}<\/h1>/g;
    code = code.replace(h1Regex1, 
        "{config.heroTitle !== '' && <h1 className=\"text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight uppercase\">{config.heroTitle ?? 'Your Vision, Realized'}</h1>}");

    // Some might have different classes (WebsiteBuilder preview)
    const h1Regex2 = /<h1[^>]*>\{config\.heroTitle\s*\|\|\s*'Your Vision, Realized'\}<\/h1>/g;
    // Just in case the first one didn't match perfectly, let's use a function to keep classes
    code = code.replace(/<h1([^>]*)>\{config\.heroTitle\s*\|\|\s*'Your Vision, Realized'\}<\/h1>/g, 
        "{config.heroTitle !== '' && <h1$1>{config.heroTitle ?? 'Your Vision, Realized'}</h1>}");

    // Hero Subtitle
    code = code.replace(/<p([^>]*)>\{config\.heroSubtitle\s*\|\|\s*'A premium digital experience tailored just for you\.'\}<\/p>/g, 
        "{config.heroSubtitle !== '' && <p$1>{config.heroSubtitle ?? 'A premium digital experience tailored just for you.'}</p>}");

    // Store button text
    code = code.replace(/<span([^>]*)>\{config\.storeButton\s*\|\|\s*'Buy Now'\}<\/span>/g, 
        "{config.storeButton !== '' && <span$1>{config.storeButton ?? 'Buy Now'}</span>}");

    // Contact button text
    code = code.replace(/<span([^>]*)>\{config\.contactButton\s*\|\|\s*'Send Message'\}<\/span>/g, 
        "{config.contactButton !== '' && <span$1>{config.contactButton ?? 'Send Message'}</span>}");
        
    // CTA Button text
    code = code.replace(/<span([^>]*)>\{config\.ctaText\s*\|\|\s*'Get Started'\}<\/span>/g, 
        "{config.ctaText !== '' && <span$1>{config.ctaText ?? 'Get Started'}</span>}");

    fs.writeFileSync(path, code, 'utf8');
}

processFile('c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/PublicWebsiteViewer.jsx');
processFile('c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/WebsiteBuilder.jsx');

console.log('Fixed hero titles and buttons');
