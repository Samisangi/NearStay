import express from 'express';
import {
  createInquiry,
  getOwnerInquiries,
  getSeekerInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
} from '../controllers/inquiryController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, requireRole('seeker'), createInquiry);
router.get('/owner', protect, requireRole('owner'), getOwnerInquiries);
router.get('/seeker', protect, requireRole('seeker'), getSeekerInquiries);
router.get('/:id', protect, getInquiryById);
router.patch('/:id/status', protect, requireRole('owner'), updateInquiryStatus);
router.delete('/:id', protect, deleteInquiry);

export default router;