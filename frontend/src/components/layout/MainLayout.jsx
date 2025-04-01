import React from "react";
import { Outlet } from "react-router-dom";
import Nav from "./Nav";

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <Nav />
            <div className="p-4">
                <Outlet />
            </div>
        </div>
    );
};

export default MainLayout; 
