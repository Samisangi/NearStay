import asyncHandler from 'express-async-handler';
import Favorite from '../models/Favorite.js';
import Listing from '../models/Listing.js';

export const addFavorite = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const existing = await Favorite.findOne({ seekerId: req.user._id, listingId });
  if (!existing) await Favorite.create({ seekerId: req.user._id, listingId });
  res.json({ success: true });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  await Favorite.deleteOne({ seekerId: req.user._id, listingId: req.params.listingId });
  res.json({ success: true });
});

export const getFavorites = asyncHandler(async (req, res) => {
  const favs = await Favorite.find({ seekerId: req.user._id }).populate('listingId');
  const listings = favs.map((f) => f.listingId).filter(Boolean);
  res.json({ success: true, listings });
});