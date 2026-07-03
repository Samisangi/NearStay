import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js';
import Inquiry from '../models/Inquiry.js';
import { io } from '../server.js';

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

/**
 * POST /api/messages/:inquiryId
 * REST fallback for sending a message (used when Socket.IO is unavailable).
 * The socket server also handles real-time delivery via 'send_message' event.
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) {
    res.status(400);
    throw new Error('Message text is required');
  }

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

  const message = await Message.create({
    inquiryId: req.params.inquiryId,
    senderId: req.user._id,
    text: text.trim(),
  });

  await message.populate('senderId', 'name profilePicture');

  // Broadcast to anyone already connected via Socket.IO
  try {
    io.to(req.params.inquiryId).emit('new_message', message);
  } catch {
    // Socket.IO not available — REST response is enough
  }

  res.status(201).json({ success: true, message });
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