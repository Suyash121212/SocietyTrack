import { prisma } from '../db/prisma.js';
import { sendStatusChangeEmail } from '../services/email.service.js';
import { getIO } from '../socket.js';
import { getThumbnailUrl } from '../middleware/upload.middleware.js';

const VALID_CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER'];
const MAX_PHOTOS = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeInStatusMs = (complaint) => {
  const now = Date.now();
  if (!complaint.statusHistory?.length) {
    return now - new Date(complaint.createdAt).getTime();
  }
  return now - new Date(complaint.statusHistory.at(-1).changedAt).getTime();
};

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

  const files = req.files ?? [];

  if (files.length > MAX_PHOTOS) {
    return res.status(400).json({ error: `Maximum ${MAX_PHOTOS} photos allowed` });
  }

  const complaint = await prisma.complaint.create({
    data: {
      userId:    req.user.id,
      category,
      description,
      status:    'OPEN',
      isOverdue: false,
      priority:  null,
      // Create all photo rows in the same transaction
      photos: files.length > 0 ? {
        create: files.map((file, i) => ({
          url:          file.secure_url || file.path,
          thumbnailUrl: getThumbnailUrl(file),
          position:     i,
        })),
      } : undefined,
    },
    select: {
      id:        true,
      category:  true,
      status:    true,
      createdAt: true,
      photos: { select: { id: true, url: true, thumbnailUrl: true, position: true } },
    },
  });

  return res.status(201).json(complaint);
};

export const getMyComplaints = async (req, res) => {
  const now = Date.now();

  const config = await prisma.appConfig.findUnique({ where: { key: 'reopen_window_days' } });
  const reopenWindowMs = (config ? parseInt(config.value, 10) : 3) * 86_400_000;

  const complaints = await prisma.complaint.findMany({
    where:   { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      statusHistory: { orderBy: { changedAt: 'asc' }, select: { changedAt: true } },
      photos: { orderBy: { position: 'asc' }, select: { thumbnailUrl: true, url: true } },
    },
  });

  return res.status(200).json(complaints.map((c) => {
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
      // Return first thumbnail for list-view previews
      thumbnailUrl:   c.photos[0]?.thumbnailUrl ?? null,
      timeInStatus:   formatMs(timeInStatusMs(c)),
      resolutionTime: formatMs(resolutionTimeMs(c)),
    };
  }));
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
      photos: { orderBy: { position: 'asc' } },
    },
  });

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  if (req.user.role === 'RESIDENT' && complaint.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  let canReopen = false;
  if (req.user.role === 'RESIDENT' && complaint.status === 'RESOLVED' && complaint.resolvedAt) {
    const config = await prisma.appConfig.findUnique({ where: { key: 'reopen_window_days' } });
    const windowMs = (config ? parseInt(config.value, 10) : 3) * 86_400_000;
    canReopen = Date.now() - new Date(complaint.resolvedAt).getTime() <= windowMs;
  }

  const statusHistory = complaint.statusHistory.map((h) => ({
    oldStatus: h.oldStatus,
    newStatus: h.newStatus,
    changedBy: h.admin?.name ?? 'System',
    note:      h.note,
    changedAt: h.changedAt,
  }));

  return res.status(200).json({
    id:             complaint.id,
    description:    complaint.description,
    category:       complaint.category,
    status:         complaint.status,
    priority:       complaint.priority,
    isOverdue:      complaint.isOverdue,
    createdAt:      complaint.createdAt,
    resolvedAt:     complaint.resolvedAt,
    canReopen,
    // Normalized photo array — full URL for detail view, thumbnail pre-generated
    photos:         complaint.photos.map((p) => ({
      id:           p.id,
      url:          p.url,
      thumbnailUrl: p.thumbnailUrl,
      position:     p.position,
    })),
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

  if (complaint.userId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (complaint.status !== 'RESOLVED') {
    return res.status(400).json({ error: 'Only resolved complaints can be reopened' });
  }

  if (!complaint.resolvedAt) {
    return res.status(400).json({ error: 'Complaint has no resolved timestamp' });
  }

  const config    = await prisma.appConfig.findUnique({ where: { key: 'reopen_window_days' } });
  const windowMs  = (config ? parseInt(config.value, 10) : 3) * 86_400_000;
  const age       = Date.now() - new Date(complaint.resolvedAt).getTime();

  if (age > windowMs) {
    const windowDays = config ? parseInt(config.value, 10) : 3;
    return res.status(400).json({
      error: `Reopen window has expired. Complaints can only be reopened within ${windowDays} day${windowDays !== 1 ? 's' : ''} of resolution. Please raise a new complaint.`,
    });
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: { status: 'REOPENED', resolvedAt: null },
  });

  await prisma.statusHistory.create({
    data: {
      complaintId: id,
      changedBy:   req.user.id,
      oldStatus:   'RESOLVED',
      newStatus:   'REOPENED',
      note:        req.body?.note ?? null,
    },
  });

  getIO().to(`complaint:${id}`).emit('status-updated', {
    complaintId: id,
    oldStatus:   'RESOLVED',
    newStatus:   'REOPENED',
    note:        req.body?.note ?? null,
    changedAt:   new Date().toISOString(),
  });

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
