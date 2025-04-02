import React from 'react'
import { FiCheck, FiClock, FiEyeOff, FiStar } from 'react-icons/fi'

const StatusBubbleText = ({status ='success',icon, text, size= 'sm', className}) => {
    const statusStyles = {
      disabled: {
        background: "#babac2",
        boxShadow: "-3px 4px 9px 0px rgba(96, 110, 192, .5)",
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
          }
    }
    const sizes = {
        sm: 14,
        md: 18,
        lg:24
    }
    const statusIcons = {
        star: <FiStar size={sizes[size]}/>,
        check: <FiCheck size={sizes[size]}/>,
        eyeOff: <FiEyeOff size={sizes[size]}/>,
        clock: <FiClock size={sizes[size]}/>, 

    }
   
  return (
    <span className={`rounded-md px-2 pb-[2px] text-white capitalize text-sm ${className}`}
    style={{
        background: statusStyles[status]?.background,
        boxShadow: statusStyles[status]?.boxShadow,
    }}
 

    >{text}</span>
  )
}

export default StatusBubbleText