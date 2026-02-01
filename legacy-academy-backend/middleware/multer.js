import multer from "multer";

// Storage στη μνήμη (καλό για Render / cloud uploads)
const storage = multer.memoryStorage();

// Middleware upload
const upload = multer({ storage });

// Default export για να δουλεύει έτσι:
// import upload from "../middleware/multer.js";
export default upload;
