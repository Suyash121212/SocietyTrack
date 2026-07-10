import cron from 'node-cron';
import { prisma } from '../db/prisma.js';

export const startOverdueCron = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[OverdueCron] Running overdue detection...');
    try {
      const config = await prisma.appConfig.findUnique({ where: { key: 'overdue_days' } });
      const overdueDays = config ? parseInt(config.value, 10) : 7;

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - overdueDays);

      const marked = await prisma.complaint.updateMany({
        where: {
          status: { not: 'RESOLVED' },
          createdAt: { lt: cutoff },
          isOverdue: false,
        },
        data: { isOverdue: true },
      });

      const cleared = await prisma.complaint.updateMany({
        where: {
          status: 'RESOLVED',
          isOverdue: true,
        },
        data: { isOverdue: false },
      });

      console.log(`[OverdueCron] Marked: ${marked.count}, Cleared: ${cleared.count}`);
    } catch (err) {
      console.error('[OverdueCron] Error:', err);
    }
  });
};
