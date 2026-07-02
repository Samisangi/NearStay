import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../middleware/upload.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('-password -refreshTokens')
    .sort({ createdAt: -1 });
  res.json({ success: true, users });
});

export const getAllListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find()
    .populate('ownerId', 'name email')
    .sort({ createdAt: -1 });
  res.json({ success: true, listings });
});

export const updateListingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'rented', 'inactive'].includes(status)) {
    res.status(400); throw new Error('Invalid status');
  }
  const listing = await Listing.findByIdAndUpdate(
    req.params.id, { status }, { new: true }
  );
  if (!listing) { res.status(404); throw new Error('Listing not found'); }
  res.json({ success: true, listing });
});

export const banUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'admin') { res.status(403); throw new Error('Cannot ban an admin'); }
  user.isBanned = req.body.isBanned;
  if (req.body.isBanned) {
    // Invalidate all sessions on ban
    user.refreshTokens = [];
  }
  await user.save();
  res.json({ success: true, user: { id: user._id, name: user.name, isBanned: user.isBanned } });
});

export const deleteListingAdmin = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) { res.status(404); throw new Error('Listing not found'); }
  await Promise.all(listing.photos.map((url) => deleteFromCloudinary(url)));
  await listing.deleteOne();
  res.json({ success: true, message: 'Listing deleted by admin' });
});

// Admin can upload a support/banner image
export const uploadAdminAsset = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No file provided'); }
  const url = await uploadBufferToCloudinary(req.file.buffer, 'nearstay/admin');
  res.json({ success: true, url });
});