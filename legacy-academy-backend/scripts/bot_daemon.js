import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { createBotPost } from "../utils/botHandlers.js";

dotenv.config();

const RUN_INTERVAL = 4 * 60 * 60 * 1000; // Every 4 hours

const runDaemon = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("🤖 [BOT DAEMON] Nova Intel Guard Connected to High-Frequency Network.");

        const bot = await User.findOne({ isBot: true });
        if (!bot) {
            console.error("❌ [BOT DAEMON] Nova Intel Guard User not found. Run setup script first.");
            process.exit(1);
        }

        console.log(`📡 [BOT DAEMON] Monitoring as: ${bot.username} (${bot._id})`);

        // Immediate post on start for testing
        await createBotPost(bot._id);
        console.log("📝 [BOT DAEMON] Intelligence Report Published.");

        setInterval(async () => {
            console.log("⏲️ [BOT DAEMON] Generating Periodic Intelligence...");
            await createBotPost(bot._id);
        }, RUN_INTERVAL);

    } catch (err) {
        console.error("💥 [BOT DAEMON] CRITICAL FAILURE:", err);
    }
};

runDaemon();
