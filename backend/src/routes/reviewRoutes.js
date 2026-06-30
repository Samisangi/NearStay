import express from 'express';
import { createReview, getListingReviews } from '../controllers/reviewController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.post('/', protect, requireRole('seeker'), createReview);
router.get('/listing/:listingId', getListingReviews);
export default router;