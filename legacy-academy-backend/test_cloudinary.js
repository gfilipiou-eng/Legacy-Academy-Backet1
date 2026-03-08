import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-backend/.env' });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function test() {
    console.log("Testing with Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("API Key:", process.env.CLOUDINARY_API_KEY);
    try {
        const result = await cloudinary.api.ping();
        console.log("Ping Result:", result);
    } catch (error) {
        console.error("Cloudinary Error:", error.message);
        if (error.http_code) console.error("HTTP Code:", error.http_code);
    }
}

test();
