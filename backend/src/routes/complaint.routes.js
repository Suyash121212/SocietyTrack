import { Router } from 'express';
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  reopenComplaint,
} from '../controllers/complaint.controller.js';
import { verifyToken, requireResident } from '../middleware/auth.middleware.js';
import { uploadPhotos } from '../middleware/upload.middleware.js';

const router = Router();

// Up to 3 photos under the field name "photos"
router.post('/',            verifyToken, requireResident, uploadPhotos.array('photos', 3), createComplaint);
router.get('/my',           verifyToken, requireResident, getMyComplaints);
router.get('/:id',          verifyToken, getComplaintById);
router.patch('/:id/reopen', verifyToken, requireResident, reopenComplaint);

export default router;
