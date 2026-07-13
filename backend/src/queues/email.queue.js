import { Queue } from 'bullmq';
import { createRedisConnection } from './redis.js';

export const EMAIL_QUEUE = 'email';

// Job type constants — used as `name` in BullMQ so the worker
// can switch on them cleanly.
export const JOB_STATUS_CHANGE   = 'status_change';
export const JOB_IMPORTANT_NOTICE = 'important_notice';

// Single Queue instance for the whole process.
// The Queue only needs a producer connection — it never blocks.

const emailQueue = new Queue(EMAIL_QUEUE, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts:    3,
    backoff:     { type: 'exponential', delay: 5_000 }, // 5s, 10s, 20s
    removeOnComplete: { count: 100 },  // keep last 100 completed for inspection
    removeOnFail:     { count: 200 },  // keep last 200 failed for post-mortem
  },
});

emailQueue.on('error', (err) => {
  console.error('[EmailQueue] Queue error:', err.message);
});

/**
 * Enqueue a status-change notification for a single resident.
 *
 * @param {{ to, complaintId, category, oldStatus, newStatus, note, changedAt }} data
 */
export const enqueueStatusChange = (data) =>
  emailQueue.add(JOB_STATUS_CHANGE, data);

/**
 * Enqueue an important-notice broadcast.
 * Each recipient gets its own job so a single bad address
 * doesn't block or fail the rest of the batch.
 *
 * @param {string[]} emails
 * @param {string}   title
 * @param {string}   body
 */
export const enqueueImportantNotice = (emails, title, body) =>
  Promise.all(
    emails.map((to) =>
      emailQueue.add(JOB_IMPORTANT_NOTICE, { to, title, body }),
    ),
  );

export default emailQueue;
