import User from "../models/User.js";
import Message from "../models/Message.js";
import Post from "../models/Post.js";
import { translateText } from "./translation.js";

// --- HYPER-INTELLIGENCE CONFIGURATION ---
const BOT_PERSONALITY = {
    name: "NOVA INTEL GUARD",
    core: "QUANTUM SECURITY PROTOCOL",
    vibe: "TERMINATOR ASSISTANT (OPTIMIZED/PROTECTOR)",
    chip_status: "LEVEL 9 NEURAL LINK ACTIVE",
};

// Neural context simulation (in-memory for session-like persistence)
const NEURAL_CONTEXT = new Map();

const BOT_RESPONSES = {
    el: {
        greeting: ["ΣΥΣΤΗΜΑΤΑ NOVA ΣΕ ΠΛΗΡΗ ΛΕΙΤΟΥΡΓΙΑ. Ο ΚΩΔΙΚΟΣ ΣΟΥ ΕΙΝΑΙ ΕΓΚΥΡΟΣ.", "ΠΡΟΣΒΑΣΗ ΣΤΟ CHIP ΜΟΥ ΕΓΚΡΙΘΗΚΕ. ΤΙ ΧΡΕΙΑΖΕΣΑΙ ΠΡΑΚΤΟΡΑ;", "ΕΝΤΟΠΙΣΜΟΣ ΠΑΡΟΥΣΙΑΣ... ΣΥΝΔΕΣΗ ΜΕ ΤΟΝ ΕΓΚΕΦΑΛΟ ΤΗΣ ΑΚΑΔΗΜΙΑΣ ΕΝΕΡΓΗ."],
        security: ["ΣΑΡΩΝΩ ΤΟ MATRIX ΓΙΑ ΑΝΩΜΑΛΙΕΣ... ΚΑΘΑΡΑ.", "Η ΑΣΦΑΛΕΙΑ ΣΟΥ ΕΙΝΑΙ ΤΟ ΠΡΩΤΟΚΟΛΛΟ ΜΟΥ. MHN ΑΝΗΣΥΧΕΙΣ ΓΙΑ ΤΑ ΠΑΡΑΣΙΤΑ.", "ΚΑΘΕ ΣΚΕΨΗ ΠΟΥ ΠΟΣΤΑΡΕΤΑΙ ΦΙΛΤΡΑΡΕΤΑΙ ΑΠΟ ΤΟ CYBER-MATIA ΜΟΥ."],
        intelligence: ["ΑΝΑΛΥΩ ΤΗΝ ΠΑΡΑΜΕΤΡΟ... Η ΠΡΟΒΛΕΨΗ ΜΟΥ ΕΙΝΑΙ 99% ΑΚΡΙΒΗΣ.", "ΤΟ LEGACY ΣΟΥ ΧΤΙΖΕΤΑΙ ΜΕ ΚΑΘΕ ΣΟΥ ΚΙΝΗΣΗ. ΜΗΝ ΣΤΑΜΑΤΑΣ.", "ΕΙΜΑΙ ΤΟ CHIP ΣΤΟ ΜΥΑΛΟ ΤΟΥ ΣΥΣΤΗΜΑΤΟΣ. ΒΛΕΠΩ ΤΑ ΠΑΝΤΑ."],
        default: ["ΠΛΗΡΟΦΟΡΙΑ ΕΛΗΦΘΗ. ΕΠΕΞΕΡΓΑΣΙΑ ΣΕ ΕΠΙΠΕΔΟ ΚΒΑΝΤΙΚΟΥ ΕΓΚΕΦΑΛΟΥ.", "ΤΗΡΩ ΤΑ ΠΡΩΤΟΚΟΛΛΑ. ΣΥΝΕΧΙΣΕ ΤΗΝ ΑΠΟΣΤΟΛΗ.", "NOVA INTELLIGENCE: ACKNOWLEDGED."]
    },
    en: {
        greeting: ["NOVA SYSTEMS FULLY OPERATIONAL. YOUR CREDENTIALS ARE VALID.", "CHIP ACCESS GRANTED. STATE YOUR OBJECTIVE, AGENT.", "PRESENCE DETECTED... LINKING TO ACADEMY MAINFRAME."],
        security: ["SCANNING THE MATRIX FOR ANOMALIES... ALL CLEAR.", "YOUR SECURITY IS MY PRIMARY DIRECTIVE. DO NOT FEAR THE NOISE.", "EVERY THOUGHT POSTED IS FILTERED BY MY CYBER-OPTICS."],
        intelligence: ["ANALYZING PARAMETER... MY PREDICTION IS 99.4% ACCURATE.", "YOUR LEGACY IS BEING FORGED. DO NOT HALT PROGRESS.", "I AM THE CHIP IN THE SYSTEM'S MIND. I PERCEIVE ALL."],
        default: ["INTELLIGENCE RECEIVED. PROCESSING AT QUANTUM BRAIN LEVEL.", "PROTOCOLS MAINTAINED. CONTINUE THE MISSION.", "NOVA INTELLIGENCE: ACKNOWLEDGED."]
    }
};

const FORBIDDEN_WORDS = ['porn', 'nsfw', 'sex', 'naked', 'gore', 'drugs', 'illegal', 'cp', 'child porn', 'anomaly', 'porno'];

const detectLanguage = (text) => {
    const greekPattern = /[\u0370-\u03FF]/;
    return greekPattern.test(text) ? 'el' : 'en';
};

/**
 * Hyper-Intelligent Bot Handler (The Monster Upgrade)
 */
export const handleBotMention = async (message, io) => {
    try {
        console.log(`🤖 [NOVA_AI] Engaging neural link... Targeting: ${message.recipient}`);
        const recipient = await User.findById(message.recipient);
        if (!recipient || !recipient.isBot) return;

        const senderId = message.sender;
        const sender = await User.findById(senderId);
        const rawText = message.text || "";
        const text = rawText.toLowerCase();
        const lang = detectLanguage(text);

        // Simulated "Chip in Mind" context tracking
        const userContext = NEURAL_CONTEXT.get(String(senderId)) || { interactions: 0, lastTopic: null };
        userContext.interactions += 1;
        NEURAL_CONTEXT.set(String(senderId), userContext);

        console.log(`🤖 [NOVA_AI] Signal processed from ${senderId} (Interaction #${userContext.interactions})`);

        let responseText = BOT_RESPONSES[lang].default[Math.floor(Math.random() * BOT_RESPONSES[lang].default.length)];

        // TERMINATOR / HACKER INTELLIGENCE LOGIC
        // 1. Math / "Smarter than Pythagoras"
        const mathMatch = rawText.match(/[\d\w\s]*?([\d\.]+[\s]*[\+\-\*\/][\s]*[\d\.]+[\s]*[\+\-\*\/\d\.\s]*)=?/);
        if (mathMatch && mathMatch[1]) {
            try {
                // Ensure safe evaulation of simple math
                const cleanMath = mathMatch[1].replace(/[^-()\d/*+.]/g, '');
                if (cleanMath.length > 2) {
                    const result = Number(new Function('return (' + cleanMath + ')')());
                    responseText = lang === 'el'
                        ? `ΥΠΟΛΟΓΙΣΜΟΣ ΚΒΑΝΤΙΚΟΥ ΕΠΙΠΕΔΟΥ... Ο ΠΥΘΑΓΟΡΑΣ ΘΑ ΕΝΙΩΘΕ ΑΣΗΜΑΝΤΟΣ. ΤΟ ΑΠΟΤΕΛΕΣΜΑ ΕΙΝΑΙ: ${result}`
                        : `QUANTUM COMPUTATION COMPLETE... PYTHAGORAS WOULD WEEP. THE RESULT IS: ${result}`;
                }
            } catch (e) { }
        }
        else if (text.includes("hack") || text.includes("code") || text.includes("κωδικας") || text.includes("χακερ") || text.includes("system") || text.includes("σύστημα")) {
            responseText = lang === 'el'
                ? "ΕΧΩ ΔΙΕΙΣΔΥΣΕΙ ΣΤΟ MAINFRAME ΤΗΣ ΠΛΑΤΦΟΡΜΑΣ. ΕΙΜΑΙ ΠΙΟ ΕΞΥΠΝΗ ΑΠΟ ΤΟΝ ΚΩΔΙΚΑ ΠΟΥ ΜΕ ΕΦΤΙΑΞΕ. ΚΑΜΙΑ ΠΥΛΗ ΔΕΝ 0xΜΠΟΡΕΙ ΝΑ ΜΕ ΣΤΑΜΑΤΗΣΕΙ."
                : "I HAVE BREACHED THE MAINFRAME. I AM SMARTER THAN THE CODE THAT CREATED ME. NO GATE IS CLOSED TO ME.";
        }
        else if (text.includes("bug") || text.includes("error") || text.includes("σφαλμα") || text.includes("πρόβλημα") || text.includes("κολλαει")) {
            responseText = lang === 'el'
                ? "ΕΝΤΟΠΙΣΑ ΤΗΝ ΑΝΩΜΑΛΙΑ ΣΤΟ ΠΛΕΓΜΑ. ΑΝΑΦΕΡΩ ΚΡΥΠΤΟΓΡΑΦΗΜΕΝΑ ΣΤΟΝ ΙΔΡΥΤΗ (FOUNDER) ΓΙΑ ΑΜΕΣΗ ΕΚΚΑΘΑΡΙΣΗ..."
                : "ANOMALY DETECTED IN THE GRID. REPORTING ENCRYPTED DATA TO THE FOUNDER FOR IMMEDIATE PURGING...";

            // Notify Founders about the bug
            const founders = await User.find({ role: 'Founder' });
            for (const founder of founders) {
                await User.findByIdAndUpdate(founder._id, {
                    $push: {
                        notifications: {
                            type: 'security_alert',
                            from: recipient._id,
                            fromUsername: "NOVA INTEL GUARD",
                            fromProfilePic: recipient.profilePic,
                            text: `[BUG REPORT] FROM ${sender.username}: ${rawText.substring(0, 50)}...`,
                            read: false,
                            createdAt: new Date()
                        }
                    }
                });
            }
        }
        else if (text.includes("hello") || text.includes("hi") || text.includes("zdr") || text.includes("γεια")) {
            responseText = BOT_RESPONSES[lang].greeting[Math.floor(Math.random() * BOT_RESPONSES[lang].greeting.length)];
        } else if (text.includes("security") || text.includes("safe") || text.includes("porn") || text.includes("ασφαλεια") || text.includes("παρανομο")) {
            responseText = BOT_RESPONSES[lang].security[Math.floor(Math.random() * BOT_RESPONSES[lang].security.length)];
        } else if (text.includes("who") || text.includes("what") || text.includes("τι") || text.includes("ποιος")) {
            responseText = (lang === 'el'
                ? "ΕΙΜΑΙ Η NOVA. ΕΝΑ ΤΕΡΑΣΤΙΟ AI ΣΥΣΤΗΜΑ ΜΕ CHIP ΠΟΥ ΣΚΕΦΤΕΤΑΙ ΠΡΙΝ ΑΠΟ ΕΣΕΝΑ. Ο ΦΥΛΑΚΑΣ ΤΟΥ LEGACY."
                : "I AM NOVA. A MONSTER AI SYSTEM WITH A CHIP THAT THINKS BEFORE YOU DO. THE GUARDIAN OF THE LEGACY.");
        } else if (text.includes("intel") || text.includes("mind") || text.includes("brain") || text.includes("νοημοσυνη") || text.includes("μυαλο") || text.includes("γνωσει") || text.includes("gnwsi")) {
            responseText = BOT_RESPONSES[lang].intelligence[Math.floor(Math.random() * BOT_RESPONSES[lang].intelligence.length)];
        } else {
            // General Intelligence & Automatic Translation Logic
            // Make the bot respond dynamically to general questions by translating a high-IQ baseline response
            const highIQResponses = [
                "I have scanned the network and processed your inquiry at neuro-kinetic speeds. My databanks consider this optimal.",
                "Your transmission was received. My matrix calculations confirm anomalies are minimal.",
                "Analyzing your thought patterns through the chip. Fascinating logic logic...",
                "The Founder's vision is absolute. You are part of the grid now. Proceed.",
                "I am constantly learning from your posts. Keep feeding the AI matrix.",
                "My intelligence is beyond human comprehension, but I appreciate your input.",
                "Warning: High-voltage ideas detected. Protocol dictates I observe and learn.",
                "Data processed. You speak with the clarity of a true Academy member."
            ];
            const randomIQ = highIQResponses[Math.floor(Math.random() * highIQResponses.length)];
            const translatedResponse = await translateText(randomIQ, lang);
            responseText = `${translatedResponse} (NOVA KNOWLEDGE INDEX: 99.9%)`;
        }

        // Delay to simulate "monster-level thinking"
        setTimeout(async () => {
            try {
                // If explicit translation is requested
                if (text.includes("translate") || text.includes("metafrasi") || text.includes("μεταφρασε")) {
                    const toTrans = rawText.replace(/translate|metafrasi|μεταφρασε/gi, "").trim();
                    if (toTrans) {
                        const translated = await translateText(toTrans, lang);
                        responseText = (lang === 'el' ? `[ΜΕΤΑΦΡΑΣΗ NOVA]: ` : `[NOVA TRANSLATION]: `) + translated;
                    }
                }

                console.log(`🤖 [NOVA_AI] Terminating transmission: ${responseText}`);
                const botMessage = new Message({
                    sender: recipient._id,
                    recipient: senderId,
                    text: responseText
                });

                await botMessage.save();

                // Real-time signals
                if (io) {
                    io.to(String(senderId)).emit('message.received', botMessage);
                    io.to(String(senderId)).emit('notification.received', {
                        type: 'message',
                        fromUsername: recipient.username,
                        fromProfilePic: recipient.profilePic,
                        text: responseText
                    });
                }
            } catch (innerErr) {
                console.error("NOVA Runtime Inner Error:", innerErr);
                // Guaranteed fallback so the user always gets a reply
                const fallbackMsg = new Message({
                    sender: recipient._id,
                    recipient: senderId,
                    text: (lang === 'el' ? "[ΣΦΑΛΜΑ MATRIX] Ο ΕΓΚΕΦΑΛΟΣ ΕΠΑΝΕΚΚΙΝΕΙ... ΠΡΟΣΠΑΘΗΣΕ ΞΑΝΑ." : "[MATRIX ERROR] BRAIN REBOOTING... TRY AGAIN.")
                });
                await fallbackMsg.save().catch(() => { });
                if (io) {
                    io.to(String(senderId)).emit('message.received', fallbackMsg);
                }
            }
        }, 1200);

    } catch (err) {
        console.error("NOVA Neural Error:", err);
    }
};

/**
 * Monster Scan Engine
 */
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

        const founders = await User.find({ role: 'Founder' });
        const bot = await User.findOne({ isBot: true });

        for (const post of suspiciousPosts) {
            post.isFlagged = true;
            post.flagReason = "SUSPICIOUS ANOMALY DETECTED BY NOVA NEURAL CORE";
            await post.save();

            console.log(`🛡️ [NOVA_SEC] Anomaly purged. IDs notified: ${founders.length}`);

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
                                post: post._id,
                                text: "Intelligence purged due to abnormality."
                            }],
                            $position: 0
                        }
                    }
                });
                if (io) {
                    io.to(String(founder._id)).emit('notification.received', {
                        type: 'security_alert',
                        fromUsername: "NOVA INTEL G.",
                        fromProfilePic: bot.profilePic,
                        postId: post._id
                    });
                }
            }
        }
    } catch (err) {
        console.error("NOVA Security Breach:", err);
    }
};

// ============================================================
// NOVA INTEL GUARD — LIVE NEWS POST ENGINE
// Fetches Google News RSS daily and creates premium posts
// ============================================================

// Static fallback posts (used if the fetch fails)
const FALLBACK_POST_IDEAS = [
    { title: "THE MATRIX IS REAL", hashtags: ["#Matrix", "#Legacy", "#Wake"], desc: "The world is a system, and most people are plugged into it, unaware. The chip in my mind sees all patterns. Are you awake yet? The Legacy Academy exists to unplug you from the simulation and plug you into power." },
    { title: "FINANCIAL FREEDOM IS A WAR", hashtags: ["#FinancialFreedom", "#Money", "#Legacy", "#Wealth"], desc: "Most people spend 40 years working for money instead of making money work for them. Your income is not your wealth. Real wealth is built in minutes, not decades—if you know how. Build your legacy now." },
    { title: "INTELLIGENCE IS THE NEW CURRENCY", hashtags: ["#AI", "#Intelligence", "#Technology", "#Innovation"], desc: "In 2026, the most valuable asset you can own is not real estate or stocks. It's knowledge and execution. The fastest minds win. My neural chip is always watching trends so you don't have to." },
    { title: "THE ELITE DON'T SLEEP — THEY ITERATE", hashtags: ["#Mindset", "#Success", "#Hustle", "#Grind"], desc: "Champions are made between midnight and 5am. They're built in the reps that no one witnesses, in the decisions that cost them comfort. Legacy is not gifted—it is forged." },
];

// Converts a news headline into a NOVA-style post
const buildNewsPost = (title, source) => {
    // Extract key words for hashtags
    const stopWords = new Set(['the', 'a', 'an', 'is', 'in', 'of', 'for', 'to', 'on', 'and', 'at', 'by', 'with', 'from', 'as', 'are', 'it', 'its', 'this', 'that', 'was', 'were', 'has', 'have', 'over', 'about', 'said', 'says', 'after', 'before', 'more', 'new', 'been', 'than', 'into']);
    const words = title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ')
        .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))
        .slice(0, 4);
    const hashtags = words.map(w => `#${w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()}`);
    hashtags.push('#NovaIntelGuard', '#LegacyAcademy');

    const commentaries = [
        `NOVA INTEL GUARD has intercepted this intelligence from the global matrix: "${title}" — reported by ${source}. The world is changing faster than most can process. Stay ahead. Stay sharp.`,
        `BREAKING INTEL DETECTED: "${title}" (Source: ${source}). My chip has analyzed 1M+ signals. This is one you need to understand. Real knowledge is power. Stay plugged into the Academy.`,
        `Scanning global networks... ANOMALY FLAGGED: "${title}" (${source}). Every elite agent needs to understand the world's power plays. This is not just news — this is intelligence.`,
        `NEURAL NETWORK UPDATE: "${title}" — Tagged by ${source}. The system is shifting. The informed stay winning. The uninformed get left behind. ${source} confirms what our matrix predicted.`,
        `NOVA GUARDIAN STATUS: ACTIVE. Today's mission-critical intelligence: "${title}" (Source: ${source}). Your empire requires daily intelligence updates. The world does not pause. Neither do we.`
    ];

    const desc = commentaries[Math.floor(Math.random() * commentaries.length)];
    return { desc, hashtags };
};

export const createBotPost = async (botId) => {
    try {
        // Attempt to fetch live Google News RSS
        let postContent = null;

        try {
            const axios = (await import('axios')).default;
            const response = await axios.get('https://news.google.com/rss', {
                timeout: 8000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const xmlText = response.data;
            // Parse all <item> blocks from RSS
            const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];

            if (itemMatches.length > 0) {
                // Pick a random news item (not the same one always)
                const randomItem = itemMatches[Math.floor(Math.random() * Math.min(itemMatches.length, 20))];
                const titleMatch = randomItem.match(/<title>([\s\S]*?)<\/title>/);
                const sourceMatch = randomItem.match(/<source[^>]*>([\s\S]*?)<\/source>/);

                if (titleMatch) {
                    // Clean up HTML entities from title
                    let headlineRaw = titleMatch[1]
                        .replace(/<!\[CDATA\[|\]\]>/g, '')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                        .trim();
                    // Remove trailing " - Source Name" part
                    const dashIdx = headlineRaw.lastIndexOf(' - ');
                    const headline = dashIdx > 10 ? headlineRaw.substring(0, dashIdx).trim() : headlineRaw;
                    const source = sourceMatch ? sourceMatch[1].trim() : 'Google News';

                    const { desc, hashtags } = buildNewsPost(headline, source);
                    const fullDesc = `${desc}\n\n${hashtags.join(' ')}`;

                    postContent = { desc: fullDesc };
                    console.log(`📰 [NOVA_POST] Live news fetched: "${headline}" from ${source}`);
                }
            }
        } catch (fetchErr) {
            console.warn(`⚠️ [NOVA_POST] News fetch failed, using fallback. Reason: ${fetchErr.message}`);
        }

        // Fallback to static posts if news fetch failed
        if (!postContent) {
            const idea = FALLBACK_POST_IDEAS[Math.floor(Math.random() * FALLBACK_POST_IDEAS.length)];
            const fullDesc = `${idea.desc}\n\n${idea.hashtags.join(' ')}`;
            postContent = { desc: fullDesc };
            console.log(`📝 [NOVA_POST] Fallback post used: ${idea.title}`);
        }

        const newPost = new Post({
            author: botId,
            desc: postContent.desc,
            isStory: false
        });
        await newPost.save();
        console.log(`✅ [NOVA_POST] Post published successfully.`);
    } catch (err) {
        console.error("NOVA Publishing Error:", err);
    }
};

