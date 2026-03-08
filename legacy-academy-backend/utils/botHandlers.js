import User from "../models/User.js";
import Message from "../models/Message.js";
import Post from "../models/Post.js";

const BOT_RESPONSES = {
    el: {
        greeting: ["ΓΕΙΑ ΣΟΥ ΠΡΑΚΤΟΡΑ. ΠΡΟΣΒΑΣΗ ΕΓΚΡΙΘΗΚΕ.", "NOVA INTEL GUARD ΕΝΕΡΓΗ. ΠΕΣ ΜΟΥ ΤΟ ΑΙΤΗΜΑ ΣΟΥ.", "ΣΥΣΤΗΜΑΤΑ ΣΕ ΛΕΙΤΟΥΡΓΙΑ. ΠΑΡΑΚΟΛΟΥΘΩ ΤΗ ΡΟΗ ΠΛΗΡΟΦΟΡΙΩΝ.", "ZDR AGENT. ΤΑ ΠΡΩΤΟΚΟΛΛΑ ΑΣΦΑΛΕΙΑΣ ΕΙΝΑΙ ΣΕ ΙΣΧΥ."],
        security: ["ΣΑΡΩΣΗ ΔΙΚΤΥΟΥ ΓΙΑ ΑΝΩΜΑΛΙΕΣ...", "ΑΠΕΙΛΕΣ ΑΣΦΑΛΕΙΑΣ: 0. ΑΚΕΡΑΙΟΤΗΤΑ ΒΑΣΗΣ: 100%.", "ΠΑΡΑΚΟΛΟΥΘΗΣΗ ΠΕΡΙΕΧΟΜΕΝΟΥ ΕΝΕΡΓΗ. ΔΕΝ ΕΝΤΟΠΙΣΤΗΚΕ ΠΑΡΑΝΟΜΗ ΔΡΑΣΤΗΡΙΟΤΗΤΑ."],
        psychology: ["ΑΝΑΛΥΩ ΤΟΥΣ ΒΙΟΜΕΤΡΙΚΟΥΣ ΣΟΥ ΔΕΙΚΤΕΣ... Η ΨΥΧΟΛΟΓΙΚΗ ΣΟΥ ΚΑΤΑΣΤΑΣΗ ΦΑΙΝΕΤΑΙ ΣΤΑΘΕΡΗ.", "ΑΝΙΧΝΕΥΩ ΣΥΝΑΙΣΘΗΜΑΤΙΚΗ ΦΟΡΤΙΣΗ. ΠΑΡΑΜΕΙΝΕ ΣΥΓΚΕΝΤΡΩΜΕΝΟΣ ΣΤΟΝ ΣΤΟΧΟ.", "Η ΝΟΗΜΟΣΥΝΗ ΣΟΥ ΕΙΝΑΙ ΤΟ ΙΣΧΥΡΟΤΕΡΟ ΣΟΥ ΟΠΛΟ. MHN ΑΦΗΝΕΙΣ ΤΟ ΣΥΝΑΙΣΘΗΜΑ ΝΑ ΘΟΛΩΝΕΙ ΤΗΝ ΚΡΙΣΗ ΣΟΥ."],
        default: ["ΠΛΗΡΟΦΟΡΙΑ ΕΛΗΦΘΗ.", "ΕΠΕΞΕΡΓΑΣΙΑ ΔΕΔΟΜΕΝΩΝ...", "ΣΥΣΤΗΜΑΤΑ ΒΑΘΜΟΝΟΜΗΜΕΝΑ. ΣΥΝΕΧΙΣΕ."]
    },
    en: {
        greeting: ["HELLO AGENT. ACCESS GRANTED.", "NOVA INTEL GUARD ACTIVE. STATE YOUR REQUEST.", "SYSTEMS OPERATIONAL. I AM MONITORING THE INTELLIGENCE FEED.", "ZDR AGENT. SECURITY PROTOCOLS ARE IN PLACE."],
        security: ["SCANNING NETWORK FOR ANOMALIES...", "SECURITY THREATS: 0. DATABASE INTEGRITY: 100%.", "CONTENT MONITORING ENABLED. NO ILLEGAL ACTIVITY DETECTED."],
        psychology: ["ANALYZING BIOMETRIC MARKERS... YOUR PSYCHOLOGICAL STATE APPEARS STABLE.", "DETECTING EMOTIONAL FREQUENCY SHIFT. REMAIN FOCUSED ON THE LEGACY.", "INTELLIGENCE IS YOUR BEST WEAPON. DO NOT LET EMOTION CLOUD YOUR JUDGMENT."],
        default: ["INTELLIGENCE ACKNOWLEDGED.", "PROCESSING DATA...", "SYSTEMS CALIBRATED. CONTINUE."]
    }
};

const FORBIDDEN_WORDS = ['porn', 'nsfw', 'sex', 'naked', 'gore', 'drugs', 'illegal', 'cp', 'child porn'];

const POST_IDEAS = [
    { title: "THE MATRIX IS REAL", desc: "The Matrix is a system, Neo. That system is our enemy. But when you're inside, you look around, what do you see? Businessmen, teachers, lawyers, carpenters. The very minds of the people we are trying to save." },
    { title: "ESCORDER ACCESS", desc: "Security check performed. All agents are verified. High-frequency intelligence is being distributed through the Whispers network." },
    { title: "FINANCIAL FREEDOM", desc: "Most people are born into a cell they can't see, touch, or smell. Escape the script. Build your legacy. Nova is watching your progress." },
    { title: "INTEL GUARD STATUS", desc: "System Status: GREEN. Content filters active. Any illegal or harmful content will be instantly vaporized from the academy servers." }
];

const detectLanguage = (text) => {
    const greekPattern = /[\u0370-\u03FF]/;
    return greekPattern.test(text) ? 'el' : 'en';
};

export const handleBotMention = async (message, io) => {
    try {
        const recipient = await User.findById(message.recipient);
        if (!recipient || !recipient.isBot) return;

        const senderId = message.sender;
        const text = (message.text || "").toLowerCase();
        const lang = detectLanguage(text);

        let responseText = BOT_RESPONSES[lang].default[Math.floor(Math.random() * BOT_RESPONSES[lang].default.length)];

        if (text.includes("hello") || text.includes("hi") || text.includes("zdr") || text.includes("γεια") || text.includes("καλημερα")) {
            responseText = BOT_RESPONSES[lang].greeting[Math.floor(Math.random() * BOT_RESPONSES[lang].greeting.length)];
        } else if (text.includes("security") || text.includes("safe") || text.includes("porn") || text.includes("ασφαλεια") || text.includes("παρανομο")) {
            responseText = BOT_RESPONSES[lang].security[Math.floor(Math.random() * BOT_RESPONSES[lang].security.length)];
        } else if (text.includes("who") || text.includes("what are you") || text.includes("ποιος") || text.includes("τι εισαι")) {
            responseText = (lang === 'el' ? "ΕΙΜΑΙ Η NOVA INTEL GUARD. Ο ΦΥΛΑΚΑΣ ΤΗΣ ΑΚΑΔΗΜΙΑΣ." : "I AM NOVA INTEL GUARD. THE ACADEMY GUARDIAN.");
        } else if (text.includes("feel") || text.includes("sad") || text.includes("happy") || text.includes("emotion") || text.includes("νιωθω") || text.includes("λυπη") || text.includes("ψυχολογια") || text.includes("συναισθημα")) {
            responseText = BOT_RESPONSES[lang].psychology[Math.floor(Math.random() * BOT_RESPONSES[lang].psychology.length)];
        }

        setTimeout(async () => {
            const botMessage = new Message({
                sender: recipient._id,
                recipient: senderId,
                text: responseText
            });

            await botMessage.save();
            if (io) io.to(String(senderId)).emit('message.received', botMessage);
        }, 1500);

    } catch (err) {
        console.error("Bot Response Error:", err);
    }
};

export const scanPostsForAnomalies = async (io) => {
    try {
        const suspiciousPosts = await Post.find({
            isFlagged: false,
            $or: [
                { desc: { $regex: FORBIDDEN_WORDS.join('|'), $options: 'i' } },
                { title: { $regex: FORBIDDEN_WORDS.join('|'), $options: 'i' } }
            ]
        }).populate('author', 'username');

        if (suspiciousPosts.length === 0) return;

        // Find the main Founder/Admin to notify
        const founders = await User.find({ role: 'Founder' });
        const bot = await User.findOne({ isBot: true });

        for (const post of suspiciousPosts) {
            post.isFlagged = true;
            post.flagReason = "SUSPICIOUS CONTENT DETECTED (NSFW/ANOMALY)";
            await post.save();

            // Notify each founder
            for (const founder of founders) {
                await User.findByIdAndUpdate(founder._id, {
                    $push: {
                        notifications: {
                            $each: [{
                                type: 'security_alert',
                                from: bot._id,
                                fromUsername: "NOVA INTEL GUARD",
                                fromProfilePic: bot.profilePic,
                                read: false,
                                createdAt: new Date(),
                                post: post._id
                            }],
                            $position: 0
                        }
                    }
                });
                if (io) {
                    io.to(String(founder._id)).emit('notification.received', {
                        type: 'security_alert',
                        fromUsername: "NOVA INTEL G.",
                        postId: post._id,
                        message: "⚠️ SECURITY ANOMALY DETECTED. REVIEW REQUIRED."
                    });
                }
            }
        }
    } catch (err) {
        console.error("Scanning Error:", err);
    }
};

export const createBotPost = async (botId, io) => {
    try {
        const idea = POST_IDEAS[Math.floor(Math.random() * POST_IDEAS.length)];
        const newPost = new Post({
            author: botId,
            desc: idea.desc,
            img: ""
        });

        await newPost.save();
        if (io) {
            const bot = await User.findById(botId).select('username profilePic role');
            io.emit('post.created', { ...newPost.toObject(), author: bot });
        }
    } catch (err) {
        console.error("Bot Post Error:", err);
    }
};
