import { Router } from 'express';
import { createNotice, getAllNotices, deleteNotice } from '../controllers/notice.controller.js';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Public-authenticated: any logged in user
router.get('/notices', verifyToken, getAllNotices);

// Admin only
router.post('/admin/notices', verifyToken, requireAdmin, createNotice);
router.delete('/admin/notices/:id', verifyToken, requireAdmin, deleteNotice);

export default router;
