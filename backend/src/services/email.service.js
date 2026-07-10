import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendStatusChangeEmail = (to, complaintId, category, oldStatus, newStatus, note, changedAt) => {
  transporter.sendMail({
    from: `"Society Maintenance" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Complaint Update: ${category} — ${newStatus}`,
    html: `
      <h2>Your complaint has been updated</h2>
      <p><strong>Complaint ID:</strong> ${complaintId}</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Status:</strong> ${oldStatus} → ${newStatus}</p>
      ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
      <p><strong>Updated at:</strong> ${changedAt.toLocaleString()}</p>
    `,
  }).catch((err) => {
    console.error('[EmailService] Failed to send status change email:', err);
  });
};

export const sendImportantNoticeEmail = (emails, title, body) => {
  emails.forEach((to) => {
    transporter.sendMail({
      from: `"Society Maintenance" <${process.env.GMAIL_USER}>`,
      to,
      subject: `[Important Notice] ${title}`,
      html: `<h2>${title}</h2><p>${body}</p>`,
    }).catch((err) => {
      console.error(`[EmailService] Failed to send notice to ${to}:`, err);
    });
  });
};
