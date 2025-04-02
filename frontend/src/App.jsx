import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Users from "./pages/Users";
import About from "./pages/About";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthProvider from './context/auth-context';
import MainLayout from "./components/layout/MainLayout";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<MainLayout />}>
                        <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/adduser" element={<Users />} />
                            <Route path="/users" element={<UsersPage />} />
                            <Route path="/user/:id" element={<UserDetailPage />} />
                        </Route>
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;
