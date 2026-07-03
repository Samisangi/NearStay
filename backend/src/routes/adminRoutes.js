import express from 'express';
import {
  getAllUsers,
  getAllListings,
  updateListingStatus,
  banUser,
  deleteListingAdmin,
  uploadAdminAsset,
  broadcastAnnouncement,
} from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = express.Router();
router.use(protect, requireRole('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/ban', banUser);

router.get('/listings', getAllListings);
router.patch('/listings/:id/status', updateListingStatus);
router.delete('/listings/:id', deleteListingAdmin);

router.post('/announce', broadcastAnnouncement);

router.post(
  '/upload',
  (req, res, next) => uploadSingle(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    next();
  }),
  uploadAdminAsset
);

export default router;