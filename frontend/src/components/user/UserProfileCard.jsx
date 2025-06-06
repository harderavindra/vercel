import React, { useState } from "react";
import StatusBubble from "../common/StatusBubble";
import Avatar from "../common/Avatar";
import { FiCalendar, FiCamera, FiCheckSquare, FiClock, FiMail, FiPhone, FiUpload } from "react-icons/fi";
import { formatDateTime } from "../../utils/formatDateTime";
import DeleteUserButton from "../user/DeleteUserButton";
import { snakeToCapitalCase } from "../../utils/convertCase";
import { hasAccess } from "../../utils/permissions";
import { useAuth } from '../../context/auth-context';
import axios from "axios";
import { deleteProfilePic, uploadProfilePic } from "../../api/userApi";
import StatusMessage from "../common/StatusMessage";
// import ChangeAvatar from "./ChangeAvatar";
const UserProfileCard = ({ user, refreshUser }) => {
    if (!user) return null;
    const { user: currentUser } = useAuth(); // current logged-in user
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0);

    const [previewUrl, setPreviewUrl] = useState(null);
    const [profileMessage, setProfileMessage] = useState('');

    const handleChangeProfilePic = async (selectedFile, currentProfilePic) => {
        try {
            let uploadedUrl = "";

            // 1. Delete current profile picture from GCS if exists
            if (currentProfilePic) {
                const deleteResponse = await deleteProfilePic(currentProfilePic);
                if (!deleteResponse.success) {
                    console.warn("Failed to delete old profile picture:", deleteResponse.message);
                    return;
                }
            }

            // 2. Upload new picture if selected
            if (selectedFile) {
                const timestamp = Date.now();
                const folderName = "user-profiles";
                const fileNameWithFolder = `${folderName}/${timestamp}-${selectedFile.name}`;

                // Get signed URL
                const { data } = await axios.post(
                    `${import.meta.env.VITE_BACKEND_BASE_URL}/api/files/signed-url/upload`,
                    { fileName: fileNameWithFolder, fileType: selectedFile.type }
                );

                if (!data.signedUrl) throw new Error("Failed to get signed URL");

                // Upload file to GCS
                await axios.put(data.signedUrl, selectedFile, {
                    headers: { "Content-Type": selectedFile.type },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    },
                });

                uploadedUrl = data.fileUrl;
            }

            // 3. Update user in DB with new profilePic URL
            const updateRes = await axios.put(
                `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users/${user._id}`,
                { profilePic: uploadedUrl },
                { withCredentials: true }
            );

            if (updateRes.status === 200) {
                setProfileMessage("Profile picture updated!");
                refreshUser?.(); // only if provided
            }
        } catch (error) {
            console.error("Error updating profile picture:", error.message || error);
        }
    };
    return (
        <div className='bg-white rounded-lg border border-blue-300/70 flex flex-col min-h-full min-w-[20%] items-center  '>

            <div className='p-5 text-center relative w-full items-center justify-center'>
                <StatusBubble size='sm' status={`${user.status === 'active' ? 'success' : 'error'}`} icon={user.status === 'inactive' ? 'eyeOff' : 'check'} className='absolute right-5 top-5' />
                <div className="relative flex justify-center">
                    <div className="relative">

                        <Avatar src={previewUrl || user.profilePic} size="xl" className="border-2 border-gray-400" />

                        <input
                            id="fileUpload"
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file.size > 5 * 1024 * 1024) { // 5MB
  setProfileMessage("File size exceeds 5MB limit.");
  return;
}
                                if (file) {
                                    setSelectedFile(file);
                                    setPreviewUrl(URL.createObjectURL(file));
                                    setProfileMessage("Uploading...");

                                    setUploading(true);
                                    handleChangeProfilePic(file, user.profilePic)
                                        .then(() => {
                                            setProfileMessage("Upload completed!");
                                        })
                                        .catch(() => {
                                            setProfileMessage("Upload failed.");
                                        })
                                        .finally(() => {
                                            setUploading(false);
                                            setUploadProgress(0); // <-- add this

                                            setPreviewUrl(null);
                                        });
                                }
                            }}
                        />
                        <div className="flex items-center justify-center gap-2 absolute right-2 bottom-2 ">


                            <label
  htmlFor="fileUpload"
  className={`rounded-full w-8 h-8 flex items-center justify-center 
    ${uploading ? 'bg-gray-300 text-white cursor-not-allowed' : 'bg-amber-500 text-white cursor-pointer'}
  `}
>
  <FiCamera />
</label>





                        </div>
                    </div>
                   
                </div>
                 {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full mt-2">
                            <p className="text-sm font-semibold mb-1">Uploading: {uploadProgress}%</p>
                            <div className="bg-gray-200/20 rounded-2xl py-1 px-1">
                                <div
                                    className="bg-blue-500 h-1 rounded-2xl transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                {
                    profileMessage &&
                    (
                    <div
  className={`rounded-sm my-2 px-3 py-1 text-sm border 
    ${profileMessage.includes("failed")
      ? "bg-red-50 border-red-400 text-red-600"
      : profileMessage.includes("completed")
      ? "bg-green-50 border-green-400 text-green-600"
      : "bg-yellow-50 border-yellow-400 text-yellow-600"
    }`}
>
  {profileMessage}
</div>
                    )
                }

                <h2 className='text-lg font-bold'>{user.firstName} {user.lastName}</h2>
                <p className='capitalize font-semibold text-lg text-blue-600'>{snakeToCapitalCase(user.role)}</p>
                <p className='capitalize font-semibold text-sm text-gray-400'>{snakeToCapitalCase(user.designation)}</p>
                <p className='capitalize  text-base text-gray-400'>{user.location.city}{user.location.city ? ',' : ''}{user?.location?.state}</p>


            </div>
            <div className='w-full border-t border-t-blue-300/70 py-3 px-5 flex flex-col gap-2'>
                <p className='  text-sm text-gray-400 flex items-center gap-2'><FiPhone size={14} />{user.contactNumber}</p>
                <p className='  text-sm text-gray-400 flex items-center gap-2 lowercase'><FiMail size={14} />{user.email}</p>
                <p className='  text-sm text-gray-400 flex items-center gap-2 lowercase'><FiCalendar size={14} />{formatDateTime(user.createdAt)}</p>
                <p className='  text-sm text-gray-400 flex items-center gap-2 lowercase'><FiCheckSquare size={14} />{user?.lastUpdatedAt ? formatDateTime(user.lastUpdatedAt) : "No updates yet"}</p>
            </div>
            <div className="flex flex-col gap-3 px-4 py-4 w-full border-t border-t-blue-300/70 ">
                {hasAccess(currentUser?.role, ['marketing_manager', 'admin']) && (
                    <DeleteUserButton userId={user._id} />
                )}
            </div>
        </div>
    );
};

export default UserProfileCard;
