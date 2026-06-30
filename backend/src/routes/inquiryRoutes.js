import express from 'express';
import { createInquiry, getOwnerInquiries, getSeekerInquiries, updateInquiryStatus } from '../controllers/inquiryController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.post('/', protect, requireRole('seeker'), createInquiry);
router.get('/owner', protect, requireRole('owner'), getOwnerInquiries);
router.get('/seeker', protect, requireRole('seeker'), getSeekerInquiries);
router.patch('/:id/status', protect, requireRole('owner'), updateInquiryStatus);
export default router;