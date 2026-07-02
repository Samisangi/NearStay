import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage — buffer goes to Cloudinary, never touches disk
const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
};

// Different upload configs for different use cases
export const uploadListingPhotos = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB each, max 10
}).array('photos', 10);

export const uploadProfilePicture = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2MB, single file
}).single('profilePicture');

export const uploadSingle = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('image');

// Upload buffer to Cloudinary with folder + optional transformation
export const uploadToCloudinary = (buffer, folder = 'nearstay', options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

// Wrapper — returns just the secure_url
export const uploadBufferToCloudinary = async (buffer, folder = 'nearstay') => {
  const result = await uploadToCloudinary(buffer, folder);
  return result.secure_url;
};

// Delete an image from Cloudinary by its public_id
// (extracted from the URL: .../nearstay/listings/abc123 → nearstay/listings/abc123)
export const deleteFromCloudinary = async (url) => {
  try {
    const parts = url.split('/');
    const filenameWithExt = parts[parts.length - 1];
    const filename = filenameWithExt.split('.')[0];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${filename}`;
    await cloudinary.uploader.destroy(publicId);
  } catch {}
};

// Multer error handler middleware — call after any upload middleware
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err?.message === 'Only image files are allowed') {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
};