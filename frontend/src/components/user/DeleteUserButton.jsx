import React, { useContext, useState } from "react";
import { deleteUser } from "../../api/userApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
const DeleteUserButton = ({ userId, onDelete }) => {
    const { user, logout } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); 

  const navigate = useNavigate();

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage("");
    try {
      await deleteUser(userId);
      setIsOpen(false);
      setIsDeleting(false);
      if (onDelete) onDelete(userId);
      navigate("/users");
    } catch (error) {
        console.error("Delete User Error:", error);
        setIsDeleting(false);
  
        // Set the error message based on response
        if (error.response && error.response.status === 403) {
          setErrorMessage("Access denied. Only admins can delete users.");
        } else if (error.response && error.response.status === 404) {
          setErrorMessage("User not found.");
        } else {
          setErrorMessage("An error occurred. Please try again.");
        }
    }
  };
 // Hide button if user is not an admin
//  if (!user || user.role.toLowerCase() !== "admin") return null;
  return (
    <div className="relative inline-block">
      {/* Delete Button */}
      <button
        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition w-full disabled:bg-gray-200"

        onClick={() => setIsOpen(true)} disabled={user?.role?.toLowerCase() !== "admin"}
      >
        Delete
      </button>

      {isOpen && (
        <div className="fixed left-0 top-0 h-full w-full bg-gray-950/30 flex items-center justify-center">
          <div className="mt-2 w-64 bg-white shadow-lg rounded-md p-4 border border-gray-300 animate-fadeIn">
            <p className="text-gray-800 text-sm">Are you sure you want to delete this user?</p>

            {errorMessage && (
              <p className="text-red-600 text-xs mt-2">{errorMessage}</p>
            )}

            <div className="flex justify-end mt-3 space-x-2">
              <button
                className="bg-gray-300 px-3 py-1 rounded-md text-gray-800 hover:bg-gray-400"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteUserButton;
