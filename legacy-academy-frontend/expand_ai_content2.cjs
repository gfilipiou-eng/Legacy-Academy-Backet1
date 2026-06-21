const fs = require('fs');

const path = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/components/WebsiteBuilder/aiSimulator.js';
let code = fs.readFileSync(path, 'utf8');

// Farm
code = code.replace(
    /Καλλιεργούμε με αγάπη και σεβασμό προς τη γη. Φρέσκα, βιολογικά προϊόντα κατευθείαν από το αγρόκτημά μας στο τραπέζι σας./g,
    `Ένας επίγειος παράδεισος αφιερωμένος στην αειφόρο γεωργία, όπου καλλιεργούμε τη γη με βαθύ σεβασμό και αγάπη για τη φύση. Προσφέρουμε αποκλειστικά φρέσκα, 100% πιστοποιημένα βιολογικά προϊόντα ανώτερης διατροφικής αξίας, τα οποία φτάνουν κατευθείαν από τα καταπράσινα αγροκτήματά μας, χωρίς μεσάζοντες, στο τραπέζι σας. Στηρίζουμε την τοπική κοινωνία και προάγουμε την υγιεινή διατροφή σε κάθε σπίτι.`
);
code = code.replace(
    /Cultivated with love and respect for the earth. Fresh, organic produce straight from our farm to your table./g,
    `An earthly paradise dedicated to sustainable agriculture, where we cultivate the land with profound respect and endless love for nature. We proudly offer exclusively fresh, 100% certified organic produce of the highest nutritional value, delivered straight from our lush, green farms to your dining table, bypassing all middlemen. We actively support local communities and champion healthy eating in every home.`
);

// Office
code = code.replace(
    /Ολοκληρωμένες λύσεις γραφείου και εταιρικής διαχείρισης. Απλοποιούμε τις διαδικασίες σας για να εστιάσετε στην ανάπτυξη./g,
    `Προσφέρουμε ένα υπερσύγχρονο, fully-managed περιβάλλον υποστήριξης και ολοκληρωμένες λύσεις εταιρικής διαχείρισης, ειδικά προσαρμοσμένες στις απαιτήσεις της σύγχρονης επιχείρησης. Αναλαμβάνουμε την πλήρη οργάνωση, απλοποίηση και ψηφιοποίηση των καθημερινών σας γραφειοκρατικών και λογιστικών διαδικασιών. Έτσι, σας απελευθερώνουμε πολύτιμο χρόνο και πόρους, επιτρέποντάς σας να εστιάσετε απρόσκοπτα στην καινοτομία και την ραγδαία ανάπτυξη.`
);
code = code.replace(
    /Comprehensive office and corporate management solutions. We streamline your processes so you can focus on growth./g,
    `We provide a cutting-edge, fully-managed support ecosystem and comprehensive corporate management solutions, specifically tailored to the rigorous demands of modern businesses. We completely overhaul, streamline, and digitize your daily administrative and accounting processes. By doing so, we free up your most valuable time and resources, allowing your leadership team to focus entirely on seamless innovation and rapid organizational growth.`
);

// Real Estate
code = code.replace(
    /Προσφέρουμε τα καλύτερα ακίνητα στην αγορά. Είτε ψάχνετε για αγορά είτε για ενοικίαση, η ομάδα μας θα σας βοηθήσει να βρείτε ακριβώς αυτό που χρειάζεστε./g,
    `Το κορυφαίο, βραβευμένο μεσιτικό γραφείο που επαναπροσδιορίζει την εμπειρία του Real Estate. Διαθέτουμε το πιο εκτεταμένο και αποκλειστικό portfolio από πολυτελείς βίλες, σύγχρονα διαμερίσματα και προνομιακά επαγγελματικά ακίνητα στην αγορά. Είτε ενδιαφέρεστε για κερδοφόρες επενδύσεις, είτε αναζητάτε το ιδανικό σας σπίτι για ενοικίαση ή αγορά, οι έμπειροι σύμβουλοί μας σας καθοδηγούν με απόλυτη διαφάνεια σε κάθε σας βήμα.`
);
code = code.replace(
    /We offer the best properties on the market. Whether you are looking to buy or rent, our team will help you find exactly what you need./g,
    `The premier, award-winning real estate agency that completely redefines the property hunting experience. We boast the most extensive and highly exclusive portfolio of luxury villas, modern apartments, and prime commercial real estate on the market. Whether you are seeking high-yield investments or searching for your forever home to buy or rent, our expert advisors will guide you with absolute transparency through every single step.`
);

// Health
code = code.replace(
    /Πρωτοποριακές ιατρικές υπηρεσίες με επίκεντρο τον άνθρωπο. Το έμπειρο ιατρικό μας προσωπικό δεσμεύεται να σας παρέχει την καλύτερη δυνατή φροντίδα./g,
    `Μια πρωτοποριακή κλινική πρότυπο, όπου η κορυφαία ιατρική επιστήμη συναντά την ανθρώπινη ενσυναίσθηση. Διαθέτουμε τελευταίας τεχνολογίας ιατρικό εξοπλισμό και ένα δίκτυο από διακεκριμένους ιατρούς όλων των ειδικοτήτων. Παρέχουμε εξατομικευμένα πλάνα πρόληψης, ακριβείς διαγνώσεις και καινοτόμες θεραπείες. Προτεραιότητά μας είναι η ασφάλεια, η ανακούφιση και η πλήρης αποκατάσταση της υγείας σας στο συντομότερο δυνατό χρόνο.`
);
code = code.replace(
    /Pioneering medical services focused on the individual. Our experienced medical staff is committed to providing you with the best possible care./g,
    `A state-of-the-art, exemplary clinic where leading-edge medical science seamlessly meets genuine human empathy. We are equipped with the latest, breakthrough medical technology and house a vast network of distinguished doctors across all specialties. We provide highly personalized prevention plans, pinpoint accurate diagnoses, and truly innovative treatments. Our ultimate priority is your absolute safety, comfort, and complete health restoration in record time.`
);

// Clean
code = code.replace(
    /Παρέχουμε επαγγελματικές υπηρεσίες καθαρισμού για σπίτια και επαγγελματικούς χώρους. Χρησιμοποιούμε φιλικά προς το περιβάλλον προϊόντα για ένα αστραφτερό αποτέλεσμα./g,
    `Ο αξιόπιστος σύμμαχός σας για ένα πεντακάθαρο, ασφαλές και υγιεινό περιβάλλον διαβίωσης και εργασίας. Το άρτια εκπαιδευμένο προσωπικό μας αναλαμβάνει βαθύ, επαγγελματικό καθαρισμό, απολυμάνσεις και βιοκαθαρισμούς σε οικίες, γραφεία και μεγάλες βιομηχανικές εγκαταστάσεις. Χρησιμοποιούμε αποκλειστικά πιστοποιημένα, οικολογικά και υποαλλεργικά προϊόντα που εγγυώνται ένα λαμπερό, αστραφτερό αποτέλεσμα, σέβοντας απόλυτα τον άνθρωπο και τη φύση.`
);
code = code.replace(
    /We provide professional cleaning services for homes and commercial spaces. We use eco-friendly products for a sparkling result./g,
    `Your most trusted ally for a pristine, completely safe, and highly hygienic living and working environment. Our rigorously trained staff performs deep, professional cleaning, thorough sanitization, and bio-cleaning for residential homes, corporate offices, and vast industrial facilities. We exclusively utilize certified, eco-friendly, and hypoallergenic products that guarantee a brilliant, sparkling result while strictly respecting both human health and nature.`
);

// Construct
code = code.replace(
    /Αναλαμβάνουμε κατασκευές και ανακαινίσεις υψηλών προδιαγραφών. Η ποιότητα και η συνέπεια είναι τα θεμέλια της δουλειάς μας./g,
    `Η ηγέτιδα δύναμη στον κατασκευαστικό κλάδο, συνώνυμο της αντοχής, της καινοτομίας και της αρχιτεκτονικής τελειότητας. Αναλαμβάνουμε εξ ολοκλήρου την μελέτη, κατασκευή και πολυτελή ανακαίνιση οικιστικών και εντυπωσιακών εμπορικών projects. Με αυστηρά χρονοδιαγράμματα, premium υλικά τελευταίας τεχνολογίας και ασυμβίβαστη έμφαση στη στατική ασφάλεια, μετατρέπουμε πολύπλοκα αρχιτεκτονικά σχέδια σε εντυπωσιακά έργα ζωής που αντέχουν στο χρόνο.`
);
code = code.replace(
    /We undertake high-standard constructions and renovations. Quality and consistency are the foundations of our work./g,
    `The dominant driving force in the construction sector, completely synonymous with durability, innovation, and architectural perfection. We fully undertake the comprehensive design, ground-up construction, and luxury renovation of both premium residential and massive commercial projects. Utilizing strict timelines, cutting-edge premium materials, and unyielding emphasis on structural integrity, we transform highly complex blueprints into stunning, enduring masterpieces.`
);

// Edu
code = code.replace(
    /Προσφέρουμε καινοτόμα εκπαιδευτικά προγράμματα για όλες τις ηλικίες. Οι έμπειροι καθηγητές μας εμπνέουν και καθοδηγούν τους μαθητές στην επιτυχία./g,
    `Ένας σύγχρονος, διαδραστικός εκπαιδευτικός οργανισμός που επανασχεδιάζει τον τρόπο που μαθαίνουμε. Προσφέρουμε καινοτόμα, μαθητοκεντρικά προγράμματα σπουδών, αξιοποιώντας έξυπνα ψηφιακά εργαλεία και πολυμέσα. Το βραβευμένο και άκρως αφοσιωμένο διδακτικό μας προσωπικό δεν προσφέρει απλώς γνώση, αλλά εμπνέει, καθοδηγεί και ξεκλειδώνει τις πραγματικές δυνατότητες κάθε μαθητή, εξασφαλίζοντας την απόλυτη ακαδημαϊκή και επαγγελματική του επιτυχία.`
);
code = code.replace(
    /We offer innovative educational programs for all ages. Our experienced teachers inspire and guide students to success./g,
    `A modern, highly interactive educational institution that completely reimagines the way we learn. We offer remarkably innovative, student-centric curricula, cleverly leveraging smart digital tools and engaging multimedia. Our award-winning and intensely dedicated teaching staff doesn’t just deliver knowledge—they deeply inspire, mentor, and unlock the true, hidden potential of every single student, absolutely guaranteeing their future academic and professional success.`
);

// Food
code = code.replace(
    /Απολαύστε μοναδικά πιάτα φτιαγμένα με τα πιο αγνά υλικά. Μια γαστρονομική εμπειρία που θα σας μείνει αξέχαστη./g,
    `Ένα αληθινό ταξίδι υψηλής γαστρονομίας που διεγείρει όλες τις αισθήσεις και μαγεύει τον ουρανίσκο. Ο καταξιωμένος Executive Chef μας δημιουργεί αριστουργηματικά πιάτα, παντρεύοντας την παραδοσιακή γαστρονομία με μοντέρνες, πρωτοποριακές τεχνικές. Χρησιμοποιούμε αυστηρά μόνο τα πιο φρέσκα, εκλεκτά υλικά τοπικών παραγωγών. Σας προσκαλούμε να ζήσετε μια ανεπανάληπτη εμπειρία fine dining, μέσα σε ένα πολυτελές και φαντασμαγορικό περιβάλλον.`
);
code = code.replace(
    /Enjoy unique dishes made with the purest ingredients. A gastronomic experience you will never forget./g,
    `A genuine journey of haute cuisine that vigorously stimulates all the senses and truly enchants the palate. Our highly acclaimed Executive Chef crafts absolute culinary masterpieces, brilliantly marrying traditional gastronomy with modern, avant-garde techniques. We strictly source only the absolute freshest, most exquisite ingredients from elite local producers. We warmly invite you to indulge in an unforgettable fine dining experience set within a breathtakingly luxurious environment.`
);

fs.writeFileSync(path, code, 'utf8');
console.log('Expanded AI content heavily part 2');
