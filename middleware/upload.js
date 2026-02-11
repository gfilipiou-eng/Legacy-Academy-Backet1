import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import path from "path";

// Ensure local uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

let storage;

// HYBRID STORAGE STRATEGY:
// If Cloudinary credentials are set in .env, use Cloudinary.
// Otherwise, fall back to local disk storage.
const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  console.log("☁️  Cloudinary Configured: Using Cloud Storage");
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "legacyacademy",
      resource_type: "auto", // Automatically detect if it's an image, video, or audio
    },
  });
} else {
  console.log("📂 Cloudinary Missing: Using Local Disk Storage (uploads/)");
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

const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES || String(200 * 1024 * 1024)); // 200MB
const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_BYTES } });

// Specialized AI Profile Picture Uploader
// Uses Cloudinary's AI 'improve' and 'sharpen' effects for 8K-like quality
export const profilePicUpload = multer({
  storage: hasCloudinary ? new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "profiles",
      transformation: [
        { width: 4000, height: 4000, crop: "limit" }, // High resolution limit
        { effect: "improve:outdoor" },               // AI Enhancement
        { effect: "sharpen:80" },                    // AI Sharpening
        { dpr: "auto" },                             // Auto retina scale
        { quality: "auto:best" },                    // Best automatic quality
        { fetch_format: "auto" }                     // Modern web format (WebP/AVIF)
      ],
      allowed_formats: ["jpg", "png", "jpeg", "webp", "avif", "heic", "heif"], // Added iPhone formats
    },
  }) : storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB per profile pic for 8K assets
});

export default upload;
