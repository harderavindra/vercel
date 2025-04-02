import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth-context";


const Nav = () => {
    const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="flex space-x-4">
        <Link to="/" className="text-white hover:text-gray-300">Home</Link>
        <Link to="/users" className="text-white hover:text-gray-300">Users</Link>
        <Link to="/about" className="text-white hover:text-gray-300">About</Link>
        <Link to="/profile" className="text-white hover:text-gray-300">Profile</Link>
        <Link to="/adduser" className="text-white hover:text-gray-300">Add User</Link>
        {user ? (
          <>
            <button 
              onClick={logout} 
              className="text-white hover:text-gray-300"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="text-white hover:text-gray-300">Login</Link>
        )}      </div>
    </nav>
  );
};

export default Nav;
