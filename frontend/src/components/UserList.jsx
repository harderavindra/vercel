import React, { useState, useEffect } from "react";
import axios from "axios";
import { getViewOrDownload } from "../utils/getViewOrDownload";

const UserList = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users`
                );
               
                setUsers(response.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

    return (
        <div className="p-4 bg-white shadow-md rounded-lg">
            <h2 className="text-xl font-bold mb-2">User List</h2>
            {users.length === 0 ? (
                <p className="text-red-500">No users found.</p>
            ) : (
                <ul className="grid grid-cols-4">
                    {users.map((user) => (
                        <li key={user._id} className="border-b py-2 flex items-center gap-3">
                            {user.profilePic ? (
                                <img
                                    src={user.profilePic}
                                    alt={`${user.name}'s profile`}
                                    className="w-10 h-10 rounded-full" width={'50px'}
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                            )}
                            <span>{user.name} - {user.email}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default UserList;
