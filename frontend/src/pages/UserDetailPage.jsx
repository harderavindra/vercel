// src/pages/UserDetailPage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Avatar from "../components/common/Avatar";
import { FiTrash2, FiArrowLeft } from "react-icons/fi";

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users/${id}`
        );
        setUser(response.data);
      } catch (err) {
        setError("User not found");
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users/${id}`
        );
        alert("User deleted successfully!");
        navigate("/users");
      } catch (error) {
        alert("Failed to delete user. Please try again.");
        console.error("Error deleting user:", error);
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6">
      <button
        className="text-blue-500 flex items-center gap-2 mb-4"
        onClick={() => navigate("/users")}
      >
        <FiArrowLeft /> Back to Users
      </button>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex flex-col items-center gap-4">
          <Avatar src={user?.profilePic} size="xl" />
          <h2 className="text-2xl font-bold">{user.name} {user.lastName}</h2>
          <p className="text-lg text-gray-600">{user.designation}</p>
          <p className="text-base text-gray-500">
            {user.location?.city}, {user.location?.state}
          </p>
          <button
            onClick={handleDelete}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
          >
            <FiTrash2 /> Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
