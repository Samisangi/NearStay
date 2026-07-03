import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../middleware/upload.js';
import sendEmail from '../utils/sendEmail.js';

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

// Admin: broadcast email announcement to users by role
export const broadcastAnnouncement = asyncHandler(async (req, res) => {
  const { target, subject, message } = req.body;

  if (!subject?.trim() || !message?.trim()) {
    res.status(400);
    throw new Error('Subject and message are required');
  }

  // Build role filter — 'all' means everyone except admins
  const roleFilter = target === 'all'
    ? { role: { $in: ['seeker', 'owner'] } }
    : { role: target };

  const recipients = await User.find({ ...roleFilter, isBanned: false })
    .select('name email');

  if (recipients.length === 0) {
    return res.json({ success: true, sent: 0, message: 'No matching recipients found.' });
  }

  // Send emails in parallel (fire-and-forget errors per recipient)
  await Promise.allSettled(
    recipients.map((user) =>
      sendEmail({
        to: user.email,
        subject: `NearStay — ${subject.trim()}`,
        html: `
          <p>Hi ${user.name},</p>
          <div style="white-space:pre-wrap;">${message.trim()}</div>
          <br/>
          <p>The NearStay Team</p>
        `,
      })
    )
  );

  res.json({ success: true, sent: recipients.length });
});