const fs = require('fs');

const appPath = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/App.jsx';
let code = fs.readFileSync(appPath, 'utf8');

code = code.replace(
    /\{ id: 'gym_endurance', titleKey: 'MISSION_GYM_ENDURANCE', descKey: 'MISSION_GYM_ENDURANCE_DESC', icon: '🏃‍♂️' \}/,
    `{ id: 'gym_endurance', titleKey: 'MISSION_GYM_ENDURANCE', descKey: 'MISSION_GYM_ENDURANCE_DESC', icon: '🏃‍♂️' },\n                { id: 'gym_strength', titleKey: 'MISSION_GYM_STRENGTH', descKey: 'MISSION_GYM_STRENGTH_DESC', icon: '🏋️‍♂️' }`
);
code = code.replace(
    /\{ id: 'adv_sea', titleKey: 'MISSION_ADV_SEA', descKey: 'MISSION_ADV_SEA_DESC', icon: '🌊' \}/,
    `{ id: 'adv_sea', titleKey: 'MISSION_ADV_SEA', descKey: 'MISSION_ADV_SEA_DESC', icon: '🌊' },\n                { id: 'adv_urban', titleKey: 'MISSION_ADV_URBAN', descKey: 'MISSION_ADV_URBAN_DESC', icon: '🏙️' }`
);
code = code.replace(
    /\{ id: 'surv_fast', titleKey: 'MISSION_SURV_FAST', descKey: 'MISSION_SURV_FAST_DESC', icon: '⏳' \}/,
    `{ id: 'surv_fast', titleKey: 'MISSION_SURV_FAST', descKey: 'MISSION_SURV_FAST_DESC', icon: '⏳' },\n                { id: 'surv_fire', titleKey: 'MISSION_SURV_FIRE', descKey: 'MISSION_SURV_FIRE_DESC', icon: '🔥' }`
);
code = code.replace(
    /\{ id: 'mind_focus', titleKey: 'MISSION_MIND_FOCUS', descKey: 'MISSION_MIND_FOCUS_DESC', icon: '🎯' \}/,
    `{ id: 'mind_focus', titleKey: 'MISSION_MIND_FOCUS', descKey: 'MISSION_MIND_FOCUS_DESC', icon: '🎯' },\n                { id: 'mind_read', titleKey: 'MISSION_MIND_READ', descKey: 'MISSION_MIND_READ_DESC', icon: '📚' }`
);
code = code.replace(
    /\{ id: 'combat_power', titleKey: 'MISSION_COMBAT_POWER', descKey: 'MISSION_COMBAT_POWER_DESC', icon: '💥' \}/,
    `{ id: 'combat_power', titleKey: 'MISSION_COMBAT_POWER', descKey: 'MISSION_COMBAT_POWER_DESC', icon: '💥' },\n                { id: 'combat_shadow', titleKey: 'MISSION_COMBAT_SHADOW', descKey: 'MISSION_COMBAT_SHADOW_DESC', icon: '🥊' }`
);
code = code.replace(
    /\{ id: 'chal_conquer', titleKey: 'MISSION_CHAL_CONQUER', descKey: 'MISSION_CHAL_CONQUER_DESC', icon: '👑' \}/,
    `{ id: 'chal_conquer', titleKey: 'MISSION_CHAL_CONQUER', descKey: 'MISSION_CHAL_CONQUER_DESC', icon: '👑' },\n                { id: 'chal_social', titleKey: 'MISSION_CHAL_SOCIAL', descKey: 'MISSION_CHAL_SOCIAL_DESC', icon: '🗣️' }`
);

fs.writeFileSync(appPath, code, 'utf8');

const localesDir = 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-frontend/src/locales';
const files = fs.readdirSync(localesDir);

const newTranslations = {
    en: {
        MISSION_GYM_CORE: "Core Crusher", MISSION_GYM_CORE_DESC: "Complete 100 sit-ups or 5 minutes of planking.",
        MISSION_GYM_ENDURANCE: "Endurance Run", MISSION_GYM_ENDURANCE_DESC: "Run or jog continuously for 5 kilometers.",
        MISSION_GYM_STRENGTH: "Strength Protocol", MISSION_GYM_STRENGTH_DESC: "Perform 50 heavy squats and 50 push-ups.",
        MISSION_ADV_NATURE: "Nature Walk", MISSION_ADV_NATURE_DESC: "Spend 1 hour hiking in a forest or mountain trail.",
        MISSION_ADV_SEA: "Sea Conqueror", MISSION_ADV_SEA_DESC: "Swim in open water or take a freezing cold sea plunge.",
        MISSION_ADV_URBAN: "Urban Explorer", MISSION_ADV_URBAN_DESC: "Walk 10km across the city finding 3 new places.",
        MISSION_SURV_SHELTER: "Build a Shelter", MISSION_SURV_SHELTER_DESC: "Construct a basic survival shelter using natural materials.",
        MISSION_SURV_FAST: "24-Hour Fast", MISSION_SURV_FAST_DESC: "Consume zero calories for 24 hours. Drink only water.",
        MISSION_SURV_FIRE: "Fire Starter", MISSION_SURV_FIRE_DESC: "Start a fire outdoors without matches or a lighter.",
        MISSION_MIND_MEDITATE: "Deep Meditation", MISSION_MIND_MEDITATE_DESC: "Meditate in complete silence for 30 minutes.",
        MISSION_MIND_FOCUS: "Absolute Focus", MISSION_MIND_FOCUS_DESC: "Work on your most important task for 4 hours with zero distractions.",
        MISSION_MIND_READ: "Knowledge Absorber", MISSION_MIND_READ_DESC: "Read 50 pages of an educational or non-fiction book.",
        MISSION_COMBAT_REFLEX: "Reflex Training", MISSION_COMBAT_REFLEX_DESC: "Do 15 minutes of intensive reflex or dodging drills.",
        MISSION_COMBAT_POWER: "Power Strikes", MISSION_COMBAT_POWER_DESC: "Perform 100 full-power strikes on a heavy bag.",
        MISSION_COMBAT_SHADOW: "Shadow Boxing", MISSION_COMBAT_SHADOW_DESC: "Shadow box with high intensity for 6 rounds (3 mins each).",
        MISSION_CHAL_ENDURE: "Pain Tolerance", MISSION_CHAL_ENDURE_DESC: "Hold a wall sit or a stress position for as long as humanly possible.",
        MISSION_CHAL_CONQUER: "Conquer a Fear", MISSION_CHAL_CONQUER_DESC: "Do one thing today that genuinely terrifies you.",
        MISSION_CHAL_SOCIAL: "Social Maverick", MISSION_CHAL_SOCIAL_DESC: "Start a meaningful conversation with 3 complete strangers."
    },
    el: {
        MISSION_GYM_CORE: "Ατσάλινος Κορμός", MISSION_GYM_CORE_DESC: "Κάνε 100 κοιλιακούς ή 5 λεπτά σανίδα (plank).",
        MISSION_GYM_ENDURANCE: "Δοκιμασία Αντοχής", MISSION_GYM_ENDURANCE_DESC: "Τρέξε συνεχόμενα για 5 χιλιόμετρα.",
        MISSION_GYM_STRENGTH: "Πρωτόκολλο Δύναμης", MISSION_GYM_STRENGTH_DESC: "Εκτέλεσε 50 βαριά squats και 50 push-ups.",
        MISSION_ADV_NATURE: "Επαφή με τη Φύση", MISSION_ADV_NATURE_DESC: "Περπάτησε για 1 ώρα σε δάσος ή βουνό.",
        MISSION_ADV_SEA: "Κατακτητής της Θάλασσας", MISSION_ADV_SEA_DESC: "Κολύμπα σε ανοιχτή θάλασσα ή κάνε μια βουτιά σε παγωμένα νερά.",
        MISSION_ADV_URBAN: "Εξερευνητής της Πόλης", MISSION_ADV_URBAN_DESC: "Περπάτησε 10km μέσα στην πόλη ανακαλύπτοντας 3 νέα μέρη.",
        MISSION_SURV_SHELTER: "Φτιάξε Καταφύγιο", MISSION_SURV_SHELTER_DESC: "Κατασκεύασε ένα βασικό καταφύγιο επιβίωσης στη φύση.",
        MISSION_SURV_FAST: "24ωρη Νηστεία", MISSION_SURV_FAST_DESC: "Μην καταναλώσεις καμία θερμίδα για 24 ώρες. Μόνο νερό.",
        MISSION_SURV_FIRE: "Άναμμα Φωτιάς", MISSION_SURV_FIRE_DESC: "Άναψε φωτιά στη φύση χωρίς σπίρτα ή αναπτήρα.",
        MISSION_MIND_MEDITATE: "Βαθύς Διαλογισμός", MISSION_MIND_MEDITATE_DESC: "Κάνε διαλογισμό σε απόλυτη σιωπή για 30 λεπτά.",
        MISSION_MIND_FOCUS: "Απόλυτη Συγκέντρωση", MISSION_MIND_FOCUS_DESC: "Δούλεψε στο πιο σημαντικό σου task για 4 ώρες χωρίς περισπασμούς.",
        MISSION_MIND_READ: "Απορρόφηση Γνώσης", MISSION_MIND_READ_DESC: "Διάβασε 50 σελίδες από ένα εκπαιδευτικό ή μη-μυθοπλαστικό βιβλίο.",
        MISSION_COMBAT_REFLEX: "Προπόνηση Αντανακλαστικών", MISSION_COMBAT_REFLEX_DESC: "Κάνε 15 λεπτά εντατικές ασκήσεις αντανακλαστικών.",
        MISSION_COMBAT_POWER: "Χτυπήματα Δύναμης", MISSION_COMBAT_POWER_DESC: "Ρίξε 100 χτυπήματα μέγιστης δύναμης σε έναν σάκο.",
        MISSION_COMBAT_SHADOW: "Σκιαμαχία", MISSION_COMBAT_SHADOW_DESC: "Κάνε εντατική σκιαμαχία για 6 γύρους (των 3 λεπτών).",
        MISSION_CHAL_ENDURE: "Ανοχή στον Πόνο", MISSION_CHAL_ENDURE_DESC: "Κάνε κάθισμα στον τοίχο (wall sit) για όσο περισσότερο αντέχεις.",
        MISSION_CHAL_CONQUER: "Κατάκτησε έναν Φόβο", MISSION_CHAL_CONQUER_DESC: "Κάνε κάτι σήμερα που σε τρομάζει πραγματικά.",
        MISSION_CHAL_SOCIAL: "Κοινωνικός Επαναστάτης", MISSION_CHAL_SOCIAL_DESC: "Ξεκίνα μια ουσιαστική συζήτηση με 3 εντελώς άγνωστα άτομα."
    },
    de: {
        MISSION_GYM_CORE: "Kernzerstörer", MISSION_GYM_CORE_DESC: "Mache 100 Sit-ups oder 5 Minuten Plank.",
        MISSION_GYM_ENDURANCE: "Ausdauerlauf", MISSION_GYM_ENDURANCE_DESC: "Laufe oder jogge 5 Kilometer ohne Pause.",
        MISSION_GYM_STRENGTH: "Stärke-Protokoll", MISSION_GYM_STRENGTH_DESC: "Mache 50 schwere Kniebeugen und 50 Liegestütze.",
        MISSION_ADV_NATURE: "Naturspaziergang", MISSION_ADV_NATURE_DESC: "Wandere 1 Stunde in einem Wald oder auf einem Bergweg.",
        MISSION_ADV_SEA: "Eroberer des Meeres", MISSION_ADV_SEA_DESC: "Schwimme im offenen Meer oder nimm ein eiskaltes Bad.",
        MISSION_ADV_URBAN: "Stadterkunder", MISSION_ADV_URBAN_DESC: "Gehe 10 km durch die Stadt und entdecke 3 neue Orte.",
        MISSION_SURV_SHELTER: "Bau eines Unterstandes", MISSION_SURV_SHELTER_DESC: "Baue einen einfachen Überlebensunterstand aus Naturmaterialien.",
        MISSION_SURV_FAST: "24-Stunden-Fasten", MISSION_SURV_FAST_DESC: "Nimm 24 Stunden lang null Kalorien zu dir. Nur Wasser trinken.",
        MISSION_SURV_FIRE: "Feuerstarter", MISSION_SURV_FIRE_DESC: "Mache im Freien ohne Streichhölzer oder Feuerzeug Feuer.",
        MISSION_MIND_MEDITATE: "Tiefe Meditation", MISSION_MIND_MEDITATE_DESC: "Meditiere in absoluter Stille für 30 Minuten.",
        MISSION_MIND_FOCUS: "Absoluter Fokus", MISSION_MIND_FOCUS_DESC: "Arbeite 4 Stunden ohne Ablenkung an deiner wichtigsten Aufgabe.",
        MISSION_MIND_READ: "Wissensabsorber", MISSION_MIND_READ_DESC: "Lies 50 Seiten eines Sach- oder Lehrbuchs.",
        MISSION_COMBAT_REFLEX: "Reflextraining", MISSION_COMBAT_REFLEX_DESC: "Absolviere 15 Minuten intensive Reflexübungen.",
        MISSION_COMBAT_POWER: "Kraftschläge", MISSION_COMBAT_POWER_DESC: "Mache 100 Schläge mit voller Kraft auf einen Sandsack.",
        MISSION_COMBAT_SHADOW: "Schattenboxen", MISSION_COMBAT_SHADOW_DESC: "Schattenboxe hochintensiv für 6 Runden (je 3 Minuten).",
        MISSION_CHAL_ENDURE: "Schmerztoleranz", MISSION_CHAL_ENDURE_DESC: "Halte einen Wandsitz so lange wie menschlich möglich durch.",
        MISSION_CHAL_CONQUER: "Besiege eine Angst", MISSION_CHAL_CONQUER_DESC: "Tue heute eine Sache, die dir wirklich Angst macht.",
        MISSION_CHAL_SOCIAL: "Sozialer Rebell", MISSION_CHAL_SOCIAL_DESC: "Beginne ein sinnvolles Gespräch mit 3 völlig Fremden."
    },
    fr: {
        MISSION_GYM_CORE: "Destructeur de Tronc", MISSION_GYM_CORE_DESC: "Faites 100 abdominaux ou 5 minutes de gainage.",
        MISSION_GYM_ENDURANCE: "Course d'Endurance", MISSION_GYM_ENDURANCE_DESC: "Courez ou faites un footing continu de 5 kilomètres.",
        MISSION_GYM_STRENGTH: "Protocole de Force", MISSION_GYM_STRENGTH_DESC: "Effectuez 50 squats lourds et 50 pompes.",
        MISSION_ADV_NATURE: "Promenade dans la Nature", MISSION_ADV_NATURE_DESC: "Marchez pendant 1 heure dans une forêt ou en montagne.",
        MISSION_ADV_SEA: "Conquérant de la Mer", MISSION_ADV_SEA_DESC: "Nagez en eau libre ou prenez un bain de mer glacé.",
        MISSION_ADV_URBAN: "Explorateur Urbain", MISSION_ADV_URBAN_DESC: "Marchez 10 km en ville en découvrant 3 nouveaux lieux.",
        MISSION_SURV_SHELTER: "Construire un Abri", MISSION_SURV_SHELTER_DESC: "Construisez un abri de survie basique avec des matériaux naturels.",
        MISSION_SURV_FAST: "Jeûne de 24 Heures", MISSION_SURV_FAST_DESC: "Ne consommez aucune calorie pendant 24h. Ne buvez que de l'eau.",
        MISSION_SURV_FIRE: "Allumeur de Feu", MISSION_SURV_FIRE_DESC: "Allumez un feu en plein air sans allumettes ni briquet.",
        MISSION_MIND_MEDITATE: "Méditation Profonde", MISSION_MIND_MEDITATE_DESC: "Méditez dans un silence complet pendant 30 minutes.",
        MISSION_MIND_FOCUS: "Concentration Absolue", MISSION_MIND_FOCUS_DESC: "Travaillez sur votre tâche la plus importante pendant 4h sans distraction.",
        MISSION_MIND_READ: "Absorbeur de Connaissances", MISSION_MIND_READ_DESC: "Lisez 50 pages d'un livre éducatif ou non-fictionnel.",
        MISSION_COMBAT_REFLEX: "Entraînement des Réflexes", MISSION_COMBAT_REFLEX_DESC: "Faites 15 minutes d'exercices intensifs d'esquive et de réflexes.",
        MISSION_COMBAT_POWER: "Frappes Puissantes", MISSION_COMBAT_POWER_DESC: "Donnez 100 frappes à pleine puissance dans un sac de frappe.",
        MISSION_COMBAT_SHADOW: "Shadow-Boxing", MISSION_COMBAT_SHADOW_DESC: "Faites du shadow-boxing intensif pendant 6 rounds (3 min chacun).",
        MISSION_CHAL_ENDURE: "Tolérance à la Douleur", MISSION_CHAL_ENDURE_DESC: "Maintenez la position de la chaise contre un mur aussi longtemps que possible.",
        MISSION_CHAL_CONQUER: "Vaincre une Peur", MISSION_CHAL_CONQUER_DESC: "Faites une chose aujourd'hui qui vous terrifie vraiment.",
        MISSION_CHAL_SOCIAL: "Maverick Social", MISSION_CHAL_SOCIAL_DESC: "Entamez une conversation enrichissante avec 3 parfaits inconnus."
    },
    es: {
        MISSION_GYM_CORE: "Núcleo de Acero", MISSION_GYM_CORE_DESC: "Haz 100 abdominales o 5 minutos de plancha.",
        MISSION_GYM_ENDURANCE: "Carrera de Resistencia", MISSION_GYM_ENDURANCE_DESC: "Corre sin parar durante 5 kilómetros.",
        MISSION_GYM_STRENGTH: "Protocolo de Fuerza", MISSION_GYM_STRENGTH_DESC: "Haz 50 sentadillas pesadas y 50 flexiones.",
        MISSION_ADV_NATURE: "Paseo por la Naturaleza", MISSION_ADV_NATURE_DESC: "Pasa 1 hora caminando en un bosque o sendero de montaña.",
        MISSION_ADV_SEA: "Conquistador del Mar", MISSION_ADV_SEA_DESC: "Nada en aguas abiertas o date un chapuzón en el mar helado.",
        MISSION_ADV_URBAN: "Explorador Urbano", MISSION_ADV_URBAN_DESC: "Camina 10km por la ciudad descubriendo 3 lugares nuevos.",
        MISSION_SURV_SHELTER: "Construye un Refugio", MISSION_SURV_SHELTER_DESC: "Construye un refugio básico de supervivencia con materiales naturales.",
        MISSION_SURV_FAST: "Ayuno de 24 Horas", MISSION_SURV_FAST_DESC: "No consumas calorías durante 24 horas. Solo agua.",
        MISSION_SURV_FIRE: "Iniciador de Fuego", MISSION_SURV_FIRE_DESC: "Haz fuego al aire libre sin cerillas ni encendedor.",
        MISSION_MIND_MEDITATE: "Meditación Profunda", MISSION_MIND_MEDITATE_DESC: "Medita en completo silencio durante 30 minutos.",
        MISSION_MIND_FOCUS: "Concentración Absoluta", MISSION_MIND_FOCUS_DESC: "Trabaja en tu tarea más importante por 4 horas sin distracciones.",
        MISSION_MIND_READ: "Absorbedor de Conocimiento", MISSION_MIND_READ_DESC: "Lee 50 páginas de un libro educativo o de no ficción.",
        MISSION_COMBAT_REFLEX: "Entrenamiento de Reflejos", MISSION_COMBAT_REFLEX_DESC: "Realiza 15 minutos de ejercicios intensos de reflejos o evasión.",
        MISSION_COMBAT_POWER: "Golpes de Poder", MISSION_COMBAT_POWER_DESC: "Da 100 golpes con máxima potencia a un saco pesado.",
        MISSION_COMBAT_SHADOW: "Boxeo de Sombra", MISSION_COMBAT_SHADOW_DESC: "Haz boxeo de sombra a alta intensidad por 6 asaltos (3 mins).",
        MISSION_CHAL_ENDURE: "Tolerancia al Dolor", MISSION_CHAL_ENDURE_DESC: "Mantén una sentadilla isométrica en la pared el mayor tiempo posible.",
        MISSION_CHAL_CONQUER: "Conquista un Miedo", MISSION_CHAL_CONQUER_DESC: "Haz algo hoy que genuinamente te aterrorice.",
        MISSION_CHAL_SOCIAL: "Rebelde Social", MISSION_CHAL_SOCIAL_DESC: "Inicia una conversación significativa con 3 completos desconocidos."
    },
    ru: {
        MISSION_GYM_CORE: "Стальной Пресс", MISSION_GYM_CORE_DESC: "Сделайте 100 скручиваний или простойте в планке 5 минут.",
        MISSION_GYM_ENDURANCE: "Тест на Выносливость", MISSION_GYM_ENDURANCE_DESC: "Пробегите без остановки 5 километров.",
        MISSION_GYM_STRENGTH: "Силовой Протокол", MISSION_GYM_STRENGTH_DESC: "Выполните 50 тяжелых приседаний и 50 отжиманий.",
        MISSION_ADV_NATURE: "Прогулка на Природе", MISSION_ADV_NATURE_DESC: "Проведите 1 час на прогулке в лесу или горах.",
        MISSION_ADV_SEA: "Покоритель Моря", MISSION_ADV_SEA_DESC: "Искупайтесь в открытой воде или ледяном море.",
        MISSION_ADV_URBAN: "Городской Исследователь", MISSION_ADV_URBAN_DESC: "Пройдите 10 км по городу, найдя 3 новых места.",
        MISSION_SURV_SHELTER: "Строитель Убежища", MISSION_SURV_SHELTER_DESC: "Постройте базовое укрытие для выживания из природных материалов.",
        MISSION_SURV_FAST: "24-Часовое Голодание", MISSION_SURV_FAST_DESC: "Не употребляйте калории 24 часа. Пейте только воду.",
        MISSION_SURV_FIRE: "Разжигатель Огня", MISSION_SURV_FIRE_DESC: "Разведите огонь на улице без спичек или зажигалки.",
        MISSION_MIND_MEDITATE: "Глубокая Медитация", MISSION_MIND_MEDITATE_DESC: "Медитируйте в полной тишине в течение 30 минут.",
        MISSION_MIND_FOCUS: "Абсолютный Фокус", MISSION_MIND_FOCUS_DESC: "Работайте над главной задачей 4 часа без отвлекающих факторов.",
        MISSION_MIND_READ: "Поглотитель Знаний", MISSION_MIND_READ_DESC: "Прочитайте 50 страниц образовательной книги.",
        MISSION_COMBAT_REFLEX: "Тренировка Рефлексов", MISSION_COMBAT_REFLEX_DESC: "Делайте 15 минут интенсивных упражнений на уклонение.",
        MISSION_COMBAT_POWER: "Мощные Удары", MISSION_COMBAT_POWER_DESC: "Нанесите 100 ударов в полную силу по боксерской груше.",
        MISSION_COMBAT_SHADOW: "Бой с Тенью", MISSION_COMBAT_SHADOW_DESC: "Интенсивный бой с тенью: 6 раундов по 3 минуты.",
        MISSION_CHAL_ENDURE: "Терпимость к Боли", MISSION_CHAL_ENDURE_DESC: "Удерживайте позицию «стульчик» у стены как можно дольше.",
        MISSION_CHAL_CONQUER: "Победи Страх", MISSION_CHAL_CONQUER_DESC: "Сделайте сегодня то, что вас по-настоящему пугает.",
        MISSION_CHAL_SOCIAL: "Социальный Бунтарь", MISSION_CHAL_SOCIAL_DESC: "Начните осмысленный разговор с 3 незнакомцами."
    },
    tr: {
        MISSION_GYM_CORE: "Çelik Merkez", MISSION_GYM_CORE_DESC: "100 mekik çek veya 5 dakika plank yap.",
        MISSION_GYM_ENDURANCE: "Dayanıklılık Koşusu", MISSION_GYM_ENDURANCE_DESC: "Kesintisiz olarak 5 kilometre koş veya tempolu yürü.",
        MISSION_GYM_STRENGTH: "Güç Protokolü", MISSION_GYM_STRENGTH_DESC: "50 ağır squat ve 50 şınav çek.",
        MISSION_ADV_NATURE: "Doğa Yürüyüşü", MISSION_ADV_NATURE_DESC: "Bir orman veya dağ yolunda 1 saat yürüyüş yap.",
        MISSION_ADV_SEA: "Deniz Fatihi", MISSION_ADV_SEA_DESC: "Açık denizde yüz veya buz gibi bir denize dal.",
        MISSION_ADV_URBAN: "Şehir Kaşifi", MISSION_ADV_URBAN_DESC: "Şehirde 10 km yürü ve 3 yeni mekan keşfet.",
        MISSION_SURV_SHELTER: "Sığınak İnşası", MISSION_SURV_SHELTER_DESC: "Doğal malzemeler kullanarak temel bir hayatta kalma sığınağı yap.",
        MISSION_SURV_FAST: "24 Saat Oruç", MISSION_SURV_FAST_DESC: "24 saat boyunca kalori alma. Sadece su iç.",
        MISSION_SURV_FIRE: "Ateş Başlatıcı", MISSION_SURV_FIRE_DESC: "Kibrit veya çakmak kullanmadan doğada ateş yak.",
        MISSION_MIND_MEDITATE: "Derin Meditasyon", MISSION_MIND_MEDITATE_DESC: "Tam sessizlikte 30 dakika meditasyon yap.",
        MISSION_MIND_FOCUS: "Mutlak Odaklanma", MISSION_MIND_FOCUS_DESC: "Hiçbir dikkat dağıtıcı olmadan 4 saat boyunca en önemli görevinde çalış.",
        MISSION_MIND_READ: "Bilgi Emici", MISSION_MIND_READ_DESC: "Eğitici veya kurgu olmayan bir kitaptan 50 sayfa oku.",
        MISSION_COMBAT_REFLEX: "Refleks Eğitimi", MISSION_COMBAT_REFLEX_DESC: "15 dakika boyunca yoğun refleks ve kaçınma antrenmanı yap.",
        MISSION_COMBAT_POWER: "Güçlü Vuruşlar", MISSION_COMBAT_POWER_DESC: "Bir kum torbasına 100 kez tam güçle vur.",
        MISSION_COMBAT_SHADOW: "Gölge Boksu", MISSION_COMBAT_SHADOW_DESC: "Yüksek yoğunluklu gölge boksu yap (6 raunt, her biri 3 dakika).",
        MISSION_CHAL_ENDURE: "Acı Toleransı", MISSION_CHAL_ENDURE_DESC: "Duvara yaslanarak oturma pozisyonunu (wall sit) dayanabildiğin kadar tut.",
        MISSION_CHAL_CONQUER: "Bir Korkuyu Yen", MISSION_CHAL_CONQUER_DESC: "Bugün seni gerçekten korkutan bir şey yap.",
        MISSION_CHAL_SOCIAL: "Sosyal Asi", MISSION_CHAL_SOCIAL_DESC: "Bugün 3 tamamen yabancı kişiyle anlamlı bir sohbet başlat."
    }
};

for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const p = `${localesDir}/${file}`;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    
    let lang = file.replace('.json', '');
    let source = newTranslations[lang] || newTranslations.en; // fallback to EN for CY or unsupported
    
    for (const [key, val] of Object.entries(source)) {
        data[key] = val;
    }
    
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}
console.log('App.jsx missions updated and locales populated fully!');
