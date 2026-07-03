import express from 'express';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  getAllTickets,
  replyToTicket,
  updateTicketStatus,
  deleteTicket,
} from '../controllers/supportController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Admin: get ALL tickets — must be before /:id
router.get('/all', protect, requireRole('admin'), getAllTickets);

// User routes
router.post('/', protect, createTicket);
router.get('/mine', protect, getMyTickets);
router.get('/:id', protect, getTicketById);

// Admin routes
router.patch('/:id/reply', protect, requireRole('admin'), replyToTicket);
router.patch('/:id/status', protect, requireRole('admin'), updateTicketStatus);
router.delete('/:id', protect, requireRole('admin'), deleteTicket);

export default router;