import React from 'react';
import { FiClock, FiImage, FiMapPin } from 'react-icons/fi';
import Avatar from '../common/Avatar';
import StatusBubbleText from '../common/StatusBubbleText';
import StatusBubble from '../common/StatusBubble';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../utils/formatDateTime';
const getPriorityStatus = (priority) => {
    switch (priority?.toLowerCase()) {
        case "urgent":
            return "error";  // Red color for urgent
        case "high":
            return "warning"; // Orange color for high
        case "medium":
            return "info";    // Blue color for medium
        case "low":
        default:
            return "disabled"; // Green color for low
    }
};
const getStatusColor = (status) => {
    const statusMap = {
        created: "success",
        pending: "warning",
        assigned: "info",
        approved: "success",
        hold: "warning",
        "under review": "error",
        "artwork rejected": "error",
        "review rejected": "error",
        "artwork approved": "success",
        inprogress: "info",
        "artwork submitted": "info",
        "ho approved": "success",
    "publish artwork": "success",

    };
    return statusMap[status?.toLowerCase()] || "default";
};
const statusIcons = {
    pending: "clock",
    created: "clock",
    assigned: "user",
    approved: "check",
    hold: "eye",
    "under review": "eye",
    "artwork rejected": "reject",
    "review rejected": "reject",
    "artwork approved": "done",
    inprogress: "clock",
    "artwork submitted": "pad",
    "ho approved": "shieldcheck",
    "publish artwork": "rocket",


};
const JobCard = ({ job }) => {
    const navigate = useNavigate();

    return (
        <div
            key={job._id}
            onClick={() => navigate(`/artwork/${job._id}`)}
            className="flex flex-col justify-between gap-0 bg-white border border-blue-300/60 rounded-lg w-full py-4 px-10 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        >
            <div className='flex flex-col gap-3'>
                <h2 className="text-xl font-bold capitalize  line-clamp-1 ">{job.title}</h2>
                <div className="flex items-center gap-2 text-gray-600">
                    <Avatar name={job?.createdBy?.firstName} src={job?.createdBy?.profilePic} size="xs" />
                    <FiClock size={18} />
                    {formatDateTime(job.createdAt)}
                    <StatusBubbleText text={job.priority || 'Low'} status={getPriorityStatus(job.priority)} className="ml-auto" />
                </div>
                <div className="flex justify-between gap-2 text-gray-600">
                    <div className='flex items-center gap-2 max-w-[50%]'>
                        <FiImage />
                        <span className='truncate whitespace-nowrap overflow-hidden '>{job.typeOfArtwork}</span>
                    </div>
                    <div className='flex items-center gap-2 max-w-[50%]'>
                        <FiMapPin />
                        <span className='truncate whitespace-nowrap overflow-hidden '>{job.zone}-{job.state}</span>
                    </div>
                </div>
                <div className="text-gray-700  mb-4 mt-1 line-clamp-2">{job.offerDetails || "No description available"}</div>
            </div>
            <div className="border-t border-gray-300 -mx-10 px-10 pt-3 flex justify-between">
                {job?.assignedTo ? (
                    <div className='flex items-center gap-2'>
                    <Avatar name={job.assignedTo.firstName} size="xs" src={job.assignedTo.profilePic} alt="Assigned User" />
                    {job?.assignedTo.firstName}
                    </div>
                ) : (<span></span>)}
                <div className="flex items-center gap-2 text-gray-700 capitalize">
                    <StatusBubble icon={statusIcons[job.finalStatus.toLowerCase()] || "clock"} status={getStatusColor(job.finalStatus)} />
                    {job.finalStatus}
                </div>
            </div>
        </div>
    );
};

export default JobCard;
