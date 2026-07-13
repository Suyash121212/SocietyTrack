import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import {
  EMAIL_QUEUE,
  JOB_STATUS_CHANGE,
  JOB_IMPORTANT_NOTICE,
} from '../queues/email.queue.js';
import { createRedisConnection } from '../queues/redis.js';

// ─── Nodemailer transport ─────────────────────────────────────────────────────
// Constructed once per worker process — reused across all jobs.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── Job handlers ─────────────────────────────────────────────────────────────

const handleStatusChange = async ({ to, complaintId, category, oldStatus, newStatus, note, changedAt }) => {
  await transporter.sendMail({
    from:    `"Society Maintenance" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Complaint Update: ${category} — ${newStatus}`,
    html: `
      <h2>Your complaint has been updated</h2>
      <p><strong>Complaint ID:</strong> ${complaintId}</p>
      <p><strong>Category:</strong> ${category}</p>
      <p><strong>Status:</strong> ${oldStatus} → ${newStatus}</p>
      ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
      <p><strong>Updated at:</strong> ${new Date(changedAt).toLocaleString()}</p>
    `,
  });
};

const handleImportantNotice = async ({ to, title, body }) => {
  await transporter.sendMail({
    from:    `"Society Maintenance" <${process.env.GMAIL_USER}>`,
    to,
    subject: `[Important Notice] ${title}`,
    html:    `<h2>${title}</h2><p>${body}</p>`,
  });
};

// ─── Worker ───────────────────────────────────────────────────────────────────

export const startEmailWorker = () => {
  const worker = new Worker(
    EMAIL_QUEUE,
    async (job) => {
      switch (job.name) {
        case JOB_STATUS_CHANGE:
          await handleStatusChange(job.data);
          break;
        case JOB_IMPORTANT_NOTICE:
          await handleImportantNotice(job.data);
          break;
        default:
          throw new Error(`[EmailWorker] Unknown job type: ${job.name}`);
      }
    },
    {
      connection: createRedisConnection(),
      // Process one email at a time — Gmail's SMTP server will throttle
      // bursts; a concurrency of 1 keeps us well inside free-tier limits.
      // Bump to 3–5 in production with a proper SMTP relay.
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[EmailWorker] Job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} (${job?.name}) failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('[EmailWorker] Worker error:', err.message);
  });

  console.log('[EmailWorker] Started — listening for email jobs');
  return worker;
};
