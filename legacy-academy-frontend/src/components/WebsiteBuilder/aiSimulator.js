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
        ? `Καλωσορίσατε στον κορυφαίο προορισμό για υπηρεσίες στον τομέα: ${coreTopic}. Με οδηγό το πάθος για την τελειότητα, την καινοτομία και την πολυετή εμπειρία μας, προσφέρουμε εξατομικευμένες λύσεις που καλύπτουν κάθε σας ανάγκη. Η αφοσίωσή μας στην άριστη εξυπηρέτηση πελατών και η προσοχή στην παραμικρή λεπτομέρεια εγγυώνται αποτελέσματα που ξεπερνούν τις προσδοκίες σας. Ελάτε να χτίσουμε μαζί ένα ισχυρό μέλλον.` 
        : `Welcome to the premier destination for industry-leading services in ${coreTopic}. Driven by a passion for excellence, continuous innovation, and years of expertise, we offer tailor-made solutions to meet your unique needs. Our unwavering commitment to outstanding customer service and meticulous attention to detail ensure results that exceed your highest expectations. Let us build a successful future together.`;
    let cta = isGreek ? 'Ξεκινήστε Τώρα' : 'Get Started';
    let palette = 'gold';
    let template = 'classic';
    
    // E-commerce logic
    let hasStore = false;
    let products = [];

    // Keyword matching for better contextual generation
    if (p.includes('gym') || p.includes('γυμναστηριο') || p.includes('fitness')) {
        name = isGreek ? 'Titan Fitness' : 'Apex Gym';
        slogan = isGreek ? 'Ξεπέρασε τα όριά σου.' : 'Push Beyond Your Limits.';
        desc = isGreek ? 'Ζήστε την απόλυτη εμπειρία fitness σε υπερσύγχρονες εγκαταστάσεις πολλών τετραγωνικών, εξοπλισμένες με τα πιο σύγχρονα μηχανήματα της αγοράς. Η εξειδικευμένη ομάδα των certified personal trainers μας βρίσκεται δίπλα σας σε κάθε βήμα, σχεδιάζοντας εξατομικευμένα προγράμματα προπόνησης και διατροφής.' : 'Experience the ultimate fitness journey in our expansive, state-of-the-art facilities equipped with industry-leading machinery. Our elite team of certified personal trainers is by your side every step of the way.';
        palette = 'green';
        template = 'fitness';
    } else if (p.includes('tech') || p.includes('software') || p.includes('saas') || p.includes('ai') || p.includes('λογισμικο')) {
        name = isGreek ? 'Nexus AI Platform' : 'Nexus AI Cloud';
        slogan = isGreek ? 'Αυτοματοποιήστε τα πάντα με τεχνητή νοημοσύνη.' : 'Automate Everything With Precision AI.';
        desc = isGreek ? 'Παρέχουμε ολοκληρωμένες και πρωτοποριακές υποδομές λογισμικού και AI, σχεδιασμένες για την απόλυτη αποδοτικότητα της επιχείρησής σας.' : 'We deliver enterprise-grade AI infrastructure and scalable software built to power the next generation of digital giants.';
        palette = 'neon';
        template = 'saas';
        cta = isGreek ? 'Δωρεάν Δοκιμή' : 'Start Free Trial';
    } else if (p.includes('luxury') || p.includes('watch') || p.includes('κοσμημα') || p.includes('χρυσο') || p.includes('ρολοι')) {
        name = isGreek ? 'Aethelgard Horlogerie' : 'Aurelius Heritage';
        slogan = isGreek ? 'Η διαχρονική τελειότητα της πολυτέλειας.' : 'Timeless Mastery of Luxury.';
        desc = isGreek ? 'Μοναδικά αριστουργήματα υψηλής ωρολογοποιίας και χειροποίητα κοσμήματα για απαιτητικούς συλλέκτες.' : 'Exquisite haute horlogerie and handcrafted heirloom jewelry for discerning connoisseurs.';
        palette = 'gold';
        template = 'luxury';
        cta = isGreek ? 'Ανακαλύψτε τη Συλλογή' : 'Explore Collection';
    } else if (p.includes('agency') || p.includes('consult') || p.includes('συμβουλος') || p.includes('marketing')) {
        name = isGreek ? 'Vanguard Strategic Agency' : 'Vanguard Capital Partners';
        slogan = isGreek ? 'Κλιμακώστε την επιχείρησή σας παγκοσμίως.' : 'Scale Your Enterprise Globally.';
        desc = isGreek ? 'Στρατηγική καθοδήγηση, digital marketing υψηλής απόδοσης και scaling για πρωτοπόρες εταιρείες.' : 'Elite management consulting and high-ROI growth architecture for high-performing brands.';
        palette = 'midnight';
        template = 'agency';
        cta = isGreek ? 'Κλείστε Consultation' : 'Book Consultation';
    } else if (p.includes('shoe') || p.includes('sneaker') || p.includes('παπουτσι') || p.includes('cloth') || p.includes('fashion') || p.includes('store') || p.includes('eshop') || p.includes('shop') || p.includes('καταστημα') || p.includes('ρουχ')) {
        hasStore = true;
        template = 'ecommerce';
        palette = 'amber';
        cta = isGreek ? 'Δείτε το Drop' : 'Shop Latest Drop';

        if (p.includes('shoe') || p.includes('sneaker') || p.includes('παπουτσι')) {
            name = isGreek ? 'Kicks Syndicate' : 'Kicks Syndicate';
            slogan = isGreek ? 'Official Streetwear & Sneaker Drops.' : 'Official Streetwear & Sneaker Drops.';
            desc = isGreek ? 'Αυθεντικά limited edition sneakers και street footwear με άμεση αποστολή και ασφαλείς πληρωμές Stripe.' : 'Authentic limited edition sneakers & street footwear with instant Stripe checkout.';
            products = [
                { id: String(Date.now() + 1), name: 'Syndicate Cyber High Top', price: 180, image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=600', stripeLink: '', sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'], badge: 'DROP' },
                { id: String(Date.now() + 2), name: 'Runner Stealth Phantom', price: 145, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600', stripeLink: '', sizes: ['EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'], badge: 'HOT' },
                { id: String(Date.now() + 3), name: 'Legacy Minimalist White', price: 120, image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600', stripeLink: '', sizes: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45'], badge: 'BEST SELLER' }
            ];
        } else {
            name = isGreek ? 'Sovereign Apparel' : 'Sovereign Apparel';
            slogan = isGreek ? 'Heavyweight Luxury Streetwear.' : 'Heavyweight Luxury Streetwear.';
            desc = isGreek ? 'Υψηλής ποιότητας 500GSM hoodies, oversized tees και luxury basics σχεδιασμένα για απαιτητικούς.' : 'Premium 500GSM heavyweight hoodies, oversized tees & luxury basics designed for high performers.';
            products = [
                { id: String(Date.now() + 1), name: 'Heavyweight Boxy Hoodie (500GSM)', price: 110, image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600', stripeLink: '', sizes: ['S', 'M', 'L', 'XL', 'XXL'], badge: 'BEST SELLER' },
                { id: String(Date.now() + 2), name: 'Oversized Acid Wash Tee', price: 45, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600', stripeLink: '', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], badge: 'NEW' },
                { id: String(Date.now() + 3), name: 'Tactical Cargo Pants', price: 95, image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=600', stripeLink: '', sizes: ['S', 'M', 'L', 'XL'], badge: 'LIMITED' }
            ];
        }
    }

    return {
        businessName: name,
        slogan,
        description: desc,
        ctaText: cta,
        palette,
        template,
        hasStore,
        products
    };
};
