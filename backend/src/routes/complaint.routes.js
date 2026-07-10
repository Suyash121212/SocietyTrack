import { Router } from 'express';
import { createComplaint, getMyComplaints, getComplaintById } from '../controllers/complaint.controller.js';
import { verifyToken, requireResident } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/', verifyToken, requireResident, upload.single('photo'), createComplaint);
router.get('/my', verifyToken, requireResident, getMyComplaints);
router.get('/:id', verifyToken, getComplaintById);

export default router;
