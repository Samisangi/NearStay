import express from 'express';
import { getMessages, markAllRead } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.get('/:inquiryId', protect, getMessages);
router.patch('/:inquiryId/read', protect, markAllRead);
export default router;