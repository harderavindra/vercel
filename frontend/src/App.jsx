import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Users from "./pages/Users";
import About from "./pages/About";

const App = () => {
    return (
        <Router>
            <div className="p-6">
                <nav className="flex space-x-4 mb-6">
                    <Link to="/" className="text-blue-500">Home</Link>
                    <Link to="/users" className="text-blue-500">Users</Link>
                    <Link to="/about" className="text-blue-500">About</Link>
                </nav>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/about" element={<About />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
