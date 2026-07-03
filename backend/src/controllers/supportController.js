import asyncHandler from 'express-async-handler';
import Support from '../models/Support.js';
import sendEmail from '../utils/sendEmail.js';
import User from '../models/User.js';

// User submits a ticket
export const createTicket = asyncHandler(async (req, res) => {
  const { subject, category, message, relatedListingId } = req.body;

  if (!subject?.trim() || !message?.trim()) {
    res.status(400);
    throw new Error('Subject and message are required');
  }

  const ticket = await Support.create({
    userId: req.user._id,
    subject: subject.trim(),
    category: category || 'other',
    message: message.trim(),
    relatedListingId: relatedListingId || undefined,
  });

  // Notify user by email
  try {
    await sendEmail({
      to: req.user.email,
      subject: `NearStay Support — Ticket #${ticket._id.toString().slice(-6).toUpperCase()} received`,
      html: `
        <p>Hi ${req.user.name},</p>
        <p>We've received your support request and will get back to you within 24 hours.</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Category:</strong> ${ticket.category}</p>
        <p><strong>Your message:</strong><br/>${ticket.message}</p>
        <br/>
        <p>The NearStay Team</p>
      `,
    });
  } catch {}

  res.status(201).json({ success: true, ticket });
});

// User gets their own tickets
export const getMyTickets = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = { userId: req.user._id };
  if (status) filter.status = status;

  const total = await Support.countDocuments(filter);
  const tickets = await Support.find(filter)
    .populate('relatedListingId', 'title coverPhoto')
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  res.json({ success: true, tickets, total, page: parseInt(page) });
});

// User gets single ticket
export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Support.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('relatedListingId', 'title coverPhoto');

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (ticket.userId._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Forbidden');
  }

  res.json({ success: true, ticket });
});

// Admin: get all tickets
export const getAllTickets = asyncHandler(async (req, res) => {
  const { status, priority, category, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  const total = await Support.countDocuments(filter);
  const tickets = await Support.find(filter)
    .populate('userId', 'name email role profilePicture')
    .populate('relatedListingId', 'title')
    .sort({ priority: -1, createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  res.json({ success: true, tickets, total, page: parseInt(page) });
});

// Admin: reply to ticket
export const replyToTicket = asyncHandler(async (req, res) => {
  const { adminReply, status, priority } = req.body;

  if (!adminReply?.trim()) {
    res.status(400);
    throw new Error('Reply message is required');
  }

  const ticket = await Support.findById(req.params.id)
    .populate('userId', 'name email');

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  ticket.adminReply = adminReply.trim();
  ticket.adminId = req.user._id;
  ticket.repliedAt = new Date();
  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;

  await ticket.save();

  // Email the user with admin reply
  try {
    await sendEmail({
      to: ticket.userId.email,
      subject: `NearStay Support — Reply to your ticket #${ticket._id.toString().slice(-6).toUpperCase()}`,
      html: `
        <p>Hi ${ticket.userId.name},</p>
        <p>Our support team has replied to your ticket:</p>
        <p><strong>Your subject:</strong> ${ticket.subject}</p>
        <hr/>
        <p><strong>Admin reply:</strong><br/>${adminReply}</p>
        <hr/>
        <p><strong>Ticket status:</strong> ${ticket.status}</p>
        <br/>
        <p>Log in to NearStay to view your ticket details.</p>
        <p>The NearStay Team</p>
      `,
    });
  } catch {}

  res.json({ success: true, ticket });
});

// Admin: update ticket status/priority only
export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status, priority } = req.body;

  const ticket = await Support.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  await ticket.save();

  res.json({ success: true, ticket });
});

// Admin: delete ticket
export const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Support.findByIdAndDelete(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  res.json({ success: true, message: 'Ticket deleted' });
});