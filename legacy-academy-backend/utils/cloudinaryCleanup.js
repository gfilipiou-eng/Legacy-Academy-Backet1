import cloudinary from "../config/cloudinary.js";

/**
 * Extract Cloudinary public_id from a full URL
 * Handles transforms, versions, and various URL formats:
 * - https://res.cloudinary.com/xxx/image/upload/v123/legacyacademy/abc123.jpg
 * - https://res.cloudinary.com/xxx/image/upload/w_150,c_fill/v123/legacyacademy/abc123.jpg  
 * - https://res.cloudinary.com/xxx/video/upload/f_webp/legacyacademy/vid.mp4
 * Returns: legacyacademy/abc123
 */
const getPublicId = (url) => {
    if (!url || !url.includes("cloudinary.com")) return null;
    try {
        // Split on /upload/ to get everything after it
        const parts = url.split("/upload/");
        if (parts.length < 2) return null;

        let afterUpload = parts[1];

        // Split into segments by /
        const segments = afterUpload.split("/");

        // Filter out: transforms (contain comma or underscore params like w_150) and version (v + digits)
        const cleanSegments = segments.filter(seg => {
            if (/^v\d+$/.test(seg)) return false;           // version like v1234567890
            if (/^[a-z]_/.test(seg) && seg.includes(",")) return false;  // transform like w_150,c_fill
            if (/^[a-z]_[^/]+$/.test(seg) && !seg.includes(".")) return false; // single transform like f_webp
            return true;
        });

        // Rejoin and remove file extension
        const fullPath = cleanSegments.join("/");
        // Remove extension (.jpg, .png, .mp4, etc.)
        const publicId = fullPath.replace(/\.\w+$/, "");

        return publicId || null;
    } catch (e) {
        return null;
    }
};

/**
 * Delete a single file from Cloudinary by URL
 * Silently fails if URL is not from Cloudinary or deletion fails
 */
export const deleteCloudinaryFile = async (url) => {
    const publicId = getPublicId(url);
    if (!publicId) {
        console.log(`⚠️ [CLOUDINARY] Could not extract public_id from: ${url}`);
        return;
    }

    try {
        // Detect resource type from URL
        let resourceType = "image";
        if (url.includes("/video/upload/")) resourceType = "video";
        else if (url.includes("/raw/upload/")) resourceType = "raw";

        console.log(`🗑️ [CLOUDINARY] Deleting ${resourceType}: ${publicId} (from: ${url})`);
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`🗑️ [CLOUDINARY] Result: ${JSON.stringify(result)}`);
    } catch (e) {
        console.warn(`⚠️ [CLOUDINARY] Failed to delete ${publicId}:`, e.message);
    }
};

/**
 * Delete multiple Cloudinary files from an array of URLs
 */
export const deleteCloudinaryFiles = async (urls) => {
    const validUrls = (urls || []).filter(u => u && u.includes("cloudinary.com"));
    if (validUrls.length === 0) return;
    console.log(`🗑️ [CLOUDINARY] Batch deleting ${validUrls.length} files...`);
    await Promise.allSettled(validUrls.map(deleteCloudinaryFile));
};
