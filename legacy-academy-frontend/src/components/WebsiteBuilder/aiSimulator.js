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
    
    // E-commerce logic
    let hasStore = false;
    let products = [];

    // Keyword matching for better contextual generation
    if (p.includes('gym') || p.includes('γυμναστηριο') || p.includes('fitness')) {
        name = isGreek ? 'Titan Fitness' : 'Apex Gym';
        slogan = isGreek ? 'Ξεπέρασε τα όριά σου.' : 'Push Beyond Your Limits.';
        desc = isGreek ? 'Ζήστε την απόλυτη εμπειρία fitness σε υπερσύγχρονες εγκαταστάσεις πολλών τετραγωνικών, εξοπλισμένες με τα πιο σύγχρονα μηχανήματα της αγοράς. Η εξειδικευμένη ομάδα των certified personal trainers μας βρίσκεται δίπλα σας σε κάθε βήμα, σχεδιάζοντας εξατομικευμένα προγράμματα προπόνησης και διατροφής. Γίνετε μέλος μιας δυναμικής κοινότητας που θα σας εμπνεύσει και θα σας ωθήσει να ανακαλύψετε και να ξεπεράσετε τα πραγματικά σας όρια.' : 'Experience the ultimate fitness journey in our expansive, state-of-the-art facilities equipped with industry-leading machinery. Our elite team of certified personal trainers is by your side every step of the way, crafting highly personalized workout and nutrition plans. Join a vibrant, supportive community that will inspire you to break through barriers and transform into the absolute best version of yourself.';
        palette = 'green';
    } else if (p.includes('tech') || p.includes('software') || p.includes('λογισμικο') || p.includes('προγραμματισμος')) {
        name = isGreek ? 'CyberTech Solutions' : 'Nexus Software';
        slogan = isGreek ? 'Χτίζουμε το ψηφιακό μέλλον.' : 'Building the Digital Future.';
        desc = isGreek ? 'Παρέχουμε ολοκληρωμένες και πρωτοποριακές λύσεις πληροφορικής, σχεδιασμένες για τον ψηφιακό μετασχηματισμό της επιχείρησής σας. Από την ανάπτυξη custom λογισμικού και συστημάτων τεχνητής νοημοσύνης (AI), μέχρι την παροχή απόλυτης προστασίας μέσω εξελιγμένων υποδομών cyber security. Μετατρέπουμε την τεχνολογία σε στρατηγικό πλεονέκτημα, εξασφαλίζοντας την κυριαρχία σας στο σύγχρονο, ανταγωνιστικό ψηφιακό τοπίο.' : 'We deliver comprehensive, cutting-edge tech solutions designed to drive your company\'s digital transformation. From developing custom software architecture and integrating advanced Artificial Intelligence, to fortifying your digital assets with enterprise-grade cyber security. We turn complex technology into your most powerful strategic advantage, guaranteeing your dominance in today\'s fiercely competitive market.';
        palette = 'blue';
        cta = isGreek ? 'Δείτε τα Projects' : 'View Projects';
    } else if (p.includes('cafe') || p.includes('καφε') || p.includes('bakery') || p.includes('φουρνος')) {
        name = isGreek ? 'Golden Roast Cafe' : 'Artisan Brews';
        slogan = isGreek ? 'Η τέχνη του καλού καφέ.' : 'The Art of Fine Coffee.';
        desc = isGreek ? 'Ένα μοναδικό καταφύγιο γεύσεων όπου ο specialty καφές συναντά την υψηλή αισθητική. Επιλέγουμε αποκλειστικά ανώτερης ποιότητας κόκκους καφέ από βιώσιμες φάρμες και τους συνδυάζουμε με ολόφρεσκα, χειροποίητα γλυκά και υγιεινά σνακ που παρασκευάζονται καθημερινά στο εργαστήριό μας. Ο ζεστός, φιλόξενος χώρος μας έχει σχεδιαστεί για να αποτελεί την τέλεια απόδραση από την καθημερινότητα, χαρίζοντάς σας την ιδανική αρχή για τη μέρα σας.' : 'A unique flavor sanctuary where premium specialty coffee meets exquisite atmosphere. We source only the finest, sustainably grown coffee beans from around the world, perfectly paired with fresh, artisanal pastries and healthy snacks baked daily in-house. Our warm and inviting space is meticulously designed to be your perfect escape from the daily grind, offering you the absolute best start to your morning.';
        palette = 'gold';
    } else if (p.includes('beauty') || p.includes('salon') || p.includes('κομμωτηριο') || p.includes('νυχια')) {
        name = isGreek ? 'Aura Beauty Salon' : 'Lumina Beauty';
        slogan = isGreek ? 'Αναδείξτε την εσωτερική σας λάμψη.' : 'Reveal Your Inner Glow.';
        desc = isGreek ? 'Ένας πολυτελής πολυχώρος ομορφιάς και αναζωογόνησης, αφιερωμένος αποκλειστικά στην ανάδειξη της φυσικής σας γοητείας. Σας προσφέρουμε μια ολοκληρωμένη σειρά από premium υπηρεσίες περιποίησης μαλλιών, νυχιών και αισθητικής, χρησιμοποιώντας αποκλειστικά τα κορυφαία και πιο πολυτελή προϊόντα της διεθνούς αγοράς. Αφεθείτε στα έμπειρα χέρια των εξειδικευμένων μας stylists και ζήστε την απόλυτη εμπειρία pampering που σας αξίζει.' : 'A luxurious sanctuary of beauty and rejuvenation, dedicated exclusively to enhancing your natural allure. We offer a comprehensive suite of premium hair, nail, and skin care services, utilizing only the most prestigious and high-quality products available globally. Surrender to the expert hands of our highly skilled stylists and immerse yourself in the ultimate, transformative pampering experience you truly deserve.';
        palette = 'pink';
        cta = isGreek ? 'Κλείστε Ραντεβού' : 'Book Appointment';
    } else if (p.includes('consult') || p.includes('συμβουλος') || p.includes('marketing') || p.includes('agency')) {
        name = isGreek ? 'Alpha Agency' : 'Elevate Consulting';
        slogan = isGreek ? 'Στρατηγική που φέρνει αποτελέσματα.' : 'Strategies that Deliver Results.';
        desc = isGreek ? 'Αναβαθμίστε την εταιρική σας ταυτότητα και κυριαρχήστε στην αγορά μέσω στοχευμένης, data-driven στρατηγικής. Η κορυφαία ομάδα συμβούλων μας αναλύει σε βάθος τις ανάγκες σας, σχεδιάζοντας καινοτόμα business & marketing plans που προσελκύουν νέους πελάτες, ενισχύουν το brand awareness και μεγιστοποιούν δραματικά το ROI (Return on Investment). Μαζί, θα μετατρέψουμε το όραμά σας σε απτή, μετρήσιμη επιχειρηματική επιτυχία.' : 'Elevate your corporate identity and dominate your market through highly targeted, data-driven strategies. Our elite team of expert consultants conducts deep market analysis to design innovative, full-scale business and marketing plans that attract new clients, build massive brand awareness, and dramatically maximize your ROI. Together, we will transform your ambitious vision into tangible, measurable, and sustainable business success.';
        palette = 'light';
    }
    else if (p.includes('car') || p.includes('auto') || p.includes('αυτοκινητο') || p.includes('συνεργειο') || p.includes('οχημα') || p.includes('dealership')) {
        name = isGreek ? 'Auto Elite' : 'Elite Auto Motors';
        slogan = isGreek ? 'Η δύναμη της τέλειας οδήγησης.' : 'The Power of Perfect Driving.';
        desc = isGreek ? 'Ο απόλυτος προορισμός για όσους απαιτούν την τελειότητα στην αυτοκίνηση. Είτε αναζητάτε το επόμενο πολυτελές όχημά σας μέσα από τον τεράστιο στόλο μας, είτε ψάχνετε για κορυφαίες, πιστοποιημένες υπηρεσίες συντήρησης και επισκευής από εξειδικευμένους μηχανικούς, εμείς σας καλύπτουμε πλήρως. Δεσμευόμαστε να σας προσφέρουμε αξεπέραστη ασφάλεια, ασύγκριτη άνεση και μια οδηγική εμπειρία γεμάτη αυτοπεποίθηση.' : 'The ultimate destination for those who demand nothing short of perfection in automotive excellence. Whether you are searching for your next luxury vehicle from our expansive premium fleet, or seeking top-tier, certified maintenance and repair services from master mechanics, we have you completely covered. We are committed to providing you with unparalleled safety, supreme comfort, and a driving experience filled with absolute confidence.';
        palette = 'red';
    } else if (p.includes('3d') || p.includes('model') || p.includes('μοντελο') || p.includes('render') || p.includes('animation') || p.includes('γραφικ')) {
        name = isGreek ? 'Nexus 3D Studios' : 'Nexus 3D Studios';
        slogan = isGreek ? 'Δίνουμε ζωή στη φαντασία σας.' : 'Bringing Your Imagination to Life.';
        desc = isGreek ? `Ωθούμε τα όρια της οπτικής δημιουργικότητας παρέχοντας state-of-the-art υπηρεσίες 3D modelling, αρχιτεκτονικού rendering και φωτορεαλιστικού animation. Η πολυβραβευμένη ομάδα των 3D artists μας χρησιμοποιεί τα πιο εξελιγμένα λογισμικά της βιομηχανίας για να δημιουργήσει μαγευτικούς, λεπτομερείς κόσμους που κόβουν την ανάσα. Μετατρέπουμε ακόμα και τις πιο πολύπλοκες ιδέες σε εντυπωσιακές οπτικές εμπειρίες που καθηλώνουν το κοινό σας.` : `We push the absolute boundaries of visual creativity by delivering state-of-the-art 3D modelling, architectural rendering, and photorealistic animation services. Our award-winning team of 3D artists utilizes the industry\'s most advanced software to construct mesmerizing, highly detailed worlds that take your breath away. We transform even the most complex concepts into stunning, immersive visual experiences that captivate and inspire your audience.`;
        palette = 'pink';
    } else if (p.includes('farm') || p.includes('φαρμα') || p.includes('αγρο') || p.includes('agriculture') || p.includes('γεωργικ') || p.includes('κτημα')) {
        name = isGreek ? 'Green Acres Farm' : 'Harvest Valley';
        slogan = isGreek ? 'Αγνά προϊόντα από τη φύση.' : 'Pure Products from Nature.';
        desc = isGreek ? 'Ένας επίγειος παράδεισος αφιερωμένος στην αειφόρο γεωργία, όπου καλλιεργούμε τη γη με βαθύ σεβασμό και αγάπη για τη φύση. Προσφέρουμε αποκλειστικά φρέσκα, 100% πιστοποιημένα βιολογικά προϊόντα ανώτερης διατροφικής αξίας, τα οποία φτάνουν κατευθείαν από τα καταπράσινα αγροκτήματά μας, χωρίς μεσάζοντες, στο τραπέζι σας. Στηρίζουμε την τοπική κοινωνία και προάγουμε την υγιεινή διατροφή σε κάθε σπίτι.' : 'An earthly paradise dedicated to sustainable agriculture, where we cultivate the land with profound respect and endless love for nature. We proudly offer exclusively fresh, 100% certified organic produce of the highest nutritional value, delivered straight from our lush, green farms to your dining table, bypassing all middlemen. We actively support local communities and champion healthy eating in every home.';
        palette = 'green';
    } else if (p.includes('office') || p.includes('γραφειο') || p.includes('corporate') || p.includes('business') || p.includes('εταιρεια') || p.includes('λογιστικ')) {
        name = isGreek ? 'Elite Corporate Services' : 'Prime Office Solutions';
        slogan = isGreek ? 'Η επαγγελματική σας επιτυχία, προτεραιότητά μας.' : 'Your Professional Success, Our Priority.';
        desc = isGreek ? 'Προσφέρουμε ένα υπερσύγχρονο, fully-managed περιβάλλον υποστήριξης και ολοκληρωμένες λύσεις εταιρικής διαχείρισης, ειδικά προσαρμοσμένες στις απαιτήσεις της σύγχρονης επιχείρησης. Αναλαμβάνουμε την πλήρη οργάνωση, απλοποίηση και ψηφιοποίηση των καθημερινών σας γραφειοκρατικών και λογιστικών διαδικασιών. Έτσι, σας απελευθερώνουμε πολύτιμο χρόνο και πόρους, επιτρέποντάς σας να εστιάσετε απρόσκοπτα στην καινοτομία και την ραγδαία ανάπτυξη.' : 'We provide a cutting-edge, fully-managed support ecosystem and comprehensive corporate management solutions, specifically tailored to the rigorous demands of modern businesses. We completely overhaul, streamline, and digitize your daily administrative and accounting processes. By doing so, we free up your most valuable time and resources, allowing your leadership team to focus entirely on seamless innovation and rapid organizational growth.';
        palette = 'blue';
    } else if (p.includes('real estate') || p.includes('μεσιτικ') || p.includes('σπιτια') || p.includes('ακινητα') || p.includes('property')) {
        name = isGreek ? 'Luxe Properties' : 'Luxe Properties';
        slogan = isGreek ? 'Βρείτε το σπίτι των ονείρων σας.' : 'Find your dream home.';
        desc = isGreek ? 'Το κορυφαίο, βραβευμένο μεσιτικό γραφείο που επαναπροσδιορίζει την εμπειρία του Real Estate. Διαθέτουμε το πιο εκτεταμένο και αποκλειστικό portfolio από πολυτελείς βίλες, σύγχρονα διαμερίσματα και προνομιακά επαγγελματικά ακίνητα στην αγορά. Είτε ενδιαφέρεστε για κερδοφόρες επενδύσεις, είτε αναζητάτε το ιδανικό σας σπίτι για ενοικίαση ή αγορά, οι έμπειροι σύμβουλοί μας σας καθοδηγούν με απόλυτη διαφάνεια σε κάθε σας βήμα.' : 'The premier, award-winning real estate agency that completely redefines the property hunting experience. We boast the most extensive and highly exclusive portfolio of luxury villas, modern apartments, and prime commercial real estate on the market. Whether you are seeking high-yield investments or searching for your forever home to buy or rent, our expert advisors will guide you with absolute transparency through every single step.';
        palette = 'gold';
    } else if (p.includes('health') || p.includes('medical') || p.includes('doctor') || p.includes('ιατρει') || p.includes('υγεια') || p.includes('κλινικ') || p.includes('οδοντιατρ')) {
        name = isGreek ? 'CarePlus Clinic' : 'CarePlus Clinic';
        slogan = isGreek ? 'Η υγεία σας σε ασφαλή χέρια.' : 'Your health in safe hands.';
        desc = isGreek ? 'Μια πρωτοποριακή κλινική πρότυπο, όπου η κορυφαία ιατρική επιστήμη συναντά την ανθρώπινη ενσυναίσθηση. Διαθέτουμε τελευταίας τεχνολογίας ιατρικό εξοπλισμό και ένα δίκτυο από διακεκριμένους ιατρούς όλων των ειδικοτήτων. Παρέχουμε εξατομικευμένα πλάνα πρόληψης, ακριβείς διαγνώσεις και καινοτόμες θεραπείες. Προτεραιότητά μας είναι η ασφάλεια, η ανακούφιση και η πλήρης αποκατάσταση της υγείας σας στο συντομότερο δυνατό χρόνο.' : 'A state-of-the-art, exemplary clinic where leading-edge medical science seamlessly meets genuine human empathy. We are equipped with the latest, breakthrough medical technology and house a vast network of distinguished doctors across all specialties. We provide highly personalized prevention plans, pinpoint accurate diagnoses, and truly innovative treatments. Our ultimate priority is your absolute safety, comfort, and complete health restoration in record time.';
        palette = 'blue';
    } else if (p.includes('clean') || p.includes('καθαρισμ') || p.includes('συνεργειο καθαρισμου') || p.includes('απολυμανση')) {
        name = isGreek ? 'Sparkle Clean' : 'Sparkle Clean';
        slogan = isGreek ? 'Άψογα αποτελέσματα κάθε φορά.' : 'Spotless results every time.';
        desc = isGreek ? 'Ο αξιόπιστος σύμμαχός σας για ένα πεντακάθαρο, ασφαλές και υγιεινό περιβάλλον διαβίωσης και εργασίας. Το άρτια εκπαιδευμένο προσωπικό μας αναλαμβάνει βαθύ, επαγγελματικό καθαρισμό, απολυμάνσεις και βιοκαθαρισμούς σε οικίες, γραφεία και μεγάλες βιομηχανικές εγκαταστάσεις. Χρησιμοποιούμε αποκλειστικά πιστοποιημένα, οικολογικά και υποαλλεργικά προϊόντα που εγγυώνται ένα λαμπερό, αστραφτερό αποτέλεσμα, σέβοντας απόλυτα τον άνθρωπο και τη φύση.' : 'Your most trusted ally for a pristine, completely safe, and highly hygienic living and working environment. Our rigorously trained staff performs deep, professional cleaning, thorough sanitization, and bio-cleaning for residential homes, corporate offices, and vast industrial facilities. We exclusively utilize certified, eco-friendly, and hypoallergenic products that guarantee a brilliant, sparkling result while strictly respecting both human health and nature.';
        palette = 'light';
    } else if (p.includes('construct') || p.includes('build') || p.includes('κατασκευαστικ') || p.includes('εργολαβ') || p.includes('ανακαινιση')) {
        name = isGreek ? 'Prime Builders' : 'Prime Builders';
        slogan = isGreek ? 'Χτίζουμε το μέλλον, τούβλο-τούβλο.' : 'Building the future block by block.';
        desc = isGreek ? 'Η ηγέτιδα δύναμη στον κατασκευαστικό κλάδο, συνώνυμο της αντοχής, της καινοτομίας και της αρχιτεκτονικής τελειότητας. Αναλαμβάνουμε εξ ολοκλήρου την μελέτη, κατασκευή και πολυτελή ανακαίνιση οικιστικών και εντυπωσιακών εμπορικών projects. Με αυστηρά χρονοδιαγράμματα, premium υλικά τελευταίας τεχνολογίας και ασυμβίβαστη έμφαση στη στατική ασφάλεια, μετατρέπουμε πολύπλοκα αρχιτεκτονικά σχέδια σε εντυπωσιακά έργα ζωής που αντέχουν στο χρόνο.' : 'The dominant driving force in the construction sector, completely synonymous with durability, innovation, and architectural perfection. We fully undertake the comprehensive design, ground-up construction, and luxury renovation of both premium residential and massive commercial projects. Utilizing strict timelines, cutting-edge premium materials, and unyielding emphasis on structural integrity, we transform highly complex blueprints into stunning, enduring masterpieces.';
        palette = 'gold';
    } else if (p.includes('edu') || p.includes('school') || p.includes('φροντιστηρι') || p.includes('σχολει') || p.includes('μαθηματα') || p.includes('learn')) {
        name = isGreek ? 'Apex Academy' : 'Apex Academy';
        slogan = isGreek ? 'Ενδυναμώνουμε τα μυαλά του αύριο.' : 'Empowering the minds of tomorrow.';
        desc = isGreek ? 'Ένας σύγχρονος, διαδραστικός εκπαιδευτικός οργανισμός που επανασχεδιάζει τον τρόπο που μαθαίνουμε. Προσφέρουμε καινοτόμα, μαθητοκεντρικά προγράμματα σπουδών, αξιοποιώντας έξυπνα ψηφιακά εργαλεία και πολυμέσα. Το βραβευμένο και άκρως αφοσιωμένο διδακτικό μας προσωπικό δεν προσφέρει απλώς γνώση, αλλά εμπνέει, καθοδηγεί και ξεκλειδώνει τις πραγματικές δυνατότητες κάθε μαθητή, εξασφαλίζοντας την απόλυτη ακαδημαϊκή και επαγγελματική του επιτυχία.' : 'A modern, highly interactive educational institution that completely reimagines the way we learn. We offer remarkably innovative, student-centric curricula, cleverly leveraging smart digital tools and engaging multimedia. Our award-winning and intensely dedicated teaching staff doesn’t just deliver knowledge—they deeply inspire, mentor, and unlock the true, hidden potential of every single student, absolutely guaranteeing their future academic and professional success.';
        palette = 'blue';
    } else if (p.includes('food') || p.includes('restaurant') || p.includes('φαγητο') || p.includes('εστιατορι') || p.includes('ταβερν') || p.includes('pizza') || p.includes('σουβλακι')) {
        name = isGreek ? 'Gastronomy Hub' : 'Gastronomy Hub';
        slogan = isGreek ? 'Μια γεύση από την τελειότητα.' : 'A taste of perfection.';
        desc = isGreek ? 'Ένα αληθινό ταξίδι υψηλής γαστρονομίας που διεγείρει όλες τις αισθήσεις και μαγεύει τον ουρανίσκο. Ο καταξιωμένος Executive Chef μας δημιουργεί αριστουργηματικά πιάτα, παντρεύοντας την παραδοσιακή γαστρονομία με μοντέρνες, πρωτοποριακές τεχνικές. Χρησιμοποιούμε αυστηρά μόνο τα πιο φρέσκα, εκλεκτά υλικά τοπικών παραγωγών. Σας προσκαλούμε να ζήσετε μια ανεπανάληπτη εμπειρία fine dining, μέσα σε ένα πολυτελές και φαντασμαγορικό περιβάλλον.' : 'A genuine journey of haute cuisine that vigorously stimulates all the senses and truly enchants the palate. Our highly acclaimed Executive Chef crafts absolute culinary masterpieces, brilliantly marrying traditional gastronomy with modern, avant-garde techniques. We strictly source only the absolute freshest, most exquisite ingredients from elite local producers. We warmly invite you to indulge in an unforgettable fine dining experience set within a breathtakingly luxurious environment.';
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
