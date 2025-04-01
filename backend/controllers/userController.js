import { bucket } from "../config/storage.js";
import User from "../models/User.js";
import { generateViewSignedUrl } from "../utils/generateViewSignedUrl.js";
import { generateUploadSignedUrl } from "./signedUrlController.js";

export const getAllusers = async (req, res) => {
    try {
        const users = await User.find();

        // Generate signed URLs for each user's profile picture
        const updatedUsers = await Promise.all(users.map(async (user) => {
            if (user.profilePic) {
                try {
                    // Extract the file path from the GCS URL
                    const decodedUrl = decodeURIComponent(user.profilePic);
                    const baseUrl = "https://storage.googleapis.com/brand-treasury/";
                    const filePath = decodedUrl.replace(baseUrl, "").split('?')[0];  // Extract the file path part before the query string

                    // Get the file reference from GCS
                    const file = bucket.file(filePath);

                    // Generate a signed URL for the file
                    const [signedUrl] = await file.getSignedUrl({
                        action: 'read',
                        expires: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
                    });

                    // Update the user's profilePic field with the signed URL
                    user.profilePic = signedUrl;
                } catch (err) {
                    console.error(`Error generating signed URL for user ${user._id}:`, err);
                }
            }
            return user;
        }));

        // Send the response with the updated user data
        res.status(200).json(updatedUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, profilePic } = req.body; // Include password here

        // Create user with all required fields
        const user = new User({ name, email, password, profilePic }); // Use proper password field

        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}