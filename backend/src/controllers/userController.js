import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// GET /api/users/me — returns the currently authenticated user's profile
export const getMe = asyncHandler(async (req, res) => {
  // req.user is already populated by the `protect` middleware
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

// PATCH /api/users/me — update name / phone / profilePicture (not email/password)
export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, profilePicture } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (profilePicture !== undefined) user.profilePicture = profilePicture;

  await user.save();

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePicture: user.profilePicture,
    },
  });
});
