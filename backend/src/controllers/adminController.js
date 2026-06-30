import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Listing from '../models/Listing.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password -refreshTokens').sort({ createdAt: -1 });
  res.json({ success: true, users });
});

export const getAllListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find()
    .populate('ownerId', 'name').sort({ createdAt: -1 });
  res.json({ success: true, listings });
});

export const updateListingStatus = asyncHandler(async (req, res) => {
  const listing = await Listing.findByIdAndUpdate(
    req.params.id, { status: req.body.status }, { new: true }
  );
  if (!listing) { res.status(404); throw new Error('Listing not found'); }
  res.json({ success: true, listing });
});

export const banUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id, { isBanned: req.body.isBanned }, { new: true }
  );
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, user });
});