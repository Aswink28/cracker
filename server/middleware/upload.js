import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB before optimisation
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/**
 * Files are held in memory and streamed straight to Cloudinary, so the API
 * needs no writable disk and can run on ephemeral hosts. 8 MB is comfortably
 * within a normal container's memory budget for the one-at-a-time uploads
 * the admin panel performs.
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(ApiError.badRequest('Only JPEG, PNG, WebP or AVIF images are allowed'));
      return;
    }
    cb(null, true);
  },
});

/**
 * Multer reports its own failures with codes rather than ApiError, so they are
 * translated here into the same shape the rest of the API uses.
 */
export function singleImage(fieldName = 'image') {
  const handler = upload.single(fieldName);

  return (req, res, next) => {
    handler(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(ApiError.badRequest('Image must be 8 MB or smaller'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(ApiError.badRequest(`Unexpected file field, expected '${fieldName}'`));
        }
        return next(ApiError.badRequest(err.message));
      }
      return next(err);
    });
  };
}

export default singleImage;
