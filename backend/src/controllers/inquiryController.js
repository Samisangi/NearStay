import asyncHandler from 'express-async-handler';
import Inquiry from '../models/Inquiry.js';
import Listing from '../models/Listing.js';

export const createInquiry = asyncHandler(async (req, res) => {
  const { listingId, message } = req.body;
  if (!listingId || !message) {
    res.status(400); throw new Error('listingId and message are required');
  }
  const listing = await Listing.findById(listingId);
  if (!listing) { res.status(404); throw new Error('Listing not found'); }

  // Prevent duplicate inquiry from same seeker on same listing
  const existing = await Inquiry.findOne({ listingId, seekerId: req.user._id });
  if (existing) {
    return res.json({ success: true, inquiry: existing, existed: true });
  }

  const inquiry = await Inquiry.create({
    listingId,
    message,
    seekerId: req.user._id,
    ownerId: listing.ownerId,
  });

  await Listing.findByIdAndUpdate(listingId, { $inc: { inquiryCount: 1 } });
  res.status(201).json({ success: true, inquiry });
});

export const getOwnerInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Inquiry.find({ ownerId: req.user._id })
    .populate('seekerId', 'name email phone profilePicture')
    .populate('listingId', 'title coverPhoto rent')
    .sort({ createdAt: -1 });
  res.json({ success: true, inquiries });
});

export const getSeekerInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Inquiry.find({ seekerId: req.user._id })
    .populate('listingId', 'title coverPhoto rent address')
    .populate('ownerId', 'name phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, inquiries });
});

export const updateInquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'responded', 'closed'].includes(status)) {
    res.status(400); throw new Error('Invalid status');
  }
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) { res.status(404); throw new Error('Inquiry not found'); }
  if (inquiry.ownerId.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Forbidden');
  }
  inquiry.status = status;
  await inquiry.save();
  res.json({ success: true, inquiry });
});

export const getInquiryById = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id)
    .populate('seekerId', 'name profilePicture')
    .populate('ownerId', 'name profilePicture')
    .populate('listingId', 'title coverPhoto');
  if (!inquiry) { res.status(404); throw new Error('Not found'); }

  const isParticipant =
    inquiry.seekerId._id.toString() === req.user._id.toString() ||
    inquiry.ownerId._id.toString() === req.user._id.toString();
  if (!isParticipant) { res.status(403); throw new Error('Forbidden'); }

  res.json({ success: true, inquiry });
});