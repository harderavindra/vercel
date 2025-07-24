const topContent = `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
  <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <div style="text-align: center; padding: 20px; background-color: #f5f5f5;">
      <img src="https://www.adbee.in/mahindra-logo.png" alt="Mahindra Logo" style="max-width: 150px;" />
    </div>`;

const bottomContent = `
  </div>

  <div style="text-align: center; font-size: 12px; color: #888888; padding: 20px;">
    © ${new Date().getFullYear()} Mahindra Brand Treasury. All rights reserved.
  </div>

</div>
`;

export const createdBrandEmailHTML = ({  newBrandTreasury,createdByUser, adminPanelLink }) => {
  return `
  ${topContent}
    <div style="padding: 20px;">
      <h2 style="color: #333333;">New Brand Document created successfully</h2>
      <p style="color: #555555;">Dear Admin,</p>
      <p>
         <strong>${newBrandTreasury.title}</strong> by a ${createdByUser.email}.
      </p>
      <p>
        Please log in to your admin panel to view the changes and take any necessary action.
      </p>
      <div style="text-align: center; margin-top: 25px;">
        <a href="${adminPanelLink}" style="background-color: #d1001c; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View in Admin Panel
        </a>
      </div>
    </div>
  ${bottomContent}
  `;
};
export const generateApprovalEmailHTML = ({ approved, documentTitle, adminPanelLink }) => {
  return `
  ${topContent}
    <div style="padding: 20px;">
      <h2 style="color: #333333;">Approval Status Updated</h2>
      <p style="color: #555555;">Dear Admin,</p>
      <p>
        The status of the document <strong>${documentTitle}</strong> in the Brand Treasury system has been <strong>${approved ? 'approved' : 'unapproved'}</strong> by a team member.
      </p>
      <p>
        Please log in to your admin panel to view the changes and take any necessary action.
      </p>
      <div style="text-align: center; margin-top: 25px;">
        <a href="${adminPanelLink}" style="background-color: #d1001c; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View in Admin Panel
        </a>
      </div>
    </div>
  ${bottomContent}
  `;
};

export const generateJobCreateEmailHTML = ({job, created, adminPanelLink}) => {
    console.log(job)
  const dueDateFormatted = job.dueDate
    ? new Date(job.dueDate).toLocaleDateString()
    : 'N/A';

  return `
  ${topContent}
    <div style="padding: 20px;">
      <h2 style="color: #333333;">New Job Created</h2>
      <p style="color: #555555;">A new job has been created in the system. Here are the details:</p>

      <ul style="color: #555555;">
        <li><strong>Job Title:</strong> ${job.title || 'N/A'}</li>
        <li><strong>Type of Artwork:</strong> ${job.typeOfArtwork || 'N/A'}</li>
        <li><strong>Offer Type:</strong> ${job.offerType || 'N/A'}</li>
        <li><strong>Due Date:</strong> ${dueDateFormatted}</li>
        <li><strong>Created By:</strong> ${created || 'N/A'}</li>
      </ul>

      <p>Please log in to your admin panel to view the details and take necessary action.</p>

      <div style="text-align: center; margin-top: 25px;">
        <a href="${adminPanelLink}" style="background-color: #d1001c; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View Job 
        </a>
      </div>
    </div>
  ${bottomContent}
  `;
};
export const firstJobApprovedEmailHTML = ({job, created, adminPanelLink}) => {
    console.log(job)
  const dueDateFormatted = job.dueDate
    ? new Date(job.dueDate).toLocaleDateString()
    : 'N/A';

  return `
  ${topContent}
    <div style="padding: 20px;">
      <h2 style="color: #333333;">New Job Approved</h2>
      <p style="color: #555555;">A job has been Approved in the system. Here are the details:</p>

      <ul style="color: #555555;">
        <li><strong>Job Title:</strong> ${job.title || 'N/A'}</li>
        <li><strong>Type of Artwork:</strong> ${job.typeOfArtwork || 'N/A'}</li>
        <li><strong>Offer Type:</strong> ${job.offerType || 'N/A'}</li>
        <li><strong>Due Date:</strong> ${dueDateFormatted}</li>
        <li><strong>Status:</strong> ${job.finalStatus}</li>
        <li><strong>Created By:</strong> ${created || 'N/A'}</li>
      </ul>

      <p>Please log in to your admin panel to view the details and take necessary action.</p>

      <div style="text-align: center; margin-top: 25px;">
        <a href="${adminPanelLink}" style="background-color: #d1001c; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View Job 
        </a>
      </div>
    </div>
  ${bottomContent}
  `;
};
export const assignedJobEmailHTML = ({job, assigned, adminPanelLink}) => {
    console.log(job)
  const dueDateFormatted = job.dueDate
    ? new Date(job.dueDate).toLocaleDateString()
    : 'N/A';

  return `
  ${topContent}
    <div style="padding: 20px;">
      <h2 style="color: #333333;">Artwork Assigned</h2>
      <p style="color: #555555;">A Artwork has been Assigned to . Here are the details:</p>

      <ul style="color: #555555;">
        <li><strong>Job Title:</strong> ${job.title || 'N/A'}</li>
        <li><strong>Type of Artwork:</strong> ${job.typeOfArtwork || 'N/A'}</li>
        <li><strong>Offer Type:</strong> ${job.offerType || 'N/A'}</li>
        <li><strong>Due Date:</strong> ${dueDateFormatted}</li>
        <li><strong>Status:</strong> ${job.finalStatus}</li>
        <li><strong>Assigned by:</strong> ${assigned.by || 'N/A'}</li>
        <li><strong>Assigned to:</strong> ${assigned.to.firstName + assigned.to.lastName || 'N/A'}</li>
      </ul>

      <p>Please log in to your admin panel to view the details and take necessary action.</p>

      <div style="text-align: center; margin-top: 25px;">
        <a href="${adminPanelLink}" style="background-color: #d1001c; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View Job 
        </a>
      </div>
    </div>
  ${bottomContent}
  `;
};
export const statusChangedJobEmailHTML = ({job, statusChangedBy, adminPanelLink}) => {
    console.log(job)
  const dueDateFormatted = job.dueDate
    ? new Date(job.dueDate).toLocaleDateString()
    : 'N/A';

  return `
  ${topContent}
    <div style="padding: 20px;">
      <h2 style="color: #333333;">Artwork Status</h2>
      <p style="color: #555555;">A Artwork's status has been updatedto . Here are the details:</p>

      <ul style="color: #555555;">
        <li><strong>Job Title:</strong> ${job.title || 'N/A'}</li>
        <li><strong>Type of Artwork:</strong> ${job.typeOfArtwork || 'N/A'}</li>
        <li><strong>Offer Type:</strong> ${job.offerType || 'N/A'}</li>
        <li><strong>Due Date:</strong> ${dueDateFormatted}</li>
        <li><strong>Status:</strong> ${job.finalStatus}</li>
        <li><strong>Updated by:</strong> ${statusChangedBy || 'N/A'}</li>
      </ul>

      <p>Please log in to your admin panel to view the details and take necessary action.</p>

      <div style="text-align: center; margin-top: 25px;">
        <a href="${adminPanelLink}" style="background-color: #d1001c; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View Job 
        </a>
      </div>
    </div>
  ${bottomContent}
  `;
};


export const generateCampaingnCreateEmailHTML = ({campaign, created, adminPanelLink}) => {
  const dueDateFormatted = campaign.dueDate
    ? new Date(campaign.dueDate).toLocaleDateString()
    : 'N/A';

  return `
  ${topContent}
    <div style="padding: 20px;">
      <h2 style="color: #333333;">New Campaign Created</h2>
      <p style="color: #555555;">A new Campaign has been created in the system. Here are the details:</p>

      <ul style="color: #555555;">
        <li><strong>Campaign Title:</strong> ${campaign.title || 'N/A'}</li>
        <li><strong>Zone:</strong> ${campaign.zone || 'N/A'}</li>
        <li><strong>Details:</strong> ${campaign.campaignDetails || 'N/A'}</li>
        <li><strong>Due Date:</strong> ${dueDateFormatted}</li>
        <li><strong>Created By:</strong> ${created || 'N/A'}</li>
      </ul>

      <p>Please log in to your admin panel to view the details and take necessary action.</p>

      <div style="text-align: center; margin-top: 25px;">
        <a href="${adminPanelLink}" style="background-color: #d1001c; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View Campaign 
        </a>
      </div>
    </div>
  ${bottomContent}
  `;
};

export const assignedCampaignEmailHTML = ({ campaign, assigned, adminPanelLink }) => {
  const dueDateFormatted = campaign.dueDate
    ? new Date(campaign.dueDate).toLocaleDateString()
    : 'N/A';

  const assignedToName = assigned?.to?.firstName || '' + ' ' + assigned?.to?.lastName || '';
  const assignedBy = assigned?.by || 'N/A';

  return `
    ${topContent}
    <div style="padding: 20px;">
      <h2 style="color: #333333;">Campaign Assigned</h2>
      <p style="color: #555555;">A campaign has been assigned to a team member. Below are the details:</p>

      <ul style="color: #555555;">
        <li><strong>Campaign Title:</strong> ${campaign.title || 'N/A'}</li>
        <li><strong>Zone:</strong> ${campaign.zone || 'N/A'}</li>
        <li><strong>Due Date:</strong> ${dueDateFormatted}</li>
        <li><strong>Assigned To:</strong> ${assignedToName || 'N/A'}</li>
        <li><strong>Assigned By:</strong> ${assignedBy}</li>
      </ul>

      <p>Please log in to your admin panel to take necessary action or follow up.</p>

      <div style="text-align: center; margin-top: 25px;">
        <a href="${adminPanelLink}" style="background-color: #d1001c; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View Campaign 
        </a>
      </div>
    </div>
    ${bottomContent}
  `;
};

export const updatedCampaignStatusEmailHTML = ({
  campaign,
  status,
  comment,
  updatedBy,          // can be user object { firstName, lastName, email } or string
  adminPanelLink,
  topContent = "",
  bottomContent = ""
}) => {
  const dueDateFormatted = campaign?.dueDate
    ? new Date(campaign.dueDate).toLocaleDateString("en-IN")
    : "N/A";

  const updatedByName =
    typeof updatedBy === "string"
      ? updatedBy
      : updatedBy
      ? `${updatedBy.firstName || ""} ${updatedBy.lastName || ""}`.trim() || updatedBy.email || "N/A"
      : "N/A";

      const designAssigned = campaign?.designAssignedTo?.firstName
    ? `${campaign.designAssignedTo.firstName} ${campaign.designAssignedTo.lastName || ""}`.trim()
    : campaign?.designAssignedTo?.email || "";

  const publishAssigned = campaign?.publishAssignedTo?.firstName
    ? `${campaign.publishAssignedTo.firstName} ${campaign.publishAssignedTo.lastName || ""}`.trim()
    : campaign?.publishAssignedTo?.email || "";

  return `
    ${topContent}
    <div style="padding:20px;font-family:Arial, sans-serif;">
      <h2 style="color:#333;margin:0 0 10px;">Campaign Status Updated</h2>
      <p style="color:#555;margin:0 0 16px;">
        The status of the campaign has been updated. Here are the details:
      </p>

      <ul style="color:#555;line-height:1.6;padding-left:18px;margin:0 0 20px;">
        <li><strong>Campaign Title:</strong> ${campaign?.title || "N/A"}</li>
        <li><strong>Zone:</strong> ${campaign?.zone || "N/A"}</li>
        <li><strong>New Status:</strong> ${status || "N/A"}</li>
        <li><strong>Updated By:</strong> ${updatedByName}</li>
        <li><strong>Due Date:</strong> ${dueDateFormatted}</li>
         ${
          designAssigned
            ? `<li><strong>Design Assigned To:</strong> ${designAssigned}</li>`
            : ""
        }
        ${
          publishAssigned
            ? `<li><strong>Publish Assigned To:</strong> ${publishAssigned}</li>`
            : ""
        }
        ${comment ? `<li><strong>Comment:</strong> ${comment}</li>` : ""}
      </ul>

      <div style="text-align:center;margin-top:24px;">
        <a href="${adminPanelLink}" style="background:#d1001c;color:#fff;padding:12px 20px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block;">
          View Campaign
        </a>
      </div>
    </div>
    ${bottomContent}
  `;
};