import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never return password by default on queries
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['seeker', 'owner', 'admin'],
      default: 'seeker',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    // For password reset flow
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Multi-device refresh tokens: one entry per active login session
    // (e.g. phone + laptop simultaneously). Each token can be revoked
    // individually (logout on one device) without affecting the others.
    refreshTokens: {
      type: [
        {
          token: { type: String, required: true, select: false },
          deviceInfo: { type: String, default: 'Unknown device' }, // e.g. parsed user-agent
          createdAt: { type: Date, default: Date.now },
          expiresAt: { type: Date, required: true },
        },
      ],
      default: [],
      select: false,
    },
  },
  { timestamps: true } // adds createdAt + updatedAt automatically
);

// Hash password before saving, but only if it was actually modified.
// Without the isModified check, every profile update (e.g. changing phone)
// would re-hash the already-hashed password, breaking login.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare plaintext login password to stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Adds a new refresh token for a device/session. Prunes expired tokens
// first, and caps the list at MAX_SESSIONS so a user who never logs out
// doesn't accumulate tokens forever (oldest is dropped once the cap hits).
const MAX_SESSIONS = 5;
userSchema.methods.addRefreshToken = function (token, deviceInfo, expiresAt) {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.expiresAt > now);

  if (this.refreshTokens.length >= MAX_SESSIONS) {
    this.refreshTokens.shift(); // drop oldest session
  }

  this.refreshTokens.push({ token, deviceInfo, expiresAt });
};

// Removes one specific refresh token (single-device logout)
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
};

const User = mongoose.model('User', userSchema);

export default User;
