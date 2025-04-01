// src/getViewOrDownload.js
import axios from "axios";

export const getViewOrDownload = async (fileName) => {
    try {
        const response = await axios.post("/api/files/signed-url/download", { fileName });
        const { signedUrl } = response.data;

        if (signedUrl) {
            // Return the signed URL to view or download
            return signedUrl;
        } else {
            console.error("Failed to get signed URL");
            return null;
        }
    } catch (error) {
        console.error(`Error trying to view or download file:`, error.message || error);
        alert(`Failed to view or download the file. Please try again later.`);
        return null;
    }
};
