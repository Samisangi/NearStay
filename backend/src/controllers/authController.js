import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  expiryStringToDate,
} from '../utils/generateTokens.js';
import sendEmail from '../utils/sendEmail.js';

const REFRESH_COOKIE_NAME = 'nearstay_refresh_token';

// Shared cookie options - httpOnly so frontend JS can never read this token.
// sameSite/secure tightened in production to guard against CSRF.
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, should match JWT_REFRESH_EXPIRY
};

/**
 * Issues a fresh access + refresh token pair, registers the refresh token
 * on the user's device list, and sets the refresh token as an httpOnly cookie.
 */
const issueTokens = async (user, req, res) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  const deviceInfo = req.headers['user-agent']?.slice(0, 200) || 'Unknown device';
  const expiresAt = expiryStringToDate(process.env.JWT_REFRESH_EXPIRY || '7d');

  user.addRefreshToken(refreshToken, deviceInfo, expiresAt);
  await user.save();

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
  return accessToken;
};

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // Only allow 'seeker' or 'owner' at signup - 'admin' must be set manually
  // in the DB, never through public registration.
  const safeRole = ['seeker', 'owner'].includes(role) ? role : 'seeker';

  const user = await User.create({ name, email, password, phone, role: safeRole });
  const accessToken = await issueTokens(user, req, res);

  res.status(201).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    },
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // .select() needed because password has select:false on the schema
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.isBanned) {
    res.status(403);
    throw new Error('This account has been banned');
  }

  const accessToken = await issueTokens(user, req, res);

  res.json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    },
  });
});

// POST /api/auth/refresh-token
// Reads the httpOnly cookie (not the body), validates it's still in the
// user's active session list, rotates it, and issues a new access token.
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE_NAME];
  if (!token) {
    res.status(401);
    throw new Error('No refresh token provided');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    res.status(401);
    throw new Error('Refresh token invalid or expired');
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user) {
    res.status(401);
    throw new Error('User no longer exists');
  }

  const sessionExists = user.refreshTokens.some((rt) => rt.token === token);
  if (!sessionExists) {
    // Token was valid JWT-wise but isn't a recognized active session -
    // e.g. user logged out on this device already, or it expired and was pruned.
    res.status(401);
    throw new Error('Session expired - please log in again');
  }

  // Rotate: remove the old token, issue a brand new pair. This limits the
  // damage window if a refresh token is ever stolen.
  user.removeRefreshToken(token);
  const accessToken = await issueTokens(user, req, res);

  res.json({ success: true, accessToken });
});

// POST /api/auth/logout
// Logs out the CURRENT device only - other devices stay logged in.
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE_NAME];

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.id).select('+refreshTokens');
      if (user) {
        user.removeRefreshToken(token);
        await user.save();
      }
    } catch {
      // Token already invalid/expired - nothing to clean up, fall through.
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
  res.json({ success: true, message: 'Logged out' });
});

// POST /api/auth/logout-all
// Logs out every device for the current user (e.g. "sign out everywhere" button).
export const logoutAll = asyncHandler(async (req, res) => {
  req.user.refreshTokens = [];
  await req.user.save();
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
  res.json({ success: true, message: 'Logged out of all devices' });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way whether or not the email exists, so this
  // endpoint can't be used to enumerate registered emails.
  const genericResponse = {
    success: true,
    message: 'If that email is registered, a reset link has been sent.',
  };

  if (!user) return res.json(genericResponse);

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'NearStay - Password Reset',
    html: `<p>You requested a password reset.</p>
           <p><a href="${resetUrl}">Click here to reset your password</a> (valid for 30 minutes).</p>
           <p>If you didn't request this, ignore this email.</p>`,
  });

  res.json(genericResponse);
});

// POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Reset link is invalid or has expired');
  }

  user.password = password; // re-hashed automatically by the pre-save hook
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshTokens = []; // invalidate all existing sessions for security
  await user.save();

  res.json({ success: true, message: 'Password reset successful - please log in' });
});
