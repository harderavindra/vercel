import React, { useState } from 'react'
import { FiMoreVertical } from 'react-icons/fi';

const MoreOptions = ({ children }) => {
    const [showOptions, setShowOptions] = useState(false);

  return (
    <div
            className="relative"
            onMouseEnter={() => setShowOptions(true)}
            onMouseLeave={() => setShowOptions(false)}
        >
            <button className="border border-gray-400 w-8 h-8 rounded-full flex items-center justify-center">
                <FiMoreVertical />
            </button>
            {showOptions && (
                <div className=" absolute bottom-0 right-0 pb-8 ">
                <div className="shadow-md rounded-sm border border-gray-300  bg-white pb-5">
                    {children}
                </div>
                </div>
            )}
        </div>
  )
}

export default MoreOptions