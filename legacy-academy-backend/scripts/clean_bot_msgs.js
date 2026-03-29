import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Message from '../models/Message.js';
import User from '../models/User.js';

dotenv.config();

async function cleanBotMessages() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to MongoDB");

        const bot = await User.findOne({
            $or: [
                { isBot: true },
                { username: { $regex: /NOVA/i } }
            ]
        });

        if (!bot) {
            console.log("No bot found");
            process.exit(0);
        }

        console.log(`Found bot: ${bot.username}`);

        // Find all users who have messaged the bot
        const usersWhoMessagedBot = await Message.distinct('sender', { recipient: bot._id });

        let deletedCount = 0;

        for (const userId of usersWhoMessagedBot) {
            // Get conversation between this user and bot, sorted by date
            const messages = await Message.find({
                $or: [
                    { sender: userId, recipient: bot._id },
                    { sender: bot._id, recipient: userId }
                ]
            }).sort({ createdAt: 1 });

            for (let i = 0; i < messages.length; i++) {
                const msg = messages[i];
                // If it's a message from the user to the bot
                if (String(msg.sender) === String(userId)) {
                    // Check if the next message is from the bot
                    const nextMsg = messages[i + 1];
                    let answered = false;

                    // It's answered if there is a next message and it's from the bot
                    if (nextMsg && String(nextMsg.sender) === String(bot._id)) {
                        answered = true;
                    }

                    if (!answered) {
                        console.log(`Deleting unanswered message from ${userId}: ${msg.text}`);
                        await Message.findByIdAndDelete(msg._id);
                        deletedCount++;
                    }
                }
            }
        }

        console.log(`Successfully deleted ${deletedCount} unanswered messages to the bot.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanBotMessages();
