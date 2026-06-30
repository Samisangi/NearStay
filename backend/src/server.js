import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
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
// app.use('/api/listings', listingRoutes);
 app.use('/api/favorites', favoriteRoutes);
 app.use('/api/inquiries', inquiryRoutes);
// app.use('/api/reviews', reviewRoutes);
// app.use('/api/admin', adminRoutes);

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

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`NearStay backend running on port ${PORT}`);
});

export { io };
