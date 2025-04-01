// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context'; // Importing the custom hook to access AuthContext
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, loading, logout } = useAuth();  // Access user, loading, and logout function from context
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('User in profile page:', user); // Log user data to check if it's coming through
    if (!loading && !user) {
        navigate('/login');
    }
}, [user, loading, navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate('/login');  // Redirect to login page after logging out
  };

  if (loading) return <div>Loading...</div>; // Show loading indicator if still loading user data

  return (
    <div>
      <h1>Profile</h1>
      {user ? (
        <>
          <p>Name: {user?.name}</p>
          <p>Email: {user?.email}</p>
          {user?.profilePic && <img src={user.profilePic} alt="Profile" width="80px" />}
          <button onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </>
      ) : (
        <p>No user information available.</p>
      )}
    </div>
  );
};

export default ProfilePage;
