import React, { useState } from "react";
import axios from "axios";

const UserForm = ({ onUserCreated }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/users`, { name, email, password:"test123" });
            setName("");
            setEmail("");
            onUserCreated();
            alert("User created successfully!");
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Failed to create user.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-white shadow-md rounded-lg">
            <h2 className="text-xl font-bold mb-2">Create User</h2>
            <div className="mb-2">
                <label className="block mb-1">Name:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
            <button
                type="submit"
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
                Add User
            </button>
        </form>
    );
};

export default UserForm;
