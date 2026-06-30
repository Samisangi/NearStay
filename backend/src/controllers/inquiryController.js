import asyncHandler from 'express-async-handler';
import Inquiry from '../models/Inquiry.js';
import Listing from '../models/Listing.js';

export const createInquiry = asyncHandler(async (req, res) => {
  const { listingId, message } = req.body;
  const listing = await Listing.findById(listingId);
  if (!listing) { res.status(404); throw new Error('Listing not found'); }

  const inquiry = await Inquiry.create({
    listingId, message, seekerId: req.user._id, ownerId: listing.ownerId,
  });
  await Listing.findByIdAndUpdate(listingId, { $inc: { inquiryCount: 1 } });
  res.status(201).json({ success: true, inquiry });
});

export const getOwnerInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Inquiry.find({ ownerId: req.user._id })
    .populate('seekerId', 'name').populate('listingId', 'title').sort({ createdAt: -1 });
  res.json({ success: true, inquiries });
});

export const getSeekerInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Inquiry.find({ seekerId: req.user._id })
    .populate('listingId', 'title').sort({ createdAt: -1 });
  res.json({ success: true, inquiries });
});

export const updateInquiryStatus = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) { res.status(404); throw new Error('Not found'); }
  if (inquiry.ownerId.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Forbidden'); }
  inquiry.status = req.body.status;
  await inquiry.save();
  res.json({ success: true, inquiry });
});