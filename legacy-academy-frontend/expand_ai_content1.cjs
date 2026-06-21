const fs = require('fs');

const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/aiSimulator.js';
let code = fs.readFileSync(path, 'utf8');

// Default
code = code.replace(
    /Προσφέρουμε κορυφαίες υπηρεσίες στον τομέα: \$\{coreTopic\}. Με γνώμονα την ποιότητα, την καινοτομία και την απόλυτη ικανοποίηση του πελάτη, ανεβάζουμε τον πήχη σε κάθε μας έργο. Εμπιστευτείτε τους ειδικούς./g,
    `Καλωσορίσατε στον κορυφαίο προορισμό για υπηρεσίες στον τομέα: \${coreTopic}. Με οδηγό το πάθος για την τελειότητα, την καινοτομία και την πολυετή εμπειρία μας, προσφέρουμε εξατομικευμένες λύσεις που καλύπτουν κάθε σας ανάγκη. Η αφοσίωσή μας στην άριστη εξυπηρέτηση πελατών και η προσοχή στην παραμικρή λεπτομέρεια εγγυώνται αποτελέσματα που ξεπερνούν τις προσδοκίες σας. Ελάτε να χτίσουμε μαζί ένα ισχυρό μέλλον.`
);
code = code.replace(
    /We provide industry-leading services in \$\{coreTopic\}. Driven by quality, innovation, and absolute customer satisfaction, we raise the bar in every project. Trust the experts./g,
    `Welcome to the premier destination for industry-leading services in \${coreTopic}. Driven by a passion for excellence, continuous innovation, and years of expertise, we offer tailor-made solutions to meet your unique needs. Our unwavering commitment to outstanding customer service and meticulous attention to detail ensure results that exceed your highest expectations. Let us build a successful future together.`
);

// Gym
code = code.replace(
    /Υπερσύγχρονες εγκαταστάσεις, κορυφαίοι personal trainers και μια κοινότητα που θα σε ωθήσει να γίνεις η καλύτερη εκδοχή του εαυτού σου./g,
    `Ζήστε την απόλυτη εμπειρία fitness σε υπερσύγχρονες εγκαταστάσεις πολλών τετραγωνικών, εξοπλισμένες με τα πιο σύγχρονα μηχανήματα της αγοράς. Η εξειδικευμένη ομάδα των certified personal trainers μας βρίσκεται δίπλα σας σε κάθε βήμα, σχεδιάζοντας εξατομικευμένα προγράμματα προπόνησης και διατροφής. Γίνετε μέλος μιας δυναμικής κοινότητας που θα σας εμπνεύσει και θα σας ωθήσει να ανακαλύψετε και να ξεπεράσετε τα πραγματικά σας όρια.`
);
code = code.replace(
    /State-of-the-art facilities, elite personal trainers, and a community that pushes you to become your best self./g,
    `Experience the ultimate fitness journey in our expansive, state-of-the-art facilities equipped with industry-leading machinery. Our elite team of certified personal trainers is by your side every step of the way, crafting highly personalized workout and nutrition plans. Join a vibrant, supportive community that will inspire you to break through barriers and transform into the absolute best version of yourself.`
);

// Tech
code = code.replace(
    /Προηγμένες λύσεις λογισμικού, τεχνητή νοημοσύνη και cyber security. Εξασφαλίζουμε ότι η επιχείρησή σας είναι έτοιμη για την επόμενη δεκαετία./g,
    `Παρέχουμε ολοκληρωμένες και πρωτοποριακές λύσεις πληροφορικής, σχεδιασμένες για τον ψηφιακό μετασχηματισμό της επιχείρησής σας. Από την ανάπτυξη custom λογισμικού και συστημάτων τεχνητής νοημοσύνης (AI), μέχρι την παροχή απόλυτης προστασίας μέσω εξελιγμένων υποδομών cyber security. Μετατρέπουμε την τεχνολογία σε στρατηγικό πλεονέκτημα, εξασφαλίζοντας την κυριαρχία σας στο σύγχρονο, ανταγωνιστικό ψηφιακό τοπίο.`
);
code = code.replace(
    /Advanced software solutions, AI integration, and enterprise-grade security. We ensure your business is ready for the next decade./g,
    `We deliver comprehensive, cutting-edge tech solutions designed to drive your company's digital transformation. From developing custom software architecture and integrating advanced Artificial Intelligence, to fortifying your digital assets with enterprise-grade cyber security. We turn complex technology into your most powerful strategic advantage, guaranteeing your dominance in today's fiercely competitive market.`
);

// Cafe
code = code.replace(
    /Διαλεχτοί κόκκοι, χειροποίητα γλυκά και μια ατμόσφαιρα που σε ταξιδεύει. Ξεκινήστε τη μέρα σας με την καλύτερη ποιότητα της πόλης./g,
    `Ένα μοναδικό καταφύγιο γεύσεων όπου ο specialty καφές συναντά την υψηλή αισθητική. Επιλέγουμε αποκλειστικά ανώτερης ποιότητας κόκκους καφέ από βιώσιμες φάρμες και τους συνδυάζουμε με ολόφρεσκα, χειροποίητα γλυκά και υγιεινά σνακ που παρασκευάζονται καθημερινά στο εργαστήριό μας. Ο ζεστός, φιλόξενος χώρος μας έχει σχεδιαστεί για να αποτελεί την τέλεια απόδραση από την καθημερινότητα, χαρίζοντάς σας την ιδανική αρχή για τη μέρα σας.`
);
code = code.replace(
    /Hand-selected beans, artisanal pastries, and an unforgettable atmosphere. Start your morning with the highest quality in the city./g,
    `A unique flavor sanctuary where premium specialty coffee meets exquisite atmosphere. We source only the finest, sustainably grown coffee beans from around the world, perfectly paired with fresh, artisanal pastries and healthy snacks baked daily in-house. Our warm and inviting space is meticulously designed to be your perfect escape from the daily grind, offering you the absolute best start to your morning.`
);

// Beauty
code = code.replace(
    /Προσφέρουμε premium υπηρεσίες περιποίησης με κορυφαία προϊόντα της αγοράς. Χαλαρώστε και αφεθείτε στα χέρια των ειδικών μας./g,
    `Ένας πολυτελής πολυχώρος ομορφιάς και αναζωογόνησης, αφιερωμένος αποκλειστικά στην ανάδειξη της φυσικής σας γοητείας. Σας προσφέρουμε μια ολοκληρωμένη σειρά από premium υπηρεσίες περιποίησης μαλλιών, νυχιών και αισθητικής, χρησιμοποιώντας αποκλειστικά τα κορυφαία και πιο πολυτελή προϊόντα της διεθνούς αγοράς. Αφεθείτε στα έμπειρα χέρια των εξειδικευμένων μας stylists και ζήστε την απόλυτη εμπειρία pampering που σας αξίζει.`
);
code = code.replace(
    /Premium beauty and care services using top-tier products. Relax and let our expert stylists elevate your look./g,
    `A luxurious sanctuary of beauty and rejuvenation, dedicated exclusively to enhancing your natural allure. We offer a comprehensive suite of premium hair, nail, and skin care services, utilizing only the most prestigious and high-quality products available globally. Surrender to the expert hands of our highly skilled stylists and immerse yourself in the ultimate, transformative pampering experience you truly deserve.`
);

// Consult
code = code.replace(
    /Μεγιστοποιήστε τα κέρδη και την επιρροή σας. Σχεδιάζουμε marketing plans που απογειώνουν τις πωλήσεις σας./g,
    `Αναβαθμίστε την εταιρική σας ταυτότητα και κυριαρχήστε στην αγορά μέσω στοχευμένης, data-driven στρατηγικής. Η κορυφαία ομάδα συμβούλων μας αναλύει σε βάθος τις ανάγκες σας, σχεδιάζοντας καινοτόμα business & marketing plans που προσελκύουν νέους πελάτες, ενισχύουν το brand awareness και μεγιστοποιούν δραματικά το ROI (Return on Investment). Μαζί, θα μετατρέψουμε το όραμά σας σε απτή, μετρήσιμη επιχειρηματική επιτυχία.`
);
code = code.replace(
    /Maximize your profits and influence. We design custom marketing campaigns that skyrocket your brand visibility and sales./g,
    `Elevate your corporate identity and dominate your market through highly targeted, data-driven strategies. Our elite team of expert consultants conducts deep market analysis to design innovative, full-scale business and marketing plans that attract new clients, build massive brand awareness, and dramatically maximize your ROI. Together, we will transform your ambitious vision into tangible, measurable, and sustainable business success.`
);

// Car
code = code.replace(
    /Προσφέρουμε κορυφαία οχήματα και υπηρεσίες συντήρησης. Από πολυτελή μοντέλα μέχρι καθημερινά αυτοκίνητα, εξασφαλίζουμε την ασφάλεια και την άνεσή σας στο δρόμο./g,
    `Ο απόλυτος προορισμός για όσους απαιτούν την τελειότητα στην αυτοκίνηση. Είτε αναζητάτε το επόμενο πολυτελές όχημά σας μέσα από τον τεράστιο στόλο μας, είτε ψάχνετε για κορυφαίες, πιστοποιημένες υπηρεσίες συντήρησης και επισκευής από εξειδικευμένους μηχανικούς, εμείς σας καλύπτουμε πλήρως. Δεσμευόμαστε να σας προσφέρουμε αξεπέραστη ασφάλεια, ασύγκριτη άνεση και μια οδηγική εμπειρία γεμάτη αυτοπεποίθηση.`
);
code = code.replace(
    /We provide top-tier vehicles and maintenance services. From luxury models to everyday cars, we ensure your safety and comfort on the road./g,
    `The ultimate destination for those who demand nothing short of perfection in automotive excellence. Whether you are searching for your next luxury vehicle from our expansive premium fleet, or seeking top-tier, certified maintenance and repair services from master mechanics, we have you completely covered. We are committed to providing you with unparalleled safety, supreme comfort, and a driving experience filled with absolute confidence.`
);

// 3D
code = code.replace(
    /Εξειδικευόμαστε σε 3D modelling, rendering και animation κορυφαίας ποιότητας. Δημιουργούμε ρεαλιστικούς κόσμους και εντυπωσιακά γραφικά για κάθε project./g,
    `Ωθούμε τα όρια της οπτικής δημιουργικότητας παρέχοντας state-of-the-art υπηρεσίες 3D modelling, αρχιτεκτονικού rendering και φωτορεαλιστικού animation. Η πολυβραβευμένη ομάδα των 3D artists μας χρησιμοποιεί τα πιο εξελιγμένα λογισμικά της βιομηχανίας για να δημιουργήσει μαγευτικούς, λεπτομερείς κόσμους που κόβουν την ανάσα. Μετατρέπουμε ακόμα και τις πιο πολύπλοκες ιδέες σε εντυπωσιακές οπτικές εμπειρίες που καθηλώνουν το κοινό σας.`
);
code = code.replace(
    /We specialize in high-quality 3D modelling, rendering, and animation. We create realistic worlds and stunning visuals for any project./g,
    `We push the absolute boundaries of visual creativity by delivering state-of-the-art 3D modelling, architectural rendering, and photorealistic animation services. Our award-winning team of 3D artists utilizes the industry's most advanced software to construct mesmerizing, highly detailed worlds that take your breath away. We transform even the most complex concepts into stunning, immersive visual experiences that captivate and inspire your audience.`
);

fs.writeFileSync(path, code, 'utf8');
console.log('Expanded AI content heavily');
