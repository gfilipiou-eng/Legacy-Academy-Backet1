import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({ path: 'c:/Users/Filip/Desktop/TateWebsite/legacy-academy-backend/.env' });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function test_upload() {
    try {
        console.log("Testing upload to account:", process.env.CLOUDINARY_CLOUD_NAME);
        const result = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/sample.jpg", {
            folder: "test_legacy"
        });
        console.log("Upload Success:", result.secure_url);
    } catch (error) {
        console.error("Upload Error:", error);
    }
}

test_upload();
