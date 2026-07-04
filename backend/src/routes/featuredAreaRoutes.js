import express from 'express';
import {
  getActiveFeaturedAreas,
  getAllFeaturedAreas,
  createFeaturedArea,
  updateFeaturedArea,
  deleteFeaturedArea,
} from '../controllers/featuredAreaController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getActiveFeaturedAreas); // public
router.get('/all', protect, requireRole('admin'), getAllFeaturedAreas);
router.post('/', protect, requireRole('admin'), createFeaturedArea);
router.patch('/:id', protect, requireRole('admin'), updateFeaturedArea);
router.delete('/:id', protect, requireRole('admin'), deleteFeaturedArea);

export default router;