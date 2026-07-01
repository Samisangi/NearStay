import express from 'express';
import {
  createListing,
  searchListings,
  getOwnerListings,
  getListingById,
  updateListing,
  deleteListing,
} from '../controllers/listingController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public
router.get('/search', searchListings);
router.get('/owner/mine', protect, requireRole('owner'), getOwnerListings); // must be before /:id
router.get('/:id', getListingById);

// Owner-authenticated (mutating)
router.post('/', protect, requireRole('owner'), upload.array('photos', 10), createListing);
router.patch('/:id', protect, requireRole('owner'), upload.array('photos', 10), updateListing);
router.delete('/:id', protect, requireRole('owner'), deleteListing);

export default router;
