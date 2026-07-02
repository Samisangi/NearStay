import asyncHandler from 'express-async-handler';
import Inquiry from '../models/Inquiry.js';
import Listing from '../models/Listing.js';
import Message from '../models/Message.js';

export const createInquiry = asyncHandler(async (req, res) => {
  const { listingId, message } = req.body;

  if (!listingId || !message?.trim()) {
    res.status(400);
    throw new Error('listingId and message are required');
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  if (listing.ownerId.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot inquire about your own listing');
  }

  // Return existing thread if already contacted
  const existing = await Inquiry.findOne({
    listingId,
    seekerId: req.user._id,
  })
    .populate('listingId', 'title coverPhoto rent address')
    .populate('ownerId', 'name profilePicture phone');

  if (existing) {
    return res.json({ success: true, inquiry: existing, existed: true });
  }

  const inquiry = await Inquiry.create({
    listingId,
    message: message.trim(),
    seekerId: req.user._id,
    ownerId: listing.ownerId,
  });

  // Save first message to the Message collection for chat history
  await Message.create({
    inquiryId: inquiry._id,
    senderId: req.user._id,
    text: message.trim(),
  });

  await Listing.findByIdAndUpdate(listingId, { $inc: { inquiryCount: 1 } });

  await inquiry.populate('listingId', 'title coverPhoto rent address');
  await inquiry.populate('ownerId', 'name profilePicture phone');
  await inquiry.populate('seekerId', 'name profilePicture');

  res.status(201).json({ success: true, inquiry });
});

export const getOwnerInquiries = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { ownerId: req.user._id };
  if (status) filter.status = status;

  const total = await Inquiry.countDocuments(filter);
  const inquiries = await Inquiry.find(filter)
    .populate('seekerId', 'name email phone profilePicture')
    .populate('listingId', 'title coverPhoto rent address')
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  // Attach latest message and unread count to each inquiry
  const enriched = await Promise.all(
    inquiries.map(async (inq) => {
      const latestMsg = await Message.findOne({ inquiryId: inq._id })
        .sort({ createdAt: -1 })
        .select('text createdAt senderId');
      const unreadCount = await Message.countDocuments({
        inquiryId: inq._id,
        senderId: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      });
      return { ...inq.toObject(), latestMessage: latestMsg, unreadCount };
    })
  );

  res.json({
    success: true,
    inquiries: enriched,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

export const getSeekerInquiries = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { seekerId: req.user._id };
  if (status) filter.status = status;

  const total = await Inquiry.countDocuments(filter);
  const inquiries = await Inquiry.find(filter)
    .populate('listingId', 'title coverPhoto rent address status')
    .populate('ownerId', 'name profilePicture phone')
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const enriched = await Promise.all(
    inquiries.map(async (inq) => {
      const latestMsg = await Message.findOne({ inquiryId: inq._id })
        .sort({ createdAt: -1 })
        .select('text createdAt senderId');
      return { ...inq.toObject(), latestMessage: latestMsg };
    })
  );

  res.json({
    success: true,
    inquiries: enriched,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

export const getInquiryById = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id)
    .populate('seekerId', 'name profilePicture email phone')
    .populate('ownerId', 'name profilePicture phone')
    .populate('listingId', 'title coverPhoto rent address location');

  if (!inquiry) {
    res.status(404);
    throw new Error('Inquiry not found');
  }

  const isParticipant =
    inquiry.seekerId._id.toString() === req.user._id.toString() ||
    inquiry.ownerId._id.toString() === req.user._id.toString();

  if (!isParticipant) {
    res.status(403);
    throw new Error('Forbidden');
  }

  res.json({ success: true, inquiry });
});

export const updateInquiryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'responded', 'closed'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status value');
  }

  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    res.status(404);
    throw new Error('Inquiry not found');
  }

  if (inquiry.ownerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the owner can update inquiry status');
  }

  inquiry.status = status;
  await inquiry.save();

  res.json({ success: true, inquiry });
});

export const deleteInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    res.status(404);
    throw new Error('Inquiry not found');
  }

  const isParticipant =
    inquiry.seekerId.toString() === req.user._id.toString() ||
    inquiry.ownerId.toString() === req.user._id.toString();

  if (!isParticipant) {
    res.status(403);
    throw new Error('Forbidden');
  }

  // Delete all messages in this thread
  await Message.deleteMany({ inquiryId: inquiry._id });
  await inquiry.deleteOne();

  res.json({ success: true, message: 'Inquiry deleted' });
});