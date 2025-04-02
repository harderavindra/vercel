import React, { useState } from "react";
import axios from "axios";
import { uploadFile } from "../utils/fileUpload";
import ProgressBar from "../components/common/ProgressBar";

const AddUser = ({ onUserCreated }) => {
    const [firstName, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [profilePic, setProfilePic] = useState(null);
    const [fileName, setFileName] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0); // State for progress

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setProfilePic(selectedFile);
        setFileName(selectedFile ? selectedFile.name : ""); 
    };

    const handleSubmit = async () => {
        console.log("Submit")

        try {
            let uploadedUrl = "";
    
            // If a profile picture is selected, upload it first
            if (profilePic) {
                const timestamp = Date.now();
                const folderName = "user-profiles";
                const fileNameWithFolder = `${folderName}/${timestamp}-${profilePic.name}`;
    
                // Get signed URL from backend
                const { data } = await axios.post(
                    `${import.meta.env.VITE_BACKEND_BASE_URL}/api/files/signed-url/upload`,
                    { fileName: fileNameWithFolder, fileType: profilePic.type }
                );
    
                if (!data.signedUrl) throw new Error("Failed to get signed URL");
    
                // Upload file to Google Cloud using signed URL
                await axios.put(data.signedUrl, profilePic, {
                    headers: { "Content-Type": profilePic.type },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted); // Update the progress state

                        console.log("Upload Progress:", percentCompleted + "%");
                    },
                });
    
                uploadedUrl = data.fileUrl; // Use the file URL from the response
            }
    
            // Submit user data to backend
            await axios.post(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/users`, {
                firstName,
                email,
                password,
                profilePic: uploadedUrl,
            });
    
            setFirstName("");
            setEmail("");
            setPassword("");
            setProfilePic(null);
            setFileName("");
            // onUserCreated();
            alert("User created successfully!");
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Failed to create user.");
        }
    };

    return (
        <form className="p-4 bg-white shadow-md rounded-lg">
            <h2 className="text-xl font-bold mb-2">Create User</h2>
            <div className="mb-2">
                <label className="block mb-1">First Name:</label>
                <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter name"
                    required
                />
            </div>
            <div className="mb-2">
                <label className="block mb-1">Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter email"
                    required
                />
            </div>
            <div className="mb-2">
                <label className="block mb-1">Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter password"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block mb-1">Profile Picture:</label>
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="block mb-2 p-1"
                />
                {fileName && <p>Selected File: {fileName}</p>}
                
                {uploadProgress > 0 && <ProgressBar progress={uploadProgress} />} {/* Display progress bar */}
                </div>
            <button
                type="button"
                onClick={handleSubmit}
                className="bg-green-500 text-white py-1 px-4 rounded hover:bg-green-600"
                disabled={!firstName || !email}
            >
                Add User
            </button>
        </form>
    );
};

export default AddUser;
