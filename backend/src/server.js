import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import supportRoutes from './routes/supportRoutes.js';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import { verifyAccessToken } from './utils/generateTokens.js';
import Message from './models/Message.js';
import Inquiry from './models/Inquiry.js';
import featuredAreaRoutes from './routes/featuredAreaRoutes.js';
dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded images as static files at /uploads/*
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/featured-areas', featuredAreaRoutes);
app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

// Auth middleware for Socket.IO
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
  socket.on('join_inquiry', async (inquiryId) => {
    try {
      const inquiry = await Inquiry.findById(inquiryId);
      if (!inquiry) return;
      const isParticipant =
        inquiry.seekerId.toString() === socket.userId ||
        inquiry.ownerId.toString() === socket.userId;
      if (!isParticipant) return;
      socket.join(inquiryId);
    } catch {}
  });

  socket.on('send_message', async ({ inquiryId, text }) => {
    try {
      if (!text?.trim()) return;
      const inquiry = await Inquiry.findById(inquiryId);
      if (!inquiry) return;
      const isParticipant =
        inquiry.seekerId.toString() === socket.userId ||
        inquiry.ownerId.toString() === socket.userId;
      if (!isParticipant) return;

      const message = await Message.create({
        inquiryId,
        senderId: socket.userId,
        text: text.trim(),
      });
      await message.populate('senderId', 'name profilePicture');
      io.to(inquiryId).emit('new_message', message);
    } catch {}
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`NearStay backend running on port ${PORT}`));

export { io };