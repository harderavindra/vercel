import React from "react";
import { FiMoreVertical } from "react-icons/fi";
import Avatar from "../common/Avatar"; // Adjust import path if needed
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
const UserCard = ({ user, loading , isEmpty}) => {
    const navigate = useNavigate();

  return (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, ease: "easeInOut" }}
  >
  
       {
       loading ?
       (
       <div className="animate-pulse">
          <div className="w-24 h-24 bg-gray-300 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
        ): isEmpty ? (
          <p className="text-gray-500 text-center">No users found</p>
        ) 
        :(
          

      <div onClick={() => navigate(`/user/${user._id}`)}
      className="flex flex-col items-center bg-white border border-blue-300/60 rounded-xl p-6 gap-2 shadow-md relative">
      <span className="self-end cursor-pointer absolute righ-5" >
        <FiMoreVertical />
      </span>
      <Avatar src={user?.profilePic } size="lg" />
      <p className="text-lg font-bold">
        {user.firstName} {user?.lastName}
      </p>
      <p className="text-sm font-semibold text-gray-400">{user?.designation}</p>
      <p className="text-base font-normal text-gray-400">
        {user.location?.city}, {user.location?.state}
      </p>
      </div>
              )
}

    </motion.div>
  );
};

export default UserCard;
