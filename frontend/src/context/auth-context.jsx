import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data on initial load or refresh
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users/profile`, 
          { withCredentials: true }
        );
        setUser(response.data);
      } catch (err) {
        console.error('User not authenticated', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users/login`, 
        { email, password },
        { withCredentials: true }
      );
      setUser(response.data);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users/logout`, 
        {}, 
        { withCredentials: true }
      );
      setUser(null);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
