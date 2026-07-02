import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js';
import Inquiry from '../models/Inquiry.js';

export const getMessages = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.inquiryId);
  if (!inquiry) {
    res.status(404);
    throw new Error('Thread not found');
  }

  const isParticipant =
    inquiry.seekerId.toString() === req.user._id.toString() ||
    inquiry.ownerId.toString() === req.user._id.toString();

  if (!isParticipant) {
    res.status(403);
    throw new Error('Forbidden');
  }

  const messages = await Message.find({ inquiryId: req.params.inquiryId })
    .populate('senderId', 'name profilePicture')
    .sort({ createdAt: 1 });

  // Mark all messages as read by this user
  await Message.updateMany(
    {
      inquiryId: req.params.inquiryId,
      readBy: { $ne: req.user._id },
    },
    { $addToSet: { readBy: req.user._id } }
  );

  res.json({ success: true, messages });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.inquiryId);
  if (!inquiry) {
    res.status(404);
    throw new Error('Not found');
  }

  const isParticipant =
    inquiry.seekerId.toString() === req.user._id.toString() ||
    inquiry.ownerId.toString() === req.user._id.toString();

  if (!isParticipant) {
    res.status(403);
    throw new Error('Forbidden');
  }

  await Message.updateMany(
    { inquiryId: req.params.inquiryId, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  res.json({ success: true });
});