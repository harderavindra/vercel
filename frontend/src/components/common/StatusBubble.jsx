import React from 'react'
import { FaTimesCircle } from 'react-icons/fa'
import { FiCheck, FiClipboard, FiClock, FiEye, FiEyeOff, FiRotateCcw, FiStar, FiThumbsUp, FiUser } from 'react-icons/fi'
import { HiOutlineRocketLaunch } from 'react-icons/hi2'
import { LuShieldCheck } from "react-icons/lu";

const StatusBubble = ({status ='success',icon,  size= 'sm', className, onClick}) => {
    const statusStyles = {
      disabled: {
        background: "#D3D3D3",
        boxShadow: "-3px 4px 9px 0px rgba(67, 175, 122, 0.0)",
      },
        success: {
            background: "#43AF7A",
            boxShadow: "-3px 4px 9px 0px rgba(67, 175, 122, 0.60)",
          },
          error: {
            background: "#FD5D5D",
            boxShadow: "-3px 4px 9px 0px rgba(253, 93, 93, 0.60)",
          },
          warning: {
            background: "#F88A48",
            boxShadow: "-3px 4px 9px 0px rgba(248, 138, 72, 0.60)",
          },
          info: {
            background: "#628fec",
            boxShadow: "-3px 4px 9px 0px rgba(42, 159, 255, 0.60)",
          }
    }
    const sizes = {
        xs: 12,
        sm: 14,
        md: 18,
        lg:24,
        xxs:5,
    }
    const statusIcons = {
        star: <FiStar size={sizes[size]}/>,
        check: <FiCheck size={sizes[size]}/>,
        reject: <FiRotateCcw size={sizes[size]}/>,
        eye: <FiEye size={sizes[size]}/>,
        clock: <FiClock size={sizes[size]}/>,
        user: <FiUser size={sizes[size]}/>,
        done:<FiThumbsUp size={sizes[size]} />,
        pad:<FiClipboard size={sizes[size]} />,
        rocket:<HiOutlineRocketLaunch size={sizes[size]} />,
        
        shieldcheck:<LuShieldCheck size={sizes[size]} />
    }
   
  return (
    <button className={`rounded-full p-[6px] text-white green-status green-shadow-md  ${className}`}
    style={{
        background: statusStyles[status]?.background,
        boxShadow: statusStyles[status]?.boxShadow,
    }}
    onClick={onClick}

    >{statusIcons[icon]}</button>
  )
}

export default StatusBubble