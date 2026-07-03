import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root uploads directory: backend/uploads/
export const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure subdirectories exist on startup
['listings', 'profiles'].forEach((sub) => {
  fs.mkdirSync(path.join(UPLOADS_DIR, sub), { recursive: true });
});

const imageFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
};

// ---------- Multer disk storage configs ----------

/** Save listing photos to uploads/listings/ */
const listingStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(UPLOADS_DIR, 'listings')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `listing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

/** Save profile pictures to uploads/profiles/ */
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(UPLOADS_DIR, 'profiles')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

export const uploadListingPhotos = multer({
  storage: listingStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5 MB each, max 10
}).array('photos', 10);

export const uploadProfilePicture = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2 MB, single file
}).single('profilePicture');

export const uploadSingle = multer({
  storage: listingStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('image');

// ---------- Local file helpers (same API as Cloudinary helpers) ----------

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

/**
 * "Upload" a file that multer already saved to disk.
 * `file` is the multer file object (req.file / req.files[i]).
 * Returns the public URL for the saved file.
 */
export const getLocalFileUrl = (file) => {
  // Convert absolute path to a URL path relative to uploads/
  const relative = path.relative(UPLOADS_DIR, file.path).replace(/\\/g, '/');
  return `${BASE_URL}/uploads/${relative}`;
};

/**
 * Compatibility shim so controllers that used uploadBufferToCloudinary
 * can call this instead — but with multer disk storage the file is already
 * on disk; we just need the URL.
 *
 * Pass the multer file object (not a buffer).
 */
export const uploadBufferToCloudinary = async (fileOrBuffer, folder = 'nearstay') => {
  // When called from the old controllers that pass req.files[i].buffer,
  // we need the multer file object instead. Controllers have been updated
  // to pass the full file object, but this guard keeps things safe.
  if (Buffer.isBuffer(fileOrBuffer)) {
    throw new Error(
      'uploadBufferToCloudinary: pass the multer file object, not a raw buffer, when using local storage.'
    );
  }
  return getLocalFileUrl(fileOrBuffer);
};

/**
 * Delete a locally stored image by its public URL.
 */
export const deleteFromCloudinary = async (url) => {
  try {
    if (!url) return;
    // Extract the path after /uploads/
    const match = url.match(/\/uploads\/(.+)$/);
    if (!match) return;
    const filePath = path.join(UPLOADS_DIR, match[1]);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Silently ignore — file may already be gone
  }
};

// ---------- Multer error handler ----------

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large (max 5 MB)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files (max 10)' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err?.message === 'Only image files are allowed') {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};