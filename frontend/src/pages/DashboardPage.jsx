import React from 'react'
import Avatar from '../components/common/Avatar'
import { useAuth } from '../context/auth-context';
import { FiFileMinus, FiFolder, FiFolderMinus, FiPaperclip } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className='w-full h-full flex justify-center items-center '>
      <div className='flex w-3xl flex-col sm:flex-row gap-8 p-8 sm:p-0'>
        <div className='w-full bg-white  rounded-2xl shadow-lg p-4 flex  justify-center items-center min-h-52 cursor-pointer'
         onClick={() => navigate(`/user/${user._id}`)} >
          <div className='flex flex-col gap-3 justify-center items-center'>
            <Avatar size='xl' src={user.profilePic} />
            <p className='capitalize text-red-500 font-semibold'>Welcome </p>
            <p className='capitalize text-2xl'>{user?.firstName} {user?.lastName}</p>
          </div>
        </div>
        <div className='w-full bg-white  rounded-2xl shadow-lg p-4 flex justify-center items-center cursor-pointer'
          onClick={() => navigate('/artworks')}>
          <div className='flex flex-col gap-3 justify-center items-center'>
            <FiPaperclip size={40} />
            <p className='text-3xl text-center'>Artwork</p>
          </div>
        </div>
        <div className='w-full bg-white  rounded-2xl shadow-lg p-4 flex justify-center items-center cursor-pointer'
          onClick={() => navigate('/brand-treasury')}>
          <div className='flex flex-col gap-3 justify-center items-center'>
            <FiFolder size={40} />
            <p className='text-3xl text-center'>Brand Treasury</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage