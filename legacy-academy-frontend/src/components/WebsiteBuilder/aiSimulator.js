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

    return {
        businessName: name,
        slogan,
        description: desc,
        ctaText: cta,
        palette
    };
};
