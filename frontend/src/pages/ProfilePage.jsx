// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/auth-context'; // Importing the custom hook to access AuthContext

const ProfilePage = () => {
  const { user, loading, logout } = useAuth();  // Access user, loading, and logout function from context
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!user) {
      // Redirect to login page if no user is found
      window.location.href = '/login';
    }
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    window.location.href = '/login';  // Redirect to login page after logging out
  };

  if (loading) return <div>Loading...</div>; // Show loading indicator if still loading user data

  return (
    <div>
      <h1>Profile</h1>
      <p>Name: {user?.name}</p>
      <p>Email: {user?.email}</p>
      <button onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
};

export default ProfilePage;
