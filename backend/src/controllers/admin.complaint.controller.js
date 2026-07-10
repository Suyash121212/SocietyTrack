import { prisma } from '../db/prisma.js';
import { sendStatusChangeEmail } from '../services/email.service.js';

const VALID_TRANSITIONS = {
  OPEN:        ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED:    [], // terminal — locked
};

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

// GET /api/admin/complaints
export const getAllComplaints = async (req, res) => {
  const { status, category, date_from, date_to } = req.query;

  const where = {};

  if (status) where.status = status;
  if (category) where.category = category;
  if (date_from || date_to) {
    where.createdAt = {};
    if (date_from) where.createdAt.gte = new Date(date_from);
    if (date_to) {
      // Make date_to inclusive by going to end of day
      const end = new Date(date_to);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: [
      { isOverdue: 'desc' },
      { createdAt: 'desc' },
    ],
    include: {
      user: { select: { flatNo: true } },
    },
  });

  const result = complaints.map((c) => ({
    id: c.id,
    flatNo: c.user.flatNo,
    category: c.category,
    status: c.status,
    priority: c.priority,
    isOverdue: c.isOverdue,
    createdAt: c.createdAt,
  }));

  return res.status(200).json(result);
};

// PATCH /api/admin/complaints/:id/status
export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status: newStatus, note } = req.body;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  if (complaint.status === 'RESOLVED') {
    return res.status(400).json({ error: 'Complaint is resolved and cannot be updated' });
  }

  const allowed = VALID_TRANSITIONS[complaint.status] ?? [];
  if (!newStatus || !allowed.includes(newStatus)) {
    return res.status(400).json({
      error: `Cannot transition from ${complaint.status} to ${newStatus}`,
    });
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: {
      status: newStatus,
      resolvedAt: newStatus === 'RESOLVED' ? new Date() : undefined,
    },
  });

  await prisma.statusHistory.create({
    data: {
      complaintId: id,
      changedBy: req.user.id,
      oldStatus: complaint.status,
      newStatus,
      note: note ?? null,
    },
  });

  // Fire-and-forget email notification
  sendStatusChangeEmail(
    complaint.user.email,
    complaint.id,
    complaint.category,
    complaint.status,
    newStatus,
    note ?? null,
    new Date(),
  );

  return res.status(200).json(updated);
};

// PATCH /api/admin/complaints/:id/priority
export const updatePriority = async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;

  if (!priority || !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: { priority },
  });

  return res.status(200).json(updated);
};

// PATCH /api/admin/complaints/:id/overdue
export const setOverdue = async (req, res) => {
  const { id } = req.params;

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  if (complaint.status === 'RESOLVED') {
    return res.status(400).json({ error: 'Resolved complaints cannot be flagged as overdue' });
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: { isOverdue: true },
  });

  return res.status(200).json(updated);
};

// GET /api/admin/dashboard
export const getDashboard = async (req, res) => {
  const total        = await prisma.complaint.count();
  const byStatusRaw  = await prisma.complaint.groupBy({ by: ['status'],   _count: { id: true } });
  const byCategoryRaw = await prisma.complaint.groupBy({ by: ['category'], _count: { id: true } });
  const overdue      = await prisma.complaint.count({ where: { isOverdue: true } });

  const byStatus = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
  for (const row of byStatusRaw) {
    byStatus[row.status] = row._count.id;
  }

  const byCategory = { ELECTRICAL: 0, PLUMBING: 0, SECURITY: 0, CLEANING: 0, OTHER: 0 };
  for (const row of byCategoryRaw) {
    byCategory[row.category] = row._count.id;
  }

  return res.status(200).json({ total, byStatus, byCategory, overdue });
};
