import { cloudinary } from '../config/cloudinary.js';
import config from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Upload a buffer to Cloudinary and return the stored image descriptor.
 *
 * Transformations are applied at upload time so the master asset is already
 * bounded (1600px, auto quality, auto format). The catalogue never serves the
 * original camera file, which is the usual cause of multi-megabyte thumbnails.
 */
export function uploadImage(buffer, { folder = 'products', filename } = {}) {
  if (!config.cloudinaryEnabled) {
    throw ApiError.serviceUnavailable(
      'Image uploads are not configured. Set the CLOUDINARY_* environment variables.',
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${config.CLOUDINARY_FOLDER}/${folder}`,
        resource_type: 'image',
        public_id: filename,
        overwrite: false,
        unique_filename: true,
        transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(ApiError.badRequest(error.message || 'Image upload failed'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          alt: '',
        });
      },
    );

    stream.end(buffer);
  });
}

/**
 * Best-effort cleanup of an orphaned asset.
 *
 * Never throws: a product delete that succeeded in the database must not be
 * reported as a failure because Cloudinary was briefly unreachable. The worst
 * case is a stray file, which is cheap.
 */
export async function destroyImage(publicId) {
  if (!publicId || !config.cloudinaryEnabled) return false;

  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.warn(`Could not remove Cloudinary asset ${publicId}:`, error.message);
    return false;
  }
}
