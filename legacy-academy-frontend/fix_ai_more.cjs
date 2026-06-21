const fs = require('fs');

const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/aiSimulator.js';
let code = fs.readFileSync(path, 'utf8');

const newIdeas = `
    } else if (p.includes('real estate') || p.includes('μεσιτικ') || p.includes('σπιτια') || p.includes('ακινητα') || p.includes('property')) {
        name = isGreek ? 'Luxe Properties' : 'Luxe Properties';
        slogan = isGreek ? 'Βρείτε το σπίτι των ονείρων σας.' : 'Find your dream home.';
        desc = isGreek ? 'Προσφέρουμε τα καλύτερα ακίνητα στην αγορά. Είτε ψάχνετε για αγορά είτε για ενοικίαση, η ομάδα μας θα σας βοηθήσει να βρείτε ακριβώς αυτό που χρειάζεστε.' : 'We offer the best properties on the market. Whether you are looking to buy or rent, our team will help you find exactly what you need.';
        palette = 'gold';
    } else if (p.includes('health') || p.includes('medical') || p.includes('doctor') || p.includes('ιατρει') || p.includes('υγεια') || p.includes('κλινικ') || p.includes('οδοντιατρ')) {
        name = isGreek ? 'CarePlus Clinic' : 'CarePlus Clinic';
        slogan = isGreek ? 'Η υγεία σας σε ασφαλή χέρια.' : 'Your health in safe hands.';
        desc = isGreek ? 'Πρωτοποριακές ιατρικές υπηρεσίες με επίκεντρο τον άνθρωπο. Το έμπειρο ιατρικό μας προσωπικό δεσμεύεται να σας παρέχει την καλύτερη δυνατή φροντίδα.' : 'Pioneering medical services focused on the individual. Our experienced medical staff is committed to providing you with the best possible care.';
        palette = 'blue';
    } else if (p.includes('clean') || p.includes('καθαρισμ') || p.includes('συνεργειο καθαρισμου') || p.includes('απολυμανση')) {
        name = isGreek ? 'Sparkle Clean' : 'Sparkle Clean';
        slogan = isGreek ? 'Άψογα αποτελέσματα κάθε φορά.' : 'Spotless results every time.';
        desc = isGreek ? 'Παρέχουμε επαγγελματικές υπηρεσίες καθαρισμού για σπίτια και επαγγελματικούς χώρους. Χρησιμοποιούμε φιλικά προς το περιβάλλον προϊόντα για ένα αστραφτερό αποτέλεσμα.' : 'We provide professional cleaning services for homes and commercial spaces. We use eco-friendly products for a sparkling result.';
        palette = 'light';
    } else if (p.includes('construct') || p.includes('build') || p.includes('κατασκευαστικ') || p.includes('εργολαβ') || p.includes('ανακαινιση')) {
        name = isGreek ? 'Prime Builders' : 'Prime Builders';
        slogan = isGreek ? 'Χτίζουμε το μέλλον, τούβλο-τούβλο.' : 'Building the future block by block.';
        desc = isGreek ? 'Αναλαμβάνουμε κατασκευές και ανακαινίσεις υψηλών προδιαγραφών. Η ποιότητα και η συνέπεια είναι τα θεμέλια της δουλειάς μας.' : 'We undertake high-standard constructions and renovations. Quality and consistency are the foundations of our work.';
        palette = 'gold';
    } else if (p.includes('edu') || p.includes('school') || p.includes('φροντιστηρι') || p.includes('σχολει') || p.includes('μαθηματα') || p.includes('learn')) {
        name = isGreek ? 'Apex Academy' : 'Apex Academy';
        slogan = isGreek ? 'Ενδυναμώνουμε τα μυαλά του αύριο.' : 'Empowering the minds of tomorrow.';
        desc = isGreek ? 'Προσφέρουμε καινοτόμα εκπαιδευτικά προγράμματα για όλες τις ηλικίες. Οι έμπειροι καθηγητές μας εμπνέουν και καθοδηγούν τους μαθητές στην επιτυχία.' : 'We offer innovative educational programs for all ages. Our experienced teachers inspire and guide students to success.';
        palette = 'blue';
    } else if (p.includes('food') || p.includes('restaurant') || p.includes('φαγητο') || p.includes('εστιατορι') || p.includes('ταβερν') || p.includes('pizza') || p.includes('σουβλακι')) {
        name = isGreek ? 'Gastronomy Hub' : 'Gastronomy Hub';
        slogan = isGreek ? 'Μια γεύση από την τελειότητα.' : 'A taste of perfection.';
        desc = isGreek ? 'Απολαύστε μοναδικά πιάτα φτιαγμένα με τα πιο αγνά υλικά. Μια γαστρονομική εμπειρία που θα σας μείνει αξέχαστη.' : 'Enjoy unique dishes made with the purest ingredients. A gastronomic experience you will never forget.';
        palette = 'red';
    }
`;

code = code.replace(/\\s+\\}\\s+\\/\\/ Explicit Store \\/ Shop detection/, newIdeas + '\n\n    // Explicit Store / Shop detection');

fs.writeFileSync(path, code, 'utf8');
console.log('Added more AI business ideas');
