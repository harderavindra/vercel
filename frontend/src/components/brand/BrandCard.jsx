import React, { useState } from 'react'
import StatusBubble from '../common/StatusBubble'
import { snakeToCapitalCase } from '../../utils/convertCase'
import { motion } from "framer-motion";
import FileIcon from '../common/FileIcon';
import { useNavigate } from 'react-router-dom';
import { updateStar } from '../../api/brandTreasury';
import { FiCalendar, FiMapPin, FiPlayCircle } from 'react-icons/fi';
import { IoLanguageOutline } from 'react-icons/io5';
import { formatDateTime } from '../../utils/formatDateTime';
import MoreOptions from '../common/MoreOptions';
import Avatar from '../common/Avatar';

const BrandCard = ({ document, loading, isEmpty }) => {
    const navigate = useNavigate()
    const [isStarred, setIsStarred] = useState(document?.isStarred || false);
    const handleStarToggle = async () => {
        try {
            setIsStarred(!isStarred); // Optimistically update UI
            const response = await updateStar(document._id); // Call API
            setIsStarred(response.isStarred); // Update state based on API response
        } catch (error) {
            console.error('Failed to update starred status:', error);
            setIsStarred(isStarred); // Revert if API call fails
        }
    };

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
                    ) : isEmpty ? (
                        <p className="text-gray-500 text-center">No users found</p>
                    )
                        : (
                            <div key={document._id} className='flex flex-col gap-5 border border-blue-300/60 rounded-xl p-6  shadow-md  '  >
                                <div className='flex gap-4 justify-between items-start'>

                                    <StatusBubble size='sm' status={isStarred ? 'warning' : 'disabled'} icon={'star'} className='cursor-pointer' onClick={handleStarToggle} />

                                    <p className="text-gray-500 capitalize  ">{snakeToCapitalCase(document?.documentType || 'N/A')}</p>
                                    <StatusBubble size='sm' status={document?.approved ? 'success' : 'disabled'} icon={'check'} className='' />
                                    {/* <StatusBubble size='sm' status={`${user.status === 'active' ? 'success' : 'error'}`} icon={user.status === 'inactive' ? 'eyeOff' : 'check'} className='absolute right-5 top-5' /> */}
                                </div>
                                <div className="h-[180px]" onClick={() => navigate(`/view-brandtreasury/${document._id}`)}>
                                    {document.thumbnailUrls[0] ? (
                                        <img src={document?.thumbnailUrls[0]} alt="Thumbnail" className="w-full h-full object-cover" style={{ borderRadius: "8px", marginBottom: "10px" }} />
                                    ) : (
                                        <div className="w-full h-full object-cover bg-gray-800 rounded-md justify-center items-center flex text-5xl" >

                                            <FileIcon mimeType={document?.mimeType} size={50} className="text-gray-600" />


                                        </div>
                                    )}
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <div className='flex gap-3 items-start' onClick={() => navigate(`/view-brandtreasury/${document._id}`)}><FiPlayCircle size={24} /><p className='font-semibold text-lg capitalize line-clamp-1' >{document.title?.toLowerCase()}</p></div>
                                    <div className='flex gap-3 items-center'><FiCalendar size={14} /><p className=' text-sm capitalize'>{formatDateTime(document.updatedAt)}</p></div>
                                    <div className='flex gap-3 justify-start items-start'>
                                        <div className='flex gap-3 items-center'><FiMapPin size={14} /><p className=' text-sm capitalize'>{document?.zone} </p></div>
                                        <div className='flex gap-3 items-center'><IoLanguageOutline size={14} /><p className=' text-sm capitalize'>{document?.language}</p></div>
                                    </div>
                                </div>
                                <div className='flex justify-between'>
                                    <div className='flex gap-2'><Avatar src={document.createdBy?.profilePic} size='sm' /><span>{document.createdBy?.firstName}</span></div>
                                    <MoreOptions>
                                        <button className="px-3 py-1 hover:bg-gray-200" >View2</button>
                                    </MoreOptions>
                                </div>
                            </div>
                        )
            }
        </motion.div>
    )
}

export default BrandCard