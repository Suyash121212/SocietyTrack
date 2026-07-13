/**
 * email.service.js
 *
 * Public interface for sending email throughout the app.
 * All calls are enqueued into BullMQ — the HTTP response returns immediately
 * and the email.worker picks up the job from Redis asynchronously.
 *
 * Why a queue instead of inline Nodemailer calls?
 *   - API response time is no longer coupled to Gmail SMTP latency (~200–800ms).
 *   - Transient SMTP failures are retried automatically (3 attempts, exponential
 *     backoff) without any extra code in the controllers.
 *   - Failed jobs accumulate in Redis and can be inspected or replayed — you get
 *     an audit trail of every email attempt for free.
 */
import {
  enqueueStatusChange,
  enqueueImportantNotice,
} from '../queues/email.queue.js';

/**
 * Queue a status-change notification to a single resident.
 * Signature is intentionally identical to the old direct-send version
 * so no controllers needed to change beyond the import.
 */
export const sendStatusChangeEmail = (
  to,
  complaintId,
  category,
  oldStatus,
  newStatus,
  note,
  changedAt,
) => {
  enqueueStatusChange({ to, complaintId, category, oldStatus, newStatus, note, changedAt })
    .catch((err) =>
      console.error('[EmailService] Failed to enqueue status_change:', err.message),
    );
};

/**
 * Queue important-notice emails to a list of residents.
 * Each recipient becomes its own job so one bad address
 * can't fail the entire broadcast.
 */
export const sendImportantNoticeEmail = (emails, title, body) => {
  enqueueImportantNotice(emails, title, body)
    .catch((err) =>
      console.error('[EmailService] Failed to enqueue important_notice:', err.message),
    );
};
