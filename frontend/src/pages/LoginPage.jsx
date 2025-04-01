import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

import axios from "axios";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post( `${import.meta.env.VITE_BACKEND_BASE_URL}/api/users/login`, { email, password }, { withCredentials: true });
      // Redirect to a protected page after login
      if (response.status === 200) {
        // Redirect, for example:
        navigate ("/profile"); // or use `useHistory` with React Router
      }
    } catch (error) {
      if (error.response) {
        // Server responded with an error
        setErrorMessage(error.response.data.message);
      } else {
        // Network or other error
        setErrorMessage("Something went wrong, please try again.");
      }
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
