import asyncHandler from 'express-async-handler';
import { verifyAccessToken } from '../utils/generateTokens.js';
import User from '../models/User.js';

/**
 * Verifies the access token from the Authorization header and attaches
 * the user (minus password/refreshTokens) to req.user.
 * Expects: Authorization: Bearer <accessToken>
 */
export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized - no token provided');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    // Expired tokens are expected and common - frontend should catch this
    // 401 and call /api/auth/refresh-token automatically (see axios interceptor).
    res.status(401);
    throw new Error('Access token invalid or expired');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('User no longer exists');
  }

  if (user.isBanned) {
    res.status(403);
    throw new Error('This account has been banned');
  }

  req.user = user; // password/refreshTokens excluded by select:false on the schema
  next();
});

// Role-based access control - use after `protect`.
// Usage: router.post('/listings', protect, requireRole('owner'), createListing)
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Access denied - requires role: ${allowedRoles.join(' or ')}`);
    }
    next();
  };
};
