import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Cloudinary is already configured in config/cloudinary.js — import to ensure
// the config runs before we try to use the SDK here.
import '../config/cloudinary.js';

// Store files in memory so we can pipe them directly to Cloudinary without
// writing to disk. Fine for typical listing photos (< 10 MB each).
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

/**
 * Uploads a single Buffer to Cloudinary and returns the secure URL.
 * @param {Buffer} buffer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<string>} secure URL
 */
export const uploadToCloudinary = (buffer, folder = 'nearstay/listings') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    // Convert Buffer → Readable stream and pipe to Cloudinary
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};
