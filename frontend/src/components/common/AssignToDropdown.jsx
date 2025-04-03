import { useState, useEffect } from "react";
import axios from "axios";

const AssignToDropdown = ({ onSelect }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");

    useEffect(() => {
        const fetchExternalUsers = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/jobs/external-users`, {
                    withCredentials: true, // Ensures cookies are sent for authentication
                });
                console.log(response.data)
                
                setUsers(response.data);
            } catch (error) {
                console.error("Error fetching external users:", error);
            }
        };
        fetchExternalUsers();
    }, []);
    const handleChange = (event) => {
        setSelectedUser(event.target.value);
        onSelect(event.target.value); // Pass selected user ID to parent component
    };

    return (
        <select value={selectedUser} onChange={handleChange} className="border p-2 rounded">
            <option value="">Select User</option>
            {users?.map((user) => (
                <option key={user._id} value={user._id}>
                  {/* <img src={user.profilePic}/> */}
                  {user.firstName} 
                </option>
            ))}
        </select>
    );
};

export default AssignToDropdown;
