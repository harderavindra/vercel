import React, { useEffect, useState } from 'react'
import avatarPlaceholder from "../../assets/avatar-placeholder.png"

const Avatar = ({className, size="sm", src, name}) => {
  const [imageSrc, setImageSrc] = useState(src || avatarPlaceholder);
  useEffect(() => {
    setImageSrc(src || avatarPlaceholder); // Update when src changes
}, [src]);
    const sizes ={
        xs:'w-6 h-6',
        sm:'w-8 h-8',
        md:'w-12 h-12',
        lg:'w-20 h-20',
        xl:'w-30 h-30',
        
    
    }

  return (
    <div className='inline-block relative group'>
       <img src={imageSrc} onError={() => setImageSrc(avatarPlaceholder)} className={`${sizes[size]} rounded-full object-cover ${className} border border-gray-500`} />
       {name && (
    <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
      {name}
    </div>
  )}
    </div>
  )
}

export default Avatar