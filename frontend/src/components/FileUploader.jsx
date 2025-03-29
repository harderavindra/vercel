import React, { useState } from 'react';
import axios from 'axios';

const FileUploader = () => {
    const [file, setFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [fileUrl, setFileUrl] = useState('');

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setUploadProgress(0);
        setFileUrl('');
    };

    const handleUpload = async () => {
        console.log("upload")
        if (!file) {
            alert("Please select a file to upload");
            return;
        }

        try {
            const timestamp = Date.now();
            const folderName = "status";
const fileNameWithFolder = `${folderName}/${timestamp}-${file.name}`;

            // Get signed URL from backend
            console.log(file)
            const { data } = await axios.post(
                'http://localhost:4000/api/files/signed-url',
                { fileName: fileNameWithFolder, fileType: file.type }
            );

            if (!data.signedUrl) throw new Error("Failed to get signed URL");

            // Upload file to Google Cloud using signed URL
            await axios.put(data.signedUrl, file, {
                headers: { 'Content-Type': file.type },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
            });

            setFileUrl(data.fileUrl);
            alert("File uploaded successfully!");
        } catch (error) {
            console.error("Upload failed:", error);
            alert("File upload failed!");
        }
    };

    return (
        <div className="p-4 bg-gray-100 rounded-md shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-2">Upload File</h2>
            <input 
                type="file" 
                onChange={handleFileChange} 
                className="mb-2 p-1"
            />
            <button 
                onClick={handleUpload} 
                className="bg-blue-500 text-white py-1 px-4 rounded"
            >
                Upload
            </button>
            {uploadProgress > 0 && (
                <div className="mt-2">
                    <p>Upload Progress: {uploadProgress}%</p>
                </div>
            )}
            {fileUrl && (
                <div className="mt-2">
                    <p>File URL:</p>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                        {fileUrl}
                    </a>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
