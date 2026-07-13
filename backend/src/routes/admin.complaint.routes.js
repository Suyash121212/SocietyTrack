import { Router } from 'express';
import {
  getAllComplaints,
  updateStatus,
  updatePriority,
  setOverdue,
  getDashboard,
  getWeeklyTrend,
  getRecurringIssues,
  getResolutionByCategory,
} from '../controllers/admin.complaint.controller.js';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken, requireAdmin);

// ── Dashboard / reporting ────────────────────────────────────────────────────
router.get('/dashboard',                     getDashboard);
router.get('/dashboard/weekly',              getWeeklyTrend);           
router.get('/dashboard/recurring',           getRecurringIssues);
router.get('/dashboard/resolution-by-category', getResolutionByCategory);

// ── Complaint management ─────────────────────────────────────────────────────
router.get('/complaints',                    getAllComplaints);
router.patch('/complaints/:id/status',       updateStatus);
router.patch('/complaints/:id/priority',     updatePriority);
router.patch('/complaints/:id/overdue',      setOverdue);

export default router;
