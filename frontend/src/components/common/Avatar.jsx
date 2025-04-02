import React, { useEffect, useState } from 'react'
import avatarPlaceholder from "../../assets/avatar-placeholder.png"

const Avatar = ({className, size="sm", src}) => {
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
    <div className='inline-block'>
       <img src={imageSrc} onError={() => setImageSrc(avatarPlaceholder)} className={`${sizes[size]} rounded-full object-cover ${className} border border-gray-500`} />
    </div>
  )
}

export default Avatar