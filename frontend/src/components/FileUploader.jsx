import React, { useState } from 'react';
import axios from 'axios';

const FileUploader = ({ onUploadSuccess, setIsUploading }) => {
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = async (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        setUploadProgress(0);

        if (selectedFile) {
            setIsUploading(true);
            try {
                const timestamp = Date.now();
                const folderName = "status";
                const fileNameWithFolder = `${folderName}/${timestamp}-${selectedFile.name}`;

                // Get signed URL from backend
                const { data } = await axios.post(
                    'http://localhost:4000/api/files/signed-url',
                    { fileName: fileNameWithFolder, fileType: selectedFile.type }
                );

                if (!data.signedUrl) throw new Error("Failed to get signed URL");

                // Upload file to Google Cloud using signed URL
                await axios.put(data.signedUrl, selectedFile, {
                    headers: { 'Content-Type': selectedFile.type },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    },
                });

                setIsUploading(false);
                onUploadSuccess(data.fileUrl);
            } catch (error) {
                setIsUploading(false);
                console.error("Upload failed:", error);
                alert("File upload failed!");
            }
        }
    };

    return (
        <div className="p-4 bg-gray-100 rounded-md shadow-md">
            <input
                type="file"
                onChange={handleFileChange}
                className="mb-2 p-1"
            />
            {uploadProgress > 0 && (
                <div className="mt-2">
                    <p>Upload Progress: {uploadProgress}%</p>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
