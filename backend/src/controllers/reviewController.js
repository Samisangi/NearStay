import asyncHandler from 'express-async-handler';
import Review from '../models/Review.js';
import Listing from '../models/Listing.js';

export const createReview = asyncHandler(async (req, res) => {
  const { listingId, rating, comment } = req.body;

  const existing = await Review.findOne({ listingId, seekerId: req.user._id });
  if (existing) { res.status(400); throw new Error('You already reviewed this listing'); }

  const review = await Review.create({ listingId, rating, comment, seekerId: req.user._id });

  // Recalculate average on the listing
  const all = await Review.find({ listingId });
  const avg = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
  await Listing.findByIdAndUpdate(listingId, { averageRating: avg, reviewCount: all.length });

  res.status(201).json({ success: true, review });
});

export const getListingReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ listingId: req.params.listingId })
    .populate('seekerId', 'name profilePicture')
    .sort({ createdAt: -1 });
  res.json({ success: true, reviews });
});