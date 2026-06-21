const fs = require('fs');

const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/aiSimulator.js';
let code = fs.readFileSync(path, 'utf8');

// The code currently has a generic fallback, but maybe we can make it look nicer by injecting the generated coreTopic into the description properly.
// It already does: let desc = `We provide industry-leading services in ${coreTopic}...`

// Add 'farm' and 'office' explicitly to keyword matching
let newKeywords = `
    } else if (p.includes('farm') || p.includes('φαρμα') || p.includes('αγρο') || p.includes('agriculture') || p.includes('γεωργικ') || p.includes('κτημα')) {
        name = isGreek ? 'Green Acres Farm' : 'Harvest Valley';
        slogan = isGreek ? 'Αγνά προϊόντα από τη φύση.' : 'Pure Products from Nature.';
        desc = isGreek ? 'Καλλιεργούμε με αγάπη και σεβασμό προς τη γη. Φρέσκα, βιολογικά προϊόντα κατευθείαν από το αγρόκτημά μας στο τραπέζι σας.' : 'Cultivated with love and respect for the earth. Fresh, organic produce straight from our farm to your table.';
        palette = 'green';
    } else if (p.includes('office') || p.includes('γραφειο') || p.includes('corporate') || p.includes('business') || p.includes('εταιρεια') || p.includes('λογιστικ')) {
        name = isGreek ? 'Elite Corporate Services' : 'Prime Office Solutions';
        slogan = isGreek ? 'Η επαγγελματική σας επιτυχία, προτεραιότητά μας.' : 'Your Professional Success, Our Priority.';
        desc = isGreek ? 'Ολοκληρωμένες λύσεις γραφείου και εταιρικής διαχείρισης. Απλοποιούμε τις διαδικασίες σας για να εστιάσετε στην ανάπτυξη.' : 'Comprehensive office and corporate management solutions. We streamline your processes so you can focus on growth.';
        palette = 'blue';
`;

code = code.replace(/\/\/ Explicit Store \/ Shop detection/, newKeywords + '\n    // Explicit Store / Shop detection');

fs.writeFileSync(path, code, 'utf8');
console.log('Updated AI Simulator');
