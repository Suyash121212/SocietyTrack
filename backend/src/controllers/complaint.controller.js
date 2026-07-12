import { prisma } from '../db/prisma.js';
import { sendStatusChangeEmail } from '../services/email.service.js';
import { getIO } from '../socket.js';

const VALID_CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** ms a complaint has spent in its current status */
const timeInStatusMs = (complaint) => {
  const now = Date.now();
  if (!complaint.statusHistory?.length) {
    return now - new Date(complaint.createdAt).getTime();
  }
  const last = complaint.statusHistory.at(-1);
  return now - new Date(last.changedAt).getTime();
};

/** ms between creation and first resolution, or null */
const resolutionTimeMs = (complaint) => {
  if (!complaint.resolvedAt) return null;
  return new Date(complaint.resolvedAt).getTime() - new Date(complaint.createdAt).getTime();
};

const formatMs = (ms) => {
  if (ms === null) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  const days    = Math.floor(totalMinutes / 1440);
  const hours   = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0)  return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

export const createComplaint = async (req, res) => {
  const { category, description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'description is required' });
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  const photoUrl = req.file?.path ?? null;

  const complaint = await prisma.complaint.create({
    data: {
      userId:    req.user.id,
      category,
      description,
      photoUrl,
      status:    'OPEN',
      isOverdue: false,
      priority:  null,
    },
    select: {
      id:        true,
      category:  true,
      status:    true,
      createdAt: true,
    },
  });

  return res.status(201).json(complaint);
};

export const getMyComplaints = async (req, res) => {
  const now = Date.now();

  // Fetch reopen window for canReopen computation
  const config = await prisma.appConfig.findUnique({ where: { key: 'reopen_window_days' } });
  const reopenWindowMs = (config ? parseInt(config.value, 10) : 3) * 86_400_000;

  const complaints = await prisma.complaint.findMany({
    where:   { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      statusHistory: { orderBy: { changedAt: 'asc' }, select: { changedAt: true } },
    },
  });

  const result = complaints.map((c) => {
    // canReopen: only when RESOLVED and within the configured window
    const canReopen =
      c.status === 'RESOLVED' &&
      c.resolvedAt !== null &&
      now - new Date(c.resolvedAt).getTime() <= reopenWindowMs;

    return {
      id:             c.id,
      description:    c.description.slice(0, 100),
      category:       c.category,
      status:         c.status,
      priority:       c.priority,
      isOverdue:      c.isOverdue,
      createdAt:      c.createdAt,
      resolvedAt:     c.resolvedAt,
      canReopen,
      timeInStatus:   formatMs(timeInStatusMs(c)),
      resolutionTime: formatMs(resolutionTimeMs(c)),
    };
  });

  return res.status(200).json(result);
};

export const getComplaintById = async (req, res) => {
  const { id } = req.params;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      statusHistory: {
        orderBy: { changedAt: 'asc' },
        include: { admin: { select: { name: true } } },
      },
    },
  });

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Residents can only view their own complaints
  if (req.user.role === 'RESIDENT' && complaint.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Compute canReopen for the resident
  let canReopen = false;
  if (req.user.role === 'RESIDENT' && complaint.status === 'RESOLVED' && complaint.resolvedAt) {
    const config = await prisma.appConfig.findUnique({ where: { key: 'reopen_window_days' } });
    const windowMs = (config ? parseInt(config.value, 10) : 3) * 86_400_000;
    canReopen = Date.now() - new Date(complaint.resolvedAt).getTime() <= windowMs;
  }

  const statusHistory = complaint.statusHistory.map((h) => ({
    oldStatus: h.oldStatus,
    newStatus: h.newStatus,
    changedBy: h.admin.name,
    note:      h.note,
    changedAt: h.changedAt,
  }));

  return res.status(200).json({
    id:             complaint.id,
    description:    complaint.description,
    photoUrl:       complaint.photoUrl,
    category:       complaint.category,
    status:         complaint.status,
    priority:       complaint.priority,
    isOverdue:      complaint.isOverdue,
    createdAt:      complaint.createdAt,
    resolvedAt:     complaint.resolvedAt,
    canReopen,
    timeInStatus:   formatMs(timeInStatusMs(complaint)),
    resolutionTime: formatMs(resolutionTimeMs(complaint)),
    statusHistory,
  });
};

export const reopenComplaint = async (req, res) => {
  const { id } = req.params;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });

  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  // Only the resident who owns this complaint may reopen it
  if (complaint.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (complaint.status !== 'RESOLVED') {
    return res.status(400).json({ error: 'Only resolved complaints can be reopened' });
  }

  if (!complaint.resolvedAt) {
    return res.status(400).json({ error: 'Complaint has no resolved timestamp' });
  }

  // Enforce configurable reopen window
  const config = await prisma.appConfig.findUnique({ where: { key: 'reopen_window_days' } });
  const windowMs = (config ? parseInt(config.value, 10) : 3) * 86_400_000;
  const age = Date.now() - new Date(complaint.resolvedAt).getTime();

  if (age > windowMs) {
    const windowDays = config ? parseInt(config.value, 10) : 3;
    return res.status(400).json({
      error: `Reopen window has expired. Complaints can only be reopened within ${windowDays} day${windowDays !== 1 ? 's' : ''} of resolution. Please raise a new complaint.`,
    });
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: {
      status:     'REOPENED',
      resolvedAt: null,   // clear resolution timestamp — it's active again
    },
  });

  // Record the transition under the resident's own ID
  await prisma.statusHistory.create({
    data: {
      complaintId: id,
      changedBy:   req.user.id,
      oldStatus:   'RESOLVED',
      newStatus:   'REOPENED',
      note:        req.body?.note ?? null,
    },
  });

  // Notify via socket so admin sees it live
  getIO().to(`complaint:${id}`).emit('status-updated', {
    complaintId: id,
    oldStatus:   'RESOLVED',
    newStatus:   'REOPENED',
    note:        req.body?.note ?? null,
    changedAt:   new Date().toISOString(),
  });

  // Email the resident confirming their reopen
  sendStatusChangeEmail(
    complaint.user.email,
    complaint.id,
    complaint.category,
    'RESOLVED',
    'REOPENED',
    req.body?.note ?? null,
    new Date(),
  );

  return res.status(200).json(updated);
};
