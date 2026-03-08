import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";

dotenv.config({ path: 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-backend/.env' });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadAvatarAndUpdate() {
    try {
        const imagePath = "C:/Users/Filip/.gemini/antigravity/brain/2a9e6a6e-4058-4efd-b62e-f70f08ce442d/nova_cyber_avatar_premium_1773006604085.png";
        console.log("Uploading avatar to Cloudinary...");
        const result = await cloudinary.uploader.upload(imagePath, {
            folder: "academy_ai",
            public_id: "nova_intel_guard_v2"
        });
        console.log("Upload Success:", result.secure_url);

        await mongoose.connect(process.env.MONGO_URL);
        const bot = await User.findOneAndUpdate(
            { isBot: true },
            { profilePic: result.secure_url },
            { new: true }
        );
        console.log("DB Updated:", bot.username, bot.profilePic);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

uploadAvatarAndUpdate();
