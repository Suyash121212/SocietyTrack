import { prisma } from '../db/prisma.js';
import { sendStatusChangeEmail } from '../services/email.service.js';
import { getIO } from '../socket.js';

const VALID_TRANSITIONS = {
  OPEN:        ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED:    [],
};

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export const getAllComplaints = async (req, res) => {
  try {
    const { status, category, date_from, date_to, q } = req.query;

    const where = {};

    // Status Filter
    if (status?.trim()) {
      where.status = status.trim().toUpperCase();
    }

    // Category Filter
    if (category?.trim()) {
      where.category = category.trim().toUpperCase();
    }

    // Date Filters
    if (date_from || date_to) {
      where.createdAt = {};

      if (date_from) {
        const fromDate = new Date(date_from);

        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid date_from",
          });
        }

        where.createdAt.gte = fromDate;
      }

      if (date_to) {
        const toDate = new Date(date_to);

        if (isNaN(toDate.getTime())) {
          return res.status(400).json({
            message: "Invalid date_to",
          });
        }

        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    // Search
    if (q?.trim()) {
      const search = q.trim();

      const orConditions = [
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            flatNo: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];

      // Add category search only if it matches an enum value
      const validCategories = [
        "ELECTRICAL",
        "PLUMBING",
        "SECURITY",
        "CLEANING",
        "OTHER",
      ];

      if (validCategories.includes(search.toUpperCase())) {
        orConditions.push({
          category: search.toUpperCase(),
        });
      }

      where.OR = orConditions;
    }

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: [
        {
          isOverdue: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      include: {
        user: {
          select: {
            flatNo: true,
          },
        },
      },
    });

    return res.status(200).json(
      complaints.map((complaint) => ({
        id: complaint.id,
        flatNo: complaint.user.flatNo,
        category: complaint.category,
        status: complaint.status,
        priority: complaint.priority,
        isOverdue: complaint.isOverdue,
        createdAt: complaint.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching complaints:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status: newStatus, note } = req.body;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });

  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  if (complaint.status === 'RESOLVED') {
    return res.status(400).json({ error: 'Complaint is resolved and cannot be updated' });
  }

  const allowed = VALID_TRANSITIONS[complaint.status] ?? [];
  if (!newStatus || !allowed.includes(newStatus)) {
    return res.status(400).json({ error: `Cannot transition from ${complaint.status} to ${newStatus}` });
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

  sendStatusChangeEmail(
    complaint.user.email,
    complaint.id,
    complaint.category,
    complaint.status,
    newStatus,
    note ?? null,
    new Date(),
  );

  getIO().to(`complaint:${id}`).emit('status-updated', {
    complaintId: id,
    oldStatus: complaint.status,
    newStatus,
    note: note ?? null,
    changedAt: new Date().toISOString(),
  });

  return res.status(200).json(updated);
};

export const updatePriority = async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;

  if (!priority || !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  const updated = await prisma.complaint.update({ where: { id }, data: { priority } });
  return res.status(200).json(updated);
};

export const setOverdue = async (req, res) => {
  const { id } = req.params;

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  if (complaint.status === 'RESOLVED') {
    return res.status(400).json({ error: 'Resolved complaints cannot be flagged as overdue' });
  }

  const updated = await prisma.complaint.update({ where: { id }, data: { isOverdue: true } });
  return res.status(200).json(updated);
};

export const getWeeklyStats = async (_req, res) => {
  const rows = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('week', created_at) AS week_start,
      COUNT(*)::int                  AS count
    FROM complaints
    WHERE created_at >= NOW() - INTERVAL '6 weeks'
    GROUP BY week_start
    ORDER BY week_start ASC
  `;

  const now = new Date();
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (5 - i) * 7);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const result = weeks.map((weekStart) => {
    const label = weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const match = rows.find((r) => new Date(r.week_start).toDateString() === weekStart.toDateString());
    return { week: label, complaints: match ? match.count : 0 };
  });

  return res.status(200).json(result);
};

export const getDashboard = async (_req, res) => {
  const total         = await prisma.complaint.count();
  const byStatusRaw   = await prisma.complaint.groupBy({ by: ['status'],   _count: { id: true } });
  const byCategoryRaw = await prisma.complaint.groupBy({ by: ['category'], _count: { id: true } });
  const overdue       = await prisma.complaint.count({ where: { isOverdue: true } });

  const byStatus = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
  for (const row of byStatusRaw) byStatus[row.status] = row._count.id;

  const byCategory = { ELECTRICAL: 0, PLUMBING: 0, SECURITY: 0, CLEANING: 0, OTHER: 0 };
  for (const row of byCategoryRaw) byCategory[row.category] = row._count.id;

  return res.status(200).json({ total, byStatus, byCategory, overdue });
};
