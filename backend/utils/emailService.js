// services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,      // Your Gmail address
    pass: process.env.EMAIL_PASS,      // App Password (not your Gmail password)
  },
});

// EMAIL_PAUSED=true → no email is sent (every caller keeps working); remove it or set false to send again.
export const emailPaused = () => process.env.EMAIL_PAUSED === 'true';

export const sendEmail = async ({ to, subject, html }) => {
  if (emailPaused()) {
    const count = Array.isArray(to) ? to.length : String(to || '').split(',').filter(Boolean).length;
    console.log(`[email paused] not sent: "${subject}" to ${count} recipient(s)`);
    return { paused: true, accepted: [], rejected: [] };
  }
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,                         // array or comma-separated string of emails
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};
