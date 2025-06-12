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

export const createdBrandEmailHTML = ({  newBrandTreasury, adminPanelLink }) => {
  return `
  ${topContent}
    <div style="padding: 20px;">
      <h2 style="color: #333333;">Approval Status Updated</h2>
      <p style="color: #555555;">Dear Admin,</p>
      <p>
        New Brand Document created successfully - <strong>${newBrandTreasury.title}</strong> by a ${createdByUser.email}.
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
