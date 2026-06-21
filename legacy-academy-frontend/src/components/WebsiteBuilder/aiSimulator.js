export const simulateAIGeneration = (prompt) => {
    const p = prompt.toLowerCase();
    const isGreek = /[α-ωΑ-Ω]/.test(p);
    
    // Extract a possible business topic by removing common stop words
    let topic = prompt;
    const stopWords = isGreek 
        ? ['θελω', 'ενα', 'μια', 'ιστοσελιδα', 'για', 'το', 'την', 'μαγαζι', 'επιχειρηση', 'μου', 'που', 'ειναι', 'κανει']
        : ['i', 'want', 'a', 'website', 'for', 'my', 'business', 'that', 'is', 'an', 'the', 'to', 'make'];
        
    let words = p.split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 2);
    let coreTopic = words.length > 0 ? words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : (isGreek ? 'Επιχείρηση' : 'Business');

    // Default premium templates
    let name = `${coreTopic} Elite`;
    let slogan = isGreek ? `Η απόλυτη εμπειρία ${coreTopic} για εσάς.` : `The Ultimate ${coreTopic} Experience.`;
    let desc = isGreek 
        ? `Προσφέρουμε κορυφαίες υπηρεσίες στον τομέα: ${coreTopic}. Με γνώμονα την ποιότητα, την καινοτομία και την απόλυτη ικανοποίηση του πελάτη, ανεβάζουμε τον πήχη σε κάθε μας έργο. Εμπιστευτείτε τους ειδικούς.` 
        : `We provide industry-leading services in ${coreTopic}. Driven by quality, innovation, and absolute customer satisfaction, we raise the bar in every project. Trust the experts.`;
    let cta = isGreek ? 'Ξεκινήστε Τώρα' : 'Get Started';
    let palette = 'gold';
    
    // E-commerce logic
    let hasStore = false;
    let products = [];

    // Keyword matching for better contextual generation
    if (p.includes('gym') || p.includes('γυμναστηριο') || p.includes('fitness')) {
        name = isGreek ? 'Titan Fitness' : 'Apex Gym';
        slogan = isGreek ? 'Ξεπέρασε τα όριά σου.' : 'Push Beyond Your Limits.';
        desc = isGreek ? 'Υπερσύγχρονες εγκαταστάσεις, κορυφαίοι personal trainers και μια κοινότητα που θα σε ωθήσει να γίνεις η καλύτερη εκδοχή του εαυτού σου.' : 'State-of-the-art facilities, elite personal trainers, and a community that pushes you to become your best self.';
        palette = 'green';
    } else if (p.includes('tech') || p.includes('software') || p.includes('λογισμικο') || p.includes('προγραμματισμος')) {
        name = isGreek ? 'CyberTech Solutions' : 'Nexus Software';
        slogan = isGreek ? 'Χτίζουμε το ψηφιακό μέλλον.' : 'Building the Digital Future.';
        desc = isGreek ? 'Προηγμένες λύσεις λογισμικού, τεχνητή νοημοσύνη και cyber security. Εξασφαλίζουμε ότι η επιχείρησή σας είναι έτοιμη για την επόμενη δεκαετία.' : 'Advanced software solutions, AI integration, and enterprise-grade security. We ensure your business is ready for the next decade.';
        palette = 'blue';
        cta = isGreek ? 'Δείτε τα Projects' : 'View Projects';
    } else if (p.includes('cafe') || p.includes('καφε') || p.includes('bakery') || p.includes('φουρνος')) {
        name = isGreek ? 'Golden Roast Cafe' : 'Artisan Brews';
        slogan = isGreek ? 'Η τέχνη του καλού καφέ.' : 'The Art of Fine Coffee.';
        desc = isGreek ? 'Διαλεχτοί κόκκοι, χειροποίητα γλυκά και μια ατμόσφαιρα που σε ταξιδεύει. Ξεκινήστε τη μέρα σας με την καλύτερη ποιότητα της πόλης.' : 'Hand-selected beans, artisanal pastries, and an unforgettable atmosphere. Start your morning with the highest quality in the city.';
        palette = 'gold';
    } else if (p.includes('beauty') || p.includes('salon') || p.includes('κομμωτηριο') || p.includes('νυχια')) {
        name = isGreek ? 'Aura Beauty Salon' : 'Lumina Beauty';
        slogan = isGreek ? 'Αναδείξτε την εσωτερική σας λάμψη.' : 'Reveal Your Inner Glow.';
        desc = isGreek ? 'Προσφέρουμε premium υπηρεσίες περιποίησης με κορυφαία προϊόντα της αγοράς. Χαλαρώστε και αφεθείτε στα χέρια των ειδικών μας.' : 'Premium beauty and care services using top-tier products. Relax and let our expert stylists elevate your look.';
        palette = 'pink';
        cta = isGreek ? 'Κλείστε Ραντεβού' : 'Book Appointment';
    } else if (p.includes('consult') || p.includes('συμβουλος') || p.includes('marketing') || p.includes('agency')) {
        name = isGreek ? 'Alpha Agency' : 'Elevate Consulting';
        slogan = isGreek ? 'Στρατηγική που φέρνει αποτελέσματα.' : 'Strategies that Deliver Results.';
        desc = isGreek ? 'Μεγιστοποιήστε τα κέρδη και την επιρροή σας. Σχεδιάζουμε marketing plans που απογειώνουν τις πωλήσεις σας.' : 'Maximize your profits and influence. We design custom marketing campaigns that skyrocket your brand visibility and sales.';
        palette = 'light';
    }
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

    // Explicit Store / Shop detection
    if (p.includes('store') || p.includes('shop') || p.includes('καταστημα') || p.includes('μαγαζι') || p.includes('eshop') || p.includes('e-shop') || p.includes('αγορες')) {
        hasStore = true;
        cta = isGreek ? 'Δείτε τα Προϊόντα' : 'Shop Now';
        
        if (p.includes('electrical') || p.includes('ηλεκτρικ') || p.includes('tech') || p.includes('gadget')) {
            products = [
                { id: Date.now() + 1, name: isGreek ? 'Smart TV 55" 4K' : 'Smart TV 55" 4K', price: '499.00', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=400' },
                { id: Date.now() + 2, name: isGreek ? 'Gaming Laptop Pro' : 'Gaming Laptop Pro', price: '1299.00', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=400' },
                { id: Date.now() + 3, name: isGreek ? 'Ασύρματα Ακουστικά' : 'Wireless Earbuds', price: '149.00', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400' }
            ];
        } else if (p.includes('cloth') || p.includes('fashion') || p.includes('ρουχ') || p.includes('boutique')) {
            products = [
                { id: Date.now() + 1, name: isGreek ? 'Premium Δερμάτινο Μπουφάν' : 'Premium Leather Jacket', price: '199.00', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=400' },
                { id: Date.now() + 2, name: isGreek ? 'Minimal Λευκό T-Shirt' : 'Minimal White T-Shirt', price: '29.00', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400' },
                { id: Date.now() + 3, name: isGreek ? 'Classic Denim Παντελόνι' : 'Classic Denim Jeans', price: '89.00', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=400' }
            ];
        } else {
            // Generic store products
            products = [
                { id: Date.now() + 1, name: isGreek ? 'Premium Προϊόν 1' : 'Premium Product 1', price: '99.00', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400' },
                { id: Date.now() + 2, name: isGreek ? 'Premium Προϊόν 2' : 'Premium Product 2', price: '149.00', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400' },
                { id: Date.now() + 3, name: isGreek ? 'Premium Προϊόν 3' : 'Premium Product 3', price: '199.00', image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=400' }
            ];
        }
    }

    return {
        businessName: name,
        slogan,
        description: desc,
        ctaText: cta,
        palette,
        hasStore,
        products
    };
};
