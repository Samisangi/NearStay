import express from 'express';
import {
  createListing,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
} from '../controllers/listingController.js';
import { searchListings } from '../controllers/searchController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { uploadListingPhotos, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

const withUpload = (req, res, next) => {
  uploadListingPhotos(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    next();
  });
};

router.get('/search', searchListings);
router.get('/owner/mine', protect, requireRole('owner'), getMyListings);

router.post('/', protect, requireRole('owner'), withUpload, createListing);
router.get('/:id', getListingById);
router.patch('/:id', protect, requireRole('owner'), withUpload, updateListing);
router.delete('/:id', protect, requireRole('owner'), deleteListing);

export default router;