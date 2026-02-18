import cloudinary from "../config/cloudinary.js";

/**
 * Extract Cloudinary public_id from a full URL
 * Example: https://res.cloudinary.com/xxx/image/upload/v123/legacyacademy/abc123.jpg
 * Returns: legacyacademy/abc123
 */
const getPublicId = (url) => {
    if (!url || !url.includes("cloudinary.com")) return null;
    try {
        // Match pattern: /upload/v{digits}/{public_id}.{ext}
        // or: /upload/{public_id}.{ext}
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
        return match ? match[1] : null;
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
    if (!publicId) return;

    try {
        // Detect resource type from URL
        let resourceType = "image";
        if (url.includes("/video/upload/")) resourceType = "video";
        else if (url.includes("/raw/upload/")) resourceType = "raw";

        console.log(`🗑️ [CLOUDINARY] Deleting ${resourceType}: ${publicId}`);
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
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
    await Promise.allSettled(validUrls.map(deleteCloudinaryFile));
};
