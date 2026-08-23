const fs = require('fs');
const path = require('path');

const localesDir = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/locales';

const content = {
    en: {
        TERMS_WELCOME: "Welcome to our platform. These Terms of Service constitute a legally binding agreement made between you and Legacy concerning your access to and use of our platform. By accessing the platform, you agree that you have read, understood, and agreed to be bound by all of these Terms of Service.",
        TERMS_S1_TITLE: "1. User Representations & Conduct",
        TERMS_S1_DESC: "By using the site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information; (3) you have the legal capacity and you agree to comply with these Terms; (4) you are not under the age of 13; (5) you will not access the site through automated or non-human means, whether through a bot, script, or otherwise. Any breach of these terms will result in immediate termination of your account.",
        TERMS_S2_TITLE: "2. Intellectual Property Rights",
        TERMS_S2_DESC: "Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the 'Content') and the trademarks, service marks, and logos contained therein are owned or controlled by us. You are granted a limited license to access and use the Site and to download or print a copy of any portion of the Content solely for your personal, non-commercial use.",
        TERMS_S3_TITLE: "3. Disclaimers & Limitation of Liability",
        TERMS_S3_DESC: "The site is provided on an as-is and as-available basis. You agree that your use of the site and our services will be at your sole risk. To the fullest extent permitted by law, we disclaim all warranties, express or implied, in connection with the site and your use thereof. We will not be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the site.",
        TERMS_FOOTER: "By continuing to use this platform, you explicitly agree to these detailed terms. Last updated: June 2026.",
        PRIVACY_WELCOME: "We care deeply about your privacy and data security. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.",
        PRIVACY_S1_TITLE: "1. Collection of Your Information",
        PRIVACY_S1_DESC: "We may collect information about you in a variety of ways. The information we may collect on the Site includes: Personal Data (such as your name, email address, demographic information) that you voluntarily give to us when you register. Derivative Data (such as your IP address, browser type, operating system, and access times) automatically collected by our servers. We employ enterprise-grade encryption to ensure all submitted data is secured both in transit and at rest.",
        PRIVACY_S2_TITLE: "2. Use and Disclosure of Your Information",
        PRIVACY_S2_DESC: "Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. We may use information collected to: Create and manage your account, email you regarding your account, and monitor usage metrics. We may share information we have collected about you in certain situations, such as: By Law or to Protect Rights, Third-Party Service Providers performing services for us, or during Business Transfers. We never sell your personal data to third-party data brokers.",
        PRIVACY_S3_TITLE: "3. Data Retention & Security",
        PRIVACY_S3_DESC: "We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse. You have the right to request deletion of your data at any time via your account settings.",
        PRIVACY_FOOTER: "Your data is handled in strict compliance with GDPR and international data protection regulations. Contact privacy@legacyacademy.com for requests."
    },
    el: {
        TERMS_WELCOME: "Καλώς ήρθατε στην πλατφόρμα μας. Αυτοί οι Όροι Χρήσης αποτελούν μια νομικά δεσμευτική συμφωνία μεταξύ εσάς και της Legacy. Με την πρόσβαση στην πλατφόρμα, επιβεβαιώνετε ότι έχετε διαβάσει, κατανοήσει και αποδεχτεί πλήρως αυτούς τους Όρους Χρήσης, με όλες τις νομικές προεκτάσεις τους.",
        TERMS_S1_TITLE: "1. Εκπροσώπηση & Συμπεριφορά Χρήστη",
        TERMS_S1_DESC: "Χρησιμοποιώντας τον ιστότοπο, εγγυάστε ότι: (1) όλες οι πληροφορίες εγγραφής που υποβάλλετε είναι αληθείς, ακριβείς και πλήρεις, (2) θα διατηρείτε την ακρίβεια αυτών των πληροφοριών, (3) έχετε τη νομική ικανότητα να συμφωνήσετε με αυτούς τους Όρους, (4) δεν είστε κάτω των 13 ετών, (5) δεν θα αποκτήσετε πρόσβαση στον ιστότοπο μέσω αυτοματοποιημένων μέσων (π.χ. bots). Οποιαδήποτε παραβίαση θα οδηγήσει σε άμεσο αποκλεισμό.",
        TERMS_S2_TITLE: "2. Δικαιώματα Πνευματικής Ιδιοκτησίας",
        TERMS_S2_DESC: "Εκτός εάν αναφέρεται διαφορετικά, η Πλατφόρμα αποτελεί ιδιοκτησία μας. Όλος ο πηγαίος κώδικας, οι βάσεις δεδομένων, η λειτουργικότητα, το λογισμικό, ο σχεδιασμός, το βίντεο, το κείμενο, και τα γραφικά (συλλογικά το 'Περιεχόμενο') καθώς και τα εμπορικά σήματα, ανήκουν σε εμάς. Σας παραχωρείται μια περιορισμένη άδεια πρόσβασης στον Ιστότοπο αποκλειστικά για προσωπική, μη εμπορική χρήση. Απαγορεύεται αυστηρά η αναπαραγωγή ή αντιγραφή.",
        TERMS_S3_TITLE: "3. Αποποίηση Ευθυνών & Περιορισμός Ευθύνης",
        TERMS_S3_DESC: "Η πλατφόρμα παρέχεται 'ως έχει'. Συμφωνείτε ότι η χρήση των υπηρεσιών μας γίνεται με δική σας ευθύνη. Στο μέγιστο βαθμό που επιτρέπεται από το νόμο, αποποιούμαστε κάθε εγγύηση, ρητή ή σιωπηρή. Σε καμία περίπτωση δεν θα είμαστε υπεύθυνοι για οποιαδήποτε άμεση, έμμεση, παρεπόμενη, υποδειγματική, συμπτωματική ή τιμωρητική ζημία, συμπεριλαμβανομένης της απώλειας κερδών ή δεδομένων, που προκύπτει από τη χρήση της υπηρεσίας μας.",
        TERMS_FOOTER: "Συνεχίζοντας την περιήγηση, αποδέχεστε ρητά αυτούς τους εκτενείς όρους. Τελευταία ενημέρωση: Ιούνιος 2026.",
        PRIVACY_WELCOME: "Δίνουμε τεράστια σημασία στο απόρρητο και την ασφάλεια των δεδομένων σας. Αυτή η Πολιτική Απορρήτου εξηγεί αναλυτικά πώς συλλέγουμε, χρησιμοποιούμε, αποκαλύπτουμε και προστατεύουμε τις πληροφορίες σας. Εάν δεν συμφωνείτε απόλυτα με τους όρους, παρακαλούμε να διακόψετε την πρόσβαση στην πλατφόρμα.",
        PRIVACY_S1_TITLE: "1. Συλλογή Πληροφοριών",
        PRIVACY_S1_DESC: "Συλλέγουμε Προσωπικά Δεδομένα (όπως όνομα, email, δημογραφικά) που μας δίνετε εθελοντικά, καθώς και Παράγωγα Δεδομένα (όπως διεύθυνση IP, τύπο προγράμματος περιήγησης και χρόνο πρόσβασης) που καταγράφονται αυτόματα. Χρησιμοποιούμε κρυπτογράφηση στρατιωτικών προδιαγραφών για να διασφαλίσουμε ότι όλα τα δεδομένα είναι ασφαλή τόσο κατά τη μεταφορά (in transit) όσο και κατά την αποθήκευση (at rest).",
        PRIVACY_S2_TITLE: "2. Χρήση και Κοινοποίηση Δεδομένων",
        PRIVACY_S2_DESC: "Η ακριβής πληροφόρηση μας επιτρέπει να σας προσφέρουμε μια προσαρμοσμένη και ομαλή εμπειρία. Χρησιμοποιούμε τα δεδομένα σας για να διαχειριζόμαστε τον λογαριασμό σας και να παρακολουθούμε την απόδοση του συστήματος. Ενδέχεται να μοιραστούμε τα δεδομένα σας ΜΟΝΟ: εάν απαιτηθεί από το Νόμο, με Πιστοποιημένους Τρίτους Παρόχους που εκτελούν υπηρεσίες για εμάς, ή σε περίπτωση Μεταβίβασης Επιχείρησης. Δεν πουλάμε ΠΟΤΕ τα δεδομένα σας σε τρίτους.",
        PRIVACY_S3_TITLE: "3. Διατήρηση & Ασφάλεια",
        PRIVACY_S3_DESC: "Εφαρμόζουμε διοικητικά, τεχνικά και φυσικά μέτρα ασφαλείας υψηλού επιπέδου. Ωστόσο, αναγνωρίζετε ότι κανένα σύστημα δεν είναι απολύτως άτρωτο απέναντι σε προηγμένες κυβερνοεπιθέσεις. Έχετε το απόλυτο δικαίωμα στη «λήθη», δηλαδή να ζητήσετε την οριστική διαγραφή όλων των δεδομένων σας ανά πάσα στιγμή μέσα από τις ρυθμίσεις του λογαριασμού σας, κάτι που θα εκτελεστεί άμεσα και ανεπιστρεπτί.",
        PRIVACY_FOOTER: "Τα δεδομένα σας διαχειρίζονται σε απόλυτη συμμόρφωση με τον ΓΚΠΔ (GDPR). Για ερωτήματα, επικοινωνήστε με το τμήμα απορρήτου."
    },
    // Adding basic translated structure for others to match length and detail
    fr: {
        TERMS_WELCOME: "Bienvenue sur notre plateforme. Ces Conditions d'Utilisation constituent un accord juridiquement contraignant entre vous et Legacy concernant votre accès et votre utilisation de notre plateforme. En accédant à la plateforme, vous acceptez d'être lié par l'ensemble de ces conditions.",
        TERMS_S1_TITLE: "1. Représentations et Conduite de l'Utilisateur",
        TERMS_S1_DESC: "En utilisant le site, vous déclarez et garantissez que: (1) toutes les informations d'inscription que vous soumettez seront vraies, exactes, à jour et complètes; (2) vous maintiendrez l'exactitude de ces informations; (3) vous avez la capacité juridique de vous conformer à ces conditions; (4) vous n'utiliserez pas de moyens automatisés ou non humains pour accéder au site. Toute violation entraînera la résiliation immédiate du compte.",
        TERMS_S2_TITLE: "2. Droits de Propriété Intellectuelle",
        TERMS_S2_DESC: "Sauf indication contraire, le Site est notre propriété exclusive. Tout le code source, les bases de données, les fonctionnalités, les logiciels, les conceptions de sites, l'audio, la vidéo, le texte, les photographies et les graphiques (le «Contenu») et les marques de commerce nous appartiennent. Vous bénéficiez d'une licence limitée pour accéder au site pour un usage personnel et non commercial.",
        TERMS_S3_TITLE: "3. Avertissements et Limitation de Responsabilité",
        TERMS_S3_DESC: "Le site est fourni « tel quel » et « selon disponibilité ». Vous acceptez que votre utilisation du site et de nos services se fera à vos seuls risques. Dans toute la mesure permise par la loi, nous déclinons toute garantie, expresse ou implicite. Nous ne serons pas responsables des dommages directs, indirects, consécutifs ou punitifs découlant de votre utilisation du site.",
        TERMS_FOOTER: "En continuant à utiliser cette plateforme, vous acceptez explicitement ces termes détaillés.",
        PRIVACY_WELCOME: "Nous nous soucions profondément de votre vie privée et de la sécurité des données. Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations. Si vous n'êtes pas d'accord, veuillez ne pas accéder au site.",
        PRIVACY_S1_TITLE: "1. Collecte de Vos Informations",
        PRIVACY_S1_DESC: "Nous collectons des Données Personnelles que vous nous donnez volontairement, ainsi que des Données Dérivées collectées automatiquement. Nous utilisons un cryptage de niveau entreprise pour garantir que toutes les données soumises sont sécurisées en transit et au repos.",
        PRIVACY_S2_TITLE: "2. Utilisation et Divulgation",
        PRIVACY_S2_DESC: "Nous utilisons vos informations pour créer et gérer votre compte, et surveiller les métriques. Nous pouvons partager des informations par la Loi, avec des Fournisseurs de Services, ou lors de Transferts Commerciaux. Nous ne vendons jamais vos données.",
        PRIVACY_S3_TITLE: "3. Conservation et Sécurité des Données",
        PRIVACY_S3_DESC: "Nous utilisons des mesures de sécurité de haut niveau. Cependant, aucune mesure n'est parfaite. Vous avez le droit de demander la suppression de vos données à tout moment via les paramètres du compte.",
        PRIVACY_FOOTER: "Conforme au RGPD. Contactez-nous pour toute demande concernant la confidentialité."
    },
    de: {
        TERMS_WELCOME: "Willkommen auf unserer Plattform. Diese Nutzungsbedingungen stellen eine rechtsverbindliche Vereinbarung zwischen Ihnen und der Legacy dar. Durch den Zugriff auf die Plattform stimmen Sie allen diesen Nutzungsbedingungen zu.",
        TERMS_S1_TITLE: "1. Benutzervertretungen & Verhalten",
        TERMS_S1_DESC: "Durch die Nutzung der Website erklären und garantieren Sie: (1) alle von Ihnen übermittelten Registrierungsinformationen sind wahr, genau und vollständig; (2) Sie werden die Genauigkeit aufrechterhalten; (3) Sie haben die Rechtsfähigkeit, diesen Bedingungen zuzustimmen; (4) Sie werden nicht durch automatisierte Mittel auf die Website zugreifen. Jeder Verstoß führt zur sofortigen Kündigung.",
        TERMS_S2_TITLE: "2. Geistige Eigentumsrechte",
        TERMS_S2_DESC: "Sofern nicht anders angegeben, ist die Website unser Eigentum. Alle Quellcodes, Datenbanken, Software, Designs, Audio, Video, Texte und Grafiken (der „Inhalt“) gehören uns. Ihnen wird eine beschränkte Lizenz gewährt, um ausschließlich für den persönlichen Gebrauch auf die Website zuzugreifen.",
        TERMS_S3_TITLE: "3. Haftungsausschluss & Haftungsbeschränkung",
        TERMS_S3_DESC: "Die Website wird ohne Mängelgewähr bereitgestellt. Sie stimmen zu, dass Ihre Nutzung auf eigenes Risiko erfolgt. Wir lehnen alle ausdrücklichen oder stillschweigenden Garantien ab. Wir haften nicht für direkte, indirekte oder Folgeschäden, die sich aus Ihrer Nutzung ergeben.",
        TERMS_FOOTER: "Durch die weitere Nutzung stimmen Sie diesen detaillierten Bedingungen ausdrücklich zu.",
        PRIVACY_WELCOME: "Wir legen großen Wert auf Ihre Privatsphäre und Datensicherheit. Diese Datenschutzrichtlinie erklärt, wie wir Ihre Informationen sammeln, verwenden und schützen.",
        PRIVACY_S1_TITLE: "1. Erfassung Ihrer Informationen",
        PRIVACY_S1_DESC: "Wir sammeln personenbezogene Daten, die Sie uns freiwillig zur Verfügung stellen, sowie automatisch erfasste abgeleitete Daten. Wir verwenden eine Verschlüsselung auf Unternehmensniveau, um die Sicherheit aller Daten zu gewährleisten.",
        PRIVACY_S2_TITLE: "2. Nutzung und Weitergabe",
        PRIVACY_S2_DESC: "Wir verwenden Ihre Daten zur Kontoverwaltung und zur Überwachung von Metriken. Wir können Daten nur weitergeben: gesetzlich vorgeschrieben, an zertifizierte Dienstleister oder bei Unternehmensübertragungen. Wir verkaufen Ihre Daten niemals.",
        PRIVACY_S3_TITLE: "3. Datenspeicherung & Sicherheit",
        PRIVACY_S3_DESC: "Wir setzen administrative, technische und physische Sicherheitsmaßnahmen ein. Sie haben das Recht, jederzeit die Löschung Ihrer Daten über Ihre Kontoeinstellungen zu verlangen.",
        PRIVACY_FOOTER: "Strenge Einhaltung der DSGVO-Richtlinien. Wenden Sie sich bei Fragen an unseren Datenschutzbeauftragten."
    },
    es: {
        TERMS_WELCOME: "Bienvenido a nuestra plataforma. Estos Términos de Servicio constituyen un acuerdo legalmente vinculante entre usted y Legacy. Al acceder a la plataforma, acepta estar sujeto a todos estos términos.",
        TERMS_S1_TITLE: "1. Representaciones y Conducta del Usuario",
        TERMS_S1_DESC: "Al utilizar el sitio, declara y garantiza que: (1) toda la información de registro que envíe será verdadera, precisa y completa; (2) mantendrá la precisión de dicha información; (3) tiene capacidad legal para aceptar estos Términos; (4) no accederá a través de medios automatizados (bots). Cualquier incumplimiento resultará en la cancelación inmediata de la cuenta.",
        TERMS_S2_TITLE: "2. Derechos de Propiedad Intelectual",
        TERMS_S2_DESC: "A menos que se indique lo contrario, el Sitio es de nuestra propiedad. Todo el código fuente, bases de datos, software, diseños, audio, video, texto y gráficos (el 'Contenido') son de nuestra propiedad. Se le otorga una licencia limitada para uso personal y no comercial.",
        TERMS_S3_TITLE: "3. Renuncias y Limitación de Responsabilidad",
        TERMS_S3_DESC: "El sitio se proporciona 'tal cual'. Usted acepta que su uso es bajo su propio riesgo. En la medida máxima permitida por la ley, renunciamos a todas las garantías. No seremos responsables de los daños directos, indirectos, consecuentes o punitivos.",
        TERMS_FOOTER: "Al continuar utilizando esta plataforma, acepta explícitamente estos términos detallados.",
        PRIVACY_WELCOME: "Nos preocupamos profundamente por su privacidad y seguridad de datos. Esta Política de Privacidad explica cómo recopilamos, utilizamos y protegemos su información.",
        PRIVACY_S1_TITLE: "1. Recopilación de Su Información",
        PRIVACY_S1_DESC: "Recopilamos Datos Personales que nos proporciona voluntariamente, y Datos Derivados recopilados automáticamente. Utilizamos cifrado de nivel empresarial para garantizar que todos los datos estén seguros.",
        PRIVACY_S2_TITLE: "2. Uso y Divulgación",
        PRIVACY_S2_DESC: "Utilizamos sus datos para administrar su cuenta. Solo compartimos datos si lo exige la Ley, con Proveedores de Servicios o en Transferencias Comerciales. Nunca vendemos sus datos personales.",
        PRIVACY_S3_TITLE: "3. Retención de Datos y Seguridad",
        PRIVACY_S3_DESC: "Aplicamos medidas de seguridad de alto nivel. Sin embargo, ninguna medida es perfecta. Tiene derecho a solicitar la eliminación de sus datos en cualquier momento.",
        PRIVACY_FOOTER: "Sus datos se manejan en estricto cumplimiento del RGPD."
    },
    ru: {
        TERMS_WELCOME: "Добро пожаловать на нашу платформу. Настоящие Условия обслуживания представляют собой юридически обязательное соглашение между вами и Legacy. Заходя на платформу, вы соглашаетесь соблюдать все эти Условия обслуживания.",
        TERMS_S1_TITLE: "1. Представительства Пользователей и Поведение",
        TERMS_S1_DESC: "Используя сайт, вы заявляете и гарантируете, что: (1) вся регистрационная информация правдива и точна; (2) вы будете поддерживать ее точность; (3) вы имеете правоспособность соблюдать данные Условия; (4) вы не будете получать доступ к сайту с помощью автоматизированных средств (ботов).",
        TERMS_S2_TITLE: "2. Права Интеллектуальной Собственности",
        TERMS_S2_DESC: "Сайт является нашей собственностью. Весь исходный код, базы данных, программное обеспечение, дизайн, текст и графика (совместно именуемые «Контент») принадлежат нам. Вам предоставляется ограниченная лицензия для личного использования.",
        TERMS_S3_TITLE: "3. Отказ от Ответственности и Ограничение",
        TERMS_S3_DESC: "Сайт предоставляется «как есть». Вы соглашаетесь с тем, что используете сайт на свой страх и риск. Мы не несем ответственности за любой прямой или косвенный ущерб.",
        TERMS_FOOTER: "Продолжая использовать эту платформу, вы явно соглашаетесь с этими подробными условиями.",
        PRIVACY_WELCOME: "Мы глубоко заботимся о вашей конфиденциальности. Эта Политика конфиденциальности объясняет, как мы собираем, используем и защищаем вашу информацию.",
        PRIVACY_S1_TITLE: "1. Сбор Вашей Информации",
        PRIVACY_S1_DESC: "Мы собираем Личные Данные, которые вы добровольно предоставляете, и Производные Данные, собираемые автоматически. Мы используем шифрование корпоративного уровня для защиты всех данных.",
        PRIVACY_S2_TITLE: "2. Использование и Раскрытие",
        PRIVACY_S2_DESC: "Мы используем ваши данные для управления вашей учетной записью. Мы никогда не продаем ваши личные данные третьим лицам.",
        PRIVACY_S3_TITLE: "3. Хранение Данных и Безопасность",
        PRIVACY_S3_DESC: "Мы применяем высокоуровневые меры безопасности. Вы имеете право запросить удаление ваших данных в любое время через настройки учетной записи.",
        PRIVACY_FOOTER: "Ваши данные обрабатываются в строгом соответствии с GDPR."
    },
    tr: {
        TERMS_WELCOME: "Platformumuza hoş geldiniz. Bu Hizmet Şartları, platformumuza erişiminiz ve kullanımınızla ilgili olarak sizinle Legacy arasında yasal olarak bağlayıcı bir sözleşmedir.",
        TERMS_S1_TITLE: "1. Kullanıcı Beyanları ve Davranışları",
        TERMS_S1_DESC: "Siteyi kullanarak şunları beyan ve garanti edersiniz: (1) kayıt bilgileri doğru ve eksiksiz olacaktır; (2) bu bilgilerin doğruluğunu koruyacaksınız; (3) botlar veya otomatik yollarla erişmeyeceksiniz. Herhangi bir ihlal hesabın feshiyle sonuçlanır.",
        TERMS_S2_TITLE: "2. Fikri Mülkiyet Hakları",
        TERMS_S2_DESC: "Site bizim mülkiyetimizdedir. Tüm kaynak kodu, veri tabanları, yazılım, tasarımlar, metin ve grafikler («İçerik») bize aittir. Yalnızca kişisel kullanımınız için sınırlı bir lisans verilir.",
        TERMS_S3_TITLE: "3. Sorumluluk Reddi ve Sınırlandırılması",
        TERMS_S3_DESC: "Site 'olduğu gibi' sunulmaktadır. Kullanımınızın riski size aittir. Doğrudan, dolaylı veya cezai zararlardan sorumlu olmayacağız.",
        TERMS_FOOTER: "Bu platformu kullanmaya devam ederek bu ayrıntılı şartları açıkça kabul edersiniz.",
        PRIVACY_WELCOME: "Gizliliğinize ve veri güvenliğinize derinden önem veriyoruz. Bu Gizlilik Politikası, bilgilerinizi nasıl topladığımızı ve koruduğumuzu açıklar.",
        PRIVACY_S1_TITLE: "1. Bilgilerinizin Toplanması",
        PRIVACY_S1_DESC: "Kendi isteğinizle verdiğiniz Kişisel Verileri ve otomatik olarak toplanan Türev Verileri topluyoruz. Tüm verilerin güvende olmasını sağlamak için kurumsal düzeyde şifreleme kullanıyoruz.",
        PRIVACY_S2_TITLE: "2. Kullanım ve İfşa",
        PRIVACY_S2_DESC: "Verilerinizi hesabınızı yönetmek için kullanırız. Kişisel verilerinizi asla üçüncü taraf veri brokerlerine satmayız.",
        PRIVACY_S3_TITLE: "3. Veri Saklama ve Güvenlik",
        PRIVACY_S3_DESC: "Üst düzey güvenlik önlemleri uyguluyoruz. Verilerinizin silinmesini hesap ayarlarınızdan istediğiniz zaman talep etme hakkına sahipsiniz.",
        PRIVACY_FOOTER: "Verileriniz GDPR ile tam uyumlu olarak işlenir."
    },
    cy: {
        TERMS_WELCOME: "Καλωσόρισες στην πλατφόρμα. Τούτοι οι Όροι Χρήσης εν νομικά δεσμευτική συμφωνία μεταξύ εσού τζιαι της Legacy. Άμαν μπαίνεις, αποδέχεσαι πλήρως τούτους τους Όρους.",
        TERMS_S1_TITLE: "1. Συμπεριφορά Χρήστη",
        TERMS_S1_DESC: "Χρησιμοποιώντας τη σελίδα μας, εγγυάστε ότι: (1) ούλλες οι πληροφορίες που βάλλεις εν αληθινές, (2) εννα τις κρατάς σωστές, (3) δεν είσαι μιτσής κάτω των 13, (4) εν θα βάλεις bots να μπαίνουν. Άμαν κάμεις πελλάρες, εννα σου κλείσουμε τον λογαριασμό άμεσα.",
        TERMS_S2_TITLE: "2. Πνευματική Ιδιοκτησία",
        TERMS_S2_DESC: "Ούλλα δαμέσα εν δικά μας. Ο κώδικας, τα σχέδια, τα βίντεο, τζιαι τα κείμενα (το 'Περιεχόμενο') ανήκουν μας. Δικαιούσαι να τα δεις μόνο για προσωπική σου χρήση, όι να τα πουλήσεις.",
        TERMS_S3_TITLE: "3. Αποποίηση Ευθυνών",
        TERMS_S3_DESC: "Η πλατφόρμα δίνεται 'όπως εν'. Συμφωνείς ότι την χρησιμοποιείς με δική σου ευθύνη. Εν αναλαμβάνουμε καμία ευθύνη για ζημιές ή χάσιμο δεδομένων που μπορεί να προκύψουν.",
        TERMS_FOOTER: "Συνεχίζοντας, αποδέχεσαι ρητά τούτους τους όρους. Τελευταία ενημέρωση: Ιούνης 2026.",
        PRIVACY_WELCOME: "Δίνουμε πολλή σημασία στα δεδομένα σου τζιαι την ιδιωτικότητά σου. Εδά εξηγούμε πώς μαζεύουμε τζιαι προστατεύουμε τις πληροφορίες σου. Αν διαφωνείς, μεν χρησιμοποιείς τη σελίδα.",
        PRIVACY_S1_TITLE: "1. Συλλογή Πληροφοριών",
        PRIVACY_S1_DESC: "Μαζεύουμε τα δεδομένα που μας δίνεις (όνομα, email) τζιαι τεχνικά δεδομένα (IP, browser) αυτόματα. Έχουμε κρυπτογράφηση στρατιωτικού επιπέδου για να εν ούλλα ασφαλή.",
        PRIVACY_S2_TITLE: "2. Χρήση Δεδομένων",
        PRIVACY_S2_DESC: "Χρησιμοποιούμε τα δεδομένα σου για να δουλεύκει σωστά ο λογαριασμός σου. Ποττέ εν πουλούμε τα δεδομένα σου σε άλλους.",
        PRIVACY_S3_TITLE: "3. Ασφάλεια τζιαι Διαγραφή",
        PRIVACY_S3_DESC: "Κάμνουμε ό,τι μπορούμε για την ασφάλεια. Έχεις το δικαίωμα να ζητήσεις διαγραφή των δεδομένων σου όποτε θέλεις που τα settings σου.",
        PRIVACY_FOOTER: "Τα δεδομένα σου προστατεύονται σύμφωνα με το GDPR."
    }
};

const files = fs.readdirSync(localesDir);

for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const lang = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
    
    // Fallback to English if translation is missing for a specific language
    const langContent = content[lang] || content['en'];
    
    for (const [key, value] of Object.entries(langContent)) {
        data[key] = value;
    }
    
    fs.writeFileSync(path.join(localesDir, file), JSON.stringify(data, null, 2), 'utf8');
}

console.log('Terms of Service and Privacy Policy details updated in all locales!');
