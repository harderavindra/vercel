import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import {
    FiChevronLeft, FiGrid, FiUser, FiLogOut,
    FiSliders, FiFolder, FiPaperclip
} from "react-icons/fi";
import logoImage from '../../assets/m-logo.svg';
import Avatar from '../common/Avatar';

const menuItems = [
    { to: '/brand-treasury', icon: <FiFolder size={24} />, label: 'Brand Treasury' },
    { to: '/artworks', icon: <FiPaperclip size={24} />, label: 'Artworks' },
    { to: '/dashboard', icon: <FiGrid size={24} />, label: 'Dashboard' },
    { to: '/users', icon: <FiUser size={24} />, label: 'Users' },
    { to: '/masterdata', icon: <FiSliders size={24} />, label: 'Master Data' }
];

const MainLayout = () => {
    const { user, logout } = useAuth();
    const [expanded, setExpanded] = useState(false);

    return (
        <div className='flex bg-gray-50 max-w-screen  transition-transform'>
            {/* Sidebar */}
            <aside className={`bg-white transition-all duration-300 ease-in-out shadow-md h-screen sticky top-0 ${expanded ? 'w-56' : 'w-16'}`}>
                <div className='py-4 px-2 flex justify-center gap-2'>
                    <img src={logoImage} width='40' alt='Logo' />
                    {expanded && <span className='text-2xl font-bold'>Catena</span>}
                </div>

                <div
                    className='p-2 flex items-center justify-end border-t border-b border-gray-200 cursor-pointer mb-3'
                    onClick={() => setExpanded(prev => !prev)}
                >
                    <FiChevronLeft className={`transition-transform duration-300 ${expanded ? 'rotate-0' : 'rotate-180'}`} />
                </div>

                <ul className='flex flex-col gap-2'>
                    {menuItems.map(({ to, icon, label }) => (
                        <li key={to}>
                            <NavLink to={to} className={({ isActive }) => `flex text-nowrap py-2 px-4 gap-2 ${isActive ? 'text-red-500' : 'text-gray-900'}`}>
                                <div className='w-8'>{icon}</div>
                                <span
                                    className={`transition-opacity duration-300 font-semibold ${expanded ? 'opacity-100 delay-300 visible' : 'opacity-0 delay-0 invisible'}`}
                                >
                                    {label}
                                </span>
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <ul>
                    {user && (
                        <li className='flex gap-2 px-4 py-2 items-center'>
                            <NavLink to='/profile' className='flex gap-2'>
                                <div className='w-8'><Avatar src={user.profilePic} size='sm' /></div>
                                
                                    <div className={`flex flex-col leading-none font-semibold transition-opacity duration-300 ${expanded ? 'opacity-100 delay-300 visible' : 'opacity-0 delay-0 invisible'}`}>
                                        {user.firstName}
                                        <p className='capitalize text-gray-400'>{user.role.toLowerCase()}</p>
                                    </div>
                             
                            </NavLink>
                        </li>
                    )}
                    <li
                        className='flex gap-2 px-4 py-2 items-center font-semibold cursor-pointer'
                        onClick={logout}
                    >
                        <FiLogOut size={24} />
                        <span className={`ransition-opacity duration-300 ${expanded ? 'opacity-100 delay-300 visible' : 'opacity-0 delay-0 invisible'}`}>Logout</span>
                    </li>
                </ul>
            </aside>

            {/* Main Content */}
            <main className='border border-gray-200 w-full h-auto transition-transform'>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
