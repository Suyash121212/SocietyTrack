import { prisma } from '../db/prisma.js';

const VALID_CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER'];

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
      userId: req.user.id,
      category,
      description,
      photoUrl,
      status: 'OPEN',
      isOverdue: false,
      priority: null,
    },
    select: {
      id: true,
      category: true,
      status: true,
      createdAt: true,
    },
  });

  return res.status(201).json(complaint);
};

export const getMyComplaints = async (req, res) => {
  const complaints = await prisma.complaint.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      description: true,
      category: true,
      status: true,
      priority: true,
      isOverdue: true,
      createdAt: true,
    },
  });

  // Truncate description to 100 chars
  const result = complaints.map((c) => ({
    ...c,
    description: c.description.slice(0, 100),
  }));

  return res.status(200).json(result);
};

export const getComplaintById = async (req, res) => {
  const { id } = req.params;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      statusHistory: {
        orderBy: { changedAt: 'asc' },
        include: {
          admin: {
            select: { name: true },
          },
        },
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

  // Shape statusHistory: replace admin object with changedBy name string
  const statusHistory = complaint.statusHistory.map((h) => ({
    oldStatus: h.oldStatus,
    newStatus: h.newStatus,
    changedBy: h.admin.name,
    note: h.note,
    changedAt: h.changedAt,
  }));

  return res.status(200).json({
    id: complaint.id,
    description: complaint.description,
    photoUrl: complaint.photoUrl,
    category: complaint.category,
    status: complaint.status,
    priority: complaint.priority,
    isOverdue: complaint.isOverdue,
    createdAt: complaint.createdAt,
    resolvedAt: complaint.resolvedAt,
    statusHistory,
  });
};
