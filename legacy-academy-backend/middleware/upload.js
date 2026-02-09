import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import path from "path";

// Hybrid storage strategy
const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

let storage;

if (hasCloudinary) {
    storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: "legacyacademy",
            allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov", "avi", "webm", "mp3", "wav", "ogg"],
            resource_type: "auto",
        },
    });
} else {
    storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        }
    });
}

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

export default upload;
