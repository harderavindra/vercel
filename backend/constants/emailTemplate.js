export const generateApprovalEmailHTML = ({ approved, documentTitle, adminPanelLink }) => {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      
      <div style="text-align: center; padding: 20px; background-color: #f5f5f5;">
        <img src="https://www.adbee.in/mahindra-logo.png" alt="Mahindra Logo" style="max-width: 150px;" />
      </div>

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

      <div style="text-align: center; font-size: 12px; color: #888888; padding: 20px;">
        © ${new Date().getFullYear()} Mahindra Brand Treasury. All rights reserved.
      </div>

    </div>
  </div>
  `;
};


export function generateJobCreateEmailHTML(job, createdByName) {
  const dueDateFormatted = job.dueDate
    ? new Date(job.dueDate).toLocaleDateString()
    : 'N/A';

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <div style="text-align: center; padding: 20px; background-color: #f5f5f5;">
          <img src="https://adbee.in/wp-content/uploads/2024/01/mahindra-tractor-logo.png" alt="Mahindra Logo" style="max-width: 150px;" />
        </div>

        <div style="padding: 20px;">
          <h2 style="color: #333333;">New Job Created</h2>
          <p style="color: #555555;">A new job has been created in the system. Here are the details:</p>

          <ul style="color: #555555;">
            <li><strong>Job Title:</strong> ${job.title || 'N/A'}</li>
            <li><strong>Type of Artwork:</strong> ${job.typeOfArtwork || 'N/A'}</li>
            <li><strong>Offer Type:</strong> ${job.offerType || 'N/A'}</li>
            <li><strong>Due Date:</strong> ${dueDateFormatted}</li>
            <li><strong>Created By:</strong> ${createdByName || 'N/A'}</li>
          </ul>

          <p>Please log in to your admin panel to view the details and take necessary action.</p>

          <div style="text-align: center; margin-top: 25px;">
            <a href="https://yourdomain.com/admin-panel" style="background-color: #d1001c; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Job in Admin Panel
            </a>
          </div>
        </div>

        <div style="text-align: center; font-size: 12px; color: #888888; padding: 20px;">
          © ${new Date().getFullYear()} Mahindra Brand Treasury. All rights reserved.
        </div>

      </div>
    </div>
  `;
}
