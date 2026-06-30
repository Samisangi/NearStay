import jwt from 'jsonwebtoken';

/**
 * Access token: short-lived, sent in response body, stored in Redux/memory
 * on the frontend (never localStorage - that's vulnerable to XSS).
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
};

/**
 * Refresh token: long-lived, sent ONLY as an httpOnly cookie (never in the
 * response body) so client-side JS can never read it. One of these is
 * issued per device/session - see User.addRefreshToken.
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
};

// Converts a JWT expiry string like '7d' or '15m' into a JS Date,
// used when storing expiresAt on the refresh token sub-document.
export const expiryStringToDate = (expiryStr) => {
  const match = expiryStr.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fallback 7d

  const [, num, unit] = match;
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return new Date(Date.now() + Number(num) * multipliers[unit]);
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);
