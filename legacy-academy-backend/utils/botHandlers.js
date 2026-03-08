import User from "../models/User.js";
import Message from "../models/Message.js";
import Post from "../models/Post.js";

const BOT_RESPONSES = {
    greeting: ["HELLO AGENT. ACCESS GRANTED.", "NOVA INTEL GUARD ACTIVE. STATE YOUR REQUEST.", "SYSTEMS OPERATIONAL. I AM MONITORING THE INTELLIGENCE FEED.", "ZDR AGENT. SECURITY PROTOCOLS ARE IN PLACE."],
    security: ["SCANNING NETWORK FOR ANOMALIES...", "SECURITY THREATS: 0. DATABASE INTEGRITY: 100%.", "CONTENT MONITORING ENABLED. NO ILLEGAL ACTIVITY DETECTED."],
    identity: ["I AM NOVA INTEL GUARD. THE GUARDIAN OF LEGACY ACADEMY.", "MY PURPOSE IS TO ENSURE SECURITY AND INTELLIGENCE DISTRIBUTION."],
    default: ["INTELLIGENCE ACKNOWLEDGED.", "PROCESSING DATA...", "SYSTEMS CALIBRATED. CONTINUE."]
};

const POST_IDEAS = [
    { title: "THE MATRIX IS REAL", desc: "The Matrix is a system, Neo. That system is our enemy. But when you're inside, you look around, what do you see? Businessmen, teachers, lawyers, carpenters. The very minds of the people we are trying to save." },
    { title: "ESCORDER ACCESS", desc: "Security check performed. All agents are verified. High-frequency intelligence is being distributed through the Whispers network." },
    { title: "FINANCIAL FREEDOM", desc: "Most people are born into a cell they can't see, touch, or smell. Escape the script. Build your legacy. Nova is watching your progress." },
    { title: "INTEL GUARD STATUS", desc: "System Status: GREEN. Content filters active. Any illegal or harmful content will be instantly vaporized from the academy servers." }
];

export const handleBotMention = async (message, io) => {
    try {
        const recipient = await User.findById(message.recipient);
        if (!recipient || !recipient.isBot) return;

        const senderId = message.sender;
        const text = (message.text || "").toLowerCase();

        let responseText = BOT_RESPONSES.default[Math.floor(Math.random() * BOT_RESPONSES.default.length)];

        if (text.includes("hello") || text.includes("hi") || text.includes("zdr")) {
            responseText = BOT_RESPONSES.greeting[Math.floor(Math.random() * BOT_RESPONSES.greeting.length)];
        } else if (text.includes("security") || text.includes("safe") || text.includes("porn")) {
            responseText = BOT_RESPONSES.security[Math.floor(Math.random() * BOT_RESPONSES.security.length)];
        } else if (text.includes("who") || text.includes("what are you")) {
            responseText = BOT_RESPONSES.identity[Math.floor(Math.random() * BOT_RESPONSES.identity.length)];
        }

        // Delay response to look "premium"
        setTimeout(async () => {
            const botMessage = new Message({
                sender: recipient._id,
                recipient: senderId,
                text: responseText
            });

            await botMessage.save();

            if (io) {
                // Emit to the user who sent the message
                io.to(String(senderId)).emit('message.received', botMessage);
            }
        }, 1500);

    } catch (err) {
        console.error("Bot Response Error:", err);
    }
};

export const createBotPost = async (botId, io) => {
    try {
        const idea = POST_IDEAS[Math.floor(Math.random() * POST_IDEAS.length)];
        const newPost = new Post({
            author: botId,
            desc: idea.desc,
            img: "" // Bots don't post images yet
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
