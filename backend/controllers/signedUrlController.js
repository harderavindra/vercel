import { bucket, uuidv4 } from '../config/storage.js';

export const generateUploadSignedUrl = async (req, res) => {
    try {
        const { fileName, fileType } = req.body;
        if (!fileName || !fileType) {
            return res.status(400).json({ message: "Missing file details" });
        }

        const file = bucket.file(fileName);


        const [signedUrl] = await file.getSignedUrl({
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // 15-minute expiry
            contentType: fileType, 
        });

        res.status(200).json({
            signedUrl,
            fileUrl: `https://storage.googleapis.com/${bucket.name}/${fileName}`,
        });
    } catch (error) {
        console.error("Error generating signed URL:", error.message);
        console.error(error); // More detailed error logging
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


export const generateViewSignedUrl = async (req, res) => {
    try {
        const { fileName } = req.query;

        if (!fileName) {
            return res.status(400).json({ message: "Missing file name" });
        }

        const file = bucket.file(fileName);

        const [signedUrl] = await file.getSignedUrl({
            action: 'read',       // Download action
            expires: Date.now() + 15 * 60 * 1000,  // 15 minutes expiration
        });

        res.status(200).json({ signedUrl });
    } catch (error) {
        console.error("Error generating download signed URL:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};