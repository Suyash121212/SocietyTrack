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
 *   4. hard-coded fallback of 7
 */
const resolveThreshold = (slaPolicies, globalDays, category, priority) => {
  // Exact match
  const exact = slaPolicies.find(
    (p) => p.category === category && p.priority === priority,
  );
  if (exact) return exact.thresholdDays;

  // Category default (priority = null row)
  const catDefault = slaPolicies.find(
    (p) => p.category === category && p.priority === null,
  );
  if (catDefault) return catDefault.thresholdDays;

  return globalDays;
};

export const startOverdueCron = () => {
  // Run at the top of every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[OverdueCron] Running SLA-aware overdue detection…');
    try {
      // Load all config in one pass
      const [slaPolicies, globalConfig] = await Promise.all([
        prisma.slaPolicy.findMany(),
        prisma.appConfig.findUnique({ where: { key: 'overdue_days' } }),
      ]);
      const globalDays = globalConfig ? parseInt(globalConfig.value, 10) : 7;

      // Fetch all active (non-resolved) complaints
      const active = await prisma.complaint.findMany({
        where: { status: { notIn: ['RESOLVED'] } },
        select: {
          id:        true,
          category:  true,
          priority:  true,
          isOverdue: true,
          createdAt: true,
        },
      });

      const now = Date.now();
      let markedCount     = 0;
      let escalatedCount  = 0;

      for (const complaint of active) {
        const thresholdDays = resolveThreshold(
          slaPolicies,
          globalDays,
          complaint.category,
          complaint.priority,
        );
        const thresholdMs = thresholdDays * 86_400_000;
        const age = now - new Date(complaint.createdAt).getTime();

        if (age > thresholdMs && !complaint.isOverdue) {
          // ── Mark overdue ──────────────────────────────────────────────────
          const newPriority = ESCALATE[complaint.priority] ?? 'MEDIUM';
          const didEscalate = complaint.priority !== newPriority;

          await prisma.complaint.update({
            where: { id: complaint.id },
            data: {
              isOverdue: true,
              // Auto-bump priority if not already HIGH
              ...(didEscalate ? { priority: newPriority } : {}),
            },
          });

          // ── Append system audit row ───────────────────────────────────────
          // changedBy = null signals a system action; the timeline renders this
          // as "System" so residents and admins know why the priority changed.
          await prisma.statusHistory.create({
            data: {
              complaintId: complaint.id,
              changedBy:   null,
              oldStatus:   complaint.status,   // status doesn't change, but we still
              newStatus:   complaint.status,   // record the event for the audit log
              note: didEscalate
                ? `Auto-escalated by system: SLA of ${thresholdDays}d exceeded. Priority bumped ${complaint.priority ?? 'unset'} → ${newPriority}.`
                : `Auto-flagged overdue by system: SLA of ${thresholdDays}d exceeded.`,
            },
          });

          markedCount++;
          if (didEscalate) escalatedCount++;
        }
      }

      // ── Clear overdue flag on anything now resolved ────────────────────────
      const cleared = await prisma.complaint.updateMany({
        where:  { status: 'RESOLVED', isOverdue: true },
        data:   { isOverdue: false },
      });

      console.log(
        `[OverdueCron] Marked: ${markedCount} | Escalated: ${escalatedCount} | Cleared: ${cleared.count}`,
      );
    } catch (err) {
      console.error('[OverdueCron] Error:', err);
    }
  });
};
