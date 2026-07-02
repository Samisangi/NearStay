import express from 'express';
import { getMe, updateMe, changePassword } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { uploadProfilePicture, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.get('/me', protect, getMe);

router.patch(
  '/me',
  protect,
  (req, res, next) => uploadProfilePicture(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    next();
  }),
  updateMe
);

router.patch('/me/password', protect, changePassword);

export default router;