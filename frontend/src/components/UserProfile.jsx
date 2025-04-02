import React, { useEffect, useState } from "react";
import { downloadFile } from "../utils/getViewOrDownload";

const UserProfile = ({ user }) => {
    const [profilePicUrl, setProfilePicUrl] = useState("");

    useEffect(() => {
        const fetchProfilePic = async () => {
            if (user.profilePic) {
                const signedUrl = await downloadFile(user.profilePic);
                if (signedUrl) {
                    setProfilePicUrl(signedUrl);
                }
            }
        };

        fetchProfilePic();
    }, [user.profilePic]);

    return (
        <div>
            <h2>{user.name}</h2>
            {profilePicUrl ? (
                <img
                    src={profilePicUrl}
                    alt={`${user.firstName}'s profile`}
                    className="w-10 h-10 rounded-full"
                />
            ) : (
                <p>No profile picture available</p>
            )}
        </div>
    );
};

export default UserProfile;
