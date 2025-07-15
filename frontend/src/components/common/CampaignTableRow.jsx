import React from 'react';
import Avatar from '../common/Avatar';
import StatusBubble from '../common/StatusBubble';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../utils/formatDateTime';

const getStatusColor = (status) => {
    const statusMap = {
        "campaign-created": "info",
        "offers-approved": "success",
        "assigned-content": "info",
        "content-submitted": "warning",
        "content-approved": "success",
        "assigned-publishing": "info",
        "published": "success",
    };

    return statusMap[status?.toLowerCase()] || "default";
};

const statusIcons = {
    "campaign-created": "clock",
    "offers-approved": "check",
    "assigned-content": "user",
    "content-submitted": "clock",
    "content-approved": "check",
    "assigned-publishing": "user",
    "published": "rocket",
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



const CampaignTableRow = ({ campaign }) => {
  const navigate = useNavigate();
  const latestStatus = campaign?.decisionHistory?.[campaign.decisionHistory.length - 1]?.status || "Created";

  return (
    <tr
      className="cursor-pointer hover:bg-gray-100/80 even:bg-gray-50 transition"
      onClick={() => navigate(`/campaigns/${campaign._id}`)}
    >
      <td className="p-3 font-semibold">{campaign.title}</td>
      <td className="p-3 flex items-center gap-2">
        <Avatar name={campaign?.createdBy?.firstName} src={campaign?.createdBy?.profilePic} size="xs" />
        {campaign?.createdBy?.firstName}
      </td>
     
      <td className="p-3">{campaign?.typeOfCampaign}</td>
      <td className="p-3">{formatDateTime(campaign.dueDate)}</td>
      <td className="p-3 flex items-center gap-2 capitalize">
        <StatusBubble
          icon={statusIcons[latestStatus.toLowerCase()] || "clock"}
          status={getStatusColor(latestStatus)}
        />
        {latestStatus}
      </td>
    </tr>
  );
};

export default CampaignTableRow;
