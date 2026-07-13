import cron from 'node-cron';
import { prisma } from '../db/prisma.js';

// Priority escalation ladder — bumps one level up, stops at HIGH
const ESCALATE = { LOW: 'MEDIUM', MEDIUM: 'HIGH', HIGH: 'HIGH' };

/**
 * Resolve the SLA threshold (days) for a given category + priority.
 *
 * Lookup order (most specific → least specific):
 *   1. sla_policies row for exact category + priority
 *   2. sla_policies row for category with priority = null (category default)
 *   3. global overdue_days from app_config
 */
const resolveThreshold = (slaPolicies, globalDays, category, priority) => {
  const exact = slaPolicies.find(
    (p) => p.category === category && p.priority === priority,
  );
  if (exact) return exact.thresholdDays;

  const catDefault = slaPolicies.find(
    (p) => p.category === category && p.priority === null,
  );
  if (catDefault) return catDefault.thresholdDays;

  return globalDays;
};

export const startOverdueCron = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[OverdueCron] Running SLA-aware overdue detection…');
    try {
      // ── Load all config in one pass ─────────────────────────────────────
      const [slaPolicies, globalConfig] = await Promise.all([
        prisma.slaPolicy.findMany(),
        prisma.appConfig.findUnique({ where: { key: 'overdue_days' } }),
      ]);
      const globalDays = globalConfig ? parseInt(globalConfig.value, 10) : 7;

      // ── Fetch all active complaints in one query ─────────────────────────
      const active = await prisma.complaint.findMany({
        where:  { status: { notIn: ['RESOLVED'] } },
        select: { id: true, category: true, priority: true, status: true,
                  isOverdue: true, createdAt: true },
      });

      const now = Date.now();

      // ── Classify without touching the DB ────────────────────────────────
      // Bucket A: needs is_overdue = true, priority unchanged
      // Bucket B: needs is_overdue = true, priority bumped (group by new priority)
      // All audit rows collected into one array for createMany at the end.

      const overdueOnlyIds    = [];           // bucket A IDs
      const escalateGroups    = {};           // { 'MEDIUM': [id,…], 'HIGH': [id,…] }
      const auditRows         = [];           // all StatusHistory rows to insert

      for (const c of active) {
        const thresholdDays = resolveThreshold(slaPolicies, globalDays, c.category, c.priority);
        const age = now - new Date(c.createdAt).getTime();

        if (age > thresholdDays * 86_400_000 && !c.isOverdue) {
          const newPriority  = ESCALATE[c.priority] ?? 'MEDIUM';
          const didEscalate  = c.priority !== newPriority;

          if (didEscalate) {
            if (!escalateGroups[newPriority]) escalateGroups[newPriority] = [];
            escalateGroups[newPriority].push(c.id);
            auditRows.push({
              complaintId: c.id,
              changedBy:   null,
              oldStatus:   c.status,
              newStatus:   c.status,
              note: `Auto-escalated by system: SLA of ${thresholdDays}d exceeded. Priority bumped ${c.priority ?? 'unset'} → ${newPriority}.`,
            });
          } else {
            overdueOnlyIds.push(c.id);
            auditRows.push({
              complaintId: c.id,
              changedBy:   null,
              oldStatus:   c.status,
              newStatus:   c.status,
              note: `Auto-flagged overdue by system: SLA of ${thresholdDays}d exceeded.`,
            });
          }
        }
      }

      // ── Batch writes — fixed number of queries regardless of N ───────────
      const writes = [];

      // Bucket A: mark overdue, no priority change
      if (overdueOnlyIds.length) {
        writes.push(
          prisma.complaint.updateMany({
            where: { id: { in: overdueOnlyIds } },
            data:  { isOverdue: true },
          }),
        );
      }

      // Bucket B: mark overdue + bump priority (one updateMany per target priority)
      for (const [newPriority, ids] of Object.entries(escalateGroups)) {
        writes.push(
          prisma.complaint.updateMany({
            where: { id: { in: ids } },
            data:  { isOverdue: true, priority: newPriority },
          }),
        );
      }

      // All audit rows in one INSERT
      if (auditRows.length) {
        writes.push(prisma.statusHistory.createMany({ data: auditRows }));
      }

      // Clear resolved complaints' overdue flag
      writes.push(
        prisma.complaint.updateMany({
          where: { status: 'RESOLVED', isOverdue: true },
          data:  { isOverdue: false },
        }),
      );

      // Fire all writes concurrently — they touch disjoint rows so no conflicts
      const results = await Promise.all(writes);
      const cleared = results.at(-1); // last write is always the clear

      const markedCount    = overdueOnlyIds.length +
        Object.values(escalateGroups).reduce((s, ids) => s + ids.length, 0);
      const escalatedCount = Object.values(escalateGroups).reduce((s, ids) => s + ids.length, 0);

      // Cache is now stale — invalidate so the dashboard reflects new counts
      const { invalidateDashboardCache } = await import('./cache.js');
      invalidateDashboardCache();

      console.log(
        `[OverdueCron] Marked: ${markedCount} | Escalated: ${escalatedCount} | Cleared: ${cleared.count} | DB writes: ${writes.length}`,
      );
    } catch (err) {
      console.error('[OverdueCron] Error:', err);
    }
  });
};
