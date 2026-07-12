import { Router } from 'express';
import {
  getOverdueDays,
  updateOverdueDays,
  getReopenDays,
  updateReopenDays,
} from '../controllers/config.controller.js';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken, requireAdmin);

router.get('/config/overdue-days',     getOverdueDays);
router.put('/config/overdue-days',     updateOverdueDays);
router.get('/config/reopen-days',      getReopenDays);
router.put('/config/reopen-days',      updateReopenDays);

export default router;
