import asyncHandler from 'express-async-handler';
import Favorite from '../models/Favorite.js';
import Listing from '../models/Listing.js';

export const addFavorite = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const listing = await Listing.findById(listingId);
  if (!listing) { res.status(404); throw new Error('Listing not found'); }
  try {
    await Favorite.create({ seekerId: req.user._id, listingId });
  } catch (e) {
    if (e.code !== 11000) throw e; // ignore duplicate
  }
  res.json({ success: true });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  await Favorite.deleteOne({ seekerId: req.user._id, listingId: req.params.listingId });
  res.json({ success: true });
});

export const getFavorites = asyncHandler(async (req, res) => {
  const favs = await Favorite.find({ seekerId: req.user._id })
    .populate({
      path: 'listingId',
      populate: { path: 'ownerId', select: 'name' },
    });
  const listings = favs.map((f) => f.listingId).filter(Boolean);
  res.json({ success: true, listings });
});

export const getFavoriteIds = asyncHandler(async (req, res) => {
  const favs = await Favorite.find({ seekerId: req.user._id }).select('listingId');
  res.json({ success: true, ids: favs.map((f) => f.listingId.toString()) });
});