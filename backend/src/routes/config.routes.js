import { Router } from 'express';
import {
  getOverdueDays,
  updateOverdueDays,
  getReopenDays,
  updateReopenDays,
  getSlaMatrix,
  upsertSlaPolicy,
} from '../controllers/config.controller.js';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken, requireAdmin);

router.get('/config/overdue-days',  getOverdueDays);
router.put('/config/overdue-days',  updateOverdueDays);
router.get('/config/reopen-days',   getReopenDays);
router.put('/config/reopen-days',   updateReopenDays);
router.get('/config/sla',           getSlaMatrix);
router.put('/config/sla',           upsertSlaPolicy);

export default router;
