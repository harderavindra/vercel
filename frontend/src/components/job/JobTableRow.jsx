import React from 'react';
import Avatar from '../common/Avatar';
import StatusBubble from '../common/StatusBubble';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../utils/formatDateTime';

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

const getPriorityStatus = (priority) => {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "error";
    case "high":
      return "warning";
    case "medium":
      return "info";
    case "low":
    default:
      return "disabled";
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

const JobTableRow = ({ job }) => {
  const navigate = useNavigate();

  return (
    <tr
      className="cursor-pointer hover:bg-gray-100/80 even:bg-gray-50 transition"
      onClick={() => navigate(`/artwork/${job._id}`)}
    >
      <td className="p-3  font-semibold">{job.title}</td>
      <td className="p-3 flex items-center gap-2">
        <Avatar name={job?.createdBy?.firstName} src={job?.createdBy?.profilePic} size="xs" />
        {job?.createdBy?.firstName}
      </td>
      <td className="p-3  text-sm capitalize">
        <span className={`text-${getPriorityStatus(job.priority)}`}>{job.priority}</span>
      </td>
      <td className="p-3 ">{job.typeOfArtwork}</td>
      <td className="p-3 ">{job.zone} - {job.state}</td>
      <td className="p-3  flex items-center gap-2 capitalize">
        <StatusBubble
          icon={statusIcons[job.finalStatus.toLowerCase()] || "clock"}
          status={getStatusColor(job.finalStatus)}
        />
        {job.finalStatus}
      </td>
    </tr>
  );
};

export default JobTableRow;
