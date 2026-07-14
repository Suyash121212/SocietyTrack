import { prisma } from '../db/prisma.js';
import { sendStatusChangeEmail } from '../services/email.service.js';
import { getIO } from '../socket.js';
import {
  withCache,
  invalidateDashboardCache,
  CACHE_KEYS,
} from '../services/cache.js';

// ─── State machine ────────────────────────────────────────────────────────────
// REOPENED sits after RESOLVED and feeds back into the active workflow.
// Admin can advance REOPENED → IN_PROGRESS or directly RESOLVED again.
const VALID_TRANSITIONS = {
  OPEN:        ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED:    [],                          // only residents may reopen via POST /reopen
  REOPENED:    ['IN_PROGRESS', 'RESOLVED'],
};

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns how long (ms) a complaint has been in its current status. */
const timeInStatus = (complaint) => {
  const now = Date.now();
  if (!complaint.statusHistory?.length) {
    return now - new Date(complaint.createdAt).getTime();
  }
  const last = complaint.statusHistory.at(-1);
  return now - new Date(last.changedAt).getTime();
};

/** Returns resolution time in ms, or null if not yet resolved. */
const resolutionTime = (complaint) => {
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

/**
 * Urgency score — higher = needs attention sooner.
 * Used to sort the admin queue instead of a flat isOverdue DESC.
 *
 * Score components:
 *   isOverdue:   +40   (already blown the SLA)
 *   REOPENED:    +20   (resident rejected the resolution)
 *   priority:    HIGH=15 / MEDIUM=8 / LOW=3 / null=0
 *   age (days):  +1 per day, capped at 20
 *   status:      OPEN=5 / IN_PROGRESS=2 / REOPENED=0 (already counted above)
 */
const PRIORITY_SCORE = { HIGH: 15, MEDIUM: 8, LOW: 3 };
const STATUS_SCORE   = { OPEN: 5, IN_PROGRESS: 2, RESOLVED: 0, REOPENED: 0 };

const urgencyScore = (complaint) => {
  let score = 0;
  if (complaint.isOverdue)             score += 40;
  if (complaint.status === 'REOPENED') score += 20;
  score += PRIORITY_SCORE[complaint.priority] ?? 0;
  score += STATUS_SCORE[complaint.status]     ?? 0;
  const ageDays = (Date.now() - new Date(complaint.createdAt).getTime()) / 86_400_000;
  score += Math.min(Math.floor(ageDays), 20);
  return score;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

// ── Cursor pagination helpers ────────────────────────────────────────────────
const DEFAULT_LIMIT = 20;
const MAX_LIMIT     = 100;

/**
 * Encode a cursor from the last row on a page.
 * Format: base64url(ISO timestamp "|" UUID)
 * Both fields together form a unique, stable sort key so ties on createdAt
 * don't cause rows to be skipped or repeated across pages.
 */
const encodeCursor = (createdAt, id) =>
  Buffer.from(`${new Date(createdAt).toISOString()}|${id}`).toString('base64url');

const decodeCursor = (cursor) => {
  if (!cursor) return null;
  try {
    const [iso, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    const createdAt = new Date(iso);
    if (isNaN(createdAt.getTime()) || !id) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
};

export const getAllComplaints = async (req, res) => {
  try {
    const { status, category, date_from, date_to, q, cursor, limit: limitParam } = req.query;

    const limit  = Math.min(parseInt(limitParam, 10) || DEFAULT_LIMIT, MAX_LIMIT);
    const parsed = decodeCursor(cursor);

    // ── Build filter conditions ───────────────────────────────────────────────
    const filterConditions = [];

    if (status?.trim())   filterConditions.push({ status:   status.trim().toUpperCase() });
    if (category?.trim()) filterConditions.push({ category: category.trim().toUpperCase() });

    if (date_from || date_to) {
      const createdAt = {};
      if (date_from) {
        const d = new Date(date_from);
        if (isNaN(d.getTime())) return res.status(400).json({ message: 'Invalid date_from' });
        createdAt.gte = d;
      }
      if (date_to) {
        const d = new Date(date_to);
        if (isNaN(d.getTime())) return res.status(400).json({ message: 'Invalid date_to' });
        d.setHours(23, 59, 59, 999);
        createdAt.lte = d;
      }
      filterConditions.push({ createdAt });
    }

    if (q?.trim()) {
      const search = q.trim();
      const validCategories = ['ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER'];
      const orConditions = [
        { description: { contains: search, mode: 'insensitive' } },
        { user: { flatNo: { contains: search, mode: 'insensitive' } } },
        ...(validCategories.includes(search.toUpperCase())
          ? [{ category: search.toUpperCase() }]
          : []),
      ];
      filterConditions.push({ OR: orConditions });
    }

    // ── Cursor condition ──────────────────────────────────────────────────────
    // Sort: createdAt DESC, id DESC (UUID tie-breaker for same-second inserts).
    // "After cursor" in descending order:
    //   rows where createdAt < cursor.createdAt
    //          OR (createdAt = cursor.createdAt AND id < cursor.id)
    if (parsed) {
      filterConditions.push({
        OR: [
          { createdAt: { lt: parsed.createdAt } },
          { createdAt: parsed.createdAt, id: { lt: parsed.id } },
        ],
      });
    }

    const where = filterConditions.length > 0 ? { AND: filterConditions } : {};

    // Fetch limit+1 — the extra row tells us whether another page exists
    // without a separate COUNT(*) round-trip.
    const rows = await prisma.complaint.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take:    limit + 1,
      include: {
        user:          { select: { flatNo: true } },
        statusHistory: { orderBy: { changedAt: 'asc' }, select: { changedAt: true } },
      },
    });

    const hasMore = rows.length > limit;
    const page    = hasMore ? rows.slice(0, limit) : rows;

    const shaped = page.map((c) => ({
      id:             c.id,
      flatNo:         c.user.flatNo,
      category:       c.category,
      status:         c.status,
      priority:       c.priority,
      isOverdue:      c.isOverdue,
      createdAt:      c.createdAt,
      resolvedAt:     c.resolvedAt,
      urgencyScore:   urgencyScore(c),
      timeInStatus:   formatMs(timeInStatus(c)),
      resolutionTime: formatMs(resolutionTime(c)),
    }));

    // Urgency sort within each page — DB gives us a stable cursor-ordered
    // set; urgency re-orders within that set so the hottest items surface first.
    // shaped.sort((a, b) =>
    //   b.urgencyScore - a.urgencyScore ||
    //   new Date(b.createdAt) - new Date(a.createdAt)
    // );

    const last       = page.at(-1);
    const nextCursor = hasMore && last ? encodeCursor(last.createdAt, last.id) : null;

    return res.status(200).json({ data: shaped, nextCursor, hasMore });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
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

  const allowed = VALID_TRANSITIONS[complaint.status] ?? [];
  if (!newStatus || !allowed.includes(newStatus)) {
    return res.status(400).json({
      error: `Cannot transition from ${complaint.status} to ${newStatus}. Allowed: [${allowed.join(', ') || 'none'}]`,
    });
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: {
      status:     newStatus,
      resolvedAt: newStatus === 'RESOLVED'  ? new Date()
                : newStatus === 'REOPENED'  ? null
                : undefined,
    },
  });

  await prisma.statusHistory.create({
    data: {
      complaintId: id,
      changedBy:   req.user.id,
      oldStatus:   complaint.status,
      newStatus,
      note:        note ?? null,
    },
  });

  // Status change affects counts — bust the cache so the next dashboard
  // load reflects reality instead of serving stale numbers.
  invalidateDashboardCache();

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
    oldStatus:   complaint.status,
    newStatus,
    note:        note ?? null,
    changedAt:   new Date().toISOString(),
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

  // Priority change affects urgency scores on the dashboard
  invalidateDashboardCache();

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

  // Overdue count on dashboard changes
  invalidateDashboardCache();

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
  const result = await withCache(CACHE_KEYS.OVERVIEW, async () => {
    const total         = await prisma.complaint.count();
    const byStatusRaw   = await prisma.complaint.groupBy({ by: ['status'],   _count: { id: true } });
    const byCategoryRaw = await prisma.complaint.groupBy({ by: ['category'], _count: { id: true } });
    const overdue       = await prisma.complaint.count({ where: { isOverdue: true } });

    const resolvedComplaints = await prisma.complaint.findMany({
      where:  { status: 'RESOLVED', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    });

    let avgResolutionHours = null;
    if (resolvedComplaints.length > 0) {
      const totalMs = resolvedComplaints.reduce(
        (sum, c) => sum + (new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime()),
        0,
      );
      avgResolutionHours = Math.round(totalMs / resolvedComplaints.length / 3_600_000);
    }

    const byStatus = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, REOPENED: 0 };
    for (const row of byStatusRaw) byStatus[row.status] = row._count.id;

    const byCategory = { ELECTRICAL: 0, PLUMBING: 0, SECURITY: 0, CLEANING: 0, OTHER: 0 };
    for (const row of byCategoryRaw) byCategory[row.category] = row._count.id;

    return { total, byStatus, byCategory, overdue, avgResolutionHours };
  });

  return res.status(200).json(result);
};

/**
 * Recurring issues — flat+category pairs with ≥2 complaints in the last 60 days.
 */
export const getRecurringIssues = async (_req, res) => {
  const rows = await withCache(CACHE_KEYS.RECURRING_ISSUES, async () =>
    prisma.$queryRaw`
      SELECT
        u.flat_no                          AS "flatNo",
        c.category                         AS "category",
        COUNT(*)::int                      AS "count",
        MAX(c.created_at)                  AS "lastSeen"
      FROM complaints c
      JOIN users u ON u.id = c.user_id
      WHERE
        c.created_at >= NOW() - INTERVAL '60 days'
        AND u.flat_no IS NOT NULL
      GROUP BY u.flat_no, c.category
      HAVING COUNT(*) >= 2
      ORDER BY COUNT(*) DESC, MAX(c.created_at) DESC
      LIMIT 10
    `
  );

  return res.status(200).json(rows);
};

/**
 * Average resolution time per category.
 */
export const getResolutionByCategory = async (_req, res) => {
  const rows = await withCache(CACHE_KEYS.RESOLUTION_CATEGORY, async () =>
    prisma.$queryRaw`
      SELECT
        category,
        COUNT(*)::int                                                     AS "resolvedCount",
        ROUND(
          AVG(
            EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
          )::numeric,
          1
        )::float                                                          AS "avgHours"
      FROM complaints
      WHERE
        status    = 'RESOLVED'
        AND resolved_at IS NOT NULL
      GROUP BY category
      ORDER BY "avgHours" ASC
    `
  );

  return res.status(200).json(rows);
};

/**
 * Weekly trend — complaints raised + average resolution hours per week.
 */
export const getWeeklyTrend = async (_req, res) => {
  const result = await withCache(CACHE_KEYS.WEEKLY_TREND, async () => {
    const rows = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('week', created_at)                                    AS week_start,
        COUNT(*)::int                                                     AS complaints,
        ROUND(
          AVG(
            CASE
              WHEN resolved_at IS NOT NULL
              THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
            END
          )::numeric,
          1
        )::float                                                          AS "avgResolutionHours"
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

    return weeks.map((weekStart) => {
      const label = weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const match = rows.find(
        (r) => new Date(r.week_start).toDateString() === weekStart.toDateString(),
      );
      return {
        week:               label,
        complaints:         match?.complaints         ?? 0,
        avgResolutionHours: match?.avgResolutionHours ?? null,
      };
    });
  });

  return res.status(200).json(result);
};
