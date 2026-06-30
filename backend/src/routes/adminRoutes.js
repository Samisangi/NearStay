import express from 'express';
import { getAllUsers, getAllListings, updateListingStatus, banUser } from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, requireRole('admin'));
router.get('/users', getAllUsers);
router.patch('/users/:id/ban', banUser);
router.get('/listings', getAllListings);
router.patch('/listings/:id/status', updateListingStatus);
export default router;