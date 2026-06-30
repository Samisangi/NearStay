import express from 'express';
import { addFavorite, removeFavorite, getFavorites } from '../controllers/favoriteController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, requireRole('seeker'));
router.get('/', getFavorites);
router.post('/:listingId', addFavorite);
router.delete('/:listingId', removeFavorite);
export default router;