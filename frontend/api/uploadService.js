import axios from "axios";

export const getSignedUrl = async (fileName, fileType) => {
    try {
        const response = await axios.post("http://localhost:4000/api/files/signed-url", {
            fileName,
            fileType,
        });
        return response.data;
    } catch (error) {
        console.error("Error getting signed URL:", error.message);
        throw error;
    }
};

export const uploadFile = async (signedUrl, file, fileType, onProgress) => {
    try {
        await axios.put(signedUrl, file, {
            headers: { "Content-Type": fileType },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            },
        });
    } catch (error) {
        console.error("Error uploading file:", error.message);
        throw error;
    }
};
