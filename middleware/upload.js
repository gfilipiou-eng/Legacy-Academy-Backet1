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
      allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov", "avi", "webm"],
      resource_type: "auto",
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

const upload = multer({ storage });

export default upload;
