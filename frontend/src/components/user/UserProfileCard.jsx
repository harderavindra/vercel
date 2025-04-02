import React from "react";
import StatusBubble from "../common/StatusBubble";
import Avatar from "../common/Avatar";
import { FiCalendar, FiCheckSquare, FiMail, FiPhone } from "react-icons/fi";
import { formatDateTime } from "../../utils/formatDateTime";
import DeleteUserButton from "../user/DeleteUserButton";
import { snakeToCapitalCase } from "../../utils/convertCase";
// import ChangeAvatar from "./ChangeAvatar";
const UserProfileCard = ({ user }) => {
    if (!user) return null;

    return (
        <div className='bg-white rounded-lg border border-blue-300/70 flex flex-col min-h-full min-w-[20%] items-center  '>
            <div className='p-5 text-center relative w-full items-center justify-center'>
                <StatusBubble size='sm' status={`${user.status === 'active' ? 'success' : 'error'}`} icon={user.status === 'inactive' ? 'eyeOff' : 'check'} className='absolute right-5 top-5' />
                <div className="relative">
            <Avatar src={user.profilePic} size="xl" className="border-2 border-gray-400" />
            </div>


                <h2 className='text-lg font-bold'>{user.firstName} {user.lastName}</h2>
                <p className='capitalize font-semibold text-lg text-blue-600'>{snakeToCapitalCase(user.role)}</p>
                <p className='capitalize font-semibold text-sm text-gray-400'>{ snakeToCapitalCase(user.designation)}</p>
                <p className='capitalize  text-base text-gray-400'>{user.location.city}{user.location.city ? ',' : ''}{user?.location?.state}</p>


            </div>
            <div className='w-full border-t border-t-blue-300/70 py-3 px-5 flex flex-col gap-2'>
                <p className='  text-sm text-gray-400 flex items-center gap-2'><FiPhone size={14} />{user.contactNumber}</p>
                <p className='  text-sm text-gray-400 flex items-center gap-2 lowercase'><FiMail size={14} />{user.email}</p>
                <p className='  text-sm text-gray-400 flex items-center gap-2 lowercase'><FiCalendar size={14} />{formatDateTime(user.createdAt)}</p>
                <p className='  text-sm text-gray-400 flex items-center gap-2 lowercase'><FiCheckSquare size={14} />{user?.lastUpdatedAt ? formatDateTime(user.lastUpdatedAt) : "No updates yet"}</p>
            </div>
            <div className="flex flex-col gap-3 px-4 py-4 w-full border-t border-t-blue-300/70 ">
            <DeleteUserButton userId={user._id}  />
            </div>
        </div>
    );
};

export default UserProfileCard;
