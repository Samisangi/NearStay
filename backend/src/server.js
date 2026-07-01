import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { verifyAccessToken } from './utils/generateTokens.js';
import Message from './models/Message.js';
import Inquiry from './models/Inquiry.js';
dotenv.config();
connectDB();

const app = express();

// --- Core middleware ---
app.use(
  cors({
    origin: process.env.CLIENT_URL, // e.g. http://localhost:5173
    credentials: true, // required so the refresh-token httpOnly cookie is sent
  })
);
app.use(express.json());
app.use(cookieParser());

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

// --- Error handler (must be last, after all routes) ---
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Wrap in an HTTP server (not app.listen directly) so Socket.IO can attach
// to the same server instance for the optional real-time chat feature.
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});


io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded = verifyAccessToken(token);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Join a chat room keyed by inquiryId
  socket.on('join_inquiry', async (inquiryId) => {
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) return;
    const isParticipant =
      inquiry.seekerId.toString() === socket.userId ||
      inquiry.ownerId.toString() === socket.userId;
    if (!isParticipant) return;
    socket.join(inquiryId);
  });

  socket.on('send_message', async ({ inquiryId, text }) => {
    if (!text?.trim()) return;
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) return;
    const isParticipant =
      inquiry.seekerId.toString() === socket.userId ||
      inquiry.ownerId.toString() === socket.userId;
    if (!isParticipant) return;

    const message = await Message.create({
      inquiryId, senderId: socket.userId, text: text.trim(),
    });
    await message.populate('senderId', 'name profilePicture');

    // Emit to everyone in the room (both participants)
    io.to(inquiryId).emit('new_message', message);
  });

  socket.on('disconnect', () => {});
});
server.listen(PORT, () => {
  console.log(`NearStay backend running on port ${PORT}`);
});

export { io };
