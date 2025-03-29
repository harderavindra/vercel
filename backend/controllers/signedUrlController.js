import { bucket, uuidv4 } from '../config/storage.js';

export const generateSignedUrl = async (req, res) => {
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
        res.status(500).json({ message: "Internal Server Error" });
    }
};
