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
import AddUser from "./pages/AddUser";
import MasterDataPage from "./pages/MasterDataPage";
import JobCreate from "./pages/JobCreate";
import JobList from "./pages/JobList";
import JobViewPage from "./pages/JobViewPage";
import NotFoundPage from "./pages/NotFoundPage";
import DashboardPage from "./pages/DashboardPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import BrandList from "./pages/BrandList";
import BrandTreasuryCreate from "./pages/BrandTreasuryCreate";
import BrandTreasuryCreatePage from "./pages/BrandTreasuryCreatePage";
import BrandTreasuryList from "./pages/BrandTreasuryList";
import ViewBrandTreasuryPage from "./pages/ViewBrandTreasuryPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const App = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />

                    <Route element={<MainLayout />}>
                    
                        <Route element={<ProtectedRoute allowedRoles={['marketing_manager', 'admin','zonal_marketing_manager', 'moderator', 'agency']} />}>
                            <Route path="/artworks" element={<JobList />} />
                            <Route path="/artwork/:fileId" element={<JobViewPage />} />

                        </Route>
                        <Route element={<ProtectedRoute allowedRoles={['marketing_manager', 'admin','zonal_marketing_manager']} />}>
                            <Route path="/create-artwork" element={<JobCreate />} />
                        </Route>
                        <Route element={<ProtectedRoute allowedRoles={['marketing_manager', 'admin']} />}>
                            <Route path="/users" element={<UsersPage />} />
                            <Route path="/add" element={<Users />} />
                            <Route path="/adduser" element={<AddUser />} />
                        </Route>
                        <Route element={<ProtectedRoute />}>
                            <Route index element={<DashboardPage />} />
                            <Route path="/brand-treasury" element={<BrandTreasuryList />} />
                            <Route path="/create-brand" element={<BrandTreasuryCreate />} />
                            <Route path="/create-brand-treasury" element={<BrandTreasuryCreatePage />} />
                            <Route path="/view-brandtreasury/:fileId" element={<ViewBrandTreasuryPage />} />

                            <Route path="/about" element={<About />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/masterdata" element={<MasterDataPage />} />
                           
                            <Route path="/user/:id" element={<UserDetailPage />} />
                            
                        </Route>
                        <Route path="*" element={<NotFoundPage />} />
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />

                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;
