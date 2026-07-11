import { Router } from 'express';
import {
  getAllComplaints,
  updateStatus,
  updatePriority,
  setOverdue,
  getDashboard,
  getWeeklyStats,
} from '../controllers/admin.complaint.controller.js';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(verifyToken, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboard);
router.get('/dashboard/weekly', getWeeklyStats);

// Complaint management
router.get('/complaints', getAllComplaints);
router.patch('/complaints/:id/status', updateStatus);
router.patch('/complaints/:id/priority', updatePriority);
router.patch('/complaints/:id/overdue', setOverdue);

export default router;
