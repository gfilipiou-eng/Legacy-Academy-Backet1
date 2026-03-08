import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { createBotPost, scanPostsForAnomalies } from "../utils/botHandlers.js";

dotenv.config();

const SCAN_INTERVAL = 5 * 60 * 1000; // Every 5 minutes
const POST_INTERVAL = 24 * 60 * 60 * 1000; // Every 24 hours (Daily)

const runDaemon = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("🤖 [BOT DAEMON] Nova Intel Guard Connected to High-Frequency Network.");

        const bot = await User.findOne({ isBot: true });
        if (!bot) {
            console.error("❌ [BOT DAEMON] Nova Intel Guard User not found.");
            process.exit(1);
        }

        console.log(`📡 [BOT DAEMON] Monitoring as: ${bot.username}`);

        // Initial scan
        await scanPostsForAnomalies();

        // Check last post time to decide whether to post daily
        // For simplicity, we just interval it here
        setInterval(async () => {
            console.log("📝 [BOT DAEMON] Publishing Daily Intelligence Report...");
            await createBotPost(bot._id);
        }, POST_INTERVAL);

        // Frequent scanning
        setInterval(async () => {
            console.log("🔍 [BOT DAEMON] Scanning for Anomaly/Forbidden Content...");
            await scanPostsForAnomalies();
        }, SCAN_INTERVAL);

        // 🔥 STATUS KEEP-ALIVE: Ensure bot looks online (Online status threshold is ~5 mins)
        setInterval(async () => {
            await User.findByIdAndUpdate(bot._id, { lastSeen: new Date() });
            console.log("⚡ [BOT DAEMON] Heartbeat: Nova remains online.");
        }, 60 * 1000); // Pulse every minute

    } catch (err) {
        console.error("💥 [BOT DAEMON] CRITICAL FAILURE:", err);
    }
};

runDaemon();
