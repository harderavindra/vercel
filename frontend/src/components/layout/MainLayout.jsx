import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import {
    FiChevronLeft, FiGrid, FiUser, FiLogOut,
    FiSliders, FiFolder, FiPaperclip, FiVolume2
} from "react-icons/fi";
import LogoImage from '../../assets/m-logo.svg';
import LogoImagePro from '../../assets/marcom.svg'
import Avatar from '../common/Avatar';
import { snakeToCapitalCase } from '../../utils/convertCase';
import MegaPhoneIcon from '../../assets/megaphone_icon.svg';
import { TbSpeakerphone } from "react-icons/tb";

const menuItems = [
    { to: '/brand-treasury', icon: <FiFolder size={24} />, label: 'Brand Treasury',  },
    { to: '/artworks', icon: <FiPaperclip size={24} />, label: 'Artworks',  roles: ['admin', 'marketing_manager', 'zonal_marketing_manager', 'agency', 'moderator'] },
    { to: '/campaigns', icon: <TbSpeakerphone size={24} />, label: 'Lead Gen' },
    { to: '/', icon: <FiGrid size={24} />, label: 'Dashboard' },
    { to: '/users', icon: <FiUser size={24} />, label: 'Users', roles: ['admin', 'marketing_manager'] },
    { to: '/masterdata', icon: <FiSliders size={24} />, label: 'Master Data', roles: ['admin', 'marketing_manager'] }
];

const MainLayout = () => {
    const { user, logout } = useAuth();
    const role = user?.role;

    const [expanded, setExpanded] = useState(false);

    return (
        <div className='flex bg-gray-50 max-w-screen  transition-transform'>
            {/* Sidebar */}
            <aside className={`bg-white transition-all duration-300 ease-in-out shadow-md h-screen sticky overflow-hidden top-0 hidden sm:block ${expanded ? 'w-56' : 'w-16'}`}>
                <div className='py-4 px-2 flex items-center justify-center gap-2 relative'>
                    <img src={LogoImage} width='40' alt='Logo' />
                    {expanded && <span>
                        <img src={LogoImagePro} width='160' alt='Logo' className=' bg-cover' />
                        </span>}

                </div>

                <div
                    className='p-2 flex items-center justify-end border-t border-b border-gray-200 cursor-pointer mb-3'
                    onClick={() => setExpanded(prev => !prev)}
                >
                    <FiChevronLeft className={`transition-transform duration-300 ${expanded ? 'rotate-0' : 'rotate-180'}`} />
                </div>

                <ul className='flex flex-col gap-2'>
                    {menuItems
                        .filter(item => !item.roles || item.roles.includes(role))
                        .map(({ to, icon, label }) => (
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
                            <NavLink to={`/user/${user._id}`} className='flex gap-2'>
                                <div className='w-12'><Avatar src={user.profilePic} size='sm' /></div>

                                <div className={`flex flex-col leading-none font-semibold transition-opacity duration-300 ${expanded ? 'opacity-100 delay-300 visible' : 'opacity-0 delay-0 invisible'}`}>
                                    {user.firstName}
                                    <p className='capitalize text-gray-400 line-clamp-1'>{snakeToCapitalCase(user?.role)}</p>
                                    
                                </div>

                            </NavLink>
                        </li>
                    )}
                    <li
                        className='flex gap-2 px-4 py-2 items-center font-semibold cursor-pointer'
                        onClick={logout}
                    >
                        <div className='w-8'><FiLogOut size={24} /></div>
                        <span className={`ransition-opacity duration-300 ${expanded ? 'opacity-100 delay-300 visible' : 'opacity-0 delay-0 invisible'}`}>Logout</span>
                    </li>
                </ul>
            </aside>

            {/* Main Content */}
            <main className='border border-gray-200 w-full h-auto transition-transform '>
            <div className={`bg-white transition-all duration-300 ease-in-out shadow-md py-2 sticky z-10 overflow-hidden top-0 justify-between border-b border-gray-300 flex sm:hidden `}>
                <div className='py-0 px-2 flex justify-center gap-2 relative'>
                    <img src={LogoImage} width='40' alt='Logo' />

                </div>

               

                <ul className='flex gap-2'>
                    {menuItems
                        .filter(item => !item.roles || item.roles.includes(role))
                        .map(({ to, icon, label }) => (
                            <li key={to}>
                                <NavLink to={to} className={({ isActive }) => `flex text-nowrap py-1 px-1 gap-2 ${isActive ? 'text-red-500' : 'text-gray-900'}`}>
                                    <div className='w-8'>{icon}</div>
                                   
                                </NavLink>
                            </li>
                        ))}
                </ul>

                
            </div>
                <div className='bg-white flex justify-end py-1 px-4 border-b border-b-gray-300'>

                    <div className='flex gap-4 '>
                       
                    <ul className='flex w-auto'>
                    {user && (

                        <li className='flex gap-2 px-4 py-0 items-center'>
                            <NavLink to={`/user/${user._id}`} className='flex gap-2'>
                                <div className='w-12'><Avatar src={user.profilePic} size='sm' /></div>

                                <div className={`flex flex-col leading-none font-semibold transition-opacity duration-300 `}>
                                    {user.firstName}
                                    <p className='capitalize text-gray-400 line-clamp-1'>{snakeToCapitalCase(user?.role)}</p>
                                </div>

                            </NavLink>
                        </li>
                    )}
                    <li
                        className='flex gap-2 px-4 py-2 items-center font-semibold cursor-pointer'
                        onClick={logout}
                    >
                        <div className='w-8'><FiLogOut size={24} /></div>
                    </li>
                </ul>
                    </div>


                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
