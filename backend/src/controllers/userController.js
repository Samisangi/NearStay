import asyncHandler from 'express-async-handler';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../middleware/upload.js';
import User from '../models/User.js';

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      profilePicture: req.user.profilePicture,
    },
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;

  // Handle profile picture upload
  if (req.file) {
    // Delete old picture from Cloudinary if it exists
    if (req.user.profilePicture) {
      await deleteFromCloudinary(req.user.profilePicture);
    }
    req.user.profilePicture = await uploadBufferToCloudinary(
      req.file.buffer,
      'nearstay/profiles'
    );
  }

  await req.user.save();

  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      profilePicture: req.user.profilePicture,
    },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Both current and new password are required');
  }

  const user = await User.findById(req.user._id).select('+password');
  const match = await user.comparePassword(currentPassword);
  if (!match) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('New password must be at least 8 characters');
  }

  user.password = newPassword; // pre-save hook rehashes it
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});