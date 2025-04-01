import axios from "axios";

export const uploadFile = async (file) => {
    try {
        // Step 1: Get Signed URL from Backend
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/files/signed-url/upload`, {
            fileName: file.name,
            fileType: file.type,
        });

        const { signedUrl, fileUrl } = response.data;

        // Step 2: Upload File to GCS using Signed URL
        await fetch(signedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
        });

        console.log("File uploaded successfully:", fileUrl);
    } catch (error) {
        console.error("Error uploading file:", error);
    }
};
