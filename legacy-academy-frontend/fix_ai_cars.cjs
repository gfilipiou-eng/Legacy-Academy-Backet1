const fs = require('fs');

const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/aiSimulator.js';
let code = fs.readFileSync(path, 'utf8');

const newKeywords = `
    else if (p.includes('car') || p.includes('auto') || p.includes('αυτοκινητο') || p.includes('συνεργειο') || p.includes('οχημα') || p.includes('dealership')) {
        name = isGreek ? 'Auto Elite' : 'Elite Auto Motors';
        slogan = isGreek ? 'Η δύναμη της τέλειας οδήγησης.' : 'The Power of Perfect Driving.';
        desc = isGreek ? 'Προσφέρουμε κορυφαία οχήματα και υπηρεσίες συντήρησης. Από πολυτελή μοντέλα μέχρι καθημερινά αυτοκίνητα, εξασφαλίζουμε την ασφάλεια και την άνεσή σας στο δρόμο.' : 'We provide top-tier vehicles and maintenance services. From luxury models to everyday cars, we ensure your safety and comfort on the road.';
        palette = 'red';
    } else if (p.includes('3d') || p.includes('model') || p.includes('μοντελο') || p.includes('render') || p.includes('animation') || p.includes('γραφικ')) {
        name = isGreek ? 'Nexus 3D Studios' : 'Nexus 3D Studios';
        slogan = isGreek ? 'Δίνουμε ζωή στη φαντασία σας.' : 'Bringing Your Imagination to Life.';
        desc = isGreek ? 'Εξειδικευόμαστε σε 3D modelling, rendering και animation κορυφαίας ποιότητας. Δημιουργούμε ρεαλιστικούς κόσμους και εντυπωσιακά γραφικά για κάθε project.' : 'We specialize in high-quality 3D modelling, rendering, and animation. We create realistic worlds and stunning visuals for any project.';
        palette = 'pink';
    } else if (p.includes('farm')`;

code = code.replace(/\s+else if \(p\.includes\('farm'\)/, newKeywords);

fs.writeFileSync(path, code, 'utf8');
console.log('Added cars and 3d to aiSimulator');
