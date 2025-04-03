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
        assigned: "info",
        approved: "success",
        inprogress: "info",
        hold: "warning",
        rejected: "error",
        resubmitted: "info",
        completed: "success",
        pending: "warning"
    };
    return statusMap[status?.toLowerCase()] || "default";
};
const statusIcons = {
    created: "clock",
    inprogress: "clock",
    approved: "star",
    pending: "clock",
    assigned: "user",
    completed: "check"

};
const JobCard = ({ job }) => {
    const navigate = useNavigate();

    return (
        <div 
            key={job._id} 
            onClick={() => navigate(`/artwork/${job._id}`)} 
            className="flex flex-col gap-2 bg-white border border-blue-300/60 rounded-lg w-full py-4 px-10 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        >
            <h2 className="text-xl font-bold">{job.title}</h2>
            <div className="flex items-center gap-2 text-gray-600">
                <Avatar src={job?.createdBy?.profilePic} size="xs" />
                <FiClock size={18} />
                {formatDateTime(job.createdAt)}
                <StatusBubbleText text={job.priority || 'Low'} status={getPriorityStatus(job.priority)} className="ml-auto" />
            </div>
            <div className="flex items-center gap-2 text-gray-600">
                <FiImage />
                {job.type}
                <FiMapPin />
                {job.zone} - {job.state}
            </div>
            <div className="text-gray-700">{job.offerDetails || "No description available"}</div>
            <div className="border-t border-gray-300 -mx-10 px-10 pt-3 flex justify-between">
                {job?.assignedTo?.profilePic ? (
                    <Avatar size="xs" src={job.assignedTo.profilePic} alt="Assigned User" />
                ) : (<span></span>)}
                <div className="flex items-center gap-2 text-gray-700">
                    <StatusBubble icon={statusIcons[job.finalStatus.toLowerCase()] || "clock"} status={getStatusColor(job.finalStatus)} />
                    {job.finalStatus}
                </div>
            </div>
        </div>
    );
};

export default JobCard;
