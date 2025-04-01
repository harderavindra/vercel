import { bucket } from '../config/storage.js';

// Extract file name from URL
const extractFileName = (url) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
};

export const generateViewSignedUrl = async (url, expiresIn = 15 * 60 * 1000) => {
    try {
        const fileName = extractFileName(url);

        if (!fileName) {
            throw new Error("Missing file name");
        }

        // Access the file from the bucket
        const file = bucket.file(`${fileName}`);

        // Generate the signed URL with a read action and expiration time
        const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + expiresIn,  // Default: 15 minutes
        });

        return signedUrl;
    } catch (error) {
        console.error("Error generating signed URL:", error.message);
        throw new Error("Failed to generate signed URL");
    }
};
