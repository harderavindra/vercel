import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  // Load user data on initial load or refresh
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users/profile`,
          { withCredentials: true }
        );
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data.user));


      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.warn("User not logged in.");
        } else {
          console.error("Auth check error:", error);
        }
        setUser(null);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users/login`,
        { email, password },
        { withCredentials: true }
      );

      const userResponse = await axios.get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/users/profile`, {
        withCredentials: true,
      });
      console.log("userResponse", userResponse)
      setUser(userResponse.data);
      localStorage.setItem("user", JSON.stringify(userResponse.data));
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
      localStorage.removeItem("user");
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
